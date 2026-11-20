import type { IncomingMessage, ServerResponse } from 'node:http';
import { authorize, readJson, sendError, sendJson } from '../auth/routes.ts';
import type { AuthService } from '../auth/service.ts';
import type { ExcursaoService } from './service.ts';

/**
 * Rotas administrativas de excursoes. Todas exigem o perfil administrador, verificado no servidor a
 * cada requisicao (RNF-002, RNF-004), antes de ler o corpo ou tocar no banco.
 */

type Metodo = 'GET' | 'POST' | 'PATCH';

interface Rota {
  padrao: RegExp;
  metodos: Partial<Record<Metodo, (ctx: Contexto) => Promise<void> | void>>;
}

interface Contexto {
  req: IncomingMessage;
  res: ServerResponse;
  atorId: number;
  id: number;
  servico: ExcursaoService;
}

const ROTAS: Rota[] = [
  {
    padrao: /^\/api\/admin\/excursoes$/,
    metodos: {
      GET: ({ res, servico }) => sendJson(res, 200, { excursoes: servico.listar() }),
      POST: async ({ req, res, atorId, servico }) => {
        sendJson(res, 201, { excursao: servico.criar(atorId, await readJson(req)) });
      },
    },
  },
  {
    padrao: /^\/api\/admin\/excursoes\/(\d{1,15})$/,
    metodos: {
      GET: ({ res, id, servico }) => sendJson(res, 200, { excursao: servico.obter(id) }),
      PATCH: async ({ req, res, atorId, id, servico }) => {
        sendJson(res, 200, { excursao: servico.editar(atorId, id, await readJson(req)) });
      },
    },
  },
  {
    padrao: /^\/api\/admin\/excursoes\/(\d{1,15})\/situacao$/,
    metodos: {
      POST: async ({ req, res, atorId, id, servico }) => {
        sendJson(res, 200, { excursao: servico.mudarSituacao(atorId, id, await readJson(req)) });
      },
    },
  },
  {
    padrao: /^\/api\/admin\/excursoes\/(\d{1,15})\/historico$/,
    metodos: {
      GET: ({ res, id, servico }) => sendJson(res, 200, { historico: servico.historico(id) }),
    },
  },
];

/** Trata as rotas administrativas de excursoes; retorna false se o caminho nao for nenhuma delas. */
export async function handleExcursaoRoute(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  auth: AuthService | undefined,
  servico: ExcursaoService | undefined,
): Promise<boolean> {
  for (const rota of ROTAS) {
    const encontrado = rota.padrao.exec(pathname);
    if (encontrado === null) continue;
    const metodo = req.method as Metodo;
    const tratador = rota.metodos[metodo];
    if (tratador === undefined) {
      sendJson(res, 405, { error: 'method_not_allowed' }, { Allow: Object.keys(rota.metodos).join(', ') });
      return true;
    }
    if (auth === undefined || servico === undefined) {
      sendJson(res, 503, { error: 'servico_indisponivel' });
      return true;
    }
    try {
      const contexto = authorize(req, auth, ['administrador']);
      await tratador({ req, res, atorId: contexto.user.id, id: Number(encontrado[1] ?? 0), servico });
    } catch (error) {
      sendError(req, res, pathname, error);
    }
    return true;
  }
  return false;
}
