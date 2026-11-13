export interface WebConfig {
  appName: string;
}

const DEFAULT_APP_NAME = 'Excursões';

/** Lê a configuração pública do front-end. Somente variáveis VITE_* são expostas ao navegador. */
export function readWebConfig(
  env: Record<string, string | undefined> = import.meta.env,
): WebConfig {
  const name = env.VITE_APP_NAME?.trim();
  return { appName: name ? name : DEFAULT_APP_NAME };
}
