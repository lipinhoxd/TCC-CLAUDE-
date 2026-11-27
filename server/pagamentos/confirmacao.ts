import type { DatabaseSync } from 'node:sqlite';
import { HttpError } from '../auth/support.ts';
import { registrarAuditoria } from '../db/audit.ts';
import { expirarVencidas, ocuparVaga } from '../vagas/disponibilidade.ts';
import { vencerSegundasParcelas } from '../vagas/vencimento.ts';

/**
 * Confirmacao financeira (AGT-009 e AGT-010; RF-025, RF-026, RF-027, RN-016 a RN-022, RN-040). Independe do provedor: um provedor
 * real so teria de chamar estas funcoes. Todas exigem uma transacao aberta (withTransaction, modo IMMEDIATE): marcar o pagamento,
 * converter a retencao, ocupar a vaga e mudar a reserva acontecem juntos ou nao acontecem (atomicidade), e a condicao e
 * reavaliada na gravacao (concorrencia).
 *
 * Parcela unica (integral): ocupa a vaga e deixa a reserva em "Pronto para embarque" (RN-016). Primeira parcela: ocupa a vaga e a
 * reserva continua em "Aguardando pagamento" com a obrigacao pendente (RN-017). Segunda parcela: conclui a quitacao e deixa a
 * reserva em "Pronto para embarque" (RN-018, RN-024), sem ocupar outra vaga.
 *
 * Decisoes do pesquisador: com a retencao expirada mas com vaga livre, a confirmacao ocupa a vaga normalmente; sem vaga, o
 * pagamento fica confirmado e sinalizado (pendencia_administrativa), a reserva continua "Aguardando pagamento" e nenhuma vaga
 * adicional e criada (RN-022). Uma segunda parcela confirmada depois do prazo e da liberacao da vaga tambem fica confirmada e
 * sinalizada, e a reserva continua Cancelada por inadimplencia (AGT-010).
 *
 * Confirmacao recebida a partir do instante da partida (RN-046, AGT-017): nao ocupa vaga, mesmo havendo vaga ou retencao; segue o
 * mesmo tratamento administrativo da confirmacao sem vaga, e o evento da auditoria leva `apos_partida`.
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

/** Segunda parcela: quitacao no prazo ou confirmacao tardia, depois da liberacao da vaga. */
function confirmarSegunda(db: DatabaseSync, pagamento: Row, reserva: Row, agora: Date, atorUsuarioId: number | null): ResultadoConfirmacao {
  const pagamentoId = Number(pagamento['id']);
  const reservaId = Number(pagamento['reserva_id']);
  const valor = Number(pagamento['valor_centavos']);
  const iso = agora.toISOString();
  const primeira = db.prepare("SELECT situacao, pendencia_administrativa FROM pagamento WHERE reserva_id = ? AND parcela = 'primeira'").get(reservaId);
  if (primeira === undefined || primeira['situacao'] !== 'confirmado' || primeira['pendencia_administrativa'] !== null) {
    throw new HttpError(409, 'primeira_parcela_nao_confirmada');
  }

  if (String(reserva['situacao']) === 'aguardando_pagamento') {
    db.prepare("UPDATE pagamento SET situacao = 'confirmado', confirmado_em = ?, atualizado_em = ? WHERE id = ?").run(iso, iso, pagamentoId);
    db.prepare("UPDATE reserva SET situacao = 'pronto_para_embarque', atualizado_em = ? WHERE id = ?").run(iso, reservaId);
    registrarAuditoria(db, {
      atorUsuarioId,
      acao: 'pagamento.confirmado',
      entidade: 'pagamento',
      registroId: pagamentoId,
      estadoAnterior: { situacao: 'pendente' },
      estadoNovo: { situacao: 'confirmado', reserva_id: reservaId, parcela: 'segunda', valor_centavos: valor, quitacao: true },
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

  if (String(reserva['situacao']) === 'cancelada' && reserva['motivo_cancelamento'] === 'inadimplencia') {
    db.prepare("UPDATE pagamento SET situacao = 'confirmado', confirmado_em = ?, atualizado_em = ?, pendencia_administrativa = 'confirmacao_sem_vaga' WHERE id = ?").run(iso, iso, pagamentoId);
    registrarAuditoria(db, {
      atorUsuarioId,
      acao: 'pagamento.confirmado_sem_vaga',
      entidade: 'pagamento',
      registroId: pagamentoId,
      estadoAnterior: { situacao: 'pendente' },
      estadoNovo: { situacao: 'confirmado', reserva_id: reservaId, parcela: 'segunda', valor_centavos: valor, pendencia_administrativa: 'confirmacao_sem_vaga', apos_vencimento: true },
      ocorridoEm: agora,
    });
    return 'confirmado_sem_vaga';
  }
  throw new HttpError(409, 'reserva_nao_pendente');
}

/**
 * Confirma o pagamento. Idempotente: repetir a confirmacao devolve o resultado anterior, sem ocupar outra vaga nem gravar de novo.
 * `atorUsuarioId` e quem disparou a confirmacao (null para o sistema).
 */
export function confirmarPagamento(db: DatabaseSync, pagamentoId: number, agora: Date, atorUsuarioId: number | null): ResultadoConfirmacao {
  exigirTransacao(db);
  const pagamento = pagamentoPorId(db, pagamentoId);
  const situacao = String(pagamento['situacao']);
  if (situacao === 'confirmado') return pagamento['pendencia_administrativa'] === null ? 'ja_confirmado' : 'confirmado_sem_vaga';
  if (situacao !== 'pendente') throw new HttpError(409, 'pagamento_nao_pendente');

  const reservaId = Number(pagamento['reserva_id']);
  // Se o prazo da segunda parcela ja passou, o vencimento e efetivado antes: uma confirmacao depois do prazo e sempre tardia (RN-019).
  vencerSegundasParcelas(db, agora, { reservaId });
  const reserva = db.prepare('SELECT * FROM reserva WHERE id = ?').get(reservaId);
  if (reserva === undefined) throw new HttpError(404, 'nao_encontrada');
  const parcela = String(pagamento['parcela']);
  if (parcela === 'segunda') return confirmarSegunda(db, pagamento, reserva, agora, atorUsuarioId);

  if (String(reserva['situacao']) !== 'aguardando_pagamento') throw new HttpError(409, 'reserva_nao_pendente');
  const excursaoId = Number(reserva['excursao_id']);
  const valor = Number(pagamento['valor_centavos']);
  const iso = agora.toISOString();

  // Retencoes vencidas deixam de contar; a que sobrar ativa e da propria reserva e ainda esta no prazo.
  expirarVencidas(db, agora, { excursaoId });
  const retencao = db.prepare("SELECT id FROM retencao_vaga WHERE reserva_id = ? AND situacao = 'ativa'").get(reservaId);
  const retencaoId = retencao === undefined ? undefined : Number(retencao['id']);

  // A partir da partida a vaga ja nao pode ser usada: a confirmacao nao ocupa (RN-046).
  const excursao = db.prepare('SELECT partida_utc FROM excursao WHERE id = ?').get(excursaoId);
  const partiu = new Date(String(excursao?.['partida_utc'])).getTime() <= agora.getTime();

  if (!partiu && ocuparVaga(db, excursaoId, agora, retencaoId)) {
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
    registrarAuditoria(db, {
      atorUsuarioId,
      acao: 'pagamento.confirmado',
      entidade: 'pagamento',
      registroId: pagamentoId,
      estadoAnterior: { situacao: 'pendente' },
      estadoNovo: { situacao: 'confirmado', reserva_id: reservaId, parcela, valor_centavos: valor, com_retencao: retencaoId !== undefined },
      ocorridoEm: agora,
    });
    // Parcela unica quita na hora (RN-016); a primeira parcela deixa a reserva aguardando a segunda (RN-017).
    if (parcela === 'unica') {
      db.prepare("UPDATE reserva SET situacao = 'pronto_para_embarque', atualizado_em = ? WHERE id = ?").run(iso, reservaId);
      registrarAuditoria(db, {
        atorUsuarioId,
        acao: 'reserva.pronta_para_embarque',
        entidade: 'reserva',
        registroId: reservaId,
        estadoAnterior: { situacao: 'aguardando_pagamento' },
        estadoNovo: { situacao: 'pronto_para_embarque' },
        ocorridoEm: agora,
      });
    }
    return 'confirmado';
  }

  // Sem vaga (RN-022) ou depois da partida (RN-046): a confirmacao nao cria vaga adicional. O pagamento fica confirmado e sinalizado
  // para a administracao; uma retencao ainda ativa que nao ocupou e cancelada para nao segurar vaga a toa.
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
    estadoNovo: { situacao: 'confirmado', reserva_id: reservaId, parcela, valor_centavos: valor, pendencia_administrativa: 'confirmacao_sem_vaga', ...(partiu ? { apos_partida: true } : {}) },
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
    estadoNovo: { situacao: 'falhou', reserva_id: Number(pagamento['reserva_id']), parcela: String(pagamento['parcela']) },
    ocorridoEm: agora,
  });
  return 'recusado';
}
