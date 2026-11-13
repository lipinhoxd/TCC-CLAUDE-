import { describe, expect, it } from 'vitest';
import { readServerConfig } from '../server/config.ts';

describe('readServerConfig', () => {
  it('usa valores padrão quando nada é informado', () => {
    expect(readServerConfig({})).toEqual({ host: '127.0.0.1', port: 3001 });
  });

  it('lê HOST e PORT do ambiente', () => {
    expect(readServerConfig({ HOST: '0.0.0.0', PORT: '4000' })).toEqual({ host: '0.0.0.0', port: 4000 });
  });

  it('ignora espaços e valores vazios', () => {
    expect(readServerConfig({ HOST: '  ', PORT: '  ' })).toEqual({ host: '127.0.0.1', port: 3001 });
  });

  it.each(['abc', '-1', '70000', '3.5'])('rejeita PORT inválida: %s', (port) => {
    expect(() => readServerConfig({ PORT: port })).toThrow(/PORT inválida/);
  });
});
