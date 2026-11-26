import { formatarReais } from '../../shared/dinheiro.ts';
import { utcParaBrasilia } from '../../shared/fuso.ts';

/**
 * Texto dos avisos ao passageiro (AGT-015, decisao 2.3 do pesquisador): primeiro nome, excursao, numero da reserva, valores e datas, em
 * texto simples. Nada de CPF, nascimento, telefone, e-mail, dados de pagamento alem do valor ou justificativa do administrador. Nenhum
 * aviso promete prazo de devolucao.
 */

/** Evento da auditoria que gera aviso (decisao 2.1) e o tipo de mensagem correspondente. A desistencia do passageiro nao avisa. */
export const TIPO_POR_ACAO = {
  'pagamento.confirmado': 'pagamento_confirmado',
  'pagamento.confirmado_sem_vaga': 'pagamento_em_analise',
  'reserva.vencimento_segunda_parcela': 'cancelada_inadimplencia',
  'reserva.cancelamento_passageiro': 'cancelada_passageiro',
  'reserva.cancelamento_organizacao': 'cancelada_organizacao',
  'reserva.cancelamento_manual': 'cancelada_administracao',
  'reserva.cancelamento_automatico': 'cancelada_excursao_terminada',
  'reserva.cancelamento_reembolso': 'cancelada_apos_reembolso',
  'reembolso.processado': 'reembolso_processado',
} as const;

export type TipoMensagem = (typeof TIPO_POR_ACAO)[keyof typeof TIPO_POR_ACAO];

const ASSUNTO: Record<TipoMensagem, string> = {
  pagamento_confirmado: 'pagamento confirmado',
  pagamento_em_analise: 'pagamento em análise',
  cancelada_inadimplencia: 'cancelada por falta da segunda parcela',
  cancelada_passageiro: 'reserva cancelada',
  cancelada_organizacao: 'reserva cancelada',
  cancelada_administracao: 'reserva cancelada',
  cancelada_excursao_terminada: 'reserva cancelada',
  cancelada_apos_reembolso: 'reserva cancelada',
  reembolso_processado: 'reembolso processado',
};

export interface DadosDoAviso {
  tipo: TipoMensagem;
  reservaId: number;
  nomeCompleto: string;
  excursao: string;
  /** AAAA-MM-DD */
  dataInicial: string;
  dataFinal: string;
  /** Instante UTC das 23:59:59 de Brasilia da data limite, ou null sem parcelamento. */
  prazoSegundaParcela: string | null;
  /** estado_novo do evento na auditoria. */
  evento: Record<string, unknown>;
  /** A reserva tem pagamento confirmado que depende de analise da organizacao. */
  temPagamentoEmAnalise: boolean;
}

/** Texto de usuario (nome, excursao) em uma unica linha, sem caracteres de controle ou de formatacao invisivel. */
export function limpar(texto: string, maximo: number): string {
  return texto
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximo);
}

const dataBr = (data: string): string => data.split('-').reverse().join('/');
const numero = (valor: unknown): number => (typeof valor === 'number' ? valor : 0);
const EM_ANALISE = 'O pagamento que aguarda análise será tratado pela organização.';

function frases(d: DadosDoAviso): string[] {
  const e = d.evento;
  switch (d.tipo) {
    case 'pagamento_confirmado': {
      const valor = formatarReais(numero(e['valor_centavos']));
      if (e['parcela'] === 'segunda') return [`Confirmamos o pagamento da segunda parcela, de ${valor}. Sua reserva está quitada e pronta para embarque.`];
      if (e['parcela'] !== 'primeira') return [`Confirmamos o pagamento de ${valor}. Sua reserva está pronta para embarque.`];
      const linhas = [`Confirmamos o pagamento da primeira parcela, de ${valor}. Sua vaga está ocupada.`];
      if (d.prazoSegundaParcela !== null) {
        const limite = dataBr(utcParaBrasilia(d.prazoSegundaParcela).data);
        linhas.push(`A segunda parcela deve ser paga até as 23:59:59 de ${limite} (horário de Brasília). Sem o pagamento até lá, a vaga é liberada e a primeira parcela não é reembolsável.`);
      }
      return linhas;
    }
    case 'pagamento_em_analise': {
      const valor = formatarReais(numero(e['valor_centavos']));
      return e['apos_vencimento'] === true
        ? [`Confirmamos o pagamento da segunda parcela, de ${valor}, depois do prazo. A reserva continua cancelada e a organização vai tratar o caso.`]
        : [`Confirmamos o pagamento de ${valor}, mas não havia vaga disponível para a reserva. A organização vai tratar o caso.`];
    }
    case 'cancelada_inadimplencia':
      return ['O prazo da segunda parcela venceu: a reserva foi cancelada, a vaga foi liberada e a primeira parcela não é reembolsável.'];
    case 'cancelada_passageiro':
    case 'cancelada_organizacao': {
      const peloPassageiro = d.tipo === 'cancelada_passageiro';
      const linhas = [peloPassageiro ? 'Sua reserva foi cancelada a seu pedido.' : 'Sua reserva foi cancelada pela organização, com o cancelamento da excursão.'];
      const valor = numero(e['valor_reembolso_centavos']);
      const percentual = numero(e['percentual']);
      if (valor > 0) {
        const parte = percentual < 100 ? ` (${percentual}% do valor elegível)` : '';
        linhas.push(`Foi registrado um reembolso de ${formatarReais(valor)}${parte}, que aguarda processamento.`);
      } else if (peloPassageiro && e['parcelada_nao_quitada'] === true) {
        linhas.push('A primeira parcela de reserva parcelada não quitada não é reembolsável.');
      } else if (peloPassageiro && !d.temPagamentoEmAnalise) {
        linhas.push('Este cancelamento não gerou reembolso.');
      }
      if (d.temPagamentoEmAnalise) linhas.push(EM_ANALISE);
      return linhas;
    }
    case 'cancelada_administracao':
      return ['Sua reserva, sem pagamento, foi cancelada pela organização.'];
    case 'cancelada_excursao_terminada':
      return ['Sua reserva foi cancelada porque a excursão terminou sem pagamento confirmado.'];
    case 'cancelada_apos_reembolso':
      return ['Sua reserva foi cancelada depois do reembolso do pagamento que aguardava análise.'];
    case 'reembolso_processado':
      return [`O reembolso de ${formatarReais(numero(e['valor_centavos']))} foi processado.`];
  }
}

/** Assunto (sem texto de usuario) e corpo em linhas separadas por "\n". */
export function montarMensagem(d: DadosDoAviso): { assunto: string; corpo: string } {
  const primeiroNome = limpar(d.nomeCompleto, 200).split(' ')[0]?.slice(0, 60) ?? '';
  return {
    assunto: `Reserva nº ${d.reservaId}: ${ASSUNTO[d.tipo]}`,
    corpo: [
      primeiroNome === '' ? 'Olá.' : `Olá, ${primeiroNome}.`,
      ...frases(d),
      `Excursão: ${limpar(d.excursao, 120)} (${dataBr(d.dataInicial)} a ${dataBr(d.dataFinal)}). Reserva nº ${d.reservaId}.`,
      'Os detalhes estão em Minhas reservas.',
    ].join('\n'),
  };
}
