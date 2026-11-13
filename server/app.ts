import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

/** Tratador de requisições. Nesta etapa existe apenas a verificação de saúde. */
export function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;

  if (path === '/api/health') {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      sendJson(res, 405, { error: 'method_not_allowed' });
      return;
    }
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  sendJson(res, 404, { error: 'not_found' });
}

export function createApp(): Server {
  return createServer(handleRequest);
}
