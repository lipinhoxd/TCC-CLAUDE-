/** Cliente minimo da API (mesma origem; o cookie de sessao e HttpOnly e nunca lido aqui). */

export class NetworkError extends Error {
  constructor() {
    super('network');
    this.name = 'NetworkError';
  }
}

export interface ApiResult<T> {
  status: number;
  data: T | null;
  /** Segundos de espera indicados pelo cabecalho Retry-After, se houver. */
  retryAfter: number | null;
}

export async function apiRequest<T = Record<string, unknown>>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new NetworkError();
  }
  let data: T | null;
  try {
    const text = await response.text();
    data = text === '' ? null : (JSON.parse(text) as T);
  } catch {
    data = null;
  }
  const retry = Number(response.headers.get('Retry-After'));
  return { status: response.status, data, retryAfter: Number.isFinite(retry) && retry > 0 ? retry : null };
}
