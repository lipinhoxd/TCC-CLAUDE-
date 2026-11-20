import { describe, expect, it } from 'vitest';
import { brasiliaParaUtc, dataValida, somarDias, utcParaBrasilia } from '../shared/fuso.ts';

describe('conversao Brasilia e UTC (RN-039)', () => {
  it('converte horario de Brasilia para UTC (UTC-3 fora do horario de verao)', () => {
    expect(brasiliaParaUtc('2026-12-10', '07:00')?.toISOString()).toBe('2026-12-10T10:00:00.000Z');
    expect(brasiliaParaUtc('2026-12-05', '23:59:59')?.toISOString()).toBe('2026-12-06T02:59:59.000Z');
    expect(brasiliaParaUtc('2026-12-05')?.toISOString()).toBe('2026-12-05T03:00:00.000Z');
  });

  it('usa o banco de fusos e nao um deslocamento fixo: em 2018 havia horario de verao (UTC-2)', () => {
    expect(brasiliaParaUtc('2018-12-01', '10:00')?.toISOString()).toBe('2018-12-01T12:00:00.000Z');
    expect(brasiliaParaUtc('2018-07-01', '10:00')?.toISOString()).toBe('2018-07-01T13:00:00.000Z');
  });

  it('converte UTC para data e hora de Brasilia, inclusive na virada do dia', () => {
    expect(utcParaBrasilia('2026-12-06T02:59:59.000Z')).toEqual({ data: '2026-12-05', hora: '23:59:59' });
    expect(utcParaBrasilia(new Date('2026-12-06T03:00:00.000Z'))).toEqual({ data: '2026-12-06', hora: '00:00:00' });
  });

  it('ida e volta preserva o instante', () => {
    const partes = utcParaBrasilia('2027-03-15T21:30:00.000Z');
    expect(brasiliaParaUtc(partes.data, partes.hora)?.toISOString()).toBe('2027-03-15T21:30:00.000Z');
  });

  it('recusa data, hora ou formato invalidos', () => {
    expect(brasiliaParaUtc('2026-02-30', '10:00')).toBeNull();
    expect(brasiliaParaUtc('2026-12-10', '25:00')).toBeNull();
    expect(brasiliaParaUtc('2026-12-10', '10h')).toBeNull();
    expect(brasiliaParaUtc('10/12/2026', '10:00')).toBeNull();
  });

  it('valida datas de calendario e soma dias', () => {
    expect(dataValida('2028-02-29')).toBe(true);
    expect(dataValida('2027-02-29')).toBe(false);
    expect(dataValida('2026-1-1')).toBe(false);
    expect(dataValida(20261210)).toBe(false);
    expect(somarDias('2026-12-01', -1)).toBe('2026-11-30');
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
  });
});
