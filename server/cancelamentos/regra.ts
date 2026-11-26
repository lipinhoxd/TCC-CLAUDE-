/**
 * Regra de calculo do reembolso do passageiro (AGT-013, RF-033, RN-027 a RN-030, RN-032, RN-038). Funcoes puras.
 *
 * Decisoes do pesquisador (26/11/2026, "recomendadas"): a antecedencia e contada em periodos exatos ate o instante da partida
 * (14 dias x 24 h ou mais: 100%; de 7 dias ate menos de 14: 50%; menos de 7 dias: sem reembolso); o valor elegivel e o pago e
 * confirmado (a parcela unica, ou as duas parcelas quitadas); a parcelada so com a primeira paga nao e reembolsada (RN-032);
 * os 50% sao metade arredondada para baixo.
 */

export const DIA_MS = 24 * 60 * 60 * 1000;

export type Percentual = 0 | 50 | 100;

/** Percentual pela antecedencia, em periodos exatos ate a partida. */
export function percentualPorAntecedencia(partida: Date, agora: Date): Percentual {
  const antecedencia = partida.getTime() - agora.getTime();
  if (antecedencia >= 14 * DIA_MS) return 100;
  if (antecedencia >= 7 * DIA_MS) return 50;
  return 0;
}

/** Pagamento confirmado e com vaga (sem pendencia administrativa); as pendencias sao tratadas a parte. */
export interface PagamentoPago {
  parcela: string;
  valor_centavos: number;
}

export interface Calculo {
  valor_pago_centavos: number;
  valor_elegivel_centavos: number;
  percentual: Percentual;
  valor_reembolso_centavos: number;
  /** Parcelada so com a primeira parcela paga: nada e reembolsavel (RN-032). */
  parcelada_nao_quitada: boolean;
}

export function calcularReembolso(modalidade: 'integral' | 'parcelada', pagos: readonly PagamentoPago[], percentual: Percentual): Calculo {
  const total = pagos.reduce((soma, p) => soma + p.valor_centavos, 0);
  const tem = (parcela: string): boolean => pagos.some((p) => p.parcela === parcela);
  const naoQuitada = modalidade === 'parcelada' && tem('primeira') && !tem('segunda');
  const elegivel = naoQuitada ? 0 : total;
  return {
    valor_pago_centavos: total,
    valor_elegivel_centavos: elegivel,
    percentual,
    valor_reembolso_centavos: Math.floor((elegivel * percentual) / 100),
    parcelada_nao_quitada: naoQuitada,
  };
}
