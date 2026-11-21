import type { DatabaseSync } from 'node:sqlite';
import { HttpError } from '../auth/support.ts';
import { registrarAuditoria } from '../db/audit.ts';
import { expirarVencidas, ocuparVaga } from '../vagas/disponibilidade.ts';

/**
 * Confirmacao financeira do pagamento integral (AGT-009, RF-025, RF-026, RN-016, RN-021, RN-022, RN-040).
 * Independe do provedor: um provedor real so teria de chamar estas funcoes. Todas exigem uma transacao aberta
 * (withTransaction, modo IMMEDIATE): marcar o pagamento, converter a retencao, ocupar a vaga e mudar a reserva acontecem
 * juntos ou nao acontecem (atomicidade), e a condicao e reavaliada na gravacao (concorrencia).
 *
 * Decisoes do pesquisador (20/11/2026, "recomendadas"): com a retencao expirada mas com vaga livre, a confirmacao ocupa a
 * vaga normalmente; sem vaga, o pagamento fica confirmado e sinalizado (coluna pendencia_administrativa, mais auditoria),
 * a reserva continua "Aguardando pagamento" e nenhuma vaga adicional e criada (RN-022).
 */

export type ResultadoConfirmacao = 'confirmado' | 'ja_confirmado' | 'confirmado_sem_vaga';
export type ResultadoRecusa = 'recusado' | 'ja_recusado';

type Row = Record<string, unknown>;

function exigirTransacao(db: DatabaseSync): void {
  if (!db.isTransaction) throw new Error('A confirmacao do pagamento exige transacao aberta (withTransaction).');
}

function pagamentoPorId(db: DatabaseSync, pagamentoId: number): Row {
  const pagamento = db.prepare('SELECT * FROM pagamento WHERE id = ?').get(pagamentoId);
  if (pagamento === undefined) throw new HttpError(404, 'nao_encontrada');
  return pagamento;
}

/**
 * Confirma o pagamento. Idempotente: repetir a confirmacao devolve o resultado anterior, sem ocupar outra vaga nem
 * gravar de novo. `atorUsuarioId` e quem disparou a confirmacao (null para o sistema).
 */
export function confirmarPagamento(db: DatabaseSync, pagamentoId: number, agora: Date, atorUsuarioId: number | null): ResultadoConfirmacao {
  exigirTransacao(db);
  const pagamento = pagamentoPorId(db, pagamentoId);
  const situacao = String(pagamento['situacao']);
  if (situacao === 'confirmado') return pagamento['pendencia_administrativa'] === null ? 'ja_confirmado' : 'confirmado_sem_vaga';
  if (situacao !== 'pendente') throw new HttpError(409, 'pagamento_nao_pendente');

  const reservaId = Number(pagamento['reserva_id']);
  const reserva = db.prepare('SELECT * FROM reserva WHERE id = ?').get(reservaId);
  if (reserva === undefined) throw new HttpError(404, 'nao_encontrada');
  if (String(reserva['situacao']) !== 'aguardando_pagamento') throw new HttpError(409, 'reserva_nao_pendente');
  const excursaoId = Number(reserva['excursao_id']);
  const valor = Number(pagamento['valor_centavos']);
  const iso = agora.toISOString();

  // Retencoes vencidas deixam de contar; a que sobrar ativa e da propria reserva e ainda esta no prazo.
  expirarVencidas(db, agora, { excursaoId });
  const retencao = db.prepare("SELECT id FROM retencao_vaga WHERE reserva_id = ? AND situacao = 'ativa'").get(reservaId);
  const retencaoId = retencao === undefined ? undefined : Number(retencao['id']);

  if (ocuparVaga(db, excursaoId, agora, retencaoId)) {
    if (retencaoId !== undefined) {
      db.prepare("UPDATE retencao_vaga SET situacao = 'confirmada' WHERE id = ?").run(retencaoId);
      registrarAuditoria(db, {
        atorUsuarioId,
        acao: 'retencao.confirmada',
        entidade: 'retencao_vaga',
        registroId: retencaoId,
        estadoAnterior: { situacao: 'ativa' },
        estadoNovo: { situacao: 'confirmada', reserva_id: reservaId },
        ocorridoEm: agora,
      });
    }
    db.prepare("UPDATE pagamento SET situacao = 'confirmado', confirmado_em = ?, atualizado_em = ? WHERE id = ?").run(iso, iso, pagamentoId);
    db.prepare("UPDATE reserva SET situacao = 'pronto_para_embarque', atualizado_em = ? WHERE id = ?").run(iso, reservaId);
    registrarAuditoria(db, {
      atorUsuarioId,
      acao: 'pagamento.confirmado',
      entidade: 'pagamento',
      registroId: pagamentoId,
      estadoAnterior: { situacao: 'pendente' },
      estadoNovo: { situacao: 'confirmado', reserva_id: reservaId, valor_centavos: valor, com_retencao: retencaoId !== undefined },
      ocorridoEm: agora,
    });
    registrarAuditoria(db, {
      atorUsuarioId,
      acao: 'reserva.pronta_para_embarque',
      entidade: 'reserva',
      registroId: reservaId,
      estadoAnterior: { situacao: 'aguardando_pagamento' },
      estadoNovo: { situacao: 'pronto_para_embarque' },
      ocorridoEm: agora,
    });
    return 'confirmado';
  }

  // Sem vaga (RN-022): a confirmacao nao cria vaga adicional. O pagamento fica confirmado e sinalizado para a administracao;
  // uma retencao ainda ativa que nao conseguiu ocupar (estado inconsistente) e cancelada para nao segurar vaga a toa.
  if (retencaoId !== undefined) {
    db.prepare("UPDATE retencao_vaga SET situacao = 'cancelada' WHERE id = ?").run(retencaoId);
    registrarAuditoria(db, {
      atorUsuarioId,
      acao: 'retencao.cancelada',
      entidade: 'retencao_vaga',
      registroId: retencaoId,
      estadoAnterior: { situacao: 'ativa' },
      estadoNovo: { situacao: 'cancelada', reserva_id: reservaId },
      ocorridoEm: agora,
    });
  }
  db.prepare("UPDATE pagamento SET situacao = 'confirmado', confirmado_em = ?, atualizado_em = ?, pendencia_administrativa = 'confirmacao_sem_vaga' WHERE id = ?").run(
    iso,
    iso,
    pagamentoId,
  );
  registrarAuditoria(db, {
    atorUsuarioId,
    acao: 'pagamento.confirmado_sem_vaga',
    entidade: 'pagamento',
    registroId: pagamentoId,
    estadoAnterior: { situacao: 'pendente' },
    estadoNovo: { situacao: 'confirmado', reserva_id: reservaId, valor_centavos: valor, pendencia_administrativa: 'confirmacao_sem_vaga' },
    ocorridoEm: agora,
  });
  return 'confirmado_sem_vaga';
}

/** Recusa o pagamento pendente (situacao "falhou"). Idempotente. Pagamento ja confirmado nao pode ser recusado. */
export function recusarPagamento(db: DatabaseSync, pagamentoId: number, agora: Date, atorUsuarioId: number | null): ResultadoRecusa {
  exigirTransacao(db);
  const pagamento = pagamentoPorId(db, pagamentoId);
  const situacao = String(pagamento['situacao']);
  if (situacao === 'falhou') return 'ja_recusado';
  if (situacao === 'confirmado') throw new HttpError(409, 'pagamento_ja_confirmado');
  if (situacao !== 'pendente') throw new HttpError(409, 'pagamento_nao_pendente');
  db.prepare("UPDATE pagamento SET situacao = 'falhou', atualizado_em = ? WHERE id = ?").run(agora.toISOString(), pagamentoId);
  registrarAuditoria(db, {
    atorUsuarioId,
    acao: 'pagamento.recusado',
    entidade: 'pagamento',
    registroId: pagamentoId,
    estadoAnterior: { situacao: 'pendente' },
    estadoNovo: { situacao: 'falhou', reserva_id: Number(pagamento['reserva_id']) },
    ocorridoEm: agora,
  });
  return 'recusado';
}
