import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { handleAdminRoute } from './admin/routes.ts';
import type { AdminService } from './admin/service.ts';
import type { AuthConfig } from './auth/config.ts';
import type { CancelamentoService } from './cancelamentos/service.ts';
import { handleAvisoRoute } from './comunicacao/routes.ts';
import type { AvisoService } from './comunicacao/service.ts';
import { handleAuthRoute, sendJson } from './auth/routes.ts';
import type { AuthService } from './auth/service.ts';
import { handleExcursaoRoute } from './excursoes/routes.ts';
import { handleConsultaPublica } from './excursoes/rotas-publicas.ts';
import type { PagamentoService } from './pagamentos/service.ts';
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
  /** Servico de pagamento integral (AGT-009); as rotas de reserva que o usam respondem 503 sem ele. */
  pagamentos?: PagamentoService;
  /** Administracao de reservas e passageiros (AGT-012); as rotas tambem exigem o servico de autenticacao. */
  admin?: AdminService;
  /** Cancelamentos e reembolsos (AGT-013); sem ele, as rotas respondem 503. */
  cancelamentos?: CancelamentoService;
  /** Avisos do passageiro (AGT-015); sem ele, a rota responde 503. */
  avisos?: AvisoService;
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

  if (handleAvisoRoute(req, res, pathname, options.auth?.service, options.avisos)) {
    return;
  }

  if (await handleReservaRoute(req, res, pathname, options.auth?.service, options.reservas, options.pagamentos, options.cancelamentos)) {
    return;
  }

  if (await handleAdminRoute(req, res, pathname, options.auth?.service, options.admin, options.cancelamentos)) {
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
