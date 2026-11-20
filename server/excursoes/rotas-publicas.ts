import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendError, sendJson } from '../auth/routes.ts';
import { HttpError } from '../auth/support.ts';
import { listarPublicas, obterPublica } from './publico.ts';
import type { ExcursaoService } from './service.ts';

/**
 * Rotas publicas de consulta (AGT-006): so GET, sem login e sem ler a sessao. Excursao que nao esta
 * publicada, ja terminou ou nao existe recebe a mesma resposta 404.
 */

const LISTA = /^\/api\/excursoes$/;
const DETALHE = /^\/api\/excursoes\/(\d{1,15})$/;

export function handleConsultaPublica(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  servico: ExcursaoService | undefined,
): boolean {
  const lista = LISTA.test(pathname);
  const detalhe = DETALHE.exec(pathname);
  if (!lista && detalhe === null) {
    return false;
  }
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'method_not_allowed' }, { Allow: 'GET' });
    return true;
  }
  if (servico === undefined) {
    sendJson(res, 503, { error: 'servico_indisponivel' });
    return true;
  }
  try {
    if (lista) {
      sendJson(res, 200, { excursoes: listarPublicas(servico.banco, servico.agora()) });
    } else {
      const excursao = obterPublica(servico.banco, Number(detalhe?.[1] ?? 0), servico.agora());
      if (excursao === null) throw new HttpError(404, 'nao_encontrada');
      sendJson(res, 200, { excursao });
    }
  } catch (error) {
    sendError(req, res, pathname, error);
  }
  return true;
}
