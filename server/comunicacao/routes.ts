import type { IncomingMessage, ServerResponse } from 'node:http';
import { authorize, sendError, sendJson } from '../auth/routes.ts';
import type { AuthService } from '../auth/service.ts';
import type { AvisoService } from './service.ts';

/** GET /api/avisos (AGT-015): so o perfil passageiro, verificado no servidor a cada requisicao: visitante 401, administrador 403. */
export function handleAvisoRoute(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  auth: AuthService | undefined,
  servico: AvisoService | undefined,
): boolean {
  if (pathname !== '/api/avisos') return false;
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'method_not_allowed' }, { Allow: 'GET' });
    return true;
  }
  if (auth === undefined || servico === undefined) {
    sendJson(res, 503, { error: 'servico_indisponivel' });
    return true;
  }
  try {
    const { user } = authorize(req, auth, ['passageiro']);
    const consulta = Object.fromEntries(new URL(req.url ?? '/', 'http://localhost').searchParams);
    sendJson(res, 200, servico.listar(user.id, consulta));
  } catch (error) {
    sendError(req, res, pathname, error);
  }
  return true;
}
