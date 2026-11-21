import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/app.ts';
import type { AuthConfig } from '../server/auth/config.ts';
import { AuthService } from '../server/auth/service.ts';
import { MEMORY_DATABASE, openDatabase } from '../server/db/connection.ts';
import { runMigrations } from '../server/db/migrate.ts';
import { ExcursaoService } from '../server/excursoes/service.ts';
import { loadReservaConfig, ReservaConfigError } from '../server/reservas/config.ts';
import { ReservaService } from '../server/reservas/service.ts';

/** Retencao temporaria de vaga no checkout (AGT-008): RF-017, RF-019, RF-021, RF-022, RN-014, RN-015, RN-021, RN-040. */

const SENHA = 'Boa-senha-2026';
const CONFIG: AuthConfig = {
  sessionTtlMs: 8 * 3_600_000,
  recoveryTtlMs: 30 * 60_000,
  loginMaxAttempts: 50,
  loginWindowMs: 15 * 60_000,
  cookieSecure: false,
  scrypt: { N: 1024, r: 8, p: 1 },
  recoveryOutboxPath: null,
};
const PESSOA = { nome_completo: 'Maria da Silva Ficticia', data_nascimento: '1990-05-20', telefone: '(11) 98765-4321', senha: SENHA };
const VALIDA = {
  nome: 'Excursao Ficticia Serra',
  descricao: 'Passeio ficticio de teste',
  local: 'Serra Ficticia',
  ponto_embarque: 'Praca Ficticia',
  data_inicial: '2026-12-10',
  data_final: '2026-12-12',
  partida_utc: '2026-12-10T10:00:00.000Z',
  capacidade: 20,
  preco_centavos: 150000,
  parcelamento_habilitado: true,
  prazo_segunda_parcela: '2026-12-05',
};
const QUINZE_MIN = 15 * 60_000;

let db: DatabaseSync;
let server: Server;
let baseUrl: string;
let relogio: Date;
let excursoes: ExcursaoService;
let adminId: number;
let anaCookie: string;
let beatrizCookie: string;
let adminCookie: string;

async function chamar(metodo: string, caminho: string, corpo?: unknown, cookie?: string) {
  const headers: Record<string, string> = {};
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie !== undefined) headers['Cookie'] = cookie;
  const res = await fetch(`${baseUrl}${caminho}`, { method: metodo, headers, ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }) });
  const texto = await res.text();
  return { status: res.status, json: texto === '' ? null : (JSON.parse(texto) as Record<string, unknown>), headers: res.headers };
}
const cookieDe = (h: Headers): string => (h.get('set-cookie') ?? '').split(';')[0] ?? '';
async function entrar(email: string): Promise<string> {
  const res = await chamar('POST', '/api/auth/login', { email, senha: SENHA });
  expect(res.status).toBe(200);
  return cookieDe(res.headers);
}
function publicar(extra: Record<string, unknown> = {}): number {
  const e = excursoes.criar(adminId, { ...VALIDA, ...extra });
  excursoes.mudarSituacao(adminId, e.id, { situacao: 'publicada' });
  return e.id;
}
const ana = (m: string, c: string, corpo?: unknown) => chamar(m, c, corpo, anaCookie);
const beatriz = (m: string, c: string, corpo?: unknown) => chamar(m, c, corpo, beatrizCookie);
const reservaDe = (res: { json: Record<string, unknown> | null }) => res.json?.['reserva'] as Record<string, unknown>;
const retencaoDe = (res: { json: Record<string, unknown> | null }) => reservaDe(res)['retencao'] as Record<string, unknown>;
const reservar = async (quem: typeof ana, excursaoId: number): Promise<number> => {
  const r = await quem('POST', '/api/reservas', { excursao_id: excursaoId });
  expect(r.status).toBe(201);
  return Number(reservaDe(r)['id']);
};
const checkout = (quem: typeof ana, reservaId: number) => quem('POST', `/api/reservas/${reservaId}/checkout`);
const contar = (tabela: string, onde = '1 = 1'): number => Number(db.prepare(`SELECT COUNT(*) AS n FROM ${tabela} WHERE ${onde}`).get()?.['n']);
const livres = async (excursaoId: number): Promise<unknown> =>
  ((await chamar('GET', `/api/excursoes/${excursaoId}`)).json?.['excursao'] as Record<string, unknown>)['vagas_disponiveis'];
const avancar = (ms: number) => {
  relogio = new Date(relogio.getTime() + ms);
};

beforeEach(async () => {
  db = openDatabase(MEMORY_DATABASE);
  runMigrations(db);
  relogio = new Date('2026-11-13T12:00:00.000Z');
  const auth = new AuthService({ db, config: CONFIG, outbox: () => undefined, now: () => relogio });
  adminId = (await auth.createAdministrator({ ...PESSOA, cpf: '529.982.247-25', email: 'admin.ficticio@exemplo.com' })).id;
  await auth.register({ ...PESSOA, cpf: '111.444.777-35', email: 'ana.passageira@exemplo.com' });
  await auth.register({ ...PESSOA, nome_completo: 'Beatriz Souza Ficticia', cpf: '123.456.789-09', email: 'beatriz.passageira@exemplo.com' });
  excursoes = new ExcursaoService(db, () => relogio);
  server = createApp({ auth: { service: auth, config: CONFIG }, excursoes, reservas: new ReservaService(db, () => relogio) });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  adminCookie = await entrar('admin.ficticio@exemplo.com');
  anaCookie = await entrar('ana.passageira@exemplo.com');
  beatrizCookie = await entrar('beatriz.passageira@exemplo.com');
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  db.close();
});

describe('abrir o checkout inicia a retencao (RF-021, RN-014, RN-015)', () => {
  it('cria a retencao ativa por 15 minutos, sem ocupar vaga e sem criar pagamento', async () => {
    const id = publicar();
    const reservaId = await reservar(ana, id);
    expect(contar('retencao_vaga')).toBe(0); // a reserva pendente nao segura vaga (decisao 1)
    const res = await checkout(ana, reservaId);
    expect(res.status).toBe(200);
    expect(retencaoDe(res)).toEqual({ situacao: 'ativa', expira_em: new Date(relogio.getTime() + QUINZE_MIN).toISOString(), segundos_restantes: 900 });
    expect(reservaDe(res)['situacao']).toBe('aguardando_pagamento');
    expect(contar('retencao_vaga', "situacao = 'ativa'")).toBe(1);
    expect(Number(db.prepare('SELECT vagas_ocupadas AS v FROM excursao WHERE id = ?').get(id)?.['v'])).toBe(0); // RN-015
    expect(contar('pagamento')).toBe(0);
    expect(await livres(id)).toBe(19);
  });

  it('repetir o checkout com a retencao ativa devolve a mesma, sem prorrogar', async () => {
    const reservaId = await reservar(ana, publicar());
    const primeira = retencaoDe(await checkout(ana, reservaId));
    avancar(5 * 60_000);
    const segunda = retencaoDe(await checkout(ana, reservaId));
    expect(segunda['expira_em']).toBe(primeira['expira_em']);
    expect(segunda['segundos_restantes']).toBe(600);
    expect(contar('retencao_vaga')).toBe(1);
  });

  it('a consulta da reserva mostra o tempo restante e nao grava nada ao ler', async () => {
    const reservaId = await reservar(ana, publicar());
    await checkout(ana, reservaId);
    avancar(14 * 60_000);
    expect(retencaoDe(await ana('GET', `/api/reservas/${reservaId}`))['segundos_restantes']).toBe(60);
    avancar(2 * 60_000); // passou do prazo: a leitura mostra expirada, mas nao altera a linha
    expect(retencaoDe(await ana('GET', `/api/reservas/${reservaId}`))).toMatchObject({ situacao: 'expirada', segundos_restantes: 0 });
    expect(db.prepare('SELECT situacao FROM retencao_vaga').get()?.['situacao']).toBe('ativa');
    expect(contar('auditoria', "acao = 'retencao.expirada'")).toBe(0);
  });

  it('reserva sem checkout iniciado nao tem retencao', async () => {
    const reservaId = await reservar(ana, publicar());
    expect(reservaDe(await ana('GET', `/api/reservas/${reservaId}`))['retencao']).toBeNull();
  });

  it('a duracao e configuravel', () => {
    const anaId = Number(db.prepare("SELECT id FROM usuario WHERE email = 'ana.passageira@exemplo.com'").get()?.['id']);
    const curto = new ReservaService(db, () => relogio, 2 * 60_000);
    const solicitada = curto.solicitar(anaId, { excursao_id: publicar() });
    expect(curto.iniciarCheckout(anaId, solicitada.id).retencao?.segundos_restantes).toBe(120);
  });

  it('a configuracao le RETENCAO_MINUTOS e recusa valores invalidos', () => {
    expect(loadReservaConfig({}).retencaoMs).toBe(QUINZE_MIN);
    expect(loadReservaConfig({ RETENCAO_MINUTOS: '30' }).retencaoMs).toBe(30 * 60_000);
    expect(loadReservaConfig({ RETENCAO_MINUTOS: ' 1 ' }).retencaoMs).toBe(60_000);
    for (const ruim of ['0', '-5', '1441', 'abc', '1.5']) {
      expect(() => loadReservaConfig({ RETENCAO_MINUTOS: ruim }), ruim).toThrow(ReservaConfigError);
    }
  });

  it('a reserva de outra pessoa, a inexistente e a cancelada recusam o checkout', async () => {
    const reservaId = await reservar(ana, publicar());
    const alheia = await checkout(beatriz, reservaId);
    const inexistente = await checkout(beatriz, 9999);
    expect([alheia.status, inexistente.status]).toEqual([404, 404]);
    expect(alheia.json).toEqual(inexistente.json);
    expect(contar('retencao_vaga')).toBe(0);
    await ana('POST', `/api/reservas/${reservaId}/desistir`);
    const cancelada = await checkout(ana, reservaId);
    expect(cancelada.status).toBe(409);
    expect(cancelada.json).toEqual({ error: 'reserva_nao_pendente' });
  });

  it('excursao que deixou de aceitar reservas recusa o checkout', async () => {
    const id = publicar();
    const reservaId = await reservar(ana, id);
    db.prepare("UPDATE excursao SET situacao = 'encerrada' WHERE id = ?").run(id);
    const res = await checkout(ana, reservaId);
    expect(res.status).toBe(409);
    expect(res.json).toEqual({ error: 'reservas_encerradas' });
    expect(contar('retencao_vaga')).toBe(0);
  });
});

describe('a retencao reduz a disponibilidade (RF-017, RF-019, RN-021)', () => {
  it('a segunda pessoa que disputa a ultima vaga recebe sem_vagas no checkout, e a consulta publica mostra zero', async () => {
    const id = publicar({ capacidade: 1 });
    const daAna = await reservar(ana, id);
    const daBeatriz = await reservar(beatriz, id); // sem retencao ainda, as duas pendentes convivem (decisao da AGT-007)
    expect((await checkout(ana, daAna)).status).toBe(200);
    expect(await livres(id)).toBe(0);
    const negado = await checkout(beatriz, daBeatriz);
    expect(negado.status).toBe(409);
    expect(negado.json).toEqual({ error: 'sem_vagas' });
    expect(contar('retencao_vaga')).toBe(1);
    expect(Number(db.prepare('SELECT vagas_ocupadas AS v FROM excursao WHERE id = ?').get(id)?.['v'])).toBe(0);
  });

  it('a solicitacao de reserva tambem considera a retencao (RF-019)', async () => {
    const id = publicar({ capacidade: 1 });
    await checkout(ana, await reservar(ana, id));
    const res = await beatriz('POST', '/api/reservas', { excursao_id: id });
    expect(res.status).toBe(409);
    expect(res.json).toEqual({ error: 'sem_vagas' });
    expect(contar('reserva')).toBe(1);
  });

  it('dois checkouts simultaneos pela ultima vaga resultam em uma retencao e um 409 (RN-040)', async () => {
    const id = publicar({ capacidade: 1 });
    const daAna = await reservar(ana, id);
    const daBeatriz = await reservar(beatriz, id);
    const [a, b] = await Promise.all([checkout(ana, daAna), checkout(beatriz, daBeatriz)]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect(contar('retencao_vaga', "situacao = 'ativa'")).toBe(1);
  });

  it('com varias vagas, cada retencao reduz uma e a ultima recusa', async () => {
    const id = publicar({ capacidade: 2 });
    const reservas = [await reservar(ana, id), await reservar(beatriz, id)];
    expect((await checkout(ana, reservas[0] as number)).status).toBe(200);
    expect(await livres(id)).toBe(1);
    expect((await checkout(beatriz, reservas[1] as number)).status).toBe(200);
    expect(await livres(id)).toBe(0);
  });
});

describe('expiracao e retomada (RF-022, decisao 3)', () => {
  it('a retencao vencida libera a vaga: a consulta volta e outra pessoa consegue o checkout', async () => {
    const id = publicar({ capacidade: 1 });
    const daAna = await reservar(ana, id);
    const daBeatriz = await reservar(beatriz, id);
    await checkout(ana, daAna);
    avancar(QUINZE_MIN - 1000);
    expect(await livres(id)).toBe(0);
    avancar(1000); // exatamente no instante de expiracao a retencao ja nao vale
    expect(await livres(id)).toBe(1);
    const res = await checkout(beatriz, daBeatriz);
    expect(res.status).toBe(200);
    // a gravacao encontrou a retencao vencida e a marcou como expirada, com auditoria do sistema
    expect(db.prepare('SELECT situacao FROM retencao_vaga WHERE reserva_id = ?').get(daAna)?.['situacao']).toBe('expirada');
    const evento = db.prepare("SELECT ator_usuario_id AS ator, entidade, estado_anterior AS antes, estado_novo AS depois FROM auditoria WHERE acao = 'retencao.expirada'").get();
    expect(evento).toMatchObject({ ator: null, entidade: 'retencao_vaga' });
    expect(JSON.parse(String(evento?.['depois']))).toEqual({ situacao: 'expirada', reserva_id: daAna });
  });

  it('a reserva continua aguardando pagamento quando a retencao expira', async () => {
    const id = publicar();
    const reservaId = await reservar(ana, id);
    await checkout(ana, reservaId);
    avancar(QUINZE_MIN + 1000);
    const res = await ana('GET', `/api/reservas/${reservaId}`);
    expect(reservaDe(res)).toMatchObject({ situacao: 'aguardando_pagamento', pode_desistir: true });
    expect(retencaoDe(res)['situacao']).toBe('expirada');
  });

  it('retomar o checkout depois de expirada cria outra retencao se houver vaga', async () => {
    const id = publicar({ capacidade: 1 });
    const reservaId = await reservar(ana, id);
    await checkout(ana, reservaId);
    avancar(QUINZE_MIN + 1000);
    const nova = await checkout(ana, reservaId);
    expect(nova.status).toBe(200);
    expect(retencaoDe(nova)).toMatchObject({ situacao: 'ativa', segundos_restantes: 900 });
    expect(db.prepare('SELECT situacao FROM retencao_vaga ORDER BY id').all().map((r) => r['situacao'])).toEqual(['expirada', 'ativa']);
    expect(contar('retencao_vaga', "situacao = 'ativa'")).toBe(1); // uq_retencao_ativa
  });

  it('retomar sem vaga (outra pessoa tomou) responde sem_vagas', async () => {
    const id = publicar({ capacidade: 1 });
    const daAna = await reservar(ana, id);
    const daBeatriz = await reservar(beatriz, id);
    await checkout(ana, daAna);
    avancar(QUINZE_MIN + 1000);
    expect((await checkout(beatriz, daBeatriz)).status).toBe(200);
    const retomada = await checkout(ana, daAna);
    expect(retomada.status).toBe(409);
    expect(retomada.json).toEqual({ error: 'sem_vagas' });
  });

  it('a retencao nao tem efeito depois que a ocupacao enche a capacidade', async () => {
    const id = publicar({ capacidade: 1 });
    const reservaId = await reservar(ana, id);
    db.prepare('UPDATE excursao SET vagas_ocupadas = 1 WHERE id = ?').run(id);
    const res = await checkout(ana, reservaId);
    expect(res.status).toBe(409);
    expect(contar('retencao_vaga')).toBe(0);
  });
});

describe('desistencia cancela a retencao (decisao 3)', () => {
  it('desistir com retencao ativa cancela a retencao, libera a vaga e audita', async () => {
    const id = publicar({ capacidade: 1 });
    const reservaId = await reservar(ana, id);
    await checkout(ana, reservaId);
    expect(await livres(id)).toBe(0);
    const res = await ana('POST', `/api/reservas/${reservaId}/desistir`);
    expect(res.status).toBe(200);
    expect(retencaoDe(res)).toMatchObject({ situacao: 'cancelada', segundos_restantes: 0 });
    expect(await livres(id)).toBe(1);
    const evento = db.prepare("SELECT ator_usuario_id AS ator FROM auditoria WHERE acao = 'retencao.cancelada'").get();
    expect(evento?.['ator']).not.toBeNull();
  });

  it('desistir com a retencao ja vencida marca expirada, nao cancelada', async () => {
    const reservaId = await reservar(ana, publicar());
    await checkout(ana, reservaId);
    avancar(QUINZE_MIN + 1000);
    await ana('POST', `/api/reservas/${reservaId}/desistir`);
    expect(db.prepare('SELECT situacao FROM retencao_vaga').get()?.['situacao']).toBe('expirada');
    expect(contar('auditoria', "acao = 'retencao.cancelada'")).toBe(0);
  });
});

describe('auditoria e privacidade da retencao (RN-041, RN-042)', () => {
  it('a auditoria da retencao tem o ator e nenhum dado pessoal', async () => {
    const reservaId = await reservar(ana, publicar());
    await checkout(ana, reservaId);
    await ana('POST', `/api/reservas/${reservaId}/desistir`);
    const linhas = db.prepare("SELECT * FROM auditoria WHERE entidade = 'retencao_vaga'").all();
    expect(linhas.map((l) => l['acao'])).toEqual(['retencao.criada', 'retencao.cancelada']);
    const texto = JSON.stringify(linhas);
    for (const proibido of ['ana.passageira', 'beatriz', '11144477735', 'senha', 'Maria da Silva']) expect(texto).not.toContain(proibido);
  });

  it('a retencao nunca aparece em respostas publicas nem em reservas de outras pessoas', async () => {
    const id = publicar();
    const reservaId = await reservar(ana, id);
    await checkout(ana, reservaId);
    for (const caminho of ['/api/excursoes', `/api/excursoes/${id}`]) {
      const corpo = JSON.stringify((await chamar('GET', caminho)).json);
      for (const proibido of ['retencao', 'retidas', 'expira_em']) expect(corpo, caminho).not.toContain(proibido);
    }
    expect((await beatriz('GET', `/api/reservas/${reservaId}`)).status).toBe(404);
  });

  it('visitante recebe 401 e administrador 403 no checkout, sem criar retencao', async () => {
    const reservaId = await reservar(ana, publicar());
    expect((await chamar('POST', `/api/reservas/${reservaId}/checkout`)).status).toBe(401);
    expect((await chamar('POST', `/api/reservas/${reservaId}/checkout`, undefined, adminCookie)).status).toBe(403);
    expect(contar('retencao_vaga')).toBe(0);
  });
});

describe('banco ocupado (decisao 2)', () => {
  it('o bloqueio de escrita nao obtido vira 503 banco_ocupado, sem detalhes internos', async () => {
    const auth = new AuthService({ db, config: CONFIG, outbox: () => undefined, now: () => relogio });
    const falso = { iniciarCheckout: () => { throw new Error('database is locked'); } } as unknown as ReservaService;
    const app = createApp({ auth: { service: auth, config: CONFIG }, reservas: falso });
    await new Promise<void>((resolve) => app.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${(app.address() as AddressInfo).port}`;
    const login = await fetch(`${url}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'ana.passageira@exemplo.com', senha: SENHA }) });
    const cookie = cookieDe(login.headers);
    const res = await fetch(`${url}/api/reservas/1/checkout`, { method: 'POST', headers: { Cookie: cookie } });
    expect(res.status).toBe(503);
    expect(res.headers.get('retry-after')).toBe('1');
    expect(await res.json()).toEqual({ error: 'banco_ocupado' });
    await new Promise<void>((resolve, reject) => app.close((e) => (e ? reject(e) : resolve())));
  });
});
