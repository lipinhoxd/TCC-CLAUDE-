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
import { PagamentoService } from '../server/pagamentos/service.ts';
import { provedorDoAmbiente, provedorSimulado } from '../server/pagamentos/provedor.ts';
import { ReservaService } from '../server/reservas/service.ts';

/** Pagamento integral (AGT-009): RF-023, RF-025, RF-026, RN-011, RN-016, RN-021, RN-022, RN-040. */

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

async function chamar(metodo: string, caminho: string, corpo?: unknown, cookie?: string, url = baseUrl) {
  const headers: Record<string, string> = {};
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie !== undefined) headers['Cookie'] = cookie;
  const res = await fetch(`${url}${caminho}`, { method: metodo, headers, ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }) });
  const texto = await res.text();
  return { status: res.status, json: texto === '' ? null : (JSON.parse(texto) as Record<string, unknown>), headers: res.headers };
}
const cookieDe = (h: Headers): string => (h.get('set-cookie') ?? '').split(';')[0] ?? '';
async function entrar(email: string, url = baseUrl): Promise<string> {
  const res = await chamar('POST', '/api/auth/login', { email, senha: SENHA }, undefined, url);
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
type Quem = typeof ana;
const reservaDe = (res: { json: Record<string, unknown> | null }) => res.json?.['reserva'] as Record<string, unknown>;
const pagamentoDe = (res: { json: Record<string, unknown> | null }) => reservaDe(res)['pagamento'] as Record<string, unknown> | null;
const reservar = async (quem: Quem, excursaoId: number, extra: Record<string, unknown> = {}): Promise<number> => {
  const r = await quem('POST', '/api/reservas', { excursao_id: excursaoId, ...extra });
  expect(r.status).toBe(201);
  return Number(reservaDe(r)['id']);
};
const checkout = (quem: Quem, reservaId: number) => quem('POST', `/api/reservas/${reservaId}/checkout`);
const pagar = (quem: Quem, reservaId: number) => quem('POST', `/api/reservas/${reservaId}/pagamento`);
const simular = (quem: Quem, reservaId: number, resultado: unknown) => quem('POST', `/api/reservas/${reservaId}/pagamento/simulacao`, { resultado });
const contar = (tabela: string, onde = '1 = 1'): number => Number(db.prepare(`SELECT COUNT(*) AS n FROM ${tabela} WHERE ${onde}`).get()?.['n']);
const ocupadas = (id: number): number => Number(db.prepare('SELECT vagas_ocupadas AS v FROM excursao WHERE id = ?').get(id)?.['v']);
const livres = async (id: number): Promise<unknown> => ((await chamar('GET', `/api/excursoes/${id}`)).json?.['excursao'] as Record<string, unknown>)['vagas_disponiveis'];
const avancar = (ms: number) => {
  relogio = new Date(relogio.getTime() + ms);
};
/** Reserva, abre o checkout e inicia o pagamento; devolve o numero da reserva. */
const ateOPagamento = async (quem: Quem, excursaoId: number): Promise<number> => {
  const reservaId = await reservar(quem, excursaoId);
  expect((await checkout(quem, reservaId)).status).toBe(200);
  expect((await pagar(quem, reservaId)).status).toBe(200);
  return reservaId;
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
  const reservas = new ReservaService(db, () => relogio, QUINZE_MIN, provedorSimulado);
  server = createApp({ auth: { service: auth, config: CONFIG }, excursoes, reservas, pagamentos: new PagamentoService(db, reservas, provedorSimulado, () => relogio) });
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

describe('autorizacao (RN-044, RNF-004)', () => {
  const rotas: [string, string, unknown][] = [
    ['POST', '/api/reservas/1/pagamento', undefined],
    ['POST', '/api/reservas/1/pagamento/simulacao', { resultado: 'aprovado' }],
  ];

  it.each(rotas)('%s %s: visitante recebe 401 e administrador recebe 403', async (metodo, caminho, corpo) => {
    expect((await chamar(metodo, caminho, corpo)).status).toBe(401);
    const negado = await chamar(metodo, caminho, corpo, adminCookie);
    expect(negado.status).toBe(403);
    expect(negado.json).toEqual({ error: 'acesso_negado' });
  });

  it('a autorizacao vem antes de ler o corpo e nada e criado por quem nao e passageiro', async () => {
    expect((await chamar('POST', '/api/reservas/1/pagamento/simulacao', '{quebrado', adminCookie)).status).toBe(403);
    expect(contar('pagamento')).toBe(0);
  });

  it('a reserva de outra pessoa e a inexistente respondem igual (404), sem criar pagamento', async () => {
    const reservaId = await ateOPagamento(ana, publicar());
    const alheia = await pagar(beatriz, reservaId);
    const inexistente = await pagar(beatriz, 9999);
    const simAlheia = await simular(beatriz, reservaId, 'aprovado');
    expect([alheia.status, inexistente.status, simAlheia.status]).toEqual([404, 404, 404]);
    expect(alheia.json).toEqual(inexistente.json);
    expect(pagamentoDe(await ana('GET', `/api/reservas/${reservaId}`))).toMatchObject({ situacao: 'pendente' });
    expect(contar('pagamento')).toBe(1);
  });

  it('sem provedor (producao) o pagamento responde 503 e as rotas de simulacao nao existem', async () => {
    const auth = new AuthService({ db, config: CONFIG, outbox: () => undefined, now: () => relogio });
    const reservas = new ReservaService(db, () => relogio, QUINZE_MIN);
    const app = createApp({ auth: { service: auth, config: CONFIG }, excursoes, reservas, pagamentos: new PagamentoService(db, reservas, undefined, () => relogio) });
    await new Promise<void>((resolve) => app.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${(app.address() as AddressInfo).port}`;
    const cookie = await entrar('ana.passageira@exemplo.com', url);
    const id = publicar();
    const reservaId = Number(reservaDe(await chamar('POST', '/api/reservas', { excursao_id: id }, cookie, url))['id']);
    await chamar('POST', `/api/reservas/${reservaId}/checkout`, undefined, cookie, url);
    const semProvedor = await chamar('POST', `/api/reservas/${reservaId}/pagamento`, undefined, cookie, url);
    expect(semProvedor.status).toBe(503);
    expect(semProvedor.json).toEqual({ error: 'pagamento_indisponivel' });
    const rota = await chamar('POST', `/api/reservas/${reservaId}/pagamento/simulacao`, { resultado: 'aprovado' }, cookie, url);
    expect(rota.status).toBe(404);
    expect(contar('pagamento')).toBe(0);
    const dto = reservaDe(await chamar('GET', `/api/reservas/${reservaId}`, undefined, cookie, url));
    expect([dto['pagamento_disponivel'], dto['pagamento_simulado']]).toEqual([false, false]);
    await new Promise<void>((resolve, reject) => app.close((e) => (e ? reject(e) : resolve())));
  });

  it('o provedor do ambiente e simulado fora de producao e inexistente em producao', () => {
    expect(provedorDoAmbiente({})).toBe(provedorSimulado);
    expect(provedorDoAmbiente({ NODE_ENV: 'development' })).toBe(provedorSimulado);
    expect(provedorDoAmbiente({ PAGAMENTO_SIMULADO: 'false' })).toBeUndefined();
    expect(provedorDoAmbiente({ NODE_ENV: 'production' })).toBeUndefined();
    expect(provedorDoAmbiente({ NODE_ENV: 'production', PAGAMENTO_SIMULADO: 'true' })).toBeUndefined();
  });
});

describe('iniciar o pagamento (RF-023)', () => {
  it('cria o pagamento pendente com o valor da excursao, sem ocupar vaga', async () => {
    const id = publicar();
    const reservaId = await reservar(ana, id);
    await checkout(ana, reservaId);
    const res = await pagar(ana, reservaId);
    expect(res.status).toBe(200);
    expect(pagamentoDe(res)).toEqual({ parcela: 'unica', situacao: 'pendente', valor_centavos: 150000, confirmado_em: null, requer_tratamento_administrativo: false });
    expect(reservaDe(res)['proxima_parcela']).toBe('unica');
    expect(reservaDe(res)).toMatchObject({ situacao: 'aguardando_pagamento', pagamento_disponivel: true, pagamento_simulado: true, pode_desistir: false });
    expect(db.prepare('SELECT parcela, valor_centavos AS v, situacao FROM pagamento').all()).toEqual([{ parcela: 'unica', v: 150000, situacao: 'pendente' }]);
    expect(ocupadas(id)).toBe(0);
    expect(await livres(id)).toBe(19); // a retencao continua segurando a vaga
  });

  it('o valor vem sempre do servidor, mesmo que o cliente mande outro', async () => {
    const id = publicar({ preco_centavos: 99990 });
    const reservaId = await reservar(ana, id);
    await checkout(ana, reservaId);
    const res = await ana('POST', `/api/reservas/${reservaId}/pagamento`, { valor_centavos: 1 });
    expect(pagamentoDe(res)?.['valor_centavos']).toBe(99990);
    expect(contar('pagamento', 'valor_centavos = 99990')).toBe(1);
  });

  it('repetir com o pagamento pendente devolve o mesmo, sem criar outra linha', async () => {
    const reservaId = await reservar(ana, publicar());
    await checkout(ana, reservaId);
    const primeira = await pagar(ana, reservaId);
    const segunda = await pagar(ana, reservaId);
    expect(pagamentoDe(segunda)).toEqual(pagamentoDe(primeira));
    expect(contar('pagamento')).toBe(1);
    expect(contar('auditoria', "acao = 'pagamento.criado'")).toBe(1);
  });

  it('exige retencao ativa: sem checkout aberto ou com a retencao vencida, recusa', async () => {
    const reservaId = await reservar(ana, publicar());
    const semCheckout = await pagar(ana, reservaId);
    expect(semCheckout.status).toBe(409);
    expect(semCheckout.json).toEqual({ error: 'retencao_inativa' });
    await checkout(ana, reservaId);
    avancar(QUINZE_MIN + 1000);
    const vencida = await pagar(ana, reservaId);
    expect(vencida.status).toBe(409);
    expect(vencida.json).toEqual({ error: 'retencao_inativa' });
    expect(contar('pagamento')).toBe(0);
  });

  it('reserva cancelada e excursao que deixou de aceitar reservas recusam', async () => {
    const id = publicar();
    const cancelada = await reservar(ana, id);
    await checkout(ana, cancelada);
    await ana('POST', `/api/reservas/${cancelada}/desistir`);
    expect((await pagar(ana, cancelada)).json).toEqual({ error: 'reserva_nao_pendente' });
    const id2 = publicar({ nome: 'Outra Excursao Ficticia' });
    const reservaId = await reservar(beatriz, id2);
    await checkout(beatriz, reservaId);
    db.prepare("UPDATE excursao SET situacao = 'encerrada' WHERE id = ?").run(id2);
    expect((await pagar(beatriz, reservaId)).json).toEqual({ error: 'reservas_encerradas' });
    expect(contar('pagamento')).toBe(0);
  });
});

describe('confirmacao do pagamento integral (RF-025, RN-016, RN-021)', () => {
  it('aprovado: confirma o pagamento, converte a retencao, ocupa uma vaga e deixa a reserva pronta para embarque', async () => {
    const id = publicar();
    const reservaId = await ateOPagamento(ana, id);
    const res = await simular(ana, reservaId, 'aprovado');
    expect(res.status).toBe(200);
    expect(reservaDe(res)).toMatchObject({ situacao: 'pronto_para_embarque', pode_desistir: false });
    expect(pagamentoDe(res)).toMatchObject({ situacao: 'confirmado', valor_centavos: 150000, requer_tratamento_administrativo: false });
    expect(pagamentoDe(res)?.['confirmado_em']).toBe(relogio.toISOString());
    expect(reservaDe(res)['retencao']).toMatchObject({ situacao: 'confirmada', segundos_restantes: 0 });
    expect(ocupadas(id)).toBe(1);
    expect(await livres(id)).toBe(19); // a retencao confirmada nao conta duas vezes
    expect(contar('retencao_vaga', "situacao = 'ativa'")).toBe(0);
  });

  it('e idempotente: confirmar de novo nao ocupa outra vaga nem cria linha ou auditoria repetida', async () => {
    const id = publicar();
    const reservaId = await ateOPagamento(ana, id);
    await simular(ana, reservaId, 'aprovado');
    const repetida = await simular(ana, reservaId, 'aprovado');
    expect(repetida.status).toBe(200);
    expect(reservaDe(repetida)['situacao']).toBe('pronto_para_embarque');
    expect(ocupadas(id)).toBe(1);
    expect(contar('pagamento')).toBe(1);
    expect(contar('auditoria', "acao = 'pagamento.confirmado'")).toBe(1);
  });

  it('duas confirmacoes simultaneas ocupam uma unica vaga', async () => {
    const id = publicar();
    const reservaId = await ateOPagamento(ana, id);
    const [a, b] = await Promise.all([simular(ana, reservaId, 'aprovado'), simular(ana, reservaId, 'aprovado')]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(ocupadas(id)).toBe(1);
    expect(contar('auditoria', "acao = 'pagamento.confirmado'")).toBe(1);
  });

  it('a reserva paga nao pode desistir, repetir o checkout nem pagar de novo', async () => {
    const reservaId = await ateOPagamento(ana, publicar());
    await simular(ana, reservaId, 'aprovado');
    expect((await ana('POST', `/api/reservas/${reservaId}/desistir`)).json).toEqual({ error: 'reserva_nao_cancelavel' });
    expect((await checkout(ana, reservaId)).json).toEqual({ error: 'reserva_nao_pendente' });
    expect((await pagar(ana, reservaId)).json).toEqual({ error: 'pagamento_ja_confirmado' });
  });

  it('a ocupacao nunca passa da capacidade: ultima vaga confirmada uma vez, com a consulta publica em zero', async () => {
    const id = publicar({ capacidade: 1 });
    const reservaId = await ateOPagamento(ana, id);
    await simular(ana, reservaId, 'aprovado');
    expect(ocupadas(id)).toBe(1);
    expect(await livres(id)).toBe(0);
    expect((await beatriz('POST', '/api/reservas', { excursao_id: id })).json).toEqual({ error: 'sem_vagas' });
  });

  it('a auditoria registra criado, confirmado, retencao confirmada e reserva pronta, sem dados pessoais nem de pagamento', async () => {
    const reservaId = await ateOPagamento(ana, publicar());
    await simular(ana, reservaId, 'aprovado');
    const acoes = db.prepare('SELECT acao FROM auditoria ORDER BY id').all().map((r) => r['acao']);
    expect(acoes).toEqual(expect.arrayContaining(['pagamento.criado', 'pagamento.confirmado', 'retencao.confirmada', 'reserva.pronta_para_embarque']));
    const tudo = JSON.stringify(db.prepare('SELECT * FROM auditoria').all()) + JSON.stringify(db.prepare('SELECT * FROM pagamento').all());
    for (const proibido of ['ana.passageira', 'beatriz', '11144477735', 'senha', 'Maria da Silva', 'cartao', 'card', 'numero']) expect(tudo).not.toContain(proibido);
    expect(Object.keys(db.prepare('SELECT * FROM pagamento').get() ?? {}).sort()).toEqual(
      ['atualizado_em', 'confirmado_em', 'criado_em', 'id', 'parcela', 'pendencia_administrativa', 'reserva_id', 'situacao', 'valor_centavos'],
    );
  });
});

describe('pagamento recusado (decisao 2)', () => {
  it('vira falhou, a retencao continua e o passageiro pode tentar de novo na mesma linha', async () => {
    const id = publicar();
    const reservaId = await ateOPagamento(ana, id);
    const recusado = await simular(ana, reservaId, 'recusado');
    expect(pagamentoDe(recusado)).toMatchObject({ situacao: 'falhou' });
    expect(reservaDe(recusado)).toMatchObject({ situacao: 'aguardando_pagamento', pode_desistir: true });
    expect(reservaDe(recusado)['retencao']).toMatchObject({ situacao: 'ativa' });
    expect(ocupadas(id)).toBe(0);
    const linhaAntes = Number(db.prepare('SELECT id FROM pagamento').get()?.['id']);
    const nova = await pagar(ana, reservaId);
    expect(pagamentoDe(nova)).toMatchObject({ situacao: 'pendente' });
    expect(contar('pagamento')).toBe(1);
    expect(Number(db.prepare('SELECT id FROM pagamento').get()?.['id'])).toBe(linhaAntes);
    expect(contar('auditoria', "acao = 'pagamento.reiniciado'")).toBe(1);
    const aprovado = await simular(ana, reservaId, 'aprovado');
    expect(reservaDe(aprovado)['situacao']).toBe('pronto_para_embarque');
  });

  it('um pagamento recusado nao impede desistir; o pendente impede', async () => {
    const reservaId = await ateOPagamento(ana, publicar());
    expect((await ana('POST', `/api/reservas/${reservaId}/desistir`)).json).toEqual({ error: 'reserva_com_pagamento' });
    await simular(ana, reservaId, 'recusado');
    const desistida = await ana('POST', `/api/reservas/${reservaId}/desistir`);
    expect(desistida.status).toBe(200);
    expect(reservaDe(desistida)['situacao']).toBe('cancelada');
  });

  it('recusar um pagamento ja confirmado e conflito; recusar de novo e idempotente', async () => {
    const reservaId = await ateOPagamento(ana, publicar());
    await simular(ana, reservaId, 'recusado');
    expect((await simular(ana, reservaId, 'recusado')).status).toBe(200);
    expect(contar('auditoria', "acao = 'pagamento.recusado'")).toBe(1);
    const outra = await ateOPagamento(beatriz, publicar({ nome: 'Outra Excursao Ficticia' }));
    await simular(beatriz, outra, 'aprovado');
    const conflito = await simular(beatriz, outra, 'recusado');
    expect(conflito.status).toBe(409);
    expect(conflito.json).toEqual({ error: 'pagamento_ja_confirmado' });
  });

  it('simular sem pagamento iniciado e com corpo invalido sao recusados', async () => {
    const reservaId = await reservar(ana, publicar());
    await checkout(ana, reservaId);
    expect((await simular(ana, reservaId, 'aprovado')).json).toEqual({ error: 'pagamento_nao_iniciado' });
    await pagar(ana, reservaId);
    const invalido = await simular(ana, reservaId, 'talvez');
    expect(invalido.status).toBe(400);
    expect(invalido.json).toEqual({ error: 'validacao', fields: { resultado: 'invalido' } });
    const semCampo = await ana('POST', `/api/reservas/${reservaId}/pagamento/simulacao`, {});
    expect(semCampo.json).toEqual({ error: 'validacao', fields: { resultado: 'obrigatorio' } });
    const extra = await ana('POST', `/api/reservas/${reservaId}/pagamento/simulacao`, { resultado: 'aprovado', valor_centavos: 1 });
    expect(extra.json).toEqual({ error: 'validacao', fields: { valor_centavos: 'campo_nao_permitido' } });
    expect(contar('pagamento', "situacao = 'confirmado'")).toBe(0);
  });
});

describe('confirmacao depois da expiracao (RN-022, RF-026, decisao 3)', () => {
  it('com a retencao expirada mas com vaga livre, a confirmacao ocupa a vaga normalmente', async () => {
    const id = publicar();
    const reservaId = await ateOPagamento(ana, id);
    avancar(QUINZE_MIN + 60_000);
    const res = await simular(ana, reservaId, 'aprovado');
    expect(reservaDe(res)).toMatchObject({ situacao: 'pronto_para_embarque' });
    expect(pagamentoDe(res)).toMatchObject({ situacao: 'confirmado', requer_tratamento_administrativo: false });
    expect(ocupadas(id)).toBe(1);
    expect(db.prepare('SELECT situacao FROM retencao_vaga').get()?.['situacao']).toBe('expirada');
    const evento = db.prepare("SELECT estado_novo AS e FROM auditoria WHERE acao = 'pagamento.confirmado'").get();
    expect(JSON.parse(String(evento?.['e']))).toMatchObject({ com_retencao: false });
  });

  it('sem vaga livre, o pagamento fica confirmado e sinalizado, a reserva continua aguardando e nenhuma vaga e criada', async () => {
    const id = publicar({ capacidade: 1 });
    const daBeatriz = await reservar(beatriz, id); // as duas reservas existem antes de alguem segurar a vaga
    const daAna = await reservar(ana, id);
    await checkout(ana, daAna);
    await pagar(ana, daAna);
    avancar(QUINZE_MIN + 1000); // a retencao da Ana expira
    await checkout(beatriz, daBeatriz);
    await pagar(beatriz, daBeatriz);
    const pagaBeatriz = await simular(beatriz, daBeatriz, 'aprovado');
    expect(reservaDe(pagaBeatriz)['situacao']).toBe('pronto_para_embarque');
    expect(ocupadas(id)).toBe(1);

    const tardia = await simular(ana, daAna, 'aprovado'); // a confirmacao da Ana chega tarde e nao ha vaga
    expect(tardia.status).toBe(200);
    expect(reservaDe(tardia)).toMatchObject({ situacao: 'aguardando_pagamento', pode_desistir: false });
    expect(pagamentoDe(tardia)).toMatchObject({ situacao: 'confirmado', requer_tratamento_administrativo: true });
    expect(ocupadas(id)).toBe(1); // nunca acima da capacidade
    expect(Number(db.prepare('SELECT capacidade AS c FROM excursao WHERE id = ?').get(id)?.['c'])).toBe(1);
    expect(db.prepare("SELECT pendencia_administrativa AS p FROM pagamento WHERE reserva_id = ?").get(daAna)?.['p']).toBe('confirmacao_sem_vaga');
    expect(db.prepare("SELECT COUNT(*) AS n FROM pagamento WHERE pendencia_administrativa IS NOT NULL").get()?.['n']).toBe(1);
    expect(contar('auditoria', "acao = 'pagamento.confirmado_sem_vaga'")).toBe(1);
    // repetir a confirmacao tardia e idempotente e nao muda nada
    const repetida = await simular(ana, daAna, 'aprovado');
    expect(pagamentoDe(repetida)).toMatchObject({ requer_tratamento_administrativo: true });
    expect(ocupadas(id)).toBe(1);
    expect(contar('auditoria', "acao = 'pagamento.confirmado_sem_vaga'")).toBe(1);
    // a reserva sinalizada nao pode pagar de novo, retomar o checkout nem desistir
    expect((await pagar(ana, daAna)).json).toEqual({ error: 'pagamento_ja_confirmado' });
    expect((await ana('POST', `/api/reservas/${daAna}/desistir`)).json).toEqual({ error: 'reserva_com_pagamento' });
  });

  it('a retencao de outra pessoa no prazo tambem impede a ocupacao sem vaga (sem vaga adicional)', async () => {
    const id = publicar({ capacidade: 1 });
    const daBeatriz = await reservar(beatriz, id);
    const daAna = await reservar(ana, id);
    await checkout(ana, daAna);
    await pagar(ana, daAna);
    avancar(QUINZE_MIN + 1000);
    await checkout(beatriz, daBeatriz); // Beatriz segura a vaga e ainda nao pagou
    const tardia = await simular(ana, daAna, 'aprovado');
    expect(pagamentoDe(tardia)).toMatchObject({ requer_tratamento_administrativo: true });
    expect(ocupadas(id)).toBe(0);
    // a retencao da Beatriz continua valendo e ela ainda consegue pagar e ocupar a vaga
    expect((await simular(beatriz, daBeatriz, 'aprovado')).json).toEqual({ error: 'pagamento_nao_iniciado' }); // ela ainda nao tinha iniciado o pagamento
    await pagar(beatriz, daBeatriz);
    expect(reservaDe(await simular(beatriz, daBeatriz, 'aprovado'))['situacao']).toBe('pronto_para_embarque');
    expect(ocupadas(id)).toBe(1);
  });
});

describe('privacidade e forma da resposta', () => {
  it('a resposta do pagamento nao traz dados de outras pessoas, de cartao nem campos internos', async () => {
    const reservaId = await ateOPagamento(ana, publicar());
    const res = await simular(ana, reservaId, 'aprovado');
    const texto = JSON.stringify(res.json);
    for (const proibido of ['ana.passageira', 'beatriz', '11144477735', 'usuario_id', 'vagas_ocupadas', 'capacidade', 'pendencia_administrativa', SENHA]) {
      expect(texto).not.toContain(proibido);
    }
    expect(Object.keys(pagamentoDe(res) ?? {}).sort()).toEqual(['confirmado_em', 'parcela', 'requer_tratamento_administrativo', 'situacao', 'valor_centavos']);
  });

  it('a consulta publica continua sem expor pagamento nem ocupacao', async () => {
    const id = publicar();
    await simular(ana, await ateOPagamento(ana, id), 'aprovado');
    const corpo = JSON.stringify((await chamar('GET', `/api/excursoes/${id}`)).json);
    for (const proibido of ['pagamento', 'retencao', 'vagas_ocupadas', 'capacidade', 'pendencia']) expect(corpo).not.toContain(proibido);
  });
});
