export interface ScryptParams {
  N: number;
  r: number;
  p: number;
}

export interface AuthConfig {
  sessionTtlMs: number;
  recoveryTtlMs: number;
  loginMaxAttempts: number;
  loginWindowMs: number;
  cookieSecure: boolean;
  scrypt: ScryptParams;
  /** Arquivo local de "entrega" do token de recuperacao; null em producao (sem entrega). */
  recoveryOutboxPath: string | null;
}

export class AuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthConfigError';
  }
}

/** Parametros de scrypt (decisao 1 da AGT-003): N=2^16, r=8, p=2 (64 MiB), conforme a OWASP. */
export const DEFAULT_SCRYPT: ScryptParams = { N: 65536, r: 8, p: 2 };

function positiveInt(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = env[name]?.trim();
  if (raw === undefined || raw === '') {
    return fallback;
  }
  if (!/^\d+$/.test(raw) || Number(raw) < 1) {
    throw new AuthConfigError(`${name} invalida: "${raw}". Informe um inteiro positivo.`);
  }
  return Number(raw);
}

/** Le e valida as variaveis de ambiente de autenticacao. */
export function loadAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const production = env['NODE_ENV'] === 'production';
  const secureRaw = env['COOKIE_SECURE']?.trim().toLowerCase();
  if (secureRaw !== undefined && secureRaw !== '' && secureRaw !== 'true' && secureRaw !== 'false') {
    throw new AuthConfigError(`COOKIE_SECURE invalida: "${secureRaw}". Use true ou false.`);
  }
  const outbox = env['RECOVERY_OUTBOX_PATH']?.trim() || 'data/outbox/recuperacao.jsonl';
  return {
    sessionTtlMs: positiveInt(env, 'SESSION_TTL_HOURS', 8) * 3_600_000,
    recoveryTtlMs: positiveInt(env, 'RECOVERY_TOKEN_TTL_MINUTES', 30) * 60_000,
    loginMaxAttempts: positiveInt(env, 'LOGIN_MAX_ATTEMPTS', 5),
    loginWindowMs: positiveInt(env, 'LOGIN_WINDOW_MINUTES', 15) * 60_000,
    cookieSecure: secureRaw === undefined || secureRaw === '' ? production : secureRaw === 'true',
    scrypt: DEFAULT_SCRYPT,
    recoveryOutboxPath: production ? null : outbox,
  };
}
