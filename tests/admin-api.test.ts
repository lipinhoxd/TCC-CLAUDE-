import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AdminService, mascararCpf, mascararTelefone } from '../server/admin/service.ts';
import { createApp } from '../server/app.ts';
import type { AuthConfig } from '../server/auth/config.ts';
import { AuthService } from '../server/auth/service.ts';
import { MEMORY_DATABASE, openDatabase } from '../server/db/connection.ts';
import { runMigrations } from '../server/db/migrate.ts';
import { ExcursaoService } from '../server/excursoes/service.ts';
import { provedorSimulado } from '../server/pagamentos/provedor.ts';
import { PagamentoService } from '../server/pagamentos/service.ts';
import { ReservaService } from '../server/reservas/service.ts';

/** Administracao de reservas e passageiros (AGT-012): RF-037, RF-038, RF-039, RF-026, RN-034, RN-035. */

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
  preco_centavos: 15000,
  parcelamento_habilitado: true,
  prazo_segunda_parcela: '2026-12-05',
};
const QUINZE_MIN = 15 * 60_000;
const DEPOIS_DO_FIM = new Date('2026-12-13T03:00:00.000Z');
const SESSAO_FIXA = new Date('2026-11-13T12:00:00.000Z');

let db: DatabaseSync;
let server: Server;
let baseUrl: string;
let relogio: Date;
let excursoes: ExcursaoService;
let adminId: number;
let anaId: number;
let beatrizId: number;
let adminCookie: string;
let anaCookie: string;
let beatrizCookie: string;

async function chamar(metodo: string, caminho: string, corpo?: unknown, cookie?: string) {
  const headers: Record<string, string> = {};
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie !== undefined) headers['Cookie'] = cookie;
  const res = await fetch(`${baseUrl}${caminho}`, { method: metodo, headers, ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }) });
  const texto = await res.text();
  return { status: res.status, json: texto === '' ? null : (JSON.parse(texto) as Record<string, unknown>), headers: res.headers, texto };
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
const adm = (m: string, c: string, corpo?: unknown) => chamar(m, c, corpo, adminCookie);
const ana = (m: string, c: string, corpo?: unknown) => chamar(m, c, corpo, anaCookie);
const beatriz = (m: string, c: string, corpo?: unknown) => chamar(m, c, corpo, beatrizCookie);
type Quem = typeof ana;
const reservaDe = (res: { json: Record<string, unknown> | null }) => res.json?.['reserva'] as Record<string, unknown>;
const reservar = async (quem: Quem, excursaoId: number, modalidade = 'integral'): Promise<number> => {
  const r = await quem('POST', '/api/reservas', { excursao_id: excursaoId, modalidade });
  expect(r.status).toBe(201);
  return Number(reservaDe(r)['id']);
};
const comCheckout = async (quem: Quem, excursaoId: number): Promise<number> => {
  const id = await reservar(quem, excursaoId);
  expect((await quem('POST', `/api/reservas/${id}/checkout`)).status).toBe(200);
  return id;
};
const ateProntaParaEmbarque = async (quem: Quem, excursaoId: number): Promise<number> => {
  const id = await comCheckout(quem, excursaoId);
  expect((await quem('POST', `/api/reservas/${id}/pagamento`)).status).toBe(200);
  expect((await quem('POST', `/api/reservas/${id}/pagamento/simulacao`, { resultado: 'aprovado' })).status).toBe(200);
  return id;
};
const contar = (tabela: string, onde = '1 = 1'): number => Number(db.prepare(`SELECT COUNT(*) AS n FROM ${tabela} WHERE ${onde}`).get()?.['n']);
const ocupadas = (id: number): number => Number(db.prepare('SELECT vagas_ocupadas AS v FROM excursao WHERE id = ?').get(id)?.['v']);
const situacaoNoBanco = (id: number): string => String(db.prepare('SELECT situacao FROM reserva WHERE id = ?').get(id)?.['situacao']);
const irPara = (instante: Date) => {
  relogio = instante;
};
const lista = (r: { json: Record<string, unknown> | null }, chave: string) => r.json?.[chave] as Array<Record<string, unknown>>;
const ANY_STR: unknown = expect.any(String);
const ANY_NUM: unknown = expect.any(Number);
const objetoCom = (o: Record<string, unknown>): unknown => expect.objectContaining(o);
const JUST = 'Pedido do passageiro por telefone, registrado pela organizacao.';

beforeEach(async () => {
  db = openDatabase(MEMORY_DATABASE);
  runMigrations(db);
  relogio = new Date('2026-11-13T12:00:00.000Z');
  const auth = new AuthService({ db, config: CONFIG, outbox: () => undefined, now: () => SESSAO_FIXA });
  adminId = (await auth.createAdministrator({ ...PESSOA, nome_completo: 'Adriana Administradora Ficticia', cpf: '529.982.247-25', email: 'admin.ficticio@exemplo.com' })).id;
  anaId = (await auth.register({ ...PESSOA, nome_completo: 'Ana Passageira Ficticia', cpf: '111.444.777-35', email: 'ana.passageira@exemplo.com' })).id;
  beatrizId = (await auth.register({ ...PESSOA, nome_completo: 'Beatriz Souza Ficticia', cpf: '123.456.789-09', email: 'beatriz.passageira@exemplo.com', telefone: '(21) 99999-1234' })).id;
  excursoes = new ExcursaoService(db, () => relogio);
  const reservas = new ReservaService(db, () => relogio, QUINZE_MIN, provedorSimulado);
  server = createApp({
    auth: { service: auth, config: CONFIG },
    excursoes,
    reservas,
    pagamentos: new PagamentoService(db, reservas, provedorSimulado, () => relogio),
    admin: new AdminService(db, () => relogio),
  });
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

describe('autorizacao nos dois sentidos (RNF-002, RNF-004, RN-044)', () => {
  const ROTAS: Array<[string, string, unknown?]> = [
    ['GET', '/api/admin/reservas'],
    ['GET', '/api/admin/reservas/1'],
    ['POST', '/api/admin/reservas/1/situacao', { situacao: 'cancelada', justificativa: 'x' }],
    ['GET', '/api/admin/pendencias'],
    ['GET', '/api/admin/passageiros'],
    ['GET', '/api/admin/passageiros/2'],
  ];

  it('visitante recebe 401 e passageiro recebe 403 em todas as rotas de administracao, antes de ler o corpo', async () => {
    for (const [metodo, caminho, corpo] of ROTAS) {
      expect((await chamar(metodo, caminho, corpo)).status, `${metodo} ${caminho} visitante`).toBe(401);
      expect((await ana(metodo, caminho, corpo)).status, `${metodo} ${caminho} passageiro`).toBe(403);
    }
  });

  it('corpo invalido de passageiro na alteracao de situacao tambem e 403 (a autorizacao vem antes do corpo)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/reservas/1/situacao`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: anaCookie }, body: '{nao e json' });
    expect(res.status).toBe(403);
  });

  it('o administrador continua recusado nas rotas do passageiro (403)', async () => {
    expect((await adm('GET', '/api/reservas')).status).toBe(403);
    expect((await adm('GET', '/api/reservas/1')).status).toBe(403);
    expect((await adm('POST', '/api/reservas', { excursao_id: 1 })).status).toBe(403);
  });

  it('metodo errado responde 405 com Allow; sem o servico responde 503', async () => {
    expect((await adm('POST', '/api/admin/reservas', {})).headers.get('allow')).toBe('GET');
    expect((await adm('GET', '/api/admin/reservas/1/situacao')).headers.get('allow')).toBe('POST');
    expect((await adm('POST', '/api/admin/pendencias', {})).headers.get('allow')).toBe('GET');
    expect((await adm('DELETE', '/api/admin/passageiros/2')).status).toBe(405);
    const sem = createApp();
    await new Promise<void>((resolve) => sem.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${(sem.address() as AddressInfo).port}`;
    expect((await fetch(`${url}/api/admin/reservas`)).status).toBe(503);
    await new Promise<void>((resolve) => sem.close(() => resolve()));
  });
});

describe('consulta de reservas (RF-037, RN-034)', () => {
  it('lista vazia devolve a pagina padrao', async () => {
    const r = await adm('GET', '/api/admin/reservas');
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ reservas: [], total: 0, pagina: 1, limite: 20 });
  });

  it('cada item traz passageiro (nome e e-mail), excursao, modalidade, situacao e total, e nao traz CPF, telefone nem campos internos', async () => {
    const id = publicar();
    const reservaId = await reservar(ana, id, 'parcelada');
    const r = await adm('GET', '/api/admin/reservas');
    expect(lista(r, 'reservas')[0]).toEqual({
      id: reservaId,
      situacao: 'aguardando_pagamento',
      modalidade: 'parcelada',
      criada_em: ANY_STR,
      motivo_cancelamento: null,
      passageiro: { id: anaId, nome_completo: 'Ana Passageira Ficticia', email: 'ana.passageira@exemplo.com' },
      excursao: { id, nome: 'Excursao Ficticia Serra', data_inicial: '2026-12-10', data_final: '2026-12-12' },
      total_centavos: 15000,
      tem_pendencia: false,
    });
    for (const proibido of ['11144477735', '98765', 'senha', 'hash', 'token', 'usuario_id', SENHA]) expect(r.texto).not.toContain(proibido);
  });

  it('ordena do identificador mais novo para o mais antigo e pagina com total', async () => {
    const id = publicar();
    const a = await reservar(ana, id);
    const b = await reservar(beatriz, id);
    const id2 = publicar({ nome: 'Outra' });
    const c = await reservar(ana, id2);
    expect(lista(await adm('GET', '/api/admin/reservas'), 'reservas').map((x) => x['id'])).toEqual([c, b, a]);
    const p1 = await adm('GET', '/api/admin/reservas?limite=2&pagina=1');
    const p2 = await adm('GET', '/api/admin/reservas?limite=2&pagina=2');
    expect([p1.json?.['total'], p1.json?.['pagina'], p1.json?.['limite']]).toEqual([3, 1, 2]);
    expect(lista(p1, 'reservas').map((x) => x['id'])).toEqual([c, b]);
    expect(lista(p2, 'reservas').map((x) => x['id'])).toEqual([a]);
    expect(lista(await adm('GET', '/api/admin/reservas?pagina=9'), 'reservas')).toEqual([]);
  });

  it('filtra por excursao, situacao, modalidade e busca por nome, e-mail e CPF', async () => {
    const e1 = publicar();
    const e2 = publicar({ nome: 'Outra' });
    const a = await reservar(ana, e1);
    const b = await reservar(beatriz, e1, 'parcelada');
    const c = await reservar(ana, e2);
    await ana('POST', `/api/reservas/${c}/desistir`);
    const ids = async (consulta: string) => lista(await adm('GET', `/api/admin/reservas?${consulta}`), 'reservas').map((x) => x['id']);
    expect(await ids(`excursao_id=${e2}`)).toEqual([c]);
    expect(await ids('situacao=cancelada')).toEqual([c]);
    expect(await ids('situacao=aguardando_pagamento')).toEqual([b, a]);
    expect(await ids('modalidade=parcelada')).toEqual([b]);
    expect(await ids('q=beatriz')).toEqual([b]);
    expect(await ids('q=PASSAGEIRA@EXEMPLO')).toEqual([c, b, a]);
    expect(await ids('q=ana.passageira')).toEqual([c, a]);
    expect(await ids('q=111.444.777-35')).toEqual([c, a]);
    expect(await ids('q=12345678909')).toEqual([b]);
    expect(await ids(`excursao_id=${e1}&situacao=aguardando_pagamento&modalidade=integral&q=ana`)).toEqual([a]);
    expect(await ids('q=nao-existe')).toEqual([]);
  });

  it('parametros invalidos respondem 400 por campo', async () => {
    const r = await adm('GET', '/api/admin/reservas?situacao=xyz&modalidade=mensal&limite=999&pagina=0&excursao_id=abc&q=' + 'a'.repeat(101));
    expect(r.status).toBe(400);
    expect(r.json).toEqual({ error: 'validacao', fields: { situacao: 'invalido', modalidade: 'invalido', limite: 'invalido', pagina: 'invalido', excursao_id: 'invalido', q: 'invalido' } });
  });

  it('a leitura efetiva a conclusao e o vencimento pendentes, e a situacao mostrada e a gravada', async () => {
    const id = publicar();
    const reservaId = await ateProntaParaEmbarque(ana, id);
    irPara(DEPOIS_DO_FIM);
    expect(lista(await adm('GET', '/api/admin/reservas?situacao=concluida'), 'reservas').map((x) => x['id'])).toEqual([reservaId]);
    expect(situacaoNoBanco(reservaId)).toBe('concluida');
  });

  it('detalhe: passageiro, excursao, valores, pagamentos, retencoes, alteracoes permitidas e auditoria, sem dados sensiveis', async () => {
    const id = publicar();
    const reservaId = await comCheckout(ana, id);
    await ana('POST', `/api/reservas/${reservaId}/pagamento`);
    const r = await adm('GET', `/api/admin/reservas/${reservaId}`);
    expect(r.status).toBe(200);
    const d = r.json?.['reserva'] as Record<string, unknown>;
    expect(d).toMatchObject({
      id: reservaId,
      situacao: 'aguardando_pagamento',
      modalidade: 'integral',
      passageiro: { id: anaId, nome_completo: 'Ana Passageira Ficticia', email: 'ana.passageira@exemplo.com' },
      excursao: { id, nome: 'Excursao Ficticia Serra', local: 'Serra Ficticia', situacao: 'publicada' },
      valores: { total_centavos: 15000 },
      pendencias: [],
    });
    expect(d['pagamentos']).toEqual([objetoCom({ parcela: 'unica', situacao: 'pendente', valor_centavos: 15000, pendencia: null })]);
    expect((d['retencoes'] as unknown[]).length).toBe(1);
    expect(d['alteracoes_permitidas']).toEqual([
      { para: 'cancelada', disponivel: false, motivo: 'reserva_com_pagamento' },
      { para: 'concluida', disponivel: false, motivo: 'transicao_nao_autorizada' },
    ]);
    const acoes = (d['auditoria'] as Array<Record<string, unknown>>).map((e) => e['acao']);
    expect(acoes).toEqual(expect.arrayContaining(['reserva.criada', 'retencao.criada', 'pagamento.criado']));
    for (const proibido of ['11144477735', '98765', 'senha', 'hash', 'token', SENHA]) expect(r.texto).not.toContain(proibido);
    expect((await adm('GET', '/api/admin/reservas/99999')).json).toEqual({ error: 'nao_encontrada' });
  });
});

describe('passageiros (RF-038, RN-034; decisao 1)', () => {
  it('a lista mostra nome e e-mail inteiros e CPF e telefone mascarados, so passageiros, e nao audita', async () => {
    const id = publicar();
    await reservar(ana, id);
    await reservar(beatriz, id);
    const antes = contar('auditoria');
    const r = await adm('GET', '/api/admin/passageiros');
    expect(r.status).toBe(200);
    expect(r.json).toMatchObject({ total: 2, pagina: 1, limite: 20 });
    expect(lista(r, 'passageiros')).toEqual([
      { id: anaId, nome_completo: 'Ana Passageira Ficticia', email: 'ana.passageira@exemplo.com', cpf_mascarado: '***.***.***-35', telefone_mascarado: '(**) *****-4321', criado_em: ANY_STR, total_reservas: 1 },
      { id: beatrizId, nome_completo: 'Beatriz Souza Ficticia', email: 'beatriz.passageira@exemplo.com', cpf_mascarado: '***.***.***-09', telefone_mascarado: '(**) *****-1234', criado_em: ANY_STR, total_reservas: 1 },
    ]);
    for (const proibido of ['11144477735', '12345678909', '98765-4321', '99999', 'Adriana', 'admin.ficticio', 'senha', 'hash', 'token', 'sessao']) expect(r.texto).not.toContain(proibido);
    expect(contar('auditoria')).toBe(antes);
  });

  it('mascaras so mostram os ultimos digitos', () => {
    expect(mascararCpf('11144477735')).toBe('***.***.***-35');
    expect(mascararTelefone('(11) 98765-4321')).toBe('(**) *****-4321');
    expect(mascararTelefone('12')).toBe('(**) *****-****');
  });

  it('busca por nome, e-mail e CPF (completo ou parcial), pagina e valida', async () => {
    const ids = async (consulta: string) => lista(await adm('GET', `/api/admin/passageiros?${consulta}`), 'passageiros').map((x) => x['id']);
    expect(await ids('q=beatriz')).toEqual([beatrizId]);
    expect(await ids('q=ANA.passageira')).toEqual([anaId]);
    expect(await ids('q=111.444.777-35')).toEqual([anaId]);
    expect(await ids('q=44477')).toEqual([anaId]);
    expect(await ids('q=Ficticia')).toEqual([anaId, beatrizId]);
    expect(await ids('limite=1&pagina=2')).toEqual([beatrizId]);
    expect(await ids('q=admin')).toEqual([]);
    expect((await adm('GET', '/api/admin/passageiros?limite=0')).json).toEqual({ error: 'validacao', fields: { limite: 'invalido' } });
  });

  it('o detalhe traz os dados completos e as reservas, e cada consulta e auditada sem gravar o dado consultado', async () => {
    const id = publicar();
    const reservaId = await reservar(ana, id);
    const r = await adm('GET', `/api/admin/passageiros/${anaId}`);
    expect(r.status).toBe(200);
    const p = r.json?.['passageiro'] as Record<string, unknown>;
    expect(p).toMatchObject({ id: anaId, nome_completo: 'Ana Passageira Ficticia', email: 'ana.passageira@exemplo.com', cpf: '11144477735', telefone: '+5511987654321', data_nascimento: '1990-05-20' });
    expect((p['reservas'] as Array<Record<string, unknown>>).map((x) => [x['id'], x['situacao']])).toEqual([[reservaId, 'aguardando_pagamento']]);
    for (const proibido of ['senha', 'hash', 'token', 'sessao', SENHA]) expect(r.texto).not.toContain(proibido);
    await adm('GET', `/api/admin/passageiros/${anaId}`);
    const eventos = db.prepare("SELECT ator_usuario_id AS a, registro_id AS r, estado_anterior AS ant, estado_novo AS nov FROM auditoria WHERE acao = 'passageiro.consultado'").all();
    expect(eventos).toHaveLength(2);
    expect(eventos.map((e) => [e['a'], e['r'], e['ant'], e['nov']])).toEqual([
      [adminId, anaId, null, null],
      [adminId, anaId, null, null],
    ]);
    const dump = JSON.stringify(db.prepare("SELECT * FROM auditoria WHERE acao = 'passageiro.consultado'").all());
    for (const proibido of ['11144477735', 'ana.passageira', '98765', 'Ana Passageira']) expect(dump).not.toContain(proibido);
  });

  it('o administrador nao e passageiro (404) e passageiro inexistente tambem; nao ha auditoria nesses casos', async () => {
    expect((await adm('GET', `/api/admin/passageiros/${adminId}`)).json).toEqual({ error: 'nao_encontrada' });
    expect((await adm('GET', '/api/admin/passageiros/99999')).status).toBe(404);
    expect(contar('auditoria', "acao = 'passageiro.consultado'")).toBe(0);
  });
});

describe('pendencias administrativas (RF-026, RN-022; decisao 3)', () => {
  /** Cria um pagamento confirmado e sinalizado, como a confirmacao sem vaga da AGT-009 deixaria. */
  function sinalizar(reservaId: number, parcela = 'unica', valor = 15000): void {
    db.prepare("INSERT INTO pagamento (reserva_id, parcela, valor_centavos, situacao, confirmado_em, criado_em, atualizado_em, pendencia_administrativa) VALUES (?, ?, ?, 'confirmado', ?, ?, ?, 'confirmacao_sem_vaga')").run(
      reservaId,
      parcela,
      valor,
      relogio.toISOString(),
      relogio.toISOString(),
      relogio.toISOString(),
    );
  }

  it('lista o pagamento confirmado sem vaga, sem acao, e a reserva aparece com tem_pendencia', async () => {
    const id = publicar();
    const reservaId = await reservar(ana, id);
    sinalizar(reservaId);
    const r = await adm('GET', '/api/admin/pendencias');
    expect(r.status).toBe(200);
    expect(r.json).toMatchObject({ total: 1 });
    expect(lista(r, 'pendencias')[0]).toEqual({
      tipo: 'confirmado_sem_vaga',
      pagamento: { id: ANY_NUM, parcela: 'unica', situacao: 'confirmado', valor_centavos: 15000, confirmado_em: ANY_STR },
      reserva: { id: reservaId, situacao: 'aguardando_pagamento' },
      passageiro: { id: anaId, nome_completo: 'Ana Passageira Ficticia' },
      excursao: { id, nome: 'Excursao Ficticia Serra' },
      reembolso: null,
    });
    expect(lista(await adm('GET', '/api/admin/reservas'), 'reservas')[0]?.['tem_pendencia']).toBe(true);
    expect(((await adm('GET', `/api/admin/reservas/${reservaId}`)).json?.['reserva'] as Record<string, unknown>)['pendencias']).toEqual(['confirmado_sem_vaga']);
    expect(r.texto).not.toContain('ana.passageira');
  });

  it('distingue a segunda parcela confirmada depois do vencimento e filtra por tipo', async () => {
    const id = publicar();
    const a = await reservar(ana, id);
    const b = await reservar(beatriz, id, 'parcelada');
    sinalizar(a);
    db.prepare("INSERT INTO pagamento (reserva_id, parcela, valor_centavos, situacao, confirmado_em, criado_em, atualizado_em) VALUES (?, 'primeira', 7500, 'confirmado', ?, ?, ?)").run(b, relogio.toISOString(), relogio.toISOString(), relogio.toISOString());
    db.prepare("UPDATE reserva SET situacao = 'cancelada', motivo_cancelamento = 'inadimplencia' WHERE id = ?").run(b);
    sinalizar(b, 'segunda', 7500);
    const todas = lista(await adm('GET', '/api/admin/pendencias'), 'pendencias');
    expect(todas.map((p) => [(p['reserva'] as Record<string, unknown>)['id'], p['tipo']])).toEqual([
      [b, 'segunda_parcela_apos_vencimento'],
      [a, 'confirmado_sem_vaga'],
    ]);
    expect(lista(await adm('GET', '/api/admin/pendencias?tipo=segunda_parcela_apos_vencimento'), 'pendencias')).toHaveLength(1);
    expect(lista(await adm('GET', '/api/admin/pendencias?tipo=confirmado_sem_vaga'), 'pendencias').map((p) => (p['reserva'] as Record<string, unknown>)['id'])).toEqual([a]);
    expect((await adm('GET', '/api/admin/pendencias?tipo=outro')).json).toEqual({ error: 'validacao', fields: { tipo: 'invalido' } });
  });

  it('sem pendencias a lista vem vazia e nao ha rota de acao sobre elas', async () => {
    expect((await adm('GET', '/api/admin/pendencias')).json).toEqual({ pendencias: [], total: 0 });
    expect((await adm('POST', '/api/admin/pendencias/1', {})).status).toBe(404);
  });
});

describe('alteracao manual de situacao (RF-039, RN-035; decisao 2)', () => {
  const cancelar = (reservaId: number, extra: Record<string, unknown> = {}) => adm('POST', `/api/admin/reservas/${reservaId}/situacao`, { situacao: 'cancelada', justificativa: JUST, ...extra });
  const concluir = (reservaId: number) => adm('POST', `/api/admin/reservas/${reservaId}/situacao`, { situacao: 'concluida', justificativa: JUST });

  it('cancela a reserva aguardando pagamento sem pagamento: libera a retencao, nao mexe em vagas e audita o administrador', async () => {
    const id = publicar();
    const reservaId = await comCheckout(ana, id);
    expect(db.prepare("SELECT situacao FROM retencao_vaga WHERE reserva_id = ?").get(reservaId)?.['situacao']).toBe('ativa');
    const ocupadasAntes = ocupadas(id);
    const r = await cancelar(reservaId);
    expect(r.status).toBe(200);
    expect(reservaDe(r)).toMatchObject({ id: reservaId, situacao: 'cancelada', motivo_cancelamento: null });
    expect(situacaoNoBanco(reservaId)).toBe('cancelada');
    expect(db.prepare('SELECT situacao FROM retencao_vaga WHERE reserva_id = ?').get(reservaId)?.['situacao']).toBe('cancelada');
    expect(ocupadas(id)).toBe(ocupadasAntes);
    const ev = db.prepare("SELECT ator_usuario_id AS a, registro_id AS r, estado_anterior AS ant, estado_novo AS nov FROM auditoria WHERE acao = 'reserva.cancelamento_manual'").all();
    expect(ev).toHaveLength(1);
    expect(ev[0]?.['a']).toBe(adminId);
    expect(ev[0]?.['r']).toBe(reservaId);
    expect(JSON.parse(String(ev[0]?.['ant']))).toEqual({ situacao: 'aguardando_pagamento' });
    expect(JSON.parse(String(ev[0]?.['nov']))).toEqual({ situacao: 'cancelada', justificativa: JUST });
    expect(contar('auditoria', "acao = 'retencao.cancelada' AND ator_usuario_id = " + adminId)).toBe(1);
    const dump = JSON.stringify(db.prepare('SELECT * FROM auditoria').all());
    for (const proibido of ['11144477735', 'ana.passageira', '98765']) expect(dump).not.toContain(proibido);
  });

  it('o passageiro volta a poder reservar a mesma excursao e a vaga continua disponivel', async () => {
    const id = publicar();
    const reservaId = await comCheckout(ana, id);
    await cancelar(reservaId);
    expect(await reservar(ana, id)).toBeGreaterThan(reservaId);
  });

  it('cancela tambem a reserva sem checkout (sem retencao) e a que teve pagamento recusado', async () => {
    const id = publicar();
    const a = await reservar(ana, id);
    expect((await cancelar(a)).status).toBe(200);
    const b = await comCheckout(beatriz, id);
    await beatriz('POST', `/api/reservas/${b}/pagamento`);
    await beatriz('POST', `/api/reservas/${b}/pagamento/simulacao`, { resultado: 'recusado' });
    expect((await cancelar(b)).status).toBe(200);
    expect(contar('pagamento', "situacao = 'falhou'")).toBe(1);
  });

  it('a justificativa e obrigatoria e validada; campos fora do permitido e destinos invalidos sao recusados sem efeito', async () => {
    const id = publicar();
    const reservaId = await comCheckout(ana, id);
    const caminho = `/api/admin/reservas/${reservaId}/situacao`;
    expect((await adm('POST', caminho, { situacao: 'cancelada' })).json).toEqual({ error: 'validacao', fields: { justificativa: 'obrigatorio' } });
    expect((await adm('POST', caminho, { situacao: 'cancelada', justificativa: '   ' })).json).toEqual({ error: 'validacao', fields: { justificativa: 'obrigatorio' } });
    expect((await adm('POST', caminho, { situacao: 'cancelada', justificativa: 'x'.repeat(301) })).json).toEqual({ error: 'validacao', fields: { justificativa: 'invalido' } });
    expect((await adm('POST', caminho, { situacao: 'cancelada', justificativa: 42 })).status).toBe(400);
    expect((await adm('POST', caminho, { justificativa: JUST })).json).toEqual({ error: 'validacao', fields: { situacao: 'obrigatorio' } });
    expect((await adm('POST', caminho, { situacao: 'cancelada', justificativa: JUST, administrador_id: 9, usuario_id: 3 })).json).toEqual({
      error: 'validacao',
      fields: { administrador_id: 'campo_nao_permitido', usuario_id: 'campo_nao_permitido' },
    });
    expect((await adm('POST', caminho, 'texto')).status).toBe(400);
    for (const destino of ['pronto_para_embarque', 'aguardando_pagamento', 'estornada', 'x']) {
      const r = await adm('POST', caminho, { situacao: destino, justificativa: JUST });
      expect([r.status, r.json], destino).toEqual([409, { error: 'transicao_nao_autorizada' }]);
    }
    expect(situacaoNoBanco(reservaId)).toBe('aguardando_pagamento');
    expect(contar('auditoria', "acao LIKE 'reserva.%manual'")).toBe(0);
    expect((await cancelar(99999)).json).toEqual({ error: 'nao_encontrada' });
  });

  it('recusa cancelar com pagamento pendente ou confirmado (409 reserva_com_pagamento), sem efeito', async () => {
    const id = publicar();
    const pendente = await comCheckout(ana, id);
    await ana('POST', `/api/reservas/${pendente}/pagamento`);
    const paga = await ateProntaParaEmbarque(beatriz, id);
    for (const reservaId of [pendente]) {
      const r = await cancelar(reservaId);
      expect([r.status, r.json]).toEqual([409, { error: 'reserva_com_pagamento' }]);
    }
    expect(situacaoNoBanco(pendente)).toBe('aguardando_pagamento');
    expect(db.prepare('SELECT situacao FROM retencao_vaga WHERE reserva_id = ?').get(pendente)?.['situacao']).toBe('ativa');
    const r2 = await cancelar(paga);
    expect([r2.status, r2.json]).toEqual([409, { error: 'transicao_nao_autorizada' }]);
    expect(situacaoNoBanco(paga)).toBe('pronto_para_embarque');
    expect(ocupadas(id)).toBe(1);
    expect(contar('auditoria', "acao = 'reserva.cancelamento_manual'")).toBe(0);
  });

  it('primeira parcela confirmada tambem impede cancelar (a reserva parcelada ocupa vaga)', async () => {
    const id = publicar();
    const reservaId = await reservar(ana, id, 'parcelada');
    await ana('POST', `/api/reservas/${reservaId}/checkout`);
    await ana('POST', `/api/reservas/${reservaId}/pagamento`);
    await ana('POST', `/api/reservas/${reservaId}/pagamento/simulacao`, { resultado: 'aprovado' });
    expect((await cancelar(reservaId)).json).toEqual({ error: 'reserva_com_pagamento' });
    expect(ocupadas(id)).toBe(1);
  });

  it('cancelar e idempotente: repetir devolve a reserva, sem novo efeito nem nova auditoria', async () => {
    const id = publicar();
    const reservaId = await comCheckout(ana, id);
    expect((await cancelar(reservaId)).status).toBe(200);
    const antes = contar('auditoria');
    const r = await cancelar(reservaId);
    expect([r.status, reservaDe(r)['situacao']]).toEqual([200, 'cancelada']);
    expect(contar('auditoria')).toBe(antes);
  });

  it('marcar concluida: so depois do fim da excursao; antes responde 409 excursao_nao_terminou', async () => {
    const id = publicar();
    const reservaId = await ateProntaParaEmbarque(ana, id);
    const r = await concluir(reservaId);
    expect([r.status, r.json]).toEqual([409, { error: 'excursao_nao_terminou' }]);
    expect(situacaoNoBanco(reservaId)).toBe('pronto_para_embarque');
    irPara(DEPOIS_DO_FIM);
    const ok = await concluir(reservaId); // chamada direta, antes de qualquer leitura que efetive a conclusao automatica
    expect([ok.status, reservaDe(ok)['situacao']]).toEqual([200, 'concluida']);
    const ev = db.prepare("SELECT ator_usuario_id AS a, estado_anterior AS ant, estado_novo AS nov FROM auditoria WHERE acao = 'reserva.conclusao_manual'").all();
    expect(ev).toHaveLength(1);
    expect(ev[0]?.['a']).toBe(adminId);
    expect(JSON.parse(String(ev[0]?.['ant']))).toEqual({ situacao: 'pronto_para_embarque' });
    expect(JSON.parse(String(ev[0]?.['nov']))).toEqual({ situacao: 'concluida', justificativa: JUST });
    expect(ocupadas(id)).toBe(1);
    expect(contar('pagamento', "situacao = 'confirmado'")).toBe(1);
  });

  it('marcar concluida e idempotente, inclusive depois de a conclusao automatica ja ter ocorrido (ator nulo)', async () => {
    const id = publicar();
    const reservaId = await ateProntaParaEmbarque(ana, id);
    irPara(DEPOIS_DO_FIM);
    await adm('GET', '/api/admin/reservas'); // a leitura efetiva a conclusao automatica, com ator nulo
    expect(contar('auditoria', "acao = 'reserva.concluida' AND ator_usuario_id IS NULL")).toBe(1);
    const r = await concluir(reservaId);
    expect([r.status, reservaDe(r)['situacao']]).toEqual([200, 'concluida']);
    expect(contar('auditoria', "acao = 'reserva.conclusao_manual'")).toBe(0);
    expect(contar('auditoria', "acao = 'reserva.concluida'")).toBe(1);
  });

  it('marcar concluida so vale para reserva pronta para embarque (aguardando e cancelada: 409)', async () => {
    const id = publicar();
    const a = await reservar(ana, id);
    const b = await reservar(beatriz, id);
    await beatriz('POST', `/api/reservas/${b}/desistir`);
    irPara(DEPOIS_DO_FIM);
    for (const reservaId of [a, b]) {
      const r = await concluir(reservaId);
      expect([r.status, r.json]).toEqual([409, { error: 'transicao_nao_autorizada' }]);
    }
  });

  it('o detalhe informa quais alteracoes estao disponiveis e por que nao', async () => {
    const id = publicar();
    const reservaId = await comCheckout(ana, id);
    const permitidas = async () => ((await adm('GET', `/api/admin/reservas/${reservaId}`)).json?.['reserva'] as Record<string, unknown>)['alteracoes_permitidas'];
    expect(await permitidas()).toEqual([
      { para: 'cancelada', disponivel: true, motivo: null },
      { para: 'concluida', disponivel: false, motivo: 'transicao_nao_autorizada' },
    ]);
    await cancelar(reservaId);
    expect(await permitidas()).toEqual([
      { para: 'cancelada', disponivel: false, motivo: 'ja_cancelada' },
      { para: 'concluida', disponivel: false, motivo: 'transicao_nao_autorizada' },
    ]);
  });

  it('atomicidade: uma falha no meio do cancelamento desfaz tudo (situacao, retencao e auditoria)', async () => {
    const id = publicar();
    const reservaId = await comCheckout(ana, id);
    db.exec("CREATE TRIGGER tg_falha_injetada BEFORE INSERT ON auditoria WHEN NEW.acao = 'reserva.cancelamento_manual' BEGIN SELECT RAISE(ABORT, 'falha injetada'); END;");
    const auditoriaAntes = contar('auditoria');
    const r = await cancelar(reservaId);
    expect(r.status).toBe(500);
    expect(r.texto).not.toContain('injetada');
    expect(situacaoNoBanco(reservaId)).toBe('aguardando_pagamento');
    expect(db.prepare('SELECT situacao FROM retencao_vaga WHERE reserva_id = ?').get(reservaId)?.['situacao']).toBe('ativa');
    expect(contar('auditoria')).toBe(auditoriaAntes);
    db.exec('DROP TRIGGER tg_falha_injetada');
    expect((await cancelar(reservaId)).status).toBe(200);
  });

  it('pedidos simultaneos de cancelamento resultam em um unico efeito e uma unica auditoria', async () => {
    const id = publicar();
    const reservaId = await comCheckout(ana, id);
    const respostas = await Promise.all([cancelar(reservaId), cancelar(reservaId), cancelar(reservaId)]);
    expect(respostas.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(contar('auditoria', "acao = 'reserva.cancelamento_manual'")).toBe(1);
    expect(contar('auditoria', "acao = 'retencao.cancelada'")).toBe(1);
  });
});

describe('duas conexoes ao mesmo arquivo (concorrencia, RN-040)', () => {
  let dir: string;
  let a: DatabaseSync;
  let b: DatabaseSync;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'agt012-'));
    a = openDatabase(join(dir, 'db.sqlite'));
    runMigrations(a);
    b = openDatabase(join(dir, 'db.sqlite'));
    const agora = '2026-11-13T12:00:00.000Z';
    a.prepare("INSERT INTO usuario (nome_completo, cpf, email, data_nascimento, telefone, senha_hash, perfil, criado_em, atualizado_em) VALUES ('Admin Ficticio', '52998224725', 'a@exemplo.com', '1990-01-01', '1', 'x', 'administrador', ?, ?)").run(agora, agora);
    a.prepare("INSERT INTO usuario (nome_completo, cpf, email, data_nascimento, telefone, senha_hash, perfil, criado_em, atualizado_em) VALUES ('Ana Ficticia', '11144477735', 'p@exemplo.com', '1990-01-01', '11999990000', 'x', 'passageiro', ?, ?)").run(agora, agora);
    a.prepare(
      "INSERT INTO excursao (nome, descricao, local, ponto_embarque, data_inicial, data_final, partida_utc, capacidade, preco_centavos, situacao, criado_em, atualizado_em) VALUES ('E', 'd', 'l', 'p', '2026-12-10', '2026-12-12', '2026-12-10T10:00:00.000Z', 5, 10000, 'publicada', ?, ?)",
    ).run(agora, agora);
    a.prepare("INSERT INTO reserva (usuario_id, excursao_id, modalidade, situacao, criado_em, atualizado_em) VALUES (2, 1, 'integral', 'aguardando_pagamento', ?, ?)").run(agora, agora);
  });

  afterEach(() => {
    a.close();
    b.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('o mesmo cancelamento pedido por duas conexoes tem um unico efeito e uma unica auditoria', () => {
    const relogioFixo = () => new Date('2026-11-13T12:00:00.000Z');
    const sa = new AdminService(a, relogioFixo);
    const sb = new AdminService(b, relogioFixo);
    sa.alterarSituacao(1, 1, { situacao: 'cancelada', justificativa: JUST });
    sb.alterarSituacao(1, 1, { situacao: 'cancelada', justificativa: JUST });
    expect(a.prepare("SELECT COUNT(*) AS n FROM auditoria WHERE acao = 'reserva.cancelamento_manual'").get()?.['n']).toBe(1);
    expect(a.prepare('SELECT situacao FROM reserva WHERE id = 1').get()?.['situacao']).toBe('cancelada');
  });

  it('um pagamento criado por outra conexao antes do cancelamento o impede (a condicao e reavaliada na gravacao)', () => {
    const relogioFixo = () => new Date('2026-11-13T12:00:00.000Z');
    const sb = new AdminService(b, relogioFixo);
    a.prepare("INSERT INTO pagamento (reserva_id, parcela, valor_centavos, situacao, criado_em, atualizado_em) VALUES (1, 'unica', 10000, 'pendente', ?, ?)").run('2026-11-13T12:00:00.000Z', '2026-11-13T12:00:00.000Z');
    expect(() => sb.alterarSituacao(1, 1, { situacao: 'cancelada', justificativa: JUST })).toThrowError(expect.objectContaining({ code: 'reserva_com_pagamento' }) as Error);
    expect(a.prepare('SELECT situacao FROM reserva WHERE id = 1').get()?.['situacao']).toBe('aguardando_pagamento');
    expect(a.prepare("SELECT COUNT(*) AS n FROM auditoria WHERE acao = 'reserva.cancelamento_manual'").get()?.['n']).toBe(0);
  });
});
