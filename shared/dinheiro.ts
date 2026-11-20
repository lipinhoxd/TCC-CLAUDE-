/** Valores em reais (texto digitado) e centavos inteiros (RN-038). Sem ponto flutuante. */

/**
 * Converte "1.234,56", "1234,5", "1234" ou "R$ 12,00" em centavos inteiros.
 * Aceita ponto como separador de milhar (so em grupos de tres) e virgula como separador decimal.
 * Retorna null para qualquer outra forma (ex.: "1,234.56", "12,345", "abc", vazio).
 */
export function reaisParaCentavos(texto: string): number | null {
  const limpo = texto.replace(/^\s*R\$\s*/i, '').trim();
  if (!/^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/.test(limpo)) {
    return null;
  }
  const [inteiro = '', decimal = ''] = limpo.split(',');
  const reais = Number(inteiro.replace(/\./g, ''));
  const centavos = Number(decimal.padEnd(2, '0'));
  const total = reais * 100 + centavos;
  return Number.isSafeInteger(total) ? total : null;
}

/** "1.234,56" a partir de centavos (sem o simbolo da moeda). */
export function centavosParaReais(centavos: number): string {
  const reais = Math.trunc(centavos / 100);
  const resto = String(centavos % 100).padStart(2, '0');
  return `${String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${resto}`;
}

/** "R$ 1.234,56" a partir de centavos. */
export const formatarReais = (centavos: number): string => `R$ ${centavosParaReais(centavos)}`;

/**
 * Divide o total em duas parcelas (RN-012): a primeira recebe a metade arredondada para baixo e a segunda,
 * o restante, de modo que o centavo que sobra de um total impar fica na ultima parcela e a soma e sempre
 * igual ao total (decisao do pesquisador na AGT-007; a primeira parcela nao e reembolsavel, RN-020).
 */
export function dividirEmDuas(totalCentavos: number): { primeira: number; segunda: number } {
  const primeira = Math.floor(totalCentavos / 2);
  return { primeira, segunda: totalCentavos - primeira };
}
