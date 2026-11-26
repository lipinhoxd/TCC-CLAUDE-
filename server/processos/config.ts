export interface RotinaConfig {
  /** Intervalo da rotina automatica dentro da API, em milissegundos; 0 desliga (decisao 1A da AGT-014). */
  intervaloMs: number;
}

export class RotinaConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RotinaConfigError';
  }
}

export const ROTINA_PADRAO_SEGUNDOS = 60;
export const ROTINA_MAXIMA_SEGUNDOS = 86_400;

/** Le e valida ROTINA_INTERVALO_SEGUNDOS (0 desliga; de 1 a 86400). */
export function loadRotinaConfig(env: NodeJS.ProcessEnv = process.env): RotinaConfig {
  const bruto = env['ROTINA_INTERVALO_SEGUNDOS']?.trim();
  if (bruto === undefined || bruto === '') return { intervaloMs: ROTINA_PADRAO_SEGUNDOS * 1000 };
  const segundos = Number(bruto);
  if (!/^[0-9]+$/.test(bruto) || segundos > ROTINA_MAXIMA_SEGUNDOS) {
    throw new RotinaConfigError(`ROTINA_INTERVALO_SEGUNDOS invalida: "${bruto}". Informe 0 (desliga) ou um inteiro entre 1 e ${ROTINA_MAXIMA_SEGUNDOS}.`);
  }
  return { intervaloMs: segundos * 1000 };
}
