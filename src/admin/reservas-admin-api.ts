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

export type SituacaoReembolso = 'pendente' | 'processado' | 'recusado';
export const ROTULO_SITUACAO_REEMBOLSO: Record<SituacaoReembolso, string> = { pendente: 'Pendente', processado: 'Processado', recusado: 'Recusado' };
export const ROTULO_MOTIVO_REEMBOLSO = {
  cancelamento_passageiro: 'Cancelamento pelo passageiro',
  cancelamento_organizacao: 'Cancelamento pela organização',
  pendencia: 'Pendência (pagamento sem vaga)',
} as const;

export interface Reembolso {
  id: number;
  reserva_id: number;
  valor_centavos: number;
  percentual_aplicado: number;
  motivo: keyof typeof ROTULO_MOTIVO_REEMBOLSO;
  situacao: SituacaoReembolso;
  criado_em: string;
  passageiro: string;
  excursao: string;
}

export interface PreviaExcursao {
  excursao: { id: number; nome: string; situacao: string; partida_utc: string };
  permitido: boolean;
  motivo_impedimento: 'excursao_ja_cancelada' | 'excursao_ja_partiu' | null;
  reservas: Array<{ id: number; passageiro: string; situacao: SituacaoReserva; valor_reembolso_centavos: number }>;
  pendencias: Array<{ pagamento_id: number; reserva_id: number; valor_centavos: number }>;
  valor_total_centavos: number;
}

export interface ResumoCancelamento {
  ja_cancelada: boolean;
  reservas_canceladas: number;
  reembolsos_criados: number;
  valor_total_centavos: number;
}

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
  reembolso: { id: number; situacao: SituacaoReembolso } | null;
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

export interface Painel {
  gerado_em: string;
  excursoes: {
    itens: Array<{ id: number; nome: string; situacao: 'publicada' | 'encerrada'; data_inicial: string; data_final: string; capacidade: number; ocupadas: number; retidas: number; livres: number }>;
    total: number;
  };
  reservas: Record<SituacaoReserva, number> & { total: number };
  valores: { recebido_centavos: number; devolvido_centavos: number; liquido_centavos: number; a_devolver_centavos: number; a_receber_centavos: number };
  pendencias: number;
  emails_com_falha: number;
}

export interface EventoDoHistorico {
  id: number;
  ocorrido_em: string;
  acao: string;
  entidade: string;
  registro_id: number | null;
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

export const adminReservasApi = {
  /** Painel consolidado e historico (AGT-016). */
  painel: () => chamar<{ painel: Painel }>('GET', '/api/admin/painel'),
  historico: (filtros: Record<string, string | number | undefined>) =>
    chamar<{ eventos: EventoDoHistorico[]; acoes: string[] } & Pagina>('GET', `/api/admin/historico${consulta(filtros)}`),
  listarReservas: (filtros: Record<string, string | number | undefined>) =>
    chamar<{ reservas: ReservaResumo[] } & Pagina>('GET', `/api/admin/reservas${consulta(filtros)}`),
  obterReserva: (id: number) => chamar<{ reserva: ReservaDetalhe }>('GET', `/api/admin/reservas/${id}`),
  alterarSituacao: (id: number, situacao: 'cancelada' | 'concluida', justificativa: string) =>
    chamar<{ reserva: ReservaDetalhe }>('POST', `/api/admin/reservas/${id}/situacao`, { situacao, justificativa }),
  listarPendencias: (tipo?: string) => chamar<{ pendencias: Pendencia[]; total: number }>('GET', `/api/admin/pendencias${consulta({ tipo })}`),
  listarPassageiros: (filtros: Record<string, string | number | undefined>) =>
    chamar<{ passageiros: PassageiroResumo[] } & Pagina>('GET', `/api/admin/passageiros${consulta(filtros)}`),
  obterPassageiro: (id: number) => chamar<{ passageiro: PassageiroDetalhe }>('GET', `/api/admin/passageiros/${id}`),
  reembolsarPendencia: (pagamentoId: number) => chamar<{ reembolso: { id: number } }>('POST', `/api/admin/pendencias/${pagamentoId}/reembolso`),
  previaExcursao: (id: number) => chamar<{ previa: PreviaExcursao }>('GET', `/api/admin/excursoes/${id}/cancelamento`),
  cancelarExcursao: (id: number, justificativa: string) => chamar<{ cancelamento: ResumoCancelamento }>('POST', `/api/admin/excursoes/${id}/cancelamento`, { justificativa }),
  listarReembolsos: (filtros: Record<string, string | number | undefined>) =>
    chamar<{ reembolsos: Reembolso[]; processamento_disponivel: boolean } & Pagina>('GET', `/api/admin/reembolsos${consulta(filtros)}`),
  processarReembolso: (id: number, resultado: 'aprovado' | 'recusado') => chamar<{ reembolso: { id: number } }>('POST', `/api/admin/reembolsos/${id}/processar`, { resultado }),
};

export const MENSAGEM_ADMIN: Record<string, string> = {
  transicao_nao_autorizada: 'Esta alteração de situação não é autorizada para esta reserva.',
  reserva_com_pagamento: 'A reserva tem pagamento pendente ou confirmado e não pode ser cancelada por aqui. O reembolso é tratado em outra etapa.',
  excursao_nao_terminou: 'A excursão ainda não terminou: só é possível concluir a reserva depois da data final.',
  banco_ocupado: 'O sistema está ocupado agora. Tente de novo em instantes.',
  nao_encontrada: 'Registro não encontrado.',
  excursao_ja_partiu: 'A excursão já partiu e não pode mais ser cancelada por aqui.',
  reembolso_ja_processado: 'Este reembolso já foi processado.',
  reembolso_excede_pago: 'O reembolso passaria do valor pago e não foi processado.',
  pagamento_sem_pendencia: 'Este pagamento não tem pendência.',
  pagamento_indisponivel: 'O processamento de reembolso não está disponível neste ambiente.',
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
  'pagamento.estornado': 'Pagamento estornado',
  'reserva.cancelamento_passageiro': 'Cancelamento pelo passageiro',
  'reserva.cancelamento_organizacao': 'Cancelamento pela organização',
  'reserva.cancelamento_reembolso': 'Cancelada após o reembolso da pendência',
  'reserva.cancelamento_automatico': 'Cancelamento automático (excursão terminada, sem pagamento)',
  'excursao.criada': 'Excursão criada',
  'excursao.editada': 'Excursão editada',
  'excursao.situacao_alterada': 'Situação da excursão alterada',
  'excursao.cancelamento': 'Excursão cancelada pela organização',
  'reembolso.criado': 'Reembolso criado',
  'reembolso.processado': 'Reembolso processado',
  'reembolso.recusado': 'Reembolso recusado',
  'passageiro.consultado': 'Consulta aos dados de um passageiro',
  'usuario.administrador_criado': 'Administrador criado',
  'usuario.perfil_alterado': 'Perfil alterado',
  'comunicacao.falha_definitiva': 'Falha definitiva no envio de e-mail',
};
