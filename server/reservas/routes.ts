import type { IncomingMessage, ServerResponse } from 'node:http';
import { authorize, readJson, sendError, sendJson } from '../auth/routes.ts';
import type { AuthService } from '../auth/service.ts';
import type { ReservaService } from './service.ts';

/**
 * Rotas de reserva do passageiro (AGT-007). Todas exigem o perfil passageiro, verificado no servidor a cada
 * requisicao e antes de ler o corpo: visitante 401, administrador 403. O passageiro vem da sessao.
 */

type Metodo = 'GET' | 'POST';

/** Erros do SQLite quando o bloqueio de escrita nao e obtido dentro do busy_timeout. */
const BANCO_OCUPADO = /database is (locked|busy)|SQLITE_BUSY/i;

interface Contexto {
  req: IncomingMessage;
  res: ServerResponse;
  passageiroId: number;
  id: number;
  servico: ReservaService;
}

interface Rota {
  padrao: RegExp;
  metodos: Partial<Record<Metodo, (ctx: Contexto) => Promise<void> | void>>;
}

const ROTAS: Rota[] = [
  {
    padrao: /^\/api\/reservas$/,
    metodos: {
      POST: async ({ req, res, passageiroId, servico }) => {
        sendJson(res, 201, { reserva: servico.solicitar(passageiroId, await readJson(req)) });
      },
    },
  },
  {
    padrao: /^\/api\/reservas\/(\d{1,15})$/,
    metodos: {
      GET: ({ res, passageiroId, id, servico }) => sendJson(res, 200, { reserva: servico.obter(passageiroId, id) }),
    },
  },
  {
    // AGT-008: abrir o checkout inicia (ou retoma) a retencao temporaria da vaga.
    padrao: /^\/api\/reservas\/(\d{1,15})\/checkout$/,
    metodos: {
      POST: ({ res, passageiroId, id, servico }) => sendJson(res, 200, { reserva: servico.iniciarCheckout(passageiroId, id) }),
    },
  },
  {
    padrao: /^\/api\/reservas\/(\d{1,15})\/desistir$/,
    metodos: {
      POST: ({ res, passageiroId, id, servico }) => sendJson(res, 200, { reserva: servico.desistir(passageiroId, id) }),
    },
  },
];

export async function handleReservaRoute(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  auth: AuthService | undefined,
  servico: ReservaService | undefined,
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
      const contexto = authorize(req, auth, ['passageiro']);
      await tratador({ req, res, passageiroId: contexto.user.id, id: Number(encontrado[1] ?? 0), servico });
    } catch (error) {
      // Banco ocupado alem do busy_timeout (AGT-008, decisao 2): resposta curta e segura, sem detalhes internos.
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
