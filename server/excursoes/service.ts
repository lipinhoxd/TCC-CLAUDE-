import type { DatabaseSync } from 'node:sqlite';
import { utcParaBrasilia } from '../../shared/fuso.ts';
import { HttpError } from '../auth/support.ts';
import { registrarAuditoria } from '../db/audit.ts';
import { withTransaction } from '../db/transaction.ts';
import type { Campo, DadosExcursao } from './validation.ts';
import {
  CAMPOS_LIVRES,
  CAMPOS_PROTEGIDOS,
  instantePrazo,
  lerCampos,
  validarCombinacao,
  validarPublicacao,
} from './validation.ts';

export type Situacao = 'rascunho' | 'publicada' | 'encerrada' | 'cancelada';

/**
 * Matriz de situacoes (decisao 1 da AGT-005): quatro situacoes; "concluida" fica para os processos
 * automaticos (AGT-014). Encerrada = o administrador fechou as vendas. As acoes abaixo sao manuais.
 */
export const TRANSICOES: Record<Situacao, readonly Situacao[]> = {
  rascunho: ['publicada', 'cancelada'],
  publicada: ['encerrada', 'rascunho', 'cancelada'],
  encerrada: ['cancelada'],
  cancelada: [],
};

/** Transicoes que exigem que nao haja reserva nem retencao ativa (cancelar e despublicar). */
const EXIGEM_SEM_ATIVAS = new Set<Situacao>(['rascunho', 'cancelada']);

export interface TransicaoDisponivel {
  para: Situacao;
  disponivel: boolean;
  motivo: 'reservas_ativas' | null;
}

export interface Excursao extends DadosExcursao {
  id: number;
  vagas_ocupadas: number;
  situacao: Situacao;
  /** Instante UTC (ISO) do fim do prazo da segunda parcela, ou null. */
  prazo_segunda_parcela_utc: string | null;
  criado_em: string;
  /** Token de edicao: deve voltar igual no PATCH; muda a cada alteracao (controle de edicao simultanea). */
  versao: string;
  /** Verdadeiro quando ha reserva ou retencao ativa e as condicoes comerciais e temporais estao bloqueadas. */
  edicao_restrita: boolean;
  campos_bloqueados: readonly string[];
  transicoes: TransicaoDisponivel[];
}

export interface ResumoExcursao {
  id: number;
  nome: string;
  situacao: Situacao;
  data_inicial: string;
  data_final: string;
  capacidade: number;
  vagas_ocupadas: number;
  preco_centavos: number;
  parcelamento_habilitado: boolean;
}

export interface EventoHistorico {
  id: number;
  ator_usuario_id: number | null;
  acao: string;
  estado_anterior: unknown;
  estado_novo: unknown;
  ocorrido_em: string;
}

type Row = Record<string, unknown>;

function objeto(entrada: unknown): Row {
  if (entrada === null || typeof entrada !== 'object' || Array.isArray(entrada)) {
    throw new HttpError(400, 'requisicao_invalida');
  }
  return entrada as Row;
}

const t = (valor: unknown): string => (typeof valor === 'string' ? valor : '');

function dadosDaLinha(row: Row): DadosExcursao {
  const prazo = row['prazo_segunda_parcela_utc'];
  return {
    nome: t(row['nome']),
    descricao: t(row['descricao']),
    imagem_ref: row['imagem_ref'] === null ? null : t(row['imagem_ref']),
    local: t(row['local']),
    ponto_embarque: t(row['ponto_embarque']),
    data_inicial: t(row['data_inicial']),
    data_final: t(row['data_final']),
    partida_utc: t(row['partida_utc']),
    capacidade: Number(row['capacidade']),
    preco_centavos: Number(row['preco_centavos']),
    parcelamento_habilitado: Number(row['parcelamento_habilitado']) === 1,
    prazo_segunda_parcela: prazo === null ? null : utcParaBrasilia(t(prazo)).data,
  };
}

export class ExcursaoService {
  private readonly db: DatabaseSync;
  private readonly relogio: () => Date;

  constructor(db: DatabaseSync, now?: () => Date) {
    this.db = db;
    this.relogio = now ?? (() => new Date());
  }

  /** Ha reserva nao cancelada nem concluida, ou retencao ativa, nesta excursao (RN-036)? */
  temReservaOuRetencaoAtiva(excursaoId: number): boolean {
    const reserva = this.db
      .prepare("SELECT 1 AS x FROM reserva WHERE excursao_id = ? AND situacao IN ('aguardando_pagamento', 'pronto_para_embarque') LIMIT 1")
      .get(excursaoId);
    if (reserva !== undefined) return true;
    const retencao = this.db
      .prepare(
        "SELECT 1 AS x FROM retencao_vaga rv JOIN reserva r ON r.id = rv.reserva_id WHERE r.excursao_id = ? AND rv.situacao = 'ativa' LIMIT 1",
      )
      .get(excursaoId);
    return retencao !== undefined;
  }

  private paraDto(row: Row): Excursao {
    const id = Number(row['id']);
    const situacao = t(row['situacao']) as Situacao;
    const ativa = this.temReservaOuRetencaoAtiva(id);
    return {
      ...dadosDaLinha(row),
      id,
      vagas_ocupadas: Number(row['vagas_ocupadas']),
      situacao,
      prazo_segunda_parcela_utc: row['prazo_segunda_parcela_utc'] === null ? null : t(row['prazo_segunda_parcela_utc']),
      criado_em: t(row['criado_em']),
      versao: t(row['atualizado_em']),
      edicao_restrita: ativa,
      campos_bloqueados: ativa ? CAMPOS_PROTEGIDOS : [],
      transicoes: TRANSICOES[situacao].map((para) => {
        const bloqueada = ativa && EXIGEM_SEM_ATIVAS.has(para);
        return { para, disponivel: !bloqueada, motivo: bloqueada ? ('reservas_ativas' as const) : null };
      }),
    };
  }

  private carregar(id: number): Row {
    const row = this.db.prepare('SELECT * FROM excursao WHERE id = ?').get(id);
    if (row === undefined) throw new HttpError(404, 'nao_encontrada');
    return row;
  }

  listar(): ResumoExcursao[] {
    return this.db
      .prepare(
        'SELECT id, nome, situacao, data_inicial, data_final, capacidade, vagas_ocupadas, preco_centavos, parcelamento_habilitado FROM excursao ORDER BY data_inicial DESC, id DESC',
      )
      .all()
      .map((row) => ({
        id: Number(row['id']),
        nome: t(row['nome']),
        situacao: t(row['situacao']) as Situacao,
        data_inicial: t(row['data_inicial']),
        data_final: t(row['data_final']),
        capacidade: Number(row['capacidade']),
        vagas_ocupadas: Number(row['vagas_ocupadas']),
        preco_centavos: Number(row['preco_centavos']),
        parcelamento_habilitado: Number(row['parcelamento_habilitado']) === 1,
      }));
  }

  obter(id: number): Excursao {
    return this.paraDto(this.carregar(id));
  }

  /** Cria a excursao sempre em Rascunho; publicar e outra acao (RN-037). */
  criar(atorId: number, entrada: unknown): Excursao {
    const corpo = objeto(entrada);
    const permitidos = new Set<string>([...CAMPOS_LIVRES, ...CAMPOS_PROTEGIDOS]);
    const erros: Record<string, string> = {};
    for (const chave of Object.keys(corpo)) {
      if (!permitidos.has(chave)) erros[chave] = 'campo_nao_permitido';
    }
    const { valores, erros: errosCampos } = lerCampos(corpo, [...CAMPOS_LIVRES, ...CAMPOS_PROTEGIDOS]);
    Object.assign(erros, errosCampos);
    const obrigatorios: Campo[] = ['nome', 'local', 'ponto_embarque', 'data_inicial', 'data_final', 'partida_utc', 'capacidade', 'preco_centavos'];
    for (const campo of obrigatorios) {
      if (!(campo in valores) && erros[campo] === undefined) erros[campo] = 'obrigatorio';
    }
    if (Object.keys(erros).length > 0) throw new HttpError(400, 'validacao', { fields: erros });

    const padroes: Partial<DadosExcursao> = {
      descricao: '',
      imagem_ref: null,
      parcelamento_habilitado: false,
      prazo_segunda_parcela: null,
    };
    const dados = { ...padroes, ...valores } as DadosExcursao;
    if (!dados.parcelamento_habilitado) dados.prazo_segunda_parcela = null;
    const agora = this.relogio();
    const combinacao = validarCombinacao(dados, new Set(Object.keys(dados)), agora);
    if (Object.keys(combinacao).length > 0) throw new HttpError(400, 'validacao', { fields: combinacao });

    const iso = agora.toISOString();
    return withTransaction(this.db, () => {
      const resultado = this.db
        .prepare(
          `INSERT INTO excursao (nome, descricao, imagem_ref, local, ponto_embarque, data_inicial, data_final, partida_utc,
             capacidade, vagas_ocupadas, preco_centavos, parcelamento_habilitado, prazo_segunda_parcela_utc, situacao, criado_em, atualizado_em)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'rascunho', ?, ?)`,
        )
        .run(
          dados.nome,
          dados.descricao,
          dados.imagem_ref,
          dados.local,
          dados.ponto_embarque,
          dados.data_inicial,
          dados.data_final,
          dados.partida_utc,
          dados.capacidade,
          dados.preco_centavos,
          dados.parcelamento_habilitado ? 1 : 0,
          dados.prazo_segunda_parcela === null ? null : instantePrazo(dados.prazo_segunda_parcela),
          iso,
          iso,
        );
      const id = Number(resultado.lastInsertRowid);
      registrarAuditoria(this.db, {
        atorUsuarioId: atorId,
        acao: 'excursao.criada',
        entidade: 'excursao',
        registroId: id,
        estadoNovo: { situacao: 'rascunho' },
        ocorridoEm: agora,
      });
      return this.obter(id);
    });
  }

  /** Edita campos informados (PATCH), respeitando RN-036, a capacidade minima e a edicao simultanea. */
  editar(atorId: number, id: number, entrada: unknown): Excursao {
    const corpo = objeto(entrada);
    const permitidos = new Set<string>([...CAMPOS_LIVRES, ...CAMPOS_PROTEGIDOS, 'versao']);
    const erros: Record<string, string> = {};
    for (const chave of Object.keys(corpo)) {
      if (!permitidos.has(chave)) erros[chave] = 'campo_nao_permitido';
    }
    if (typeof corpo['versao'] !== 'string' || corpo['versao'] === '') erros['versao'] = 'obrigatorio';
    const { valores, erros: errosCampos } = lerCampos(corpo, [...CAMPOS_LIVRES, ...CAMPOS_PROTEGIDOS]);
    Object.assign(erros, errosCampos);
    if (Object.keys(erros).length > 0) throw new HttpError(400, 'validacao', { fields: erros });

    const agora = this.relogio();
    return withTransaction(this.db, () => {
      const row = this.carregar(id);
      if (t(row['situacao']) === 'cancelada') throw new HttpError(409, 'excursao_cancelada');
      if (corpo['versao'] !== t(row['atualizado_em'])) throw new HttpError(409, 'conflito_de_edicao');

      const atual = dadosDaLinha(row);
      const novos: Partial<DadosExcursao> = {};
      const anteriores: Record<string, unknown> = {};
      const mudancas: Record<string, unknown> = {};
      for (const [campo, valor] of Object.entries(valores) as [Campo, unknown][]) {
        if (atual[campo] !== valor) {
          (novos as Record<string, unknown>)[campo] = valor;
          anteriores[campo] = atual[campo];
          mudancas[campo] = valor;
        }
      }
      if (Object.keys(mudancas).length === 0) throw new HttpError(400, 'validacao', { fields: { corpo: 'sem_alteracoes' } });

      const bloqueados = (CAMPOS_PROTEGIDOS as readonly string[]).filter((campo) => campo in mudancas);
      if (bloqueados.length > 0 && this.temReservaOuRetencaoAtiva(id)) {
        const campos: Record<string, string> = {};
        for (const campo of bloqueados) campos[campo] = 'bloqueado_por_reserva_ativa';
        throw new HttpError(409, 'edicao_bloqueada', { fields: campos });
      }

      const final: DadosExcursao = { ...atual, ...novos };
      if (!final.parcelamento_habilitado && final.prazo_segunda_parcela !== null) {
        final.prazo_segunda_parcela = null;
        if (atual.prazo_segunda_parcela !== null) {
          anteriores['prazo_segunda_parcela'] = atual.prazo_segunda_parcela;
          mudancas['prazo_segunda_parcela'] = null;
        }
      }
      const errosFinais = validarCombinacao(final, new Set(Object.keys(mudancas)), agora);
      if ('capacidade' in mudancas && final.capacidade < Number(row['vagas_ocupadas'])) {
        errosFinais['capacidade'] = 'menor_que_vagas_ocupadas';
      }
      if (Object.keys(errosFinais).length > 0) throw new HttpError(400, 'validacao', { fields: errosFinais });

      const anterior = Date.parse(t(row['atualizado_em']));
      const novaVersao = new Date(Math.max(agora.getTime(), anterior + 1)).toISOString();
      this.db
        .prepare(
          `UPDATE excursao SET nome = ?, descricao = ?, imagem_ref = ?, local = ?, ponto_embarque = ?, data_inicial = ?, data_final = ?,
             partida_utc = ?, capacidade = ?, preco_centavos = ?, parcelamento_habilitado = ?, prazo_segunda_parcela_utc = ?, atualizado_em = ?
           WHERE id = ?`,
        )
        .run(
          final.nome,
          final.descricao,
          final.imagem_ref,
          final.local,
          final.ponto_embarque,
          final.data_inicial,
          final.data_final,
          final.partida_utc,
          final.capacidade,
          final.preco_centavos,
          final.parcelamento_habilitado ? 1 : 0,
          final.prazo_segunda_parcela === null ? null : instantePrazo(final.prazo_segunda_parcela),
          novaVersao,
          id,
        );
      registrarAuditoria(this.db, {
        atorUsuarioId: atorId,
        acao: 'excursao.editada',
        entidade: 'excursao',
        registroId: id,
        estadoAnterior: anteriores,
        estadoNovo: mudancas,
        ocorridoEm: agora,
      });
      return this.obter(id);
    });
  }

  /** Muda a situacao pela matriz (RN-035, RN-037); cancelar e despublicar exigem ausencia de reservas ativas. */
  mudarSituacao(atorId: number, id: number, entrada: unknown): Excursao {
    const corpo = objeto(entrada);
    const destino = corpo['situacao'];
    const validos: readonly string[] = ['rascunho', 'publicada', 'encerrada', 'cancelada'];
    if (typeof destino !== 'string' || !validos.includes(destino)) {
      throw new HttpError(400, 'validacao', { fields: { situacao: typeof destino === 'string' && destino !== '' ? 'invalido' : 'obrigatorio' } });
    }
    const agora = this.relogio();
    return withTransaction(this.db, () => {
      const row = this.carregar(id);
      const origem = t(row['situacao']) as Situacao;
      if (corpo['versao'] !== undefined && corpo['versao'] !== t(row['atualizado_em'])) {
        throw new HttpError(409, 'conflito_de_edicao');
      }
      if (!TRANSICOES[origem].includes(destino as Situacao)) throw new HttpError(409, 'transicao_invalida');
      if (EXIGEM_SEM_ATIVAS.has(destino as Situacao) && this.temReservaOuRetencaoAtiva(id)) {
        throw new HttpError(409, 'excursao_com_reservas_ativas');
      }
      if (destino === 'publicada') {
        const erros = validarPublicacao(dadosDaLinha(row), agora);
        if (Object.keys(erros).length > 0) throw new HttpError(400, 'validacao', { fields: erros });
      }
      const anterior = Date.parse(t(row['atualizado_em']));
      const novaVersao = new Date(Math.max(agora.getTime(), anterior + 1)).toISOString();
      this.db.prepare('UPDATE excursao SET situacao = ?, atualizado_em = ? WHERE id = ?').run(destino, novaVersao, id);
      registrarAuditoria(this.db, {
        atorUsuarioId: atorId,
        acao: 'excursao.situacao_alterada',
        entidade: 'excursao',
        registroId: id,
        estadoAnterior: { situacao: origem },
        estadoNovo: { situacao: destino },
        ocorridoEm: agora,
      });
      return this.obter(id);
    });
  }

  /** Historico de auditoria da excursao (RF-042): so ids de ator, sem dados pessoais. */
  historico(id: number): EventoHistorico[] {
    this.carregar(id);
    const lerJson = (valor: unknown): unknown => (valor === null ? null : JSON.parse(t(valor)));
    return this.db
      .prepare(
        "SELECT id, ator_usuario_id, acao, estado_anterior, estado_novo, ocorrido_em FROM auditoria WHERE entidade = 'excursao' AND registro_id = ? ORDER BY id DESC",
      )
      .all(id)
      .map((row) => ({
        id: Number(row['id']),
        ator_usuario_id: row['ator_usuario_id'] === null ? null : Number(row['ator_usuario_id']),
        acao: t(row['acao']),
        estado_anterior: lerJson(row['estado_anterior']),
        estado_novo: lerJson(row['estado_novo']),
        ocorrido_em: t(row['ocorrido_em']),
      }));
  }
}
