import type { IncomingMessage, ServerResponse } from 'node:http';
import { authorize, readJson, sendError, sendJson } from '../auth/routes.ts';
import type { AuthService } from '../auth/service.ts';
import type { CancelamentoService } from '../cancelamentos/service.ts';
import { HttpError } from '../auth/support.ts';
import type { AdminService } from './service.ts';

/**
 * Rotas de administracao de reservas e passageiros (AGT-012). Todas exigem o perfil administrador, verificado no servidor a cada
 * requisicao e antes de ler o corpo (RNF-002, RNF-004): visitante 401, passageiro 403. O administrador vem da sessao.
 */

type Metodo = 'GET' | 'POST';

/** Erros do SQLite quando o bloqueio de escrita nao e obtido dentro do busy_timeout. */
const BANCO_OCUPADO = /database is (locked|busy)|SQLITE_BUSY/i;

interface Contexto {
  req: IncomingMessage;
  res: ServerResponse;
  atorId: number;
  id: number;
  consulta: Record<string, string | undefined>;
  servico: AdminService;
  cancelamentos: CancelamentoService | undefined;
}

function exigir(cancelamentos: CancelamentoService | undefined): CancelamentoService {
  if (cancelamentos === undefined) throw new HttpError(503, 'servico_indisponivel');
  return cancelamentos;
}

interface Rota {
  padrao: RegExp;
  metodos: Partial<Record<Metodo, (ctx: Contexto) => Promise<void> | void>>;
}

const ROTAS: Rota[] = [
  { padrao: /^\/api\/admin\/reservas$/, metodos: { GET: ({ res, consulta, servico }) => sendJson(res, 200, servico.listarReservas(consulta)) } },
  { padrao: /^\/api\/admin\/reservas\/(\d{1,15})$/, metodos: { GET: ({ res, id, servico }) => sendJson(res, 200, { reserva: servico.obterReserva(id) }) } },
  {
    padrao: /^\/api\/admin\/reservas\/(\d{1,15})\/situacao$/,
    metodos: {
      POST: async ({ req, res, atorId, id, servico }) => {
        sendJson(res, 200, { reserva: servico.alterarSituacao(atorId, id, await readJson(req)) });
      },
    },
  },
  { padrao: /^\/api\/admin\/pendencias$/, metodos: { GET: ({ res, consulta, servico }) => sendJson(res, 200, servico.listarPendencias(consulta)) } },
  {
    // AGT-013: cria (ou devolve) o reembolso integral de um pagamento sinalizado.
    padrao: /^\/api\/admin\/pendencias\/(\d{1,15})\/reembolso$/,
    metodos: { POST: ({ res, atorId, id, cancelamentos }) => sendJson(res, 200, { reembolso: exigir(cancelamentos).reembolsarPendencia(atorId, id) }) },
  },
  {
    // AGT-013: previa e cancelamento da excursao pela organizacao.
    padrao: /^\/api\/admin\/excursoes\/(\d{1,15})\/cancelamento$/,
    metodos: {
      GET: ({ res, id, cancelamentos }) => sendJson(res, 200, { previa: exigir(cancelamentos).previaExcursao(id) }),
      POST: async ({ req, res, atorId, id, cancelamentos }) => {
        const servico = exigir(cancelamentos);
        sendJson(res, 200, { cancelamento: servico.cancelarExcursao(atorId, id, await readJson(req)) });
      },
    },
  },
  { padrao: /^\/api\/admin\/reembolsos$/, metodos: { GET: ({ res, consulta, cancelamentos }) => sendJson(res, 200, exigir(cancelamentos).listarReembolsos(consulta)) } },
  {
    padrao: /^\/api\/admin\/reembolsos\/(\d{1,15})\/processar$/,
    metodos: {
      POST: async ({ req, res, atorId, id, cancelamentos }) => {
        const servico = exigir(cancelamentos);
        sendJson(res, 200, { reembolso: servico.processarReembolso(atorId, id, await readJson(req)) });
      },
    },
  },
  { padrao: /^\/api\/admin\/passageiros$/, metodos: { GET: ({ res, consulta, servico }) => sendJson(res, 200, servico.listarPassageiros(consulta)) } },
  {
    padrao: /^\/api\/admin\/passageiros\/(\d{1,15})$/,
    metodos: { GET: ({ res, atorId, id, servico }) => sendJson(res, 200, { passageiro: servico.obterPassageiro(atorId, id) }) },
  },
];

function consultaDe(req: IncomingMessage): Record<string, string | undefined> {
  const params = new URL(req.url ?? '/', 'http://localhost').searchParams;
  const consulta: Record<string, string | undefined> = {};
  for (const [chave, valor] of params) if (!(chave in consulta)) consulta[chave] = valor;
  return consulta;
}

/** Trata as rotas de administracao de reservas e passageiros; retorna false se o caminho nao for nenhuma delas. */
export async function handleAdminRoute(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  auth: AuthService | undefined,
  servico: AdminService | undefined,
  cancelamentos?: CancelamentoService,
): Promise<boolean> {
  for (const rota of ROTAS) {
    const encontrado = rota.padrao.exec(pathname);
    if (encontrado === null) continue;
    const tratador = rota.metodos[req.method as Metodo];
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
      await tratador({ req, res, atorId: contexto.user.id, id: Number(encontrado[1] ?? 0), consulta: consultaDe(req), servico, cancelamentos });
    } catch (error) {
      if (error instanceof Error && BANCO_OCUPADO.test(error.message)) {
        sendJson(res, 503, { error: 'banco_ocupado' }, { 'Retry-After': '1' });
      } else {
        sendError(req, res, pathname, error);
      }
    }
    return true;
  }
  return false;
}
