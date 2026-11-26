/**
 * Qual parcela o passageiro deve pagar agora (AGT-010, RF-024). A decisao e do servidor; o cliente nunca informa a parcela nem o
 * valor. Integral: a parcela unica. Parcelada: a primeira ate ser confirmada com vaga; depois, a segunda; com a primeira
 * confirmada sem vaga (RN-022) ou as duas confirmadas, nao ha mais nada a pagar.
 */
export type ParcelaPagamento = 'unica' | 'primeira' | 'segunda';

export interface LinhaPagamento {
  parcela: string;
  situacao: string;
  pendencia_administrativa: unknown;
}

export function proximaParcela(modalidade: 'integral' | 'parcelada', linhas: readonly LinhaPagamento[]): ParcelaPagamento | null {
  const da = (parcela: ParcelaPagamento): LinhaPagamento | undefined => linhas.find((l) => l.parcela === parcela);
  if (modalidade === 'integral') return da('unica')?.situacao === 'confirmado' ? null : 'unica';
  const primeira = da('primeira');
  if (primeira?.situacao !== 'confirmado') return 'primeira';
  if (primeira.pendencia_administrativa !== null) return null;
  return da('segunda')?.situacao === 'confirmado' ? null : 'segunda';
}
