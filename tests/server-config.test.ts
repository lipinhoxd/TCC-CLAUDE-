import { describe, expect, it } from 'vitest';
import { ConfigError, loadServerConfig } from '../server/config.ts';

describe('loadServerConfig', () => {
  it('usa os valores padrao quando nada e informado', () => {
    expect(loadServerConfig({})).toEqual({ host: '127.0.0.1', port: 3001 });
  });

  it('le HOST e PORT do ambiente', () => {
    expect(loadServerConfig({ HOST: '0.0.0.0', PORT: '8080' })).toEqual({ host: '0.0.0.0', port: 8080 });
  });

  it('ignora valores vazios e espacos', () => {
    expect(loadServerConfig({ HOST: '  ', PORT: ' ' })).toEqual({ host: '127.0.0.1', port: 3001 });
  });

  it.each(['abc', '-1', '3.5', '70000'])('rejeita PORT invalida (%s)', (port) => {
    expect(() => loadServerConfig({ PORT: port })).toThrow(ConfigError);
  });
});
