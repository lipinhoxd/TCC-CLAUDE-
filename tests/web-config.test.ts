import { describe, expect, it } from 'vitest';
import { loadWebConfig } from '../src/config/env.ts';

describe('loadWebConfig', () => {
  it('usa o nome padrao quando VITE_APP_NAME nao e informado', () => {
    expect(loadWebConfig({})).toEqual({ appName: 'BPM Trip' });
  });

  it('usa VITE_APP_NAME quando informado', () => {
    expect(loadWebConfig({ VITE_APP_NAME: ' Minha Plataforma ' })).toEqual({ appName: 'Minha Plataforma' });
  });

  it('ignora valor vazio ou que nao seja texto', () => {
    expect(loadWebConfig({ VITE_APP_NAME: '   ' }).appName).toBe('BPM Trip');
    expect(loadWebConfig({ VITE_APP_NAME: 42 }).appName).toBe('BPM Trip');
  });
});
