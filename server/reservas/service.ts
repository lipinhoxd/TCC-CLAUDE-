import type { DatabaseSync } from 'node:sqlite';
import { dividirEmDuas } from '../../shared/dinheiro.ts';
import { utcParaBrasilia } from '../../shared/fuso.ts';
import { HttpError } from '../auth/support.ts';
import { registrarAuditoria } from '../db/audit.ts';
import { withTransaction } from '../db/transaction.ts';
import { vagasDisponiveis } from '../excursoes/publico.ts';
import { instantePrazo } from '../excursoes/validation.ts';

/**
 * Reservas do passageiro (AGT-007, RF-018 a RF-020). Cria a reserva em "aguardando_pagamento" e nada mais:
 * nao cria pagamento nem retencao e nao altera vagas_ocupadas (RN-021 fica a cargo do banco e das AGT-008 a 010).
 * Decisoes do pesquisador: reserva criada ao solicitar; desistencia enquanto nao houver pagamento; ate 3
 * reservas pendentes por passageiro; primeira parcela = metade para baixo e segunda = restante; modalidade
 * escolhida na solicitacao e sem troca; solicitacao recusada sem vagas, mas varias pendentes na ultima vaga.
 */

export const LIMITE_PENDENTES = 3;

export type Modalidade = 'integral' | 'parcelada';

export interface Parcela {
  parcela: 'unica' | 'primeira' | 'segunda';
  valor_centavos: number;
  /** Data (Brasilia) de vencimento; so a segunda parcela tem. */
  vencimento: string | null;
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

  constructor(db: DatabaseSync, now?: () => Date) {
    this.db = db;
    this.relogio = now ?? (() => new Date());
  }

  private paraDto(reserva: Row): ReservaDto {
    const excursao = this.db.prepare('SELECT * FROM excursao WHERE id = ?').get(Number(reserva['excursao_id']));
    if (excursao === undefined) throw new HttpError(404, 'nao_encontrada');
    const modalidade: Modalidade = reserva['modalidade'] === 'parcelada' ? 'parcelada' : 'integral';
    const prazo = excursao['prazo_segunda_parcela_utc'];
    const total = Number(excursao['preco_centavos']);
    const partida = utcParaBrasilia(t(excursao['partida_utc']));
    const situacao = t(reserva['situacao']);
    const comPagamento = this.db.prepare('SELECT 1 AS x FROM pagamento WHERE reserva_id = ? LIMIT 1').get(Number(reserva['id'])) !== undefined;
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

      if (vagasDisponiveis(Number(excursao['capacidade']), Number(excursao['vagas_ocupadas'])) <= 0) {
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

  /** Desistencia: so enquanto aguarda pagamento e sem nenhum pagamento; vira Cancelada e libera o indice unico. */
  desistir(passageiroId: number, reservaId: number): ReservaDto {
    const agora = this.relogio();
    return withTransaction(this.db, () => {
      const reserva = this.db.prepare('SELECT * FROM reserva WHERE id = ? AND usuario_id = ?').get(reservaId, passageiroId);
      if (reserva === undefined) throw new HttpError(404, 'nao_encontrada');
      if (t(reserva['situacao']) !== 'aguardando_pagamento') throw new HttpError(409, 'reserva_nao_cancelavel');
      if (this.db.prepare('SELECT 1 AS x FROM pagamento WHERE reserva_id = ? LIMIT 1').get(reservaId) !== undefined) {
        throw new HttpError(409, 'reserva_com_pagamento');
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
