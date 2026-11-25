import { NetworkError, apiRequest } from '../api.ts';

/** Cliente das reservas do passageiro (AGT-007, AGT-008). O servidor decide tudo; aqui so se envia e se mostra. */

export type Modalidade = 'integral' | 'parcelada';

export interface ParcelaReserva {
  parcela: 'unica' | 'primeira' | 'segunda';
  valor_centavos: number;
  vencimento: string | null;
  situacao_pagamento?: Pagamento['situacao'] | null;
}

export interface Retencao {
  situacao: 'ativa' | 'confirmada' | 'expirada' | 'cancelada';
  expira_em: string;
  segundos_restantes: number;
}

export type ParcelaPagamento = 'unica' | 'primeira' | 'segunda';

export interface Pagamento {
  parcela: ParcelaPagamento;
  situacao: 'pendente' | 'confirmado' | 'falhou' | 'estornado';
  valor_centavos: number;
  confirmado_em: string | null;
  requer_tratamento_administrativo: boolean;
}

export interface Reserva {
  id: number;
  situacao: 'aguardando_pagamento' | 'pronto_para_embarque' | 'concluida' | 'cancelada';
  modalidade: Modalidade;
  criada_em: string;
  excursao: {
    id: number;
    nome: string;
    local: string;
    ponto_embarque: string;
    data_inicial: string;
    data_final: string;
    partida_brasilia: { data: string; hora: string };
  };
  valores: { total_centavos: number; parcelas: ParcelaReserva[] };
  pode_desistir: boolean;
  retencao: Retencao | null;
  pagamento: Pagamento | null;
  proxima_parcela: ParcelaPagamento | null;
  motivo_cancelamento: 'inadimplencia' | null;
  pagamento_disponivel: boolean;
  pagamento_simulado: boolean;
}

export type ResultadoReserva =
  | { ok: true; reserva: Reserva }
  | { ok: false; motivo: 'acesso' | 'rede' | 'nao_encontrada' | 'erro' }
  | { ok: false; motivo: 'recusa'; status: number; codigo: string; campos: Record<string, string> };

/** Lista da area do passageiro (AGT-011): em andamento e historico (concluidas e canceladas). */
export interface ListaReservas {
  em_andamento: Reserva[];
  historico: Reserva[];
}

export type ResultadoLista =
  | { ok: true; lista: ListaReservas }
  | { ok: false; motivo: 'acesso' | 'rede' | 'erro' };

async function listarReservas(): Promise<ResultadoLista> {
  try {
    const r = await apiRequest<Partial<ListaReservas>>('GET', '/api/reservas');
    if (r.status === 200 && Array.isArray(r.data?.em_andamento) && Array.isArray(r.data?.historico)) {
      return { ok: true, lista: { em_andamento: r.data.em_andamento, historico: r.data.historico } };
    }
    if (r.status === 401 || r.status === 403) return { ok: false, motivo: 'acesso' };
    return { ok: false, motivo: 'erro' };
  } catch (erro) {
    return { ok: false, motivo: erro instanceof NetworkError ? 'rede' : 'erro' };
  }
}

interface Corpo {
  reserva?: Reserva;
  error?: string;
  fields?: Record<string, string>;
}

async function chamar(metodo: 'GET' | 'POST', caminho: string, corpo?: unknown): Promise<ResultadoReserva> {
  try {
    const r = await apiRequest<Corpo>(metodo, caminho, corpo);
    if (r.status >= 200 && r.status < 300 && r.data?.reserva !== undefined) return { ok: true, reserva: r.data.reserva };
    if (r.status === 401 || r.status === 403) return { ok: false, motivo: 'acesso' };
    if (r.status === 404 && r.data?.error === 'nao_encontrada') return { ok: false, motivo: 'nao_encontrada' };
    if ((r.status === 400 || r.status === 404 || r.status === 409 || r.status === 503) && r.data?.error !== undefined) {
      return { ok: false, motivo: 'recusa', status: r.status, codigo: r.data.error, campos: r.data.fields ?? {} };
    }
    return { ok: false, motivo: 'erro' };
  } catch (erro) {
    return { ok: false, motivo: erro instanceof NetworkError ? 'rede' : 'erro' };
  }
}

export const reservasApi = {
  solicitar: (excursaoId: number, modalidade: Modalidade) => chamar('POST', '/api/reservas', { excursao_id: excursaoId, modalidade }),
  obter: (id: number) => chamar('GET', `/api/reservas/${id}`),
  /** As proprias reservas: em andamento e historico (AGT-011). */
  listar: listarReservas,
  /** Abre o checkout: inicia ou retoma a retencao temporaria da vaga (AGT-008). */
  iniciarCheckout: (id: number) => chamar('POST', `/api/reservas/${id}/checkout`),
  /** Inicia (ou retoma) o pagamento integral (AGT-009). */
  pagar: (id: number) => chamar('POST', `/api/reservas/${id}/pagamento`),
  /** Resultado do provedor simulado; so existe fora de producao (AGT-009). */
  simular: (id: number, resultado: 'aprovado' | 'recusado') => chamar('POST', `/api/reservas/${id}/pagamento/simulacao`, { resultado }),
  desistir: (id: number) => chamar('POST', `/api/reservas/${id}/desistir`),
};

export const ROTULO_SITUACAO_RESERVA: Record<Reserva['situacao'], string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pronto_para_embarque: 'Pronto para embarque',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export const MENSAGEM_RESERVA: Record<string, string> = {
  sem_vagas: 'Não há vaga disponível agora: as vagas restantes estão retidas por outras pessoas ou esgotaram.',
  reserva_nao_pendente: 'Esta reserva não está mais aguardando pagamento.',
  retencao_inativa: 'A vaga não está mais retida para você. Retome o checkout antes de pagar.',
  prazo_da_segunda_parcela_vencido: 'O prazo da segunda parcela venceu: a vaga foi liberada e a primeira parcela não é reembolsável.',
  primeira_parcela_nao_confirmada: 'A primeira parcela ainda não foi confirmada.',
  pagamento_ja_confirmado: 'O pagamento desta reserva já foi confirmado.',
  pagamento_parcelado_indisponivel: 'O pagamento em duas parcelas ainda não está disponível.',
  pagamento_indisponivel: 'O pagamento não está disponível neste ambiente.',
  pagamento_nao_iniciado: 'O pagamento ainda não foi iniciado.',
  pagamento_nao_pendente: 'Este pagamento não está mais pendente.',
  banco_ocupado: 'O sistema está ocupado agora. Tente de novo em instantes.',
  limite_de_reservas_pendentes: 'Você já tem 3 reservas aguardando pagamento. Conclua ou desista de uma antes de reservar outra.',
  reservas_encerradas: 'As reservas desta excursão estão encerradas.',
  excursao_nao_encontrada: 'Esta excursão não foi encontrada ou não está disponível.',
  reserva_nao_cancelavel: 'Esta reserva não pode mais ser cancelada por aqui.',
  reserva_com_pagamento: 'Esta reserva já tem pagamento e não pode ser cancelada por aqui.',
};

export const MENSAGEM_MODALIDADE: Record<string, string> = {
  parcelamento_indisponivel: 'Esta excursão não permite pagamento em duas parcelas.',
  prazo_da_segunda_parcela_vencido: 'O prazo da segunda parcela já passou. Escolha o pagamento integral.',
  invalido: 'Escolha uma forma de pagamento válida.',
};
