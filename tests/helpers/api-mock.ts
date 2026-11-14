import { vi } from 'vitest';

export interface RecordedCall {
  method: string;
  path: string;
  body: Record<string, unknown> | null;
}

export type Handler = (call: RecordedCall) => Response | 'network';

export const json = (status: number, body: unknown, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

export const empty = (status: number, headers: Record<string, string> = {}): Response =>
  new Response(null, { status, headers });

/** Substitui fetch por uma API simulada, indexada por "METODO /caminho"; registra as chamadas. */
export function mockApi(routes: Record<string, Handler>): RecordedCall[] {
  const calls: RecordedCall[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      const call: RecordedCall = {
        method,
        path: input,
        body: typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : null,
      };
      calls.push(call);
      const handler = routes[`${method} ${input}`];
      const result = handler === undefined ? json(404, { error: 'not_found' }) : handler(call);
      return result === 'network' ? Promise.reject(new TypeError('failed to fetch')) : Promise.resolve(result);
    }),
  );
  return calls;
}

export const MARIA = {
  id: 1,
  nome_completo: 'Maria da Silva Ficticia',
  email: 'maria.ficticia@exemplo.com',
  perfil: 'passageiro',
};
