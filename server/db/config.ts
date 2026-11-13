export interface DatabaseConfig {
  path: string;
}

export const DEFAULT_DATABASE_PATH = 'data/excursoes.sqlite';

/** Le DATABASE_PATH. Aceita ":memory:" (banco temporario, usado nos testes). */
export function loadDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const raw = env['DATABASE_PATH']?.trim();
  return { path: raw ? raw : DEFAULT_DATABASE_PATH };
}
