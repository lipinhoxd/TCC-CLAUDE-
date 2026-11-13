export interface ServerConfig {
  host: string;
  port: number;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3001;

function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_PORT;
  }
  const value = raw.trim();
  if (!/^\d+$/.test(value)) {
    throw new ConfigError(`PORT invalida: "${value}". Informe um inteiro entre 0 e 65535.`);
  }
  const port = Number(value);
  if (port > 65535) {
    throw new ConfigError(`PORT invalida: ${port}. O maximo e 65535.`);
  }
  return port;
}

/** Le e valida as variaveis de ambiente da API. */
export function loadServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const host = env['HOST']?.trim() || DEFAULT_HOST;
  return { host, port: parsePort(env['PORT']) };
}
