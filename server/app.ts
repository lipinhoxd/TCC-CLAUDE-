import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';

function sendJson(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(payload);
}

function handle(req: IncomingMessage, res: ServerResponse): void {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');

  if (pathname === '/api/health') {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method_not_allowed' }, { Allow: 'GET' });
      return;
    }
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  sendJson(res, 404, { error: 'not_found' });
}

/** Cria o servidor HTTP da API sem iniciar a escuta (facilita os testes). */
export function createApp(): Server {
  return createServer(handle);
}
