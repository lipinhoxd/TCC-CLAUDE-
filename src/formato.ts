/** Formatacao de datas e textos da consulta publica. Datas AAAA-MM-DD vindas da API nao passam por Date (sem erro de fuso). */

export const dataBr = (data: string): string => data.split('-').reverse().join('/');

export function vagasTexto(vagas: number): string {
  if (vagas <= 0) return 'Esgotada';
  return vagas === 1 ? '1 vaga disponível' : `${vagas} vagas disponíveis`;
}

export function parcelamentoTexto(habilitado: boolean, prazo: string | null): string {
  if (!habilitado || prazo === null) return 'Pagamento integral.';
  return `Em até 2x de 50%. A segunda parcela vence em ${dataBr(prazo)}.`;
}
