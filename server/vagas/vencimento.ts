import type { DatabaseSync } from 'node:sqlite';
import { registrarAuditoria } from '../db/audit.ts';
import { liberarVaga } from './disponibilidade.ts';

/**
 * Vencimento da segunda parcela (AGT-010, RN-019, RN-020, RN-032, RF-028). Decisoes do pesquisador (21/11/2026, "recomendadas"):
 * o vencimento e avaliado na leitura e na gravacao, sem tarefa em segundo plano (a rotina agendada completa e da AGT-014);
 * a disponibilidade ja trata a vaga como liberada pelo prazo e a gravacao seguinte efetiva a liberacao; depois dela a reserva
 * fica Cancelada, com o motivo "inadimplencia" (reserva.motivo_cancelamento) e a primeira parcela permanece confirmada e nao
 * reembolsavel.
 *
 * "Vencida" = reserva parcelada em Aguardando pagamento, com a primeira parcela confirmada (com vaga, sem pendencia
 * administrativa), sem a segunda parcela confirmada e com o prazo da excursao (instante UTC das 23:59:59 de Brasilia) ja no
 * passado ou no instante atual (mesmo criterio da AGT-007).
 */

const CONDICAO_VENCIDA = `r.modalidade = 'parcelada'
  AND r.situacao = 'aguardando_pagamento'
  AND e.prazo_segunda_parcela_utc IS NOT NULL
  AND e.prazo_segunda_parcela_utc <= ?
  AND EXISTS (SELECT 1 FROM pagamento p WHERE p.reserva_id = r.id AND p.parcela = 'primeira' AND p.situacao = 'confirmado' AND p.pendencia_administrativa IS NULL)
  AND NOT EXISTS (SELECT 1 FROM pagamento p WHERE p.reserva_id = r.id AND p.parcela = 'segunda' AND p.situacao = 'confirmado')`;

/**
 * Subconsulta que conta as reservas vencidas de uma excursao, cuja vaga ja conta como liberada na disponibilidade publica mesmo
 * antes de a liberacao ser gravada. Tem um parametro "?": o instante atual em ISO 8601 UTC.
 */
export function sqlVencidas(colunaExcursaoId: string): string {
  return `(SELECT COUNT(*) FROM reserva r JOIN excursao e ON e.id = r.excursao_id WHERE r.excursao_id = ${colunaExcursaoId} AND ${CONDICAO_VENCIDA})`;
}

/** Leitura (sem gravar): a reserva ja esta vencida, embora a liberacao ainda nao tenha sido gravada? */
export function reservaVencida(db: DatabaseSync, reservaId: number, agora: Date): boolean {
  return (
    db
      .prepare(`SELECT 1 AS x FROM reserva r JOIN excursao e ON e.id = r.excursao_id WHERE r.id = ? AND ${CONDICAO_VENCIDA}`)
      .get(reservaId, agora.toISOString()) !== undefined
  );
}

/**
 * Efetiva o vencimento: cancela as reservas vencidas com o motivo inadimplencia e libera uma vaga de cada (uma unica vez, porque
 * a reserva sai da condicao ao ser cancelada). Exige transacao aberta. Devolve quantas venceram.
 */
export function vencerSegundasParcelas(db: DatabaseSync, agora: Date, escopo: { excursaoId?: number; reservaId?: number } = {}): number {
  if (!db.isTransaction) throw new Error('O vencimento da segunda parcela exige transacao aberta (withTransaction).');
  const filtros: string[] = [];
  const parametros: Array<string | number> = [agora.toISOString()];
  if (escopo.excursaoId !== undefined) {
    filtros.push('AND r.excursao_id = ?');
    parametros.push(escopo.excursaoId);
  }
  if (escopo.reservaId !== undefined) {
    filtros.push('AND r.id = ?');
    parametros.push(escopo.reservaId);
  }
  const vencidas = db
    .prepare(`SELECT r.id AS id, r.excursao_id AS excursao_id FROM reserva r JOIN excursao e ON e.id = r.excursao_id WHERE ${CONDICAO_VENCIDA} ${filtros.join(' ')} ORDER BY r.id`)
    .all(...parametros);
  const iso = agora.toISOString();
  for (const v of vencidas) {
    const reservaId = Number(v['id']);
    const excursaoId = Number(v['excursao_id']);
    db.prepare("UPDATE reserva SET situacao = 'cancelada', motivo_cancelamento = 'inadimplencia', atualizado_em = ? WHERE id = ? AND situacao = 'aguardando_pagamento'").run(iso, reservaId);
    const liberada = liberarVaga(db, excursaoId);
    registrarAuditoria(db, {
      atorUsuarioId: null,
      acao: 'reserva.vencimento_segunda_parcela',
      entidade: 'reserva',
      registroId: reservaId,
      estadoAnterior: { situacao: 'aguardando_pagamento' },
      estadoNovo: { situacao: 'cancelada', motivo_cancelamento: 'inadimplencia', excursao_id: excursaoId, vaga_liberada: liberada },
      ocorridoEm: agora,
    });
  }
  return vencidas.length;
}
