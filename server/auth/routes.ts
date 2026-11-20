import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AuthConfig } from './config.ts';
import type { AuthContext, AuthService, Perfil } from './service.ts';
import { HttpError } from './support.ts';

export const SESSION_COOKIE = 'sid';
const MAX_BODY_BYTES = 16 * 1024;

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string | string[]> = {},
): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(payload);
}

function sendNoContent(res: ServerResponse, headers: Record<string, string | string[]> = {}): void {
  res.writeHead(204, { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end();
}

function readCookie(req: IncomingMessage, name: string): string | undefined {
  const header = req.headers.cookie;
  if (header === undefined) {
    return undefined;
  }
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index > 0 && part.slice(0, index).trim() === name) {
      return part.slice(index + 1).trim();
    }
  }
  return undefined;
}

function sessionCookie(config: AuthConfig, value: string, maxAgeSeconds: number): string {
  const secure = config.cookieSecure ? '; Secure' : '';
  return `${SESSION_COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}${secure}`;
}

export async function readJson(req: IncomingMessage): Promise<unknown> {
  const contentType = req.headers['content-type'] ?? '';
  if (!/^application\/json\s*(;|$)/i.test(contentType)) {
    throw new HttpError(415, 'content_type_nao_suportado');
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = chunk as Buffer;
    size += buffer.length;
    if (size > MAX_BODY_BYTES) {
      throw new HttpError(413, 'corpo_grande_demais');
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'json_invalido');
  }
}

interface RouteContext {
  req: IncomingMessage;
  res: ServerResponse;
  service: AuthService;
  config: AuthConfig;
}

interface Route {
  method: string;
  path: string;
  /** Perfis autorizados; undefined = rota publica. Verificado no servidor a cada requisicao (RF-004). */
  roles?: Perfil[];
  handler: (ctx: RouteContext, auth: AuthContext | null) => Promise<void> | void;
}

const address = (req: IncomingMessage): string => req.socket.remoteAddress ?? 'desconhecido';

const ROUTES: Route[] = [
  {
    method: 'POST',
    path: '/api/auth/register',
    async handler({ req, res, service }) {
      const user = await service.register(await readJson(req));
      sendJson(res, 201, { usuario: user });
    },
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    async handler({ req, res, service, config }) {
      const result = await service.login(await readJson(req), address(req));
      const maxAge = Math.floor(config.sessionTtlMs / 1000);
      sendJson(res, 200, { usuario: result.user, expira_em: result.expiraEm }, {
        'Set-Cookie': sessionCookie(config, result.token, maxAge),
      });
    },
  },
  {
    method: 'POST',
    path: '/api/auth/logout',
    roles: ['passageiro', 'administrador'],
    handler({ res, service, config }, auth) {
      if (auth !== null) {
        service.logout(auth);
      }
      sendNoContent(res, { 'Set-Cookie': sessionCookie(config, '', 0) });
    },
  },
  {
    method: 'POST',
    path: '/api/auth/recovery/request',
    async handler({ req, res, service }) {
      service.requestRecovery(await readJson(req), address(req));
      sendJson(res, 202, { status: 'solicitacao_recebida' });
    },
  },
  {
    method: 'POST',
    path: '/api/auth/recovery/confirm',
    async handler({ req, res, service, config }) {
      await service.confirmRecovery(await readJson(req));
      sendNoContent(res, { 'Set-Cookie': sessionCookie(config, '', 0) });
    },
  },
  {
    method: 'GET',
    path: '/api/me',
    roles: ['passageiro', 'administrador'],
    handler({ res }, auth) {
      sendJson(res, 200, { usuario: auth?.user });
    },
  },
  {
    method: 'PATCH',
    path: '/api/me',
    roles: ['passageiro', 'administrador'],
    async handler({ req, res, service }, auth) {
      if (auth === null) {
        throw new HttpError(401, 'nao_autenticado');
      }
      sendJson(res, 200, { usuario: service.updateProfile(auth, await readJson(req)) });
    },
  },
  {
    // Rota minima que existe para exercitar e testar o controle de acesso por perfil (RF-004).
    method: 'GET',
    path: '/api/admin/ping',
    roles: ['administrador'],
    handler({ res }) {
      sendJson(res, 200, { status: 'ok', area: 'administracao' });
    },
  },
];

/**
 * Autorizacao por perfil, verificada no servidor a cada requisicao (RF-004, RNF-004). Extraida de
 * handleAuthRoute na AGT-005 para ser reutilizada, sem mudar o comportamento: 401 sem sessao valida,
 * 403 se o perfil nao estiver na lista.
 */
export function authorize(req: IncomingMessage, service: AuthService, roles: Perfil[]): AuthContext {
  const auth = service.authenticate(readCookie(req, SESSION_COOKIE));
  if (auth === null) {
    throw new HttpError(401, 'nao_autenticado');
  }
  if (!roles.includes(auth.user.perfil)) {
    throw new HttpError(403, 'acesso_negado');
  }
  return auth;
}

/** Responde a um erro de rota: HttpError vira a resposta padronizada; o resto vira 500 sem detalhes. */
export function sendError(req: IncomingMessage, res: ServerResponse, pathname: string, error: unknown): void {
  if (error instanceof HttpError) {
    const headers: Record<string, string> = {};
    if (error.retryAfterSeconds !== undefined) {
      headers['Retry-After'] = String(error.retryAfterSeconds);
    }
    const body: Record<string, unknown> = { error: error.code };
    if (error.fields !== undefined) {
      body['fields'] = error.fields;
    }
    sendJson(res, error.status, body, headers);
  } else {
    // Registra so o tipo do erro: mensagens internas podem conter dados do banco ou da requisicao.
    console.error(`Erro interno em ${req.method} ${pathname}: ${error instanceof Error ? error.name : 'erro'}`);
    sendJson(res, 500, { error: 'erro_interno' });
  }
}

/** Trata as rotas de autenticacao e acesso; retorna false se o caminho nao for nenhuma delas. */
export async function handleAuthRoute(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  service: AuthService | undefined,
  config: AuthConfig | undefined,
): Promise<boolean> {
  const matching = ROUTES.filter((route) => route.path === pathname);
  if (matching.length === 0) {
    return false;
  }
  const route = matching.find((candidate) => candidate.method === req.method);
  if (route === undefined) {
    sendJson(res, 405, { error: 'method_not_allowed' }, { Allow: matching.map((m) => m.method).join(', ') });
    return true;
  }
  if (service === undefined || config === undefined) {
    sendJson(res, 503, { error: 'servico_indisponivel' });
    return true;
  }
  try {
    const auth = route.roles === undefined ? null : authorize(req, service, route.roles);
    await route.handler({ req, res, service, config }, auth);
  } catch (error) {
    sendError(req, res, pathname, error);
  }
  return true;
}
