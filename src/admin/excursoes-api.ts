import { NetworkError, apiRequest } from '../api.ts';

/** Cliente da API administrativa de excursoes e textos da interface (AGT-005). O servidor e a autoridade. */

export type Situacao = 'rascunho' | 'publicada' | 'encerrada' | 'cancelada';

export const ROTULO_SITUACAO: Record<Situacao, string> = {
  rascunho: 'Rascunho',
  publicada: 'Publicada',
  encerrada: 'Encerrada',
  cancelada: 'Cancelada',
};

export interface Transicao {
  para: Situacao;
  disponivel: boolean;
  motivo: 'reservas_ativas' | null;
}

export interface ExcursaoCompleta {
  id: number;
  nome: string;
  descricao: string;
  imagem_ref: string | null;
  local: string;
  ponto_embarque: string;
  data_inicial: string;
  data_final: string;
  partida_utc: string;
  capacidade: number;
  vagas_ocupadas: number;
  preco_centavos: number;
  parcelamento_habilitado: boolean;
  prazo_segunda_parcela: string | null;
  situacao: Situacao;
  versao: string;
  edicao_restrita: boolean;
  campos_bloqueados: string[];
  transicoes: Transicao[];
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
  estado_anterior: Record<string, unknown> | null;
  estado_novo: Record<string, unknown> | null;
  ocorrido_em: string;
}

export type Resultado<T> =
  | { ok: true; dados: T }
  | { ok: false; motivo: 'acesso' | 'rede' | 'nao_encontrada' | 'erro' }
  | { ok: false; motivo: 'recusa'; status: number; codigo: string; campos: Record<string, string> };

interface Corpo {
  error?: string;
  fields?: Record<string, string>;
}

async function chamar<T>(metodo: 'GET' | 'POST' | 'PATCH', caminho: string, corpo?: unknown, extrair?: (dados: Record<string, unknown>) => T): Promise<Resultado<T>> {
  try {
    const r = await apiRequest<Record<string, unknown> & Corpo>(metodo, caminho, corpo);
    if (r.status >= 200 && r.status < 300 && r.data !== null && extrair !== undefined) {
      return { ok: true, dados: extrair(r.data) };
    }
    if (r.status === 401 || r.status === 403) return { ok: false, motivo: 'acesso' };
    if (r.status === 404) return { ok: false, motivo: 'nao_encontrada' };
    if ((r.status === 400 || r.status === 409) && r.data?.error !== undefined) {
      return { ok: false, motivo: 'recusa', status: r.status, codigo: r.data.error, campos: r.data.fields ?? {} };
    }
    return { ok: false, motivo: 'erro' };
  } catch (erro) {
    return { ok: false, motivo: erro instanceof NetworkError ? 'rede' : 'erro' };
  }
}

const BASE = '/api/admin/excursoes';

export const excursoesApi = {
  listar: () => chamar('GET', BASE, undefined, (d) => d['excursoes'] as ResumoExcursao[]),
  obter: (id: number) => chamar('GET', `${BASE}/${id}`, undefined, (d) => d['excursao'] as ExcursaoCompleta),
  criar: (corpo: Record<string, unknown>) => chamar('POST', BASE, corpo, (d) => d['excursao'] as ExcursaoCompleta),
  editar: (id: number, corpo: Record<string, unknown>) => chamar('PATCH', `${BASE}/${id}`, corpo, (d) => d['excursao'] as ExcursaoCompleta),
  mudarSituacao: (id: number, situacao: Situacao, versao: string) =>
    chamar('POST', `${BASE}/${id}/situacao`, { situacao, versao }, (d) => d['excursao'] as ExcursaoCompleta),
  historico: (id: number) => chamar('GET', `${BASE}/${id}/historico`, undefined, (d) => d['historico'] as EventoHistorico[]),
};

/** Nome do campo no servidor -> nome do campo no formulario. */
export const CAMPO_DO_FORMULARIO: Record<string, string> = {
  partida_utc: 'partida',
  preco_centavos: 'preco',
};

const GERAL: Record<string, string> = {
  obrigatorio: 'Preencha este campo.',
  invalido: 'Valor inválido. Confira e tente de novo.',
  campo_nao_permitido: 'Este campo não pode ser alterado.',
  sem_alteracoes: 'Nenhuma alteração para salvar.',
  bloqueado_por_reserva_ativa: 'Bloqueado: há reserva ou retenção ativa nesta excursão.',
};

const POR_CAMPO: Record<string, Record<string, string>> = {
  capacidade: {
    fora_do_limite: 'A capacidade deve ficar entre 1 e 1.000.',
    menor_que_vagas_ocupadas: 'A capacidade não pode ficar abaixo das vagas já ocupadas.',
  },
  preco_centavos: { fora_do_limite: 'O preço deve ficar entre R$ 0,01 e R$ 100.000,00.' },
  data_inicial: { no_passado: 'A data inicial não pode estar no passado.' },
  data_final: { anterior_a_data_inicial: 'A data final não pode ser anterior à data inicial.' },
  partida_utc: {
    fora_da_data_inicial: 'A partida deve ser na data inicial ou no dia anterior (horário de Brasília).',
    no_passado: 'A partida já passou.',
  },
  prazo_segunda_parcela: {
    nao_anterior_a_partida: 'O prazo deve ser anterior ao dia da partida.',
    no_passado: 'O prazo da segunda parcela já passou.',
    obrigatorio: 'Informe o prazo da segunda parcela.',
  },
  imagem_ref: { invalido: 'Use um caminho como imagens/nome.jpg (jpg, jpeg, png ou webp).' },
  nome: { invalido: 'O nome precisa ter de 3 a 120 caracteres.' },
};

export function mensagemDeCampo(campoServidor: string, codigo: string): string {
  return POR_CAMPO[campoServidor]?.[codigo] ?? GERAL[codigo] ?? GERAL['invalido'] ?? 'Valor inválido.';
}

export const MENSAGEM_DE_ERRO: Record<string, string> = {
  conflito_de_edicao: 'Outra pessoa alterou esta excursão enquanto você editava. Recarregue para ver a versão atual.',
  excursao_cancelada: 'Excursão cancelada não pode ser editada.',
  transicao_invalida: 'Essa mudança de situação não é permitida a partir da situação atual.',
  excursao_com_reservas_ativas: 'Há reservas ou retenções ativas. Cancelar e voltar para rascunho ficam bloqueados enquanto elas existirem.',
  edicao_bloqueada: 'Há reserva ou retenção ativa: as condições comerciais e temporais não podem ser alteradas. Nome, descrição, imagem, local e ponto de embarque continuam editáveis.',
  validacao: 'Corrija os campos destacados.',
};

export const ROTULO_ACAO: Record<string, string> = {
  'excursao.criada': 'Excursão criada',
  'excursao.editada': 'Excursão editada',
  'excursao.situacao_alterada': 'Situação alterada',
};

export const ROTULO_CAMPO: Record<string, string> = {
  nome: 'nome',
  descricao: 'descrição',
  imagem_ref: 'imagem',
  local: 'local',
  ponto_embarque: 'ponto de embarque',
  data_inicial: 'data inicial',
  data_final: 'data final',
  partida_utc: 'partida',
  capacidade: 'capacidade',
  preco_centavos: 'preço',
  parcelamento_habilitado: 'parcelamento',
  prazo_segunda_parcela: 'prazo da 2ª parcela',
};
