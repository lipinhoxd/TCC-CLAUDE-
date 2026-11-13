export interface ServerConfig {
  host: string;
  port: number;
}

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3001;

/** Lê e valida a configuração do servidor a partir das variáveis de ambiente. */
export function readServerConfig(
  env: Record<string, string | undefined> = process.env,
): ServerConfig {
  const host = env.HOST?.trim() || DEFAULT_HOST;

  const rawPort = env.PORT?.trim();
  let port = DEFAULT_PORT;
  if (rawPort) {
    port = Number(rawPort);
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
      throw new Error(`PORT inválida: "${rawPort}". Informe um inteiro entre 0 e 65535.`);
    }
  }

  return { host, port };
}
