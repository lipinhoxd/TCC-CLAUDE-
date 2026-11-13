import { describe, expect, it } from 'vitest';
import { readWebConfig } from '../src/config/env.ts';

describe('readWebConfig', () => {
  it('usa o nome padrão quando VITE_APP_NAME não é informado', () => {
    expect(readWebConfig({})).toEqual({ appName: 'Excursões' });
  });

  it('usa VITE_APP_NAME quando informado', () => {
    expect(readWebConfig({ VITE_APP_NAME: ' Minha Agência ' })).toEqual({ appName: 'Minha Agência' });
  });

  it('ignora valor vazio', () => {
    expect(readWebConfig({ VITE_APP_NAME: '   ' })).toEqual({ appName: 'Excursões' });
  });
});
