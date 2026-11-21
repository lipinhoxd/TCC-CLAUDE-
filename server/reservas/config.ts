export interface ReservaConfig {
  /** Duracao da retencao temporaria de vaga durante o checkout, em milissegundos (decisao da AGT-008: 15 min). */
  retencaoMs: number;
}

export class ReservaConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReservaConfigError';
  }
}

export const RETENCAO_PADRAO_MINUTOS = 15;
export const RETENCAO_MAXIMA_MINUTOS = 1440;

/** Le e valida as variaveis de ambiente das reservas (RETENCAO_MINUTOS, de 1 a 1440). */
export function loadReservaConfig(env: NodeJS.ProcessEnv = process.env): ReservaConfig {
  const bruto = env['RETENCAO_MINUTOS']?.trim();
  if (bruto === undefined || bruto === '') return { retencaoMs: RETENCAO_PADRAO_MINUTOS * 60_000 };
  const minutos = Number(bruto);
  if (!/^[0-9]+$/.test(bruto) || minutos < 1 || minutos > RETENCAO_MAXIMA_MINUTOS) {
    throw new ReservaConfigError(`RETENCAO_MINUTOS invalida: "${bruto}". Informe um inteiro entre 1 e ${RETENCAO_MAXIMA_MINUTOS}.`);
  }
  return { retencaoMs: minutos * 60_000 };
}
