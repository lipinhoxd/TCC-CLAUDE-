import type { DatabaseSync } from 'node:sqlite';
import { utcParaBrasilia } from '../../shared/fuso.ts';
import { registrarAuditoria } from '../db/audit.ts';

/**
 * Conclusao da reserva (AGT-011, RN-025, RN-026). Decisoes do pesquisador (24/11/2026, "recomendadas"): a conclusao e avaliada na
 * leitura e na gravacao, sem tarefa em segundo plano (a rotina agendada completa e da AGT-014), e a passagem para Concluida e
 * gravada com auditoria do sistema.
 *
 * Elegivel: so a reserva em "Pronto para embarque". A reserva fica Concluida a partir de 00:00 (Brasilia) do dia seguinte a data final
 * da excursao ("um dia apos a data final"). A conclusao nao altera pagamentos nem vagas: a vaga de uma reserva concluida continua
 * ocupada. Reserva em "Aguardando pagamento" depois do fim da excursao nao e elegivel (limitacao registrada; cabe a AGT-014).
 */

const CONDICAO_CONCLUIDA = `r.situacao = 'pronto_para_embarque' AND e.data_final < ?`;

/** Data de hoje em Brasilia (AAAA-MM-DD): a excursao terminou se a data final for anterior a ela. */
function hojeBrasilia(agora: Date): string {
  return utcParaBrasilia(agora).data;
}

/** Leitura (sem gravar): a reserva ja deveria estar Concluida, embora a passagem ainda nao tenha sido gravada? */
export function reservaConcluida(db: DatabaseSync, reservaId: number, agora: Date): boolean {
  return (
    db
      .prepare(`SELECT 1 AS x FROM reserva r JOIN excursao e ON e.id = r.excursao_id WHERE r.id = ? AND ${CONDICAO_CONCLUIDA}`)
      .get(reservaId, hojeBrasilia(agora)) !== undefined
  );
}

/**
 * Efetiva a conclusao das reservas elegiveis (do escopo dado) e audita cada uma, uma unica vez: a reserva sai da condicao ao ser
 * concluida. Nao toca em vagas nem em pagamentos. Exige transacao aberta. Devolve quantas foram concluidas.
 */
export function concluirReservas(db: DatabaseSync, agora: Date, escopo: { passageiroId?: number; reservaId?: number } = {}): number {
  if (!db.isTransaction) throw new Error('A conclusao da reserva exige transacao aberta (withTransaction).');
  const filtros: string[] = [];
  const parametros: Array<string | number> = [hojeBrasilia(agora)];
  if (escopo.passageiroId !== undefined) {
    filtros.push('AND r.usuario_id = ?');
    parametros.push(escopo.passageiroId);
  }
  if (escopo.reservaId !== undefined) {
    filtros.push('AND r.id = ?');
    parametros.push(escopo.reservaId);
  }
  const elegiveis = db
    .prepare(`SELECT r.id AS id, r.excursao_id AS excursao_id FROM reserva r JOIN excursao e ON e.id = r.excursao_id WHERE ${CONDICAO_CONCLUIDA} ${filtros.join(' ')} ORDER BY r.id`)
    .all(...parametros);
  const iso = agora.toISOString();
  for (const v of elegiveis) {
    const reservaId = Number(v['id']);
    const atualizadas = db.prepare("UPDATE reserva SET situacao = 'concluida', atualizado_em = ? WHERE id = ? AND situacao = 'pronto_para_embarque'").run(iso, reservaId);
    if (Number(atualizadas.changes) !== 1) continue;
    registrarAuditoria(db, {
      atorUsuarioId: null,
      acao: 'reserva.concluida',
      entidade: 'reserva',
      registroId: reservaId,
      estadoAnterior: { situacao: 'pronto_para_embarque' },
      estadoNovo: { situacao: 'concluida', excursao_id: Number(v['excursao_id']) },
      ocorridoEm: agora,
    });
  }
  return elegiveis.length;
}
