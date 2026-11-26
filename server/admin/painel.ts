import type { DatabaseSync } from 'node:sqlite';
import { dividirEmDuas } from '../../shared/dinheiro.ts';
import { brasiliaParaUtc, dataValida, somarDias, utcParaBrasilia } from '../../shared/fuso.ts';
import { HttpError } from '../auth/support.ts';
import { disponibilidade } from '../vagas/disponibilidade.ts';

/**
 * Painel consolidado e historico administrativo (AGT-016, RF-041, RF-042). So leitura: quem efetiva vencimentos e conclusoes antes do
 * painel e o AdminService, como nas demais telas administrativas (decisao 3.1 do pesquisador). Valores em centavos (RN-038).
 */

export const LIMITE_EXCURSOES = 100;
export const HISTORICO_POR_PAGINA = 20;

type Row = Record<string, unknown>;
const t = (valor: unknown): string => (typeof valor === 'string' ? valor : '');
const n = (valor: unknown): number => Number(valor);

export interface ExcursaoNoPainel {
  id: number;
  nome: string;
  situacao: 'publicada' | 'encerrada';
  data_inicial: string;
  data_final: string;
  capacidade: number;
  ocupadas: number;
  retidas: number;
  livres: number;
}

export interface Painel {
  gerado_em: string;
  /** Excursoes publicadas ou encerradas que ainda nao terminaram (data final nao anterior a hoje, em Brasilia). */
  excursoes: { itens: ExcursaoNoPainel[]; total: number };
  reservas: { aguardando_pagamento: number; pronto_para_embarque: number; concluida: number; cancelada: number; total: number };
  /** Totais de todo o historico, em centavos (decisao 1.2). */
  valores: {
    recebido_centavos: number;
    devolvido_centavos: number;
    liquido_centavos: number;
    a_devolver_centavos: number;
    a_receber_centavos: number;
  };
  /** Pagamentos confirmados que aguardam tratamento, o mesmo criterio da tela de pendencias. */
  pendencias: number;
  emails_com_falha: number;
}

/** Monta o painel. Deve rodar dentro de uma transacao, para todos os numeros virem do mesmo instante do banco. */
export function montarPainel(db: DatabaseSync, agora: Date): Painel {
  if (!db.isTransaction) throw new Error('O painel exige uma transacao aberta, para uma leitura consistente.');
  const hoje = utcParaBrasilia(agora).data;
  const soma = (sql: string, ...parametros: string[]): number => n(db.prepare(sql).get(...parametros)?.['v']);

  const condicao = "situacao IN ('publicada', 'encerrada') AND data_final >= ?";
  const totalExcursoes = soma(`SELECT COUNT(*) AS v FROM excursao WHERE ${condicao}`, hoje);
  const itens = db
    .prepare(`SELECT id, nome, situacao, data_inicial, data_final FROM excursao WHERE ${condicao} ORDER BY data_inicial, id LIMIT ${LIMITE_EXCURSOES}`)
    .all(hoje)
    .map((e): ExcursaoNoPainel => {
      // A mesma funcao das reservas e da consulta publica (retencoes ativas e no prazo).
      const d = disponibilidade(db, n(e['id']), agora);
      return {
        id: n(e['id']),
        nome: t(e['nome']),
        situacao: t(e['situacao']) as ExcursaoNoPainel['situacao'],
        data_inicial: t(e['data_inicial']),
        data_final: t(e['data_final']),
        capacidade: d?.capacidade ?? 0,
        ocupadas: d?.ocupadas ?? 0,
        retidas: d?.retidas ?? 0,
        livres: d?.livres ?? 0,
      };
    });

  const reservas = { aguardando_pagamento: 0, pronto_para_embarque: 0, concluida: 0, cancelada: 0, total: 0 };
  for (const linha of db.prepare('SELECT situacao, COUNT(*) AS v FROM reserva GROUP BY situacao').all()) {
    reservas[t(linha['situacao']) as 'cancelada'] = n(linha['v']);
    reservas.total += n(linha['v']);
  }

  const recebido = soma("SELECT COALESCE(SUM(valor_centavos), 0) AS v FROM pagamento WHERE situacao IN ('confirmado', 'estornado')");
  const devolvido = soma("SELECT COALESCE(SUM(valor_centavos), 0) AS v FROM reembolso WHERE situacao = 'processado'");
  const aDevolver = soma("SELECT COALESCE(SUM(valor_centavos), 0) AS v FROM reembolso WHERE situacao IN ('pendente', 'recusado')");
  // Segunda parcela em aberto e no prazo: reserva parcelada aguardando, com a primeira confirmada com vaga e sem a segunda confirmada.
  const aReceber = db
    .prepare(
      `SELECT e.preco_centavos AS preco FROM reserva r JOIN excursao e ON e.id = r.excursao_id
       WHERE r.modalidade = 'parcelada' AND r.situacao = 'aguardando_pagamento' AND e.situacao <> 'cancelada'
         AND e.prazo_segunda_parcela_utc > ?
         AND EXISTS (SELECT 1 FROM pagamento p WHERE p.reserva_id = r.id AND p.parcela = 'primeira' AND p.situacao = 'confirmado' AND p.pendencia_administrativa IS NULL)
         AND NOT EXISTS (SELECT 1 FROM pagamento p WHERE p.reserva_id = r.id AND p.parcela = 'segunda' AND p.situacao = 'confirmado')`,
    )
    .all(agora.toISOString())
    .reduce((total, linha) => total + dividirEmDuas(n(linha['preco'])).segunda, 0);

  return {
    gerado_em: agora.toISOString(),
    excursoes: { itens, total: totalExcursoes },
    reservas,
    valores: { recebido_centavos: recebido, devolvido_centavos: devolvido, liquido_centavos: recebido - devolvido, a_devolver_centavos: aDevolver, a_receber_centavos: aReceber },
    pendencias: soma("SELECT COUNT(*) AS v FROM pagamento WHERE situacao = 'confirmado' AND pendencia_administrativa IS NOT NULL"),
    emails_com_falha: soma("SELECT COUNT(*) AS v FROM mensagem WHERE email_situacao = 'falhou'"),
  };
}

/* ---------------------------------------------------------------- historico */

export const ENTIDADES_DO_HISTORICO = ['excursao', 'reserva', 'pagamento', 'reembolso', 'retencao_vaga', 'usuario', 'mensagem'] as const;
export type OrigemDoEvento = 'administrador' | 'sistema';

/** So os campos aprovados do evento (decisao 2.3); o restante do que foi gravado nao sai. */
export interface EventoDoHistorico {
  id: number;
  ocorrido_em: string;
  acao: string;
  entidade: string;
  registro_id: number | null;
  /** null = acao do sistema. */
  ator_usuario_id: number | null;
  reserva_id: number | null;
  situacao_anterior: string | null;
  situacao_nova: string | null;
  valor_centavos: number | null;
  valor_reembolso_centavos: number | null;
  valor_total_centavos: number | null;
  percentual: number | null;
  justificativa: string | null;
}

/**
 * Eventos do historico (decisao 2.1): feitos por um administrador ou pelo sistema (sem ator). Acoes de acesso (auth.*) e de passageiros
 * ficam de fora. So texto fixo: nenhum parametro do pedido entra aqui.
 */
const BASE = `FROM auditoria a LEFT JOIN usuario u ON u.id = a.ator_usuario_id
  WHERE a.acao NOT LIKE 'auth.%' AND (a.ator_usuario_id IS NULL OR u.perfil = 'administrador')`;

const PARAMETROS = ['origem', 'acao', 'entidade', 'registro', 'de', 'ate', 'pagina'];

const texto = (valor: unknown): string | null => (typeof valor === 'string' ? valor : null);
const inteiro = (valor: unknown): number | null => (typeof valor === 'number' && Number.isSafeInteger(valor) ? valor : null);
const lerEstado = (valor: unknown): Record<string, unknown> => (typeof valor === 'string' ? (JSON.parse(valor) as Record<string, unknown>) : {});

function paraEvento(l: Row): EventoDoHistorico {
  const antes = lerEstado(l['estado_anterior']);
  const depois = lerEstado(l['estado_novo']);
  const entidade = t(l['entidade']);
  const registro = l['registro_id'] === null ? null : n(l['registro_id']);
  return {
    id: n(l['id']),
    ocorrido_em: t(l['ocorrido_em']),
    acao: t(l['acao']),
    entidade,
    registro_id: registro,
    ator_usuario_id: l['ator_usuario_id'] === null ? null : n(l['ator_usuario_id']),
    reserva_id: entidade === 'reserva' ? registro : inteiro(depois['reserva_id']),
    situacao_anterior: texto(antes['situacao']),
    situacao_nova: texto(depois['situacao']),
    valor_centavos: inteiro(depois['valor_centavos']),
    valor_reembolso_centavos: inteiro(depois['valor_reembolso_centavos']),
    valor_total_centavos: inteiro(depois['valor_total_centavos']),
    percentual: inteiro(depois['percentual']),
    justificativa: texto(depois['justificativa']),
  };
}

export interface PaginaDoHistorico {
  eventos: EventoDoHistorico[];
  total: number;
  pagina: number;
  limite: number;
  /** Tipos de acao que ja existem no historico, para o filtro. */
  acoes: string[];
}

/** Historico paginado, do mais recente para o mais antigo. Filtros validados e sempre parametrizados. */
export function listarHistorico(db: DatabaseSync, consulta: Record<string, string | undefined>): PaginaDoHistorico {
  const erros: Record<string, string> = {};
  for (const chave of Object.keys(consulta)) if (!PARAMETROS.includes(chave)) erros[chave] = 'campo_nao_permitido';
  const valor = (campo: string): string | undefined => {
    const v = consulta[campo];
    return v === undefined || v === '' ? undefined : v;
  };
  const filtros: string[] = [];
  const parametros: Array<string | number> = [];

  const origem = valor('origem');
  if (origem === 'sistema') filtros.push('a.ator_usuario_id IS NULL');
  else if (origem === 'administrador') filtros.push('a.ator_usuario_id IS NOT NULL');
  else if (origem !== undefined) erros['origem'] = 'invalido';

  const acao = valor('acao');
  if (acao !== undefined) {
    if (!/^[a-z_]{1,40}\.[a-z_]{1,60}$/.test(acao)) erros['acao'] = 'invalido';
    else {
      filtros.push('a.acao = ?');
      parametros.push(acao);
    }
  }

  const entidade = valor('entidade');
  if (entidade !== undefined) {
    if (!(ENTIDADES_DO_HISTORICO as readonly string[]).includes(entidade)) erros['entidade'] = 'invalido';
    else {
      filtros.push('a.entidade = ?');
      parametros.push(entidade);
    }
  }
  const registro = valor('registro');
  if (registro !== undefined) {
    if (!/^[1-9][0-9]{0,14}$/.test(registro)) erros['registro'] = 'invalido';
    else if (entidade === undefined) erros['entidade'] = 'obrigatorio';
    else {
      filtros.push('a.registro_id = ?');
      parametros.push(Number(registro));
    }
  }

  // Periodo em datas de Brasilia (RN-039): do inicio do dia "de" ao fim do dia "ate".
  const inicioDe = (data: string): string | null => (dataValida(data) ? (brasiliaParaUtc(data)?.toISOString() ?? null) : null);
  const de = valor('de');
  const ate = valor('ate');
  if (de !== undefined) {
    const instante = inicioDe(de);
    if (instante === null) erros['de'] = 'invalido';
    else {
      filtros.push('a.ocorrido_em >= ?');
      parametros.push(instante);
    }
  }
  if (ate !== undefined) {
    const instante = dataValida(ate) ? inicioDe(somarDias(ate, 1)) : null;
    if (instante === null) erros['ate'] = 'invalido';
    else if (de !== undefined && dataValida(de) && ate < de) erros['ate'] = 'anterior_ao_inicio';
    else {
      filtros.push('a.ocorrido_em < ?');
      parametros.push(instante);
    }
  }

  const bruto = valor('pagina');
  const pagina = bruto === undefined ? 1 : /^[0-9]{1,6}$/.test(bruto) ? Number(bruto) : 0;
  if (pagina < 1) erros['pagina'] = 'invalido';
  if (Object.keys(erros).length > 0) throw new HttpError(400, 'validacao', { fields: erros });

  const onde = filtros.map((f) => ` AND ${f}`).join('');
  const total = n(db.prepare(`SELECT COUNT(*) AS v ${BASE}${onde}`).get(...parametros)?.['v']);
  const eventos = db
    .prepare(`SELECT a.id, a.ocorrido_em, a.acao, a.entidade, a.registro_id, a.ator_usuario_id, a.estado_anterior, a.estado_novo ${BASE}${onde} ORDER BY a.id DESC LIMIT ? OFFSET ?`)
    .all(...parametros, HISTORICO_POR_PAGINA, (pagina - 1) * HISTORICO_POR_PAGINA)
    .map(paraEvento);
  const acoes = db
    .prepare(`SELECT DISTINCT a.acao AS acao ${BASE} ORDER BY a.acao`)
    .all()
    .map((l) => t(l['acao']));
  return { eventos, total, pagina, limite: HISTORICO_POR_PAGINA, acoes };
}
