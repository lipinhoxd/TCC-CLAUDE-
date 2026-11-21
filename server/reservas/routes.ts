import type { IncomingMessage, ServerResponse } from 'node:http';
import { authorize, readJson, sendError, sendJson } from '../auth/routes.ts';
import type { AuthService } from '../auth/service.ts';
import { HttpError } from '../auth/support.ts';
import type { PagamentoService } from '../pagamentos/service.ts';
import type { ReservaService } from './service.ts';

/**
 * Rotas de reserva do passageiro (AGT-007). Todas exigem o perfil passageiro, verificado no servidor a cada
 * requisicao e antes de ler o corpo: visitante 401, administrador 403. O passageiro vem da sessao.
 * AGT-009: pagamento integral da reserva (iniciar) e, so com o provedor simulado, a simulacao do resultado.
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
  pagamentos: PagamentoService | undefined;
}

/** As rotas de pagamento exigem o servico de pagamento; as demais rotas de reserva nao dependem dele. */
function exigir(pagamentos: PagamentoService | undefined): PagamentoService {
  if (pagamentos === undefined) throw new HttpError(503, 'servico_indisponivel');
  return pagamentos;
}

interface Rota {
  padrao: RegExp;
  /** Rota que so existe com o provedor de pagamento simulado (nunca em producao). */
  soSimulado?: boolean;
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
    // AGT-009: inicia (ou retoma) o pagamento integral.
    padrao: /^\/api\/reservas\/(\d{1,15})\/pagamento$/,
    metodos: {
      POST: ({ res, passageiroId, id, pagamentos }) => sendJson(res, 200, { reserva: exigir(pagamentos).iniciar(passageiroId, id) }),
    },
  },
  {
    // AGT-009: resultado do provedor simulado (aprovado ou recusado); inexistente fora do ambiente simulado.
    padrao: /^\/api\/reservas\/(\d{1,15})\/pagamento\/simulacao$/,
    soSimulado: true,
    metodos: {
      POST: async ({ req, res, passageiroId, id, pagamentos }) => {
        sendJson(res, 200, { reserva: exigir(pagamentos).simular(passageiroId, id, await readJson(req)) });
      },
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
  pagamentos?: PagamentoService,
): Promise<boolean> {
  for (const rota of ROTAS) {
    const encontrado = rota.padrao.exec(pathname);
    if (encontrado === null) continue;
    if (rota.soSimulado === true && pagamentos?.simulacaoAtiva !== true) continue;
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
      await tratador({ req, res, passageiroId: contexto.user.id, id: Number(encontrado[1] ?? 0), servico, pagamentos });
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
