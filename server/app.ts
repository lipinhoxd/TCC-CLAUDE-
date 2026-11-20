import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AuthConfig } from './auth/config.ts';
import { handleAuthRoute, sendJson } from './auth/routes.ts';
import type { AuthService } from './auth/service.ts';
import { handleExcursaoRoute } from './excursoes/routes.ts';
import { handleConsultaPublica } from './excursoes/rotas-publicas.ts';
import { handleReservaRoute } from './reservas/routes.ts';
import type { ReservaService } from './reservas/service.ts';
import type { ExcursaoService } from './excursoes/service.ts';

export interface AppOptions {
  /** Servico de autenticacao; sem ele, as rotas de autenticacao respondem 503. */
  auth?: { service: AuthService; config: AuthConfig };
  /** Servico de excursoes (AGT-005); as rotas administrativas tambem exigem o servico de autenticacao. */
  excursoes?: ExcursaoService;
  /** Servico de reservas (AGT-007); as rotas tambem exigem o servico de autenticacao. */
  reservas?: ReservaService;
}

async function handle(req: IncomingMessage, res: ServerResponse, options: AppOptions): Promise<void> {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');

  if (pathname === '/api/health') {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method_not_allowed' }, { Allow: 'GET' });
      return;
    }
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (await handleAuthRoute(req, res, pathname, options.auth?.service, options.auth?.config)) {
    return;
  }

  if (handleConsultaPublica(req, res, pathname, options.excursoes)) {
    return;
  }

  if (await handleReservaRoute(req, res, pathname, options.auth?.service, options.reservas)) {
    return;
  }

  if (await handleExcursaoRoute(req, res, pathname, options.auth?.service, options.excursoes)) {
    return;
  }

  sendJson(res, 404, { error: 'not_found' });
}

/** Cria o servidor HTTP da API sem iniciar a escuta (facilita os testes). */
export function createApp(options: AppOptions = {}): Server {
  return createServer((req, res) => {
    handle(req, res, options).catch(() => {
      if (!res.headersSent) {
        sendJson(res, 500, { error: 'erro_interno' });
      } else {
        res.destroy();
      }
    });
  });
}
