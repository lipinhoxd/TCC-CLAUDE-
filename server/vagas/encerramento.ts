import type { DatabaseSync } from 'node:sqlite';
import { utcParaBrasilia } from '../../shared/fuso.ts';
import { registrarAuditoria } from '../db/audit.ts';

/**
 * Reserva sem pagamento de excursao terminada (AGT-014, decisao 2.3 do pesquisador, 26/11/2026). A especificacao nao define este caso:
 * e regra adotada por decisao do pesquisador, registrada em TCC/registros-agente/AGT-014.md.
 *
 * Passa a Cancelada a reserva em "Aguardando pagamento" cuja excursao ja terminou (data final anterior a hoje em Brasilia, o mesmo
 * criterio da conclusao) e que nao tem nenhum pagamento pendente nem confirmado (o mesmo criterio da desistencia). Com pagamento, a
 * reserva fica como esta. Nao mexe em pagamentos nem em vagas: sem pagamento confirmado, a reserva nao ocupa vaga. O motivo vai so
 * para a auditoria (reserva.motivo_cancelamento continua nulo). Aplicada apenas pela rotina, nunca na leitura.
 */

const CONDICAO = `r.situacao = 'aguardando_pagamento'
  AND e.data_final < ?
  AND NOT EXISTS (SELECT 1 FROM pagamento p WHERE p.reserva_id = r.id AND p.situacao IN ('pendente', 'confirmado'))`;

/** Cancela as reservas elegiveis e audita cada uma como acao do sistema. Exige transacao aberta. Devolve quantas foram canceladas. */
export function cancelarSemPagamentoDeExcursaoTerminada(db: DatabaseSync, agora: Date): number {
  if (!db.isTransaction) throw new Error('O cancelamento da reserva sem pagamento exige transacao aberta (withTransaction).');
  const elegiveis = db
    .prepare(`SELECT r.id AS id, r.excursao_id AS excursao_id FROM reserva r JOIN excursao e ON e.id = r.excursao_id WHERE ${CONDICAO} ORDER BY r.id`)
    .all(utcParaBrasilia(agora).data);
  const iso = agora.toISOString();
  let canceladas = 0;
  for (const v of elegiveis) {
    const reservaId = Number(v['id']);
    const alteradas = db
      .prepare("UPDATE reserva SET situacao = 'cancelada', atualizado_em = ? WHERE id = ? AND situacao = 'aguardando_pagamento'")
      .run(iso, reservaId);
    if (Number(alteradas.changes) !== 1) continue;
    canceladas += 1;

    // Uma retencao ainda ativa (prazo configurado maior que a duracao restante da excursao) e cancelada junto.
    const ativa = db.prepare("SELECT id FROM retencao_vaga WHERE reserva_id = ? AND situacao = 'ativa'").get(reservaId);
    if (ativa !== undefined) {
      db.prepare("UPDATE retencao_vaga SET situacao = 'cancelada' WHERE id = ?").run(Number(ativa['id']));
      registrarAuditoria(db, {
        atorUsuarioId: null,
        acao: 'retencao.cancelada',
        entidade: 'retencao_vaga',
        registroId: Number(ativa['id']),
        estadoAnterior: { situacao: 'ativa' },
        estadoNovo: { situacao: 'cancelada', reserva_id: reservaId },
        ocorridoEm: agora,
      });
    }
    registrarAuditoria(db, {
      atorUsuarioId: null,
      acao: 'reserva.cancelamento_automatico',
      entidade: 'reserva',
      registroId: reservaId,
      estadoAnterior: { situacao: 'aguardando_pagamento' },
      estadoNovo: { situacao: 'cancelada', excursao_id: Number(v['excursao_id']), motivo: 'excursao_terminada_sem_pagamento' },
      ocorridoEm: agora,
    });
  }
  return canceladas;
}
