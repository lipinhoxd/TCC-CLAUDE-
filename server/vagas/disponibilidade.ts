import type { DatabaseSync } from 'node:sqlite';
import { registrarAuditoria } from '../db/audit.ts';

/**
 * Capacidade, retencao temporaria e ocupacao de vagas (AGT-008, RN-014, RN-015, RN-021, RN-040).
 *
 * Decisoes do pesquisador: a disponibilidade e calculada pelas retencoes ativas e nao expiradas, sem coluna nova
 * (vagas_ocupadas guarda so a ocupacao definitiva, RN-015); a expiracao e avaliada na leitura e na gravacao e, desde a
 * AGT-014, tambem pela rotina automatica (server/processos/).
 *
 * Toda funcao que grava exige uma transacao aberta (withTransaction, modo IMMEDIATE): o bloqueio de escrita e obtido
 * no inicio e a condicao e reavaliada na gravacao, entao uma leitura antiga nunca causa excedente (RN-040).
 */

/**
 * Capacidade menos ocupadas menos retidas, nunca negativa. `vencidas` (AGT-010) sao vagas de reservas parceladas cuja segunda parcela
 * venceu e cuja liberacao ainda nao foi gravada: ja contam como livres na leitura.
 */
export function vagasDisponiveis(capacidade: number, ocupadas: number, retidas = 0, vencidas = 0): number {
  return Math.max(0, capacidade - ocupadas + vencidas - retidas);
}

/**
 * Subconsulta que conta as retencoes ativas e ainda nao expiradas de uma excursao. Tem um parametro "?": o
 * instante atual em ISO 8601 UTC. `colunaExcursaoId` e a coluna da excursao na consulta externa (ex.: "excursao.id").
 */
export function sqlRetidas(colunaExcursaoId: string): string {
  return `(SELECT COUNT(*) FROM retencao_vaga rv JOIN reserva rr ON rr.id = rv.reserva_id WHERE rr.excursao_id = ${colunaExcursaoId} AND rv.situacao = 'ativa' AND rv.expira_em > ?)`;
}

export interface Disponibilidade {
  capacidade: number;
  ocupadas: number;
  retidas: number;
  livres: number;
}

/**
 * Disponibilidade atual da excursao, ou null se ela nao existir. `ignorarRetencaoId` desconta uma retencao que esta
 * sendo convertida em ocupacao (uso futuro da AGT-009), para ela nao bloquear a si mesma.
 */
export function disponibilidade(db: DatabaseSync, excursaoId: number, agora: Date, ignorarRetencaoId?: number): Disponibilidade | null {
  const excursao = db.prepare('SELECT capacidade, vagas_ocupadas FROM excursao WHERE id = ?').get(excursaoId);
  if (excursao === undefined) return null;
  const retidas = Number(
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM retencao_vaga rv JOIN reserva rr ON rr.id = rv.reserva_id WHERE rr.excursao_id = ? AND rv.situacao = 'ativa' AND rv.expira_em > ? AND rv.id <> ?",
      )
      .get(excursaoId, agora.toISOString(), ignorarRetencaoId ?? 0)?.['n'],
  );
  const capacidade = Number(excursao['capacidade']);
  const ocupadas = Number(excursao['vagas_ocupadas']);
  return { capacidade, ocupadas, retidas, livres: vagasDisponiveis(capacidade, ocupadas, retidas) };
}

function exigirTransacao(db: DatabaseSync): void {
  if (!db.isTransaction) throw new Error('Operacao de vagas exige transacao aberta (withTransaction).');
}

/**
 * Marca como expiradas as retencoes ativas cujo prazo passou, com auditoria (RF-022). Quem le ou
 * grava vagas chama esta funcao, e a rotina da AGT-014 tambem. Devolve quantas expiraram.
 */
export function expirarVencidas(db: DatabaseSync, agora: Date, escopo: { excursaoId?: number; reservaId?: number } = {}): number {
  exigirTransacao(db);
  const filtros: string[] = ["rv.situacao = 'ativa'", 'rv.expira_em <= ?'];
  const parametros: Array<string | number> = [agora.toISOString()];
  if (escopo.excursaoId !== undefined) {
    filtros.push('rr.excursao_id = ?');
    parametros.push(escopo.excursaoId);
  }
  if (escopo.reservaId !== undefined) {
    filtros.push('rv.reserva_id = ?');
    parametros.push(escopo.reservaId);
  }
  const vencidas = db
    .prepare(`SELECT rv.id AS id, rv.reserva_id AS reserva_id FROM retencao_vaga rv JOIN reserva rr ON rr.id = rv.reserva_id WHERE ${filtros.join(' AND ')}`)
    .all(...parametros);
  for (const v of vencidas) {
    const id = Number(v['id']);
    const alterada = Number(db.prepare("UPDATE retencao_vaga SET situacao = 'expirada' WHERE id = ? AND situacao = 'ativa'").run(id).changes);
    if (alterada === 0) continue;
    registrarAuditoria(db, {
      atorUsuarioId: null,
      acao: 'retencao.expirada',
      entidade: 'retencao_vaga',
      registroId: id,
      estadoAnterior: { situacao: 'ativa' },
      estadoNovo: { situacao: 'expirada', reserva_id: Number(v['reserva_id']) },
      ocorridoEm: agora,
    });
  }
  return vencidas.length;
}

/**
 * Ocupa uma vaga da excursao sem ultrapassar a capacidade nem as retencoes de outras pessoas (RN-021, RN-040). Usa
 * UPDATE condicional, reavaliado na gravacao. Devolve false se nao houver vaga. Sem rota publica: e o mecanismo que
 * a AGT-009 usa na confirmacao financeira. `retencaoConsumidaId` e a retencao que esta virando ocupacao; ela nao
 * bloqueia a si mesma, e o chamador a marca como confirmada (RN-016, fora desta atividade).
 */
export function ocuparVaga(db: DatabaseSync, excursaoId: number, agora: Date, retencaoConsumidaId?: number): boolean {
  exigirTransacao(db);
  const d = disponibilidade(db, excursaoId, agora, retencaoConsumidaId);
  if (d === null || d.livres <= 0) return false;
  const alteradas = Number(
    db.prepare('UPDATE excursao SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = ? AND vagas_ocupadas < capacidade').run(excursaoId).changes,
  );
  return alteradas === 1;
}

/** Libera uma vaga ocupada, nunca abaixo de zero. Devolve false se nao havia vaga ocupada. */
export function liberarVaga(db: DatabaseSync, excursaoId: number): boolean {
  exigirTransacao(db);
  return Number(db.prepare('UPDATE excursao SET vagas_ocupadas = vagas_ocupadas - 1 WHERE id = ? AND vagas_ocupadas > 0').run(excursaoId).changes) === 1;
}
