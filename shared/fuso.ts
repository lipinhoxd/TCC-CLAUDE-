/**
 * Conversao entre horario de Brasilia (America/Sao_Paulo) e UTC (RN-039). Usa o banco de fusos do
 * ambiente (Intl), sem depender do fuso do navegador nem da maquina, e vale para o servidor e para a interface.
 */

export const FUSO = 'America/Sao_Paulo';

const formato = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export interface PartesLocais {
  /** AAAA-MM-DD */
  data: string;
  /** HH:mm:ss */
  hora: string;
}

function partes(ms: number): Record<string, string> {
  const resultado: Record<string, string> = {};
  for (const parte of formato.formatToParts(new Date(Math.floor(ms / 1000) * 1000))) {
    resultado[parte.type] = parte.value;
  }
  return resultado;
}

/** Diferenca, em ms, entre o relogio de Brasilia e o UTC no instante dado (negativa: Brasilia esta atras). */
function deslocamento(ms: number): number {
  const p = partes(ms);
  const comoUtc = Date.UTC(Number(p['year']), Number(p['month']) - 1, Number(p['day']), Number(p['hour']), Number(p['minute']), Number(p['second']));
  return comoUtc - Math.floor(ms / 1000) * 1000;
}

/** Data e hora de Brasilia de um instante. */
export function utcParaBrasilia(instante: Date | string): PartesLocais {
  const ms = (instante instanceof Date ? instante : new Date(instante)).getTime();
  const p = partes(ms);
  return {
    data: `${p['year']}-${p['month']}-${p['day']}`,
    hora: `${p['hour']}:${p['minute']}:${p['second']}`,
  };
}

/** Verdadeiro para AAAA-MM-DD que existe no calendario. */
export function dataValida(texto: unknown): texto is string {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return false;
  }
  const [a, m, d] = texto.split('-').map(Number) as [number, number, number];
  const data = new Date(Date.UTC(a, m - 1, d));
  return data.getUTCFullYear() === a && data.getUTCMonth() === m - 1 && data.getUTCDate() === d;
}

/**
 * Instante UTC correspondente a uma data e hora de Brasilia. Retorna null se a data for invalida ou se
 * a hora local nao existir (lacuna do horario de verao).
 */
export function brasiliaParaUtc(data: string, hora = '00:00:00'): Date | null {
  if (!dataValida(data) || !/^\d{2}:\d{2}(:\d{2})?$/.test(hora)) {
    return null;
  }
  const completa = hora.length === 5 ? `${hora}:00` : hora;
  const [a, m, d] = data.split('-').map(Number) as [number, number, number];
  const [h, mi, s] = completa.split(':').map(Number) as [number, number, number];
  if (h > 23 || mi > 59 || s > 59) {
    return null;
  }
  const alvo = Date.UTC(a, m - 1, d, h, mi, s);
  const primeira = alvo - deslocamento(alvo);
  const resultado = new Date(alvo - deslocamento(primeira));
  const volta = utcParaBrasilia(resultado);
  return volta.data === data && volta.hora === completa ? resultado : null;
}

/** Soma dias a uma data AAAA-MM-DD. */
export function somarDias(data: string, dias: number): string {
  const [a, m, d] = data.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** ISO UTC com milissegundos e Z, como o esquema exige. */
export const paraIso = (data: Date): string => data.toISOString();
