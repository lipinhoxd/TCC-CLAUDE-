import type { DatabaseSync } from 'node:sqlite';
import { dividirEmDuas } from '../../shared/dinheiro.ts';
import { utcParaBrasilia } from '../../shared/fuso.ts';
import { HttpError } from '../auth/support.ts';
import { registrarAuditoria } from '../db/audit.ts';
import { withTransaction } from '../db/transaction.ts';
import { instantePrazo } from '../excursoes/validation.ts';
import type { ProvedorPagamento } from '../pagamentos/provedor.ts';
import { disponibilidade, expirarVencidas } from '../vagas/disponibilidade.ts';
import { RETENCAO_PADRAO_MINUTOS } from './config.ts';

/**
 * Reservas do passageiro (AGT-007, RF-018 a RF-020). Cria a reserva em "aguardando_pagamento":
 * nao cria pagamento e nao altera vagas_ocupadas (RN-021 fica a cargo do banco e do mecanismo de server/vagas/).
 * AGT-008: o checkout inicia a retencao temporaria de vaga (RF-021, RN-014, RN-015), que reduz a disponibilidade.
 * Decisoes do pesquisador: reserva criada ao solicitar; desistencia enquanto nao houver pagamento; ate 3
 * reservas pendentes por passageiro; primeira parcela = metade para baixo e segunda = restante; modalidade
 * escolhida na solicitacao e sem troca; solicitacao recusada sem vagas, mas varias pendentes na ultima vaga.
 * Decisoes do pesquisador na AGT-008: a retencao comeca ao abrir o checkout e dura 15 min (configuravel); pode ser
 * retomada depois de expirada, se houver vaga; a expiracao e avaliada na leitura e na gravacao; a reserva continua
 * aguardando pagamento quando a retencao expira; desistir cancela a retencao ativa.
 * AGT-009: a reserva mostra o pagamento integral (server/pagamentos/); a desistencia fica bloqueada com pagamento pendente
 * ou confirmado (um pagamento recusado nao impede desistir).
 */

export const LIMITE_PENDENTES = 3;

export type Modalidade = 'integral' | 'parcelada';

export interface Parcela {
  parcela: 'unica' | 'primeira' | 'segunda';
  valor_centavos: number;
  /** Data (Brasilia) de vencimento; so a segunda parcela tem. */
  vencimento: string | null;
}

export type SituacaoRetencao = 'ativa' | 'confirmada' | 'expirada' | 'cancelada';

export interface RetencaoDto {
  situacao: SituacaoRetencao;
  expira_em: string;
  /** Segundos que faltam para expirar; 0 se nao estiver ativa. */
  segundos_restantes: number;
}

export interface PagamentoDto {
  situacao: 'pendente' | 'confirmado' | 'falhou' | 'estornado';
  valor_centavos: number;
  confirmado_em: string | null;
  /** Confirmado sem vaga disponivel: aguarda tratamento da administracao (RN-022, RF-026). */
  requer_tratamento_administrativo: boolean;
}

export interface ReservaDto {
  id: number;
  situacao: string;
  modalidade: Modalidade;
  criada_em: string;
  excursao: {
    id: number;
    nome: string;
    data_inicial: string;
    data_final: string;
    partida_brasilia: { data: string; hora: string };
  };
  valores: { total_centavos: number; parcelas: Parcela[] };
  pode_desistir: boolean;
  /** Retencao mais recente da reserva, ou null se o checkout ainda nao foi iniciado. */
  retencao: RetencaoDto | null;
  /** Pagamento integral da reserva (parcela unica), ou null se ainda nao foi iniciado. */
  pagamento: PagamentoDto | null;
  /** Ha provedor de pagamento neste ambiente e a reserva e integral. */
  pagamento_disponivel: boolean;
  /** O provedor e o simulado (rotas de aprovar e recusar existem so fora de producao). */
  pagamento_simulado: boolean;
}

type Row = Record<string, unknown>;
const t = (valor: unknown): string => (typeof valor === 'string' ? valor : '');

function objeto(entrada: unknown): Row {
  if (entrada === null || typeof entrada !== 'object' || Array.isArray(entrada)) {
    throw new HttpError(400, 'requisicao_invalida');
  }
  return entrada as Row;
}

/** Parcelas da modalidade, em centavos inteiros, com soma igual ao total (RN-038). */
export function calcularParcelas(total: number, modalidade: Modalidade, prazoSegunda: string | null): Parcela[] {
  if (modalidade === 'integral') {
    return [{ parcela: 'unica', valor_centavos: total, vencimento: null }];
  }
  const { primeira, segunda } = dividirEmDuas(total);
  return [
    { parcela: 'primeira', valor_centavos: primeira, vencimento: null },
    { parcela: 'segunda', valor_centavos: segunda, vencimento: prazoSegunda },
  ];
}

export class ReservaService {
  private readonly db: DatabaseSync;
  private readonly relogio: () => Date;
  private readonly retencaoMs: number;
  private readonly provedor: ProvedorPagamento | undefined;

  constructor(db: DatabaseSync, now?: () => Date, retencaoMs: number = RETENCAO_PADRAO_MINUTOS * 60_000, provedor?: ProvedorPagamento) {
    this.db = db;
    this.relogio = now ?? (() => new Date());
    this.retencaoMs = retencaoMs;
    this.provedor = provedor;
  }

  /** Pagamento integral da reserva, se existir. */
  private pagamentoDe(reservaId: number): PagamentoDto | null {
    const p = this.db.prepare("SELECT situacao, valor_centavos, confirmado_em, pendencia_administrativa FROM pagamento WHERE reserva_id = ? AND parcela = 'unica'").get(reservaId);
    if (p === undefined) return null;
    return {
      situacao: p['situacao'] as PagamentoDto['situacao'],
      valor_centavos: Number(p['valor_centavos']),
      confirmado_em: p['confirmado_em'] === null ? null : t(p['confirmado_em']),
      requer_tratamento_administrativo: p['pendencia_administrativa'] !== null,
    };
  }

  /** Retencao mais recente da reserva; a ativa com prazo vencido aparece como expirada, sem gravar nada na leitura. */
  private retencaoDe(reservaId: number): RetencaoDto | null {
    const r = this.db.prepare('SELECT situacao, expira_em FROM retencao_vaga WHERE reserva_id = ? ORDER BY id DESC LIMIT 1').get(reservaId);
    if (r === undefined) return null;
    const expiraEm = t(r['expira_em']);
    const restante = Math.floor((new Date(expiraEm).getTime() - this.relogio().getTime()) / 1000);
    const ativa = r['situacao'] === 'ativa' && restante > 0;
    const situacao: SituacaoRetencao = ativa ? 'ativa' : r['situacao'] === 'ativa' ? 'expirada' : (r['situacao'] as SituacaoRetencao);
    return { situacao, expira_em: expiraEm, segundos_restantes: ativa ? restante : 0 };
  }

  private paraDto(reserva: Row): ReservaDto {
    const excursao = this.db.prepare('SELECT * FROM excursao WHERE id = ?').get(Number(reserva['excursao_id']));
    if (excursao === undefined) throw new HttpError(404, 'nao_encontrada');
    const modalidade: Modalidade = reserva['modalidade'] === 'parcelada' ? 'parcelada' : 'integral';
    const prazo = excursao['prazo_segunda_parcela_utc'];
    const total = Number(excursao['preco_centavos']);
    const partida = utcParaBrasilia(t(excursao['partida_utc']));
    const situacao = t(reserva['situacao']);
    const pagamento = this.pagamentoDe(Number(reserva['id']));
    // Pagamento pendente ou confirmado impede desistir; o recusado (falhou) nao.
    const comPagamento = pagamento !== null && (pagamento.situacao === 'pendente' || pagamento.situacao === 'confirmado');
    return {
      id: Number(reserva['id']),
      situacao,
      modalidade,
      criada_em: t(reserva['criado_em']),
      excursao: {
        id: Number(excursao['id']),
        nome: t(excursao['nome']),
        data_inicial: t(excursao['data_inicial']),
        data_final: t(excursao['data_final']),
        partida_brasilia: { data: partida.data, hora: partida.hora.slice(0, 5) },
      },
      valores: {
        total_centavos: total,
        parcelas: calcularParcelas(total, modalidade, modalidade === 'parcelada' && prazo !== null ? utcParaBrasilia(t(prazo)).data : null),
      },
      pode_desistir: situacao === 'aguardando_pagamento' && !comPagamento,
      retencao: this.retencaoDe(Number(reserva['id'])),
      pagamento,
      pagamento_disponivel: this.provedor !== undefined && modalidade === 'integral',
      pagamento_simulado: this.provedor?.simulado === true,
    };
  }

  /** Solicita a reserva do passageiro da sessao (RN-009); o corpo nunca escolhe o passageiro. */
  solicitar(passageiroId: number, entrada: unknown): ReservaDto {
    const corpo = objeto(entrada);
    const erros: Record<string, string> = {};
    for (const chave of Object.keys(corpo)) {
      if (chave !== 'excursao_id' && chave !== 'modalidade') erros[chave] = 'campo_nao_permitido';
    }
    const excursaoId = corpo['excursao_id'];
    if (typeof excursaoId !== 'number' || !Number.isSafeInteger(excursaoId) || excursaoId < 1) {
      erros['excursao_id'] = excursaoId === undefined || excursaoId === null ? 'obrigatorio' : 'invalido';
    }
    const modalidadePedida = corpo['modalidade'] ?? 'integral';
    if (modalidadePedida !== 'integral' && modalidadePedida !== 'parcelada') erros['modalidade'] = 'invalido';
    if (Object.keys(erros).length > 0) throw new HttpError(400, 'validacao', { fields: erros });
    const modalidade = modalidadePedida as Modalidade;

    const agora = this.relogio();
    const hoje = utcParaBrasilia(agora).data;
    return withTransaction(this.db, () => {
      // Mesma visibilidade da consulta publica: publicada e ainda nao terminada.
      const excursao = this.db
        .prepare("SELECT * FROM excursao WHERE id = ? AND situacao = 'publicada' AND data_final >= ?")
        .get(excursaoId as number, hoje);
      if (excursao === undefined) throw new HttpError(404, 'excursao_nao_encontrada');
      if (new Date(t(excursao['partida_utc'])).getTime() <= agora.getTime()) throw new HttpError(409, 'reservas_encerradas');

      const existente = this.db
        .prepare("SELECT id FROM reserva WHERE usuario_id = ? AND excursao_id = ? AND situacao <> 'cancelada'")
        .get(passageiroId, excursaoId as number);
      if (existente !== undefined) {
        throw new HttpError(409, 'reserva_ativa_existente', { fields: { reserva_id: String(Number(existente['id'])) } });
      }
      const pendentes = Number(
        this.db.prepare("SELECT COUNT(*) AS n FROM reserva WHERE usuario_id = ? AND situacao = 'aguardando_pagamento'").get(passageiroId)?.['n'],
      );
      if (pendentes >= LIMITE_PENDENTES) throw new HttpError(409, 'limite_de_reservas_pendentes');

      // RF-019 (AGT-008): a disponibilidade desconta as retencoes ativas e nao expiradas.
      expirarVencidas(this.db, agora, { excursaoId: excursaoId as number });
      if ((disponibilidade(this.db, excursaoId as number, agora)?.livres ?? 0) <= 0) {
        throw new HttpError(409, 'sem_vagas');
      }
      if (modalidade === 'parcelada') {
        const prazo = excursao['prazo_segunda_parcela_utc'];
        if (Number(excursao['parcelamento_habilitado']) !== 1 || prazo === null) {
          throw new HttpError(400, 'validacao', { fields: { modalidade: 'parcelamento_indisponivel' } });
        }
        if (new Date(instantePrazo(utcParaBrasilia(t(prazo)).data)).getTime() <= agora.getTime()) {
          throw new HttpError(400, 'validacao', { fields: { modalidade: 'prazo_da_segunda_parcela_vencido' } });
        }
      }

      const iso = agora.toISOString();
      let id: number;
      try {
        id = Number(
          this.db
            .prepare("INSERT INTO reserva (usuario_id, excursao_id, modalidade, situacao, criado_em, atualizado_em) VALUES (?, ?, ?, 'aguardando_pagamento', ?, ?)")
            .run(passageiroId, excursaoId as number, modalidade, iso, iso).lastInsertRowid,
        );
      } catch (erro) {
        // Rede de seguranca: o indice unico uq_reserva_ativa (RN-009) vale mesmo se a verificacao acima for contornada.
        if (erro instanceof Error && erro.message.includes('UNIQUE constraint failed')) {
          throw new HttpError(409, 'reserva_ativa_existente');
        }
        throw erro;
      }
      registrarAuditoria(this.db, {
        atorUsuarioId: passageiroId,
        acao: 'reserva.criada',
        entidade: 'reserva',
        registroId: id,
        estadoNovo: { situacao: 'aguardando_pagamento', modalidade, excursao_id: excursaoId as number },
        ocorridoEm: agora,
      });
      return this.obter(passageiroId, id);
    });
  }

  /** A propria reserva; a de outra pessoa responde 404, igual a inexistente. */
  obter(passageiroId: number, reservaId: number): ReservaDto {
    const reserva = this.db.prepare('SELECT * FROM reserva WHERE id = ? AND usuario_id = ?').get(reservaId, passageiroId);
    if (reserva === undefined) throw new HttpError(404, 'nao_encontrada');
    return this.paraDto(reserva);
  }

  /**
   * Inicia o checkout: cria a retencao temporaria da vaga (RF-021, RN-014). Repetir a chamada com a retencao ativa devolve a
   * mesma, sem prorrogar. Depois de expirada, retoma criando outra se houver vaga. A disponibilidade e reavaliada dentro da
   * transacao IMMEDIATE, entao dois pedidos pela ultima vaga resultam em uma retencao e um 409 (RN-021, RN-040).
   */
  iniciarCheckout(passageiroId: number, reservaId: number): ReservaDto {
    const agora = this.relogio();
    const hoje = utcParaBrasilia(agora).data;
    return withTransaction(this.db, () => {
      const reserva = this.db.prepare('SELECT * FROM reserva WHERE id = ? AND usuario_id = ?').get(reservaId, passageiroId);
      if (reserva === undefined) throw new HttpError(404, 'nao_encontrada');
      if (t(reserva['situacao']) !== 'aguardando_pagamento') throw new HttpError(409, 'reserva_nao_pendente');
      const excursaoId = Number(reserva['excursao_id']);
      const excursao = this.db
        .prepare("SELECT partida_utc FROM excursao WHERE id = ? AND situacao = 'publicada' AND data_final >= ?")
        .get(excursaoId, hoje);
      if (excursao === undefined || new Date(t(excursao['partida_utc'])).getTime() <= agora.getTime()) {
        throw new HttpError(409, 'reservas_encerradas');
      }
      expirarVencidas(this.db, agora, { excursaoId });
      if (this.db.prepare("SELECT 1 AS x FROM retencao_vaga WHERE reserva_id = ? AND situacao = 'ativa'").get(reservaId) !== undefined) {
        return this.obter(passageiroId, reservaId);
      }
      if ((disponibilidade(this.db, excursaoId, agora)?.livres ?? 0) <= 0) throw new HttpError(409, 'sem_vagas');
      let id: number;
      try {
        id = Number(
          this.db
            .prepare("INSERT INTO retencao_vaga (reserva_id, criado_em, expira_em, situacao) VALUES (?, ?, ?, 'ativa')")
            .run(reservaId, agora.toISOString(), new Date(agora.getTime() + this.retencaoMs).toISOString()).lastInsertRowid,
        );
      } catch (erro) {
        // Rede de seguranca: uq_retencao_ativa garante uma retencao ativa por reserva mesmo se a verificacao acima for contornada.
        if (erro instanceof Error && erro.message.includes('UNIQUE constraint failed')) return this.obter(passageiroId, reservaId);
        throw erro;
      }
      registrarAuditoria(this.db, {
        atorUsuarioId: passageiroId,
        acao: 'retencao.criada',
        entidade: 'retencao_vaga',
        registroId: id,
        estadoNovo: { situacao: 'ativa', reserva_id: reservaId, excursao_id: excursaoId },
        ocorridoEm: agora,
      });
      return this.obter(passageiroId, reservaId);
    });
  }

  /** Desistencia: so enquanto aguarda pagamento e sem nenhum pagamento; vira Cancelada e libera o indice unico. */
  desistir(passageiroId: number, reservaId: number): ReservaDto {
    const agora = this.relogio();
    return withTransaction(this.db, () => {
      const reserva = this.db.prepare('SELECT * FROM reserva WHERE id = ? AND usuario_id = ?').get(reservaId, passageiroId);
      if (reserva === undefined) throw new HttpError(404, 'nao_encontrada');
      if (t(reserva['situacao']) !== 'aguardando_pagamento') throw new HttpError(409, 'reserva_nao_cancelavel');
      if (this.db.prepare("SELECT 1 AS x FROM pagamento WHERE reserva_id = ? AND situacao IN ('pendente', 'confirmado') LIMIT 1").get(reservaId) !== undefined) {
        throw new HttpError(409, 'reserva_com_pagamento');
      }
      expirarVencidas(this.db, agora, { reservaId });
      const ativa = this.db.prepare("SELECT id FROM retencao_vaga WHERE reserva_id = ? AND situacao = 'ativa'").get(reservaId);
      if (ativa !== undefined) {
        this.db.prepare("UPDATE retencao_vaga SET situacao = 'cancelada' WHERE id = ?").run(Number(ativa['id']));
        registrarAuditoria(this.db, {
          atorUsuarioId: passageiroId,
          acao: 'retencao.cancelada',
          entidade: 'retencao_vaga',
          registroId: Number(ativa['id']),
          estadoAnterior: { situacao: 'ativa' },
          estadoNovo: { situacao: 'cancelada', reserva_id: reservaId },
          ocorridoEm: agora,
        });
      }
      this.db.prepare("UPDATE reserva SET situacao = 'cancelada', atualizado_em = ? WHERE id = ?").run(agora.toISOString(), reservaId);
      registrarAuditoria(this.db, {
        atorUsuarioId: passageiroId,
        acao: 'reserva.desistencia',
        entidade: 'reserva',
        registroId: reservaId,
        estadoAnterior: { situacao: 'aguardando_pagamento' },
        estadoNovo: { situacao: 'cancelada' },
        ocorridoEm: agora,
      });
      return this.obter(passageiroId, reservaId);
    });
  }
}
