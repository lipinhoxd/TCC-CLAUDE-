import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/app.ts';
import type { AuthConfig } from '../server/auth/config.ts';
import { AuthService } from '../server/auth/service.ts';
import type { RecoveryMessage } from '../server/auth/support.ts';
import { MEMORY_DATABASE, openDatabase } from '../server/db/connection.ts';
import { runMigrations } from '../server/db/migrate.ts';

const SENHA = 'Boa-senha-2026';
const NOVA_SENHA = 'Outra-senha-2027';

const CONFIG: AuthConfig = {
  sessionTtlMs: 8 * 3_600_000,
  recoveryTtlMs: 30 * 60_000,
  loginMaxAttempts: 3,
  loginWindowMs: 15 * 60_000,
  cookieSecure: false,
  scrypt: { N: 1024, r: 8, p: 1 },
  recoveryOutboxPath: null,
};

const PASSAGEIRO = {
  nome_completo: 'Maria da Silva Ficticia',
  cpf: '529.982.247-25',
  data_nascimento: '1990-05-20',
  telefone: '(11) 98765-4321',
  email: 'Maria.Ficticia@Exemplo.com',
  senha: SENHA,
};

let db: DatabaseSync;
let server: Server;
let baseUrl: string;
let clock: Date;
let outbox: RecoveryMessage[];

async function call(
  method: string,
  path: string,
  body?: unknown,
  cookie?: string,
  extra: Record<string, string> = {},
): Promise<{ status: number; json: Record<string, unknown> | null; headers: Headers }> {
  const headers: Record<string, string> = { ...extra };
  if (body !== undefined && headers['Content-Type'] === undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (cookie !== undefined) {
    headers['Cookie'] = cookie;
  }
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
  const text = await res.text();
  return { status: res.status, json: text === '' ? null : (JSON.parse(text) as Record<string, unknown>), headers: res.headers };
}

function cookieOf(headers: Headers): string {
  const raw = headers.get('set-cookie') ?? '';
  return raw.split(';')[0] ?? '';
}

async function cadastrar(overrides: Record<string, unknown> = {}): Promise<void> {
  const res = await call('POST', '/api/auth/register', { ...PASSAGEIRO, ...overrides });
  expect(res.status).toBe(201);
}

async function entrar(email = PASSAGEIRO.email, senha = SENHA): Promise<string> {
  const res = await call('POST', '/api/auth/login', { email, senha });
  expect(res.status).toBe(200);
  return cookieOf(res.headers);
}

const contar = (sql: string, ...args: string[]): number => Number(db.prepare(sql).get(...args)?.['n']);

beforeEach(async () => {
  db = openDatabase(MEMORY_DATABASE);
  runMigrations(db);
  clock = new Date('2026-11-13T12:00:00.000Z');
  outbox = [];
  const service = new AuthService({ db, config: CONFIG, outbox: (m) => outbox.push(m), now: () => clock });
  server = createApp({ auth: { service, config: CONFIG } });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  db.close();
});

describe('cadastro (RF-001, RF-002)', () => {
  it('cadastra passageiro, normaliza e-mail, CPF e telefone e nao devolve hash nem CPF completo', async () => {
    const res = await call('POST', '/api/auth/register', PASSAGEIRO);
    expect(res.status).toBe(201);
    const usuario = res.json?.['usuario'] as Record<string, unknown>;
    expect(usuario).toMatchObject({
      email: 'maria.ficticia@exemplo.com',
      telefone: '+5511987654321',
      cpf_mascarado: '***.***.***-25',
      perfil: 'passageiro',
    });
    expect(JSON.stringify(res.json)).not.toMatch(/senha|hash|52998224725/);
    const row = db.prepare('SELECT cpf, senha_hash FROM usuario').get();
    expect(row?.['cpf']).toBe('52998224725');
    expect(String(row?.['senha_hash'])).toMatch(/^scrypt\$/);
    expect(String(row?.['senha_hash'])).not.toContain(SENHA);
  });

  it('nao permite escolher o perfil: tentativa de virar administrador e ignorada', async () => {
    const res = await call('POST', '/api/auth/register', { ...PASSAGEIRO, perfil: 'administrador' });
    expect(res.status).toBe(201);
    expect(contar("SELECT COUNT(*) AS n FROM usuario WHERE perfil = 'administrador'")).toBe(0);
  });

  it('exige todos os campos obrigatorios (RN-004)', async () => {
    const res = await call('POST', '/api/auth/register', {});
    expect(res.status).toBe(400);
    expect(res.json).toEqual({
      error: 'validacao',
      fields: {
        nome_completo: 'obrigatorio',
        cpf: 'obrigatorio',
        data_nascimento: 'obrigatorio',
        telefone: 'obrigatorio',
        email: 'obrigatorio',
        senha: 'obrigatorio',
      },
    });
  });

  it('recusa menor de 18 anos, CPF invalido, telefone invalido e senha fraca', async () => {
    const res = await call('POST', '/api/auth/register', {
      ...PASSAGEIRO,
      data_nascimento: '2010-01-01',
      cpf: '111.111.111-11',
      telefone: '123',
      senha: 'curta1',
    });
    expect(res.status).toBe(400);
    expect(res.json?.['fields']).toEqual({
      data_nascimento: 'menor_de_idade',
      cpf: 'invalido',
      telefone: 'invalido',
      senha: 'curta',
    });
    expect(contar('SELECT COUNT(*) AS n FROM usuario')).toBe(0);
  });

  it('recusa CPF ou e-mail ja cadastrado sem dizer qual campo', async () => {
    await cadastrar();
    const mesmoCpf = await call('POST', '/api/auth/register', { ...PASSAGEIRO, email: 'outro@exemplo.com' });
    expect(mesmoCpf.status).toBe(409);
    expect(mesmoCpf.json).toEqual({ error: 'cadastro_duplicado' });
    const mesmoEmail = await call('POST', '/api/auth/register', { ...PASSAGEIRO, cpf: '11144477735' });
    expect(mesmoEmail.status).toBe(409);
    expect(contar('SELECT COUNT(*) AS n FROM usuario')).toBe(1);
  });

  it('exige Content-Type JSON, recusa JSON invalido, corpo nao objeto e corpo grande', async () => {
    expect((await call('POST', '/api/auth/register', 'x=1', undefined, { 'Content-Type': 'text/plain' })).status).toBe(415);
    expect((await call('POST', '/api/auth/register', '{quebrado')).status).toBe(400);
    expect((await call('POST', '/api/auth/register', '[1,2]')).json).toEqual({ error: 'requisicao_invalida' });
    const grande = await call('POST', '/api/auth/register', JSON.stringify({ nome_completo: 'x'.repeat(20_000) }));
    expect(grande.status).toBe(413);
  });
});

describe('login, sessao e saida (RF-003, RN-006, RN-008)', () => {
  it('entra com e-mail em qualquer caixa, define cookie HttpOnly e acessa o proprio perfil', async () => {
    await cadastrar();
    const res = await call('POST', '/api/auth/login', { email: 'MARIA.FICTICIA@exemplo.com', senha: SENHA });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toMatch(/^sid=[A-Za-z0-9_-]{43}; HttpOnly; SameSite=Strict; Path=\/; Max-Age=28800$/);
    const me = await call('GET', '/api/me', undefined, cookieOf(res.headers));
    expect(me.status).toBe(200);
    expect((me.json?.['usuario'] as Record<string, unknown>)['email']).toBe('maria.ficticia@exemplo.com');
  });

  it('guarda so o hash do token da sessao', async () => {
    await cadastrar();
    const cookie = await entrar();
    const token = cookie.slice('sid='.length);
    const rows = db.prepare('SELECT token_hash FROM sessao').all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.['token_hash']).not.toBe(token);
    expect(JSON.stringify(rows)).not.toContain(token);
  });

  it('responde igual para e-mail inexistente e senha errada', async () => {
    await cadastrar();
    const semConta = await call('POST', '/api/auth/login', { email: 'ninguem@exemplo.com', senha: SENHA });
    const senhaErrada = await call('POST', '/api/auth/login', { email: PASSAGEIRO.email, senha: 'Senha-errada-1' });
    expect(semConta.status).toBe(401);
    expect(senhaErrada.status).toBe(401);
    expect(semConta.json).toEqual({ error: 'credenciais_invalidas' });
    expect(senhaErrada.json).toEqual(semConta.json);
  });

  it('limita tentativas: bloqueia apos o maximo, com Retry-After, e libera depois da janela', async () => {
    await cadastrar();
    for (let i = 0; i < CONFIG.loginMaxAttempts; i += 1) {
      expect((await call('POST', '/api/auth/login', { email: PASSAGEIRO.email, senha: 'Senha-errada-1' })).status).toBe(401);
    }
    const bloqueado = await call('POST', '/api/auth/login', { email: PASSAGEIRO.email, senha: SENHA });
    expect(bloqueado.status).toBe(429);
    expect(bloqueado.json).toEqual({ error: 'muitas_tentativas' });
    expect(Number(bloqueado.headers.get('retry-after'))).toBeGreaterThan(0);
    clock = new Date(clock.getTime() + CONFIG.loginWindowMs + 1000);
    expect((await call('POST', '/api/auth/login', { email: PASSAGEIRO.email, senha: SENHA })).status).toBe(200);
  });

  it('a sessao expira e e recusada depois do prazo', async () => {
    await cadastrar();
    const cookie = await entrar();
    expect((await call('GET', '/api/me', undefined, cookie)).status).toBe(200);
    clock = new Date(clock.getTime() + CONFIG.sessionTtlMs + 1000);
    expect((await call('GET', '/api/me', undefined, cookie)).status).toBe(401);
  });

  it('sair revoga a sessao no servidor e limpa o cookie', async () => {
    await cadastrar();
    const cookie = await entrar();
    const out = await call('POST', '/api/auth/logout', undefined, cookie);
    expect(out.status).toBe(204);
    expect(out.headers.get('set-cookie')).toMatch(/Max-Age=0/);
    expect((await call('GET', '/api/me', undefined, cookie)).status).toBe(401);
    expect(contar('SELECT COUNT(*) AS n FROM sessao WHERE revogada_em IS NOT NULL')).toBe(1);
  });

  it('cookie ausente, malformado ou desconhecido nao autentica', async () => {
    expect((await call('GET', '/api/me')).status).toBe(401);
    expect((await call('GET', '/api/me', undefined, 'sid=abc')).status).toBe(401);
    expect((await call('GET', '/api/me', undefined, `sid=${'A'.repeat(43)}`)).status).toBe(401);
  });
});

describe('controle de acesso por perfil (RF-004)', () => {
  it('visitante recebe 401, passageiro recebe 403 e administrador acessa a area restrita', async () => {
    await cadastrar();
    expect((await call('GET', '/api/admin/ping')).status).toBe(401);
    const passageiro = await entrar();
    const negado = await call('GET', '/api/admin/ping', undefined, passageiro);
    expect(negado.status).toBe(403);
    expect(negado.json).toEqual({ error: 'acesso_negado' });

    const service = new AuthService({ db, config: CONFIG, outbox: () => undefined, now: () => clock });
    await service.createAdministrator({
      ...PASSAGEIRO,
      cpf: '11144477735',
      email: 'admin.ficticio@exemplo.com',
    });
    const admin = await entrar('admin.ficticio@exemplo.com');
    expect((await call('GET', '/api/admin/ping', undefined, admin)).status).toBe(200);
  });

  it('o perfil e lido do banco a cada requisicao: rebaixar o usuario vale na hora', async () => {
    const service = new AuthService({ db, config: CONFIG, outbox: () => undefined, now: () => clock });
    await service.createAdministrator(PASSAGEIRO);
    const cookie = await entrar();
    expect((await call('GET', '/api/admin/ping', undefined, cookie)).status).toBe(200);
    db.prepare("UPDATE usuario SET perfil = 'passageiro'").run();
    expect((await call('GET', '/api/admin/ping', undefined, cookie)).status).toBe(403);
  });

  it('nenhuma rota HTTP cria administrador', async () => {
    await call('POST', '/api/auth/register', { ...PASSAGEIRO, perfil: 'administrador' });
    await call('POST', '/api/auth/register', { ...PASSAGEIRO, cpf: '11144477735', email: 'b@exemplo.com', role: 'admin' });
    expect(contar("SELECT COUNT(*) AS n FROM usuario WHERE perfil = 'administrador'")).toBe(0);
  });

  it('metodo nao permitido responde 405 com Allow', async () => {
    const res = await call('DELETE', '/api/me');
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, PATCH');
  });
});

describe('perfil proprio (RF-005)', () => {
  it('altera nome e telefone e registra so os nomes dos campos na auditoria', async () => {
    await cadastrar();
    const cookie = await entrar();
    const res = await call('PATCH', '/api/me', { nome_completo: 'Maria Souza Ficticia', telefone: '21 3456-7890' }, cookie);
    expect(res.status).toBe(200);
    expect(res.json?.['usuario']).toMatchObject({ nome_completo: 'Maria Souza Ficticia', telefone: '+552134567890' });
    const audit = db.prepare("SELECT estado_novo FROM auditoria WHERE acao = 'usuario.perfil_alterado'").get();
    expect(JSON.parse(String(audit?.['estado_novo']))).toEqual({ campos_alterados: ['nome_completo', 'telefone'] });
  });

  it('recusa alterar CPF, e-mail, perfil, nascimento ou campo desconhecido, e corpo vazio', async () => {
    await cadastrar();
    const cookie = await entrar();
    const res = await call('PATCH', '/api/me', { cpf: '11144477735', perfil: 'administrador', email: 'x@y.com', data_nascimento: '1980-01-01', id: 9 }, cookie);
    expect(res.status).toBe(400);
    expect(res.json?.['fields']).toEqual({
      cpf: 'campo_nao_permitido',
      perfil: 'campo_nao_permitido',
      email: 'campo_nao_permitido',
      data_nascimento: 'campo_nao_permitido',
      id: 'campo_nao_permitido',
    });
    expect((await call('PATCH', '/api/me', {}, cookie)).status).toBe(400);
    expect((await call('PATCH', '/api/me', { telefone: '123' }, cookie)).status).toBe(400);
    expect(db.prepare('SELECT perfil, cpf FROM usuario').get()).toMatchObject({ perfil: 'passageiro', cpf: '52998224725' });
  });

  it('nao ha rota para ver ou editar o perfil de outro usuario e exige sessao', async () => {
    expect((await call('GET', '/api/me')).status).toBe(401);
    expect((await call('PATCH', '/api/me', { nome_completo: 'Fulano de Tal' })).status).toBe(401);
    expect((await call('GET', '/api/usuarios/1')).status).toBe(404);
  });
});

describe('recuperacao de acesso (RF-006, RN-007)', () => {
  it('responde igual para conta existente e inexistente e nunca devolve o token na API', async () => {
    await cadastrar();
    const existente = await call('POST', '/api/auth/recovery/request', { email: PASSAGEIRO.email });
    const inexistente = await call('POST', '/api/auth/recovery/request', { email: 'ninguem@exemplo.com' });
    expect(existente.status).toBe(202);
    expect(inexistente.status).toBe(202);
    expect(existente.json).toEqual(inexistente.json);
    expect(outbox).toHaveLength(1);
    expect(JSON.stringify(existente.json)).not.toContain(outbox[0]?.token ?? 'x');
    expect(contar('SELECT COUNT(*) AS n FROM token_acesso')).toBe(1);
  });

  it('exige e-mail em formato valido', async () => {
    expect((await call('POST', '/api/auth/recovery/request', {})).status).toBe(400);
    expect((await call('POST', '/api/auth/recovery/request', { email: 'x' })).status).toBe(400);
  });

  it('troca a senha com o token, que so vale uma vez; guarda so o hash e revoga as sessoes', async () => {
    await cadastrar();
    const sessao = await entrar();
    await call('POST', '/api/auth/recovery/request', { email: PASSAGEIRO.email });
    const token = outbox[0]?.token ?? '';
    expect(JSON.stringify(db.prepare('SELECT token_hash FROM token_acesso').all())).not.toContain(token);

    const ok = await call('POST', '/api/auth/recovery/confirm', { token, nova_senha: NOVA_SENHA });
    expect(ok.status).toBe(204);
    expect((await call('GET', '/api/me', undefined, sessao)).status).toBe(401);
    expect((await call('POST', '/api/auth/login', { email: PASSAGEIRO.email, senha: SENHA })).status).toBe(401);
    expect((await call('POST', '/api/auth/login', { email: PASSAGEIRO.email, senha: NOVA_SENHA })).status).toBe(200);

    const reuso = await call('POST', '/api/auth/recovery/confirm', { token, nova_senha: 'Mais-uma-senha-3' });
    expect(reuso.status).toBe(400);
    expect(reuso.json).toEqual({ error: 'token_invalido' });
  });

  it('recusa token expirado (30 min), invalido e malformado', async () => {
    await cadastrar();
    await call('POST', '/api/auth/recovery/request', { email: PASSAGEIRO.email });
    const token = outbox[0]?.token ?? '';
    clock = new Date(clock.getTime() + CONFIG.recoveryTtlMs + 1000);
    expect((await call('POST', '/api/auth/recovery/confirm', { token, nova_senha: NOVA_SENHA })).json).toEqual({ error: 'token_invalido' });
    expect((await call('POST', '/api/auth/recovery/confirm', { token: 'A'.repeat(43), nova_senha: NOVA_SENHA })).status).toBe(400);
    expect((await call('POST', '/api/auth/recovery/confirm', { token: 'curto', nova_senha: NOVA_SENHA })).status).toBe(400);
  });

  it('novo pedido invalida o token anterior; senha fraca nao consome o token', async () => {
    await cadastrar();
    await call('POST', '/api/auth/recovery/request', { email: PASSAGEIRO.email });
    await call('POST', '/api/auth/recovery/request', { email: PASSAGEIRO.email });
    const [antigo, novo] = [outbox[0]?.token ?? '', outbox[1]?.token ?? ''];
    expect((await call('POST', '/api/auth/recovery/confirm', { token: antigo, nova_senha: NOVA_SENHA })).status).toBe(400);
    const fraca = await call('POST', '/api/auth/recovery/confirm', { token: novo, nova_senha: 'curta1' });
    expect(fraca.status).toBe(400);
    expect(fraca.json?.['fields']).toEqual({ nova_senha: 'curta' });
    expect((await call('POST', '/api/auth/recovery/confirm', { token: novo, nova_senha: NOVA_SENHA })).status).toBe(204);
  });

  it('limita pedidos repetidos sem revelar o limite (continua 202, sem novo token)', async () => {
    await cadastrar();
    for (let i = 0; i < CONFIG.loginMaxAttempts + 2; i += 1) {
      expect((await call('POST', '/api/auth/recovery/request', { email: PASSAGEIRO.email })).status).toBe(202);
    }
    expect(outbox).toHaveLength(CONFIG.loginMaxAttempts);
  });
});

describe('auditoria e servico indisponivel (RN-041, RN-042)', () => {
  it('registra os eventos sem senha, token, CPF, e-mail ou telefone', async () => {
    await cadastrar();
    await call('POST', '/api/auth/login', { email: PASSAGEIRO.email, senha: 'Senha-errada-1' });
    const cookie = await entrar();
    await call('PATCH', '/api/me', { nome_completo: 'Maria Souza Ficticia' }, cookie);
    await call('POST', '/api/auth/recovery/request', { email: PASSAGEIRO.email });
    const token = outbox[0]?.token ?? '';
    await call('POST', '/api/auth/recovery/confirm', { token, nova_senha: NOVA_SENHA });
    const cookie2 = await entrar(PASSAGEIRO.email, NOVA_SENHA);
    await call('POST', '/api/auth/logout', undefined, cookie2);

    const acoes = db.prepare('SELECT acao FROM auditoria ORDER BY id').all().map((r) => r['acao']);
    expect(acoes).toEqual([
      'usuario.cadastro',
      'auth.login_falha',
      'auth.login',
      'usuario.perfil_alterado',
      'auth.recuperacao_solicitada',
      'auth.recuperacao_concluida',
      'auth.login',
      'auth.logout',
    ]);
    const dump = JSON.stringify(db.prepare('SELECT * FROM auditoria').all());
    for (const segredo of [SENHA, NOVA_SENHA, token, cookie.slice(4), '52998224725', 'ficticia@exemplo.com', '987654321', 'Maria']) {
      expect(dump).not.toContain(segredo);
    }
  });

  it('sem servico de autenticacao as rotas respondem 503 e a saude continua ok', async () => {
    const semAuth = createApp();
    await new Promise<void>((resolve) => semAuth.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${(semAuth.address() as AddressInfo).port}`;
    expect((await fetch(`${url}/api/me`)).status).toBe(503);
    expect((await fetch(`${url}/api/health`)).status).toBe(200);
    await new Promise<void>((resolve) => semAuth.close(() => resolve()));
  });
});
