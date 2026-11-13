export interface WebConfig {
  appName: string;
}

const DEFAULT_APP_NAME = 'Plataforma de Excursões';

/** Le as variaveis publicas (VITE_*) expostas ao navegador. */
export function loadWebConfig(env: Record<string, unknown> = import.meta.env): WebConfig {
  const raw = env['VITE_APP_NAME'];
  const appName = typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : DEFAULT_APP_NAME;
  return { appName };
}
