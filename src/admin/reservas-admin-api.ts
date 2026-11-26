import { NetworkError, apiRequest } from '../api.ts';

/** Cliente da API de administracao de reservas e passageiros (AGT-012). O servidor e a autoridade; aqui so se envia e se mostra. */

export type SituacaoReserva = 'aguardando_pagamento' | 'pronto_para_embarque' | 'concluida' | 'cancelada';
export type Modalidade = 'integral' | 'parcelada';
export type TipoPendencia = 'confirmado_sem_vaga' | 'segunda_parcela_apos_vencimento';

export const ROTULO_SITUACAO: Record<SituacaoReserva, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pronto_para_embarque: 'Pronto para embarque',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};
export const ROTULO_MODALIDADE: Record<Modalidade, string> = { integral: 'Pagamento integral', parcelada: 'Em 2 parcelas de 50%' };
export const ROTULO_TIPO_PENDENCIA: Record<TipoPendencia, string> = {
  confirmado_sem_vaga: 'Pagamento confirmado sem vaga',
  segunda_parcela_apos_vencimento: 'Segunda parcela confirmada depois do vencimento',
};
export const ROTULO_PARCELA = { unica: 'Parcela única', primeira: 'Primeira parcela', segunda: 'Segunda parcela' } as const;
export const ROTULO_PAGAMENTO = { pendente: 'Aguardando confirmação', confirmado: 'Pago', falhou: 'Recusado', estornado: 'Estornado' } as const;

export interface Pagina {
  total: number;
  pagina: number;
  limite: number;
}

export interface ReservaResumo {
  id: number;
  situacao: SituacaoReserva;
  modalidade: Modalidade;
  criada_em: string;
  motivo_cancelamento: 'inadimplencia' | null;
  passageiro: { id: number; nome_completo: string; email: string };
  excursao: { id: number; nome: string; data_inicial: string; data_final: string };
  total_centavos: number;
  tem_pendencia: boolean;
}

export interface AlteracaoPermitida {
  para: 'cancelada' | 'concluida';
  disponivel: boolean;
  motivo: string | null;
}

export interface EventoAuditoria {
  id: number;
  ator_usuario_id: number | null;
  acao: string;
  entidade: string;
  registro_id: number | null;
  estado_anterior: Record<string, unknown> | null;
  estado_novo: Record<string, unknown> | null;
  ocorrido_em: string;
}

export interface PagamentoAdmin {
  id: number;
  parcela: 'unica' | 'primeira' | 'segunda';
  situacao: 'pendente' | 'confirmado' | 'falhou' | 'estornado';
  valor_centavos: number;
  confirmado_em: string | null;
  criado_em: string;
  pendencia: 'confirmado_sem_vaga' | null;
}

export interface ReservaDetalhe {
  id: number;
  situacao: SituacaoReserva;
  modalidade: Modalidade;
  criada_em: string;
  atualizada_em: string;
  motivo_cancelamento: 'inadimplencia' | null;
  passageiro: { id: number; nome_completo: string; email: string };
  excursao: { id: number; nome: string; local: string; situacao: string; data_inicial: string; data_final: string };
  valores: { total_centavos: number; parcelas: Array<{ parcela: 'unica' | 'primeira' | 'segunda'; valor_centavos: number; vencimento: string | null }> };
  pagamentos: PagamentoAdmin[];
  retencoes: Array<{ id: number; situacao: string; criada_em: string; expira_em: string }>;
  pendencias: TipoPendencia[];
  alteracoes_permitidas: AlteracaoPermitida[];
  auditoria: EventoAuditoria[];
}

export interface Pendencia {
  tipo: TipoPendencia;
  pagamento: { id: number; parcela: 'unica' | 'primeira' | 'segunda'; situacao: string; valor_centavos: number; confirmado_em: string };
  reserva: { id: number; situacao: SituacaoReserva };
  passageiro: { id: number; nome_completo: string };
  excursao: { id: number; nome: string };
}

export interface PassageiroResumo {
  id: number;
  nome_completo: string;
  email: string;
  cpf_mascarado: string;
  telefone_mascarado: string;
  criado_em: string;
  total_reservas: number;
}

export interface PassageiroDetalhe {
  id: number;
  nome_completo: string;
  email: string;
  cpf: string;
  telefone: string;
  data_nascimento: string;
  criado_em: string;
  reservas: Array<{
    id: number;
    situacao: SituacaoReserva;
    modalidade: Modalidade;
    criada_em: string;
    motivo_cancelamento: 'inadimplencia' | null;
    excursao: { id: number; nome: string; data_inicial: string; data_final: string };
    total_centavos: number;
  }>;
}

export type Resultado<T> =
  | { ok: true; dados: T }
  | { ok: false; motivo: 'acesso' | 'rede' | 'erro' | 'nao_encontrada' }
  | { ok: false; motivo: 'recusa'; status: number; codigo: string; campos: Record<string, string> };

interface Erro {
  error?: string;
  fields?: Record<string, string>;
}

async function chamar<T>(metodo: 'GET' | 'POST', caminho: string, corpo?: unknown): Promise<Resultado<T>> {
  try {
    const r = await apiRequest<T & Erro>(metodo, caminho, corpo);
    if (r.status >= 200 && r.status < 300 && r.data !== null) return { ok: true, dados: r.data };
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

function consulta(filtros: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor === undefined || valor === '' || (chave === 'pagina' && Number(valor) === 1)) continue; // a pagina 1 e a padrao
    params.set(chave, String(valor));
  }
  const texto = params.toString();
  return texto === '' ? '' : `?${texto}`;
}

export const adminReservasApi = {
  listarReservas: (filtros: Record<string, string | number | undefined>) =>
    chamar<{ reservas: ReservaResumo[] } & Pagina>('GET', `/api/admin/reservas${consulta(filtros)}`),
  obterReserva: (id: number) => chamar<{ reserva: ReservaDetalhe }>('GET', `/api/admin/reservas/${id}`),
  alterarSituacao: (id: number, situacao: 'cancelada' | 'concluida', justificativa: string) =>
    chamar<{ reserva: ReservaDetalhe }>('POST', `/api/admin/reservas/${id}/situacao`, { situacao, justificativa }),
  listarPendencias: (tipo?: string) => chamar<{ pendencias: Pendencia[]; total: number }>('GET', `/api/admin/pendencias${consulta({ tipo })}`),
  listarPassageiros: (filtros: Record<string, string | number | undefined>) =>
    chamar<{ passageiros: PassageiroResumo[] } & Pagina>('GET', `/api/admin/passageiros${consulta(filtros)}`),
  obterPassageiro: (id: number) => chamar<{ passageiro: PassageiroDetalhe }>('GET', `/api/admin/passageiros/${id}`),
};

export const MENSAGEM_ADMIN: Record<string, string> = {
  transicao_nao_autorizada: 'Esta alteração de situação não é autorizada para esta reserva.',
  reserva_com_pagamento: 'A reserva tem pagamento pendente ou confirmado e não pode ser cancelada por aqui. O reembolso é tratado em outra etapa.',
  excursao_nao_terminou: 'A excursão ainda não terminou: só é possível concluir a reserva depois da data final.',
  banco_ocupado: 'O sistema está ocupado agora. Tente de novo em instantes.',
  nao_encontrada: 'Reserva não encontrada.',
};

export const ROTULO_ACAO_AUDITORIA: Record<string, string> = {
  'reserva.criada': 'Reserva criada',
  'reserva.desistencia': 'Desistência do passageiro',
  'reserva.cancelamento_manual': 'Cancelamento manual pelo administrador',
  'reserva.conclusao_manual': 'Conclusão manual pelo administrador',
  'reserva.concluida': 'Conclusão automática',
  'reserva.pronta_para_embarque': 'Pronta para embarque',
  'reserva.vencimento_segunda_parcela': 'Vencimento da segunda parcela',
  'retencao.criada': 'Vaga retida',
  'retencao.cancelada': 'Retenção cancelada',
  'retencao.confirmada': 'Retenção confirmada',
  'retencao.expirada': 'Retenção expirada',
  'pagamento.criado': 'Pagamento iniciado',
  'pagamento.reiniciado': 'Pagamento reiniciado',
  'pagamento.recusado': 'Pagamento recusado',
  'pagamento.confirmado': 'Pagamento confirmado',
  'pagamento.confirmado_sem_vaga': 'Pagamento confirmado sem vaga',
};
