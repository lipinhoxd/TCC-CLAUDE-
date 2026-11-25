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
import { provedorSimulado } from '../server/pagamentos/provedor.ts';
import { PagamentoService } from '../server/pagamentos/service.ts';
import { ReservaService } from '../server/reservas/service.ts';

/** Area do passageiro (AGT-011): RF-029, RF-030, RF-031, RN-023, RN-024, RN-025, RN-026. */

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
/** A excursao termina em 12/12/2026; a conclusao vale a partir de 00:00 de Brasilia de 13/12 = 03:00 UTC. */
const ULTIMO_INSTANTE_ANTES = new Date('2026-12-13T02:59:59.000Z');
const PRIMEIRO_INSTANTE_DEPOIS = new Date('2026-12-13T03:00:00.000Z');

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
const ana = (m: string, c: string, corpo?: unknown) => chamar(m, c, corpo, anaCookie);
const beatriz = (m: string, c: string, corpo?: unknown) => chamar(m, c, corpo, beatrizCookie);
type Quem = typeof ana;
interface Lista {
  em_andamento: Array<Record<string, unknown>>;
  historico: Array<Record<string, unknown>>;
}
const listaDe = (res: { json: Record<string, unknown> | null }) => res.json as unknown as Lista;
const reservaDe = (res: { json: Record<string, unknown> | null }) => res.json?.['reserva'] as Record<string, unknown>;
const reservar = async (quem: Quem, excursaoId: number, modalidade = 'integral'): Promise<number> => {
  const r = await quem('POST', '/api/reservas', { excursao_id: excursaoId, modalidade });
  expect(r.status).toBe(201);
  return Number(reservaDe(r)['id']);
};
/** Reserva integral, checkout, pagamento iniciado e aprovado: Pronto para embarque. */
const ateProntaParaEmbarque = async (quem: Quem, excursaoId: number): Promise<number> => {
  const id = await reservar(quem, excursaoId);
  expect((await quem('POST', `/api/reservas/${id}/checkout`)).status).toBe(200);
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

beforeEach(async () => {
  db = openDatabase(MEMORY_DATABASE);
  runMigrations(db);
  relogio = new Date('2026-11-13T12:00:00.000Z');
  // A sessao usa um relogio fixo: os testes avancam o relogio dos servicos por semanas e nao querem expirar o login.
  const auth = new AuthService({ db, config: CONFIG, outbox: () => undefined, now: () => new Date('2026-11-13T12:00:00.000Z') });
  adminId = (await auth.createAdministrator({ ...PESSOA, cpf: '529.982.247-25', email: 'admin.ficticio@exemplo.com' })).id;
  await auth.register({ ...PESSOA, cpf: '111.444.777-35', email: 'ana.passageira@exemplo.com' });
  await auth.register({ ...PESSOA, nome_completo: 'Beatriz Souza Ficticia', cpf: '123.456.789-09', email: 'beatriz.passageira@exemplo.com' });
  excursoes = new ExcursaoService(db, () => relogio);
  const reservas = new ReservaService(db, () => relogio, QUINZE_MIN, provedorSimulado);
  server = createApp({ auth: { service: auth, config: CONFIG }, excursoes, reservas, pagamentos: new PagamentoService(db, reservas, provedorSimulado, () => relogio) });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  anaCookie = await entrar('ana.passageira@exemplo.com');
  beatrizCookie = await entrar('beatriz.passageira@exemplo.com');
  adminCookie = await entrar('admin.ficticio@exemplo.com');
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  db.close();
});

describe('autorizacao e isolamento (RN-044, RNF-004)', () => {
  it('visitante recebe 401 e administrador 403 na lista e no detalhe', async () => {
    expect((await chamar('GET', '/api/reservas')).status).toBe(401);
    expect((await chamar('GET', '/api/reservas/1')).status).toBe(401);
    expect((await chamar('GET', '/api/reservas', undefined, adminCookie)).status).toBe(403);
    expect((await chamar('GET', '/api/reservas/1', undefined, adminCookie)).status).toBe(403);
  });

  it('a lista vazia devolve os dois blocos vazios', async () => {
    const r = await ana('GET', '/api/reservas');
    expect(r.status).toBe(200);
    expect(r.json).toEqual({ em_andamento: [], historico: [] });
  });

  it('cada passageiro ve so as proprias reservas; a alheia responde 404 igual a inexistente', async () => {
    const id = publicar();
    const reservaAna = await reservar(ana, id);
    expect(listaDe(await ana('GET', '/api/reservas')).em_andamento.map((r) => r['id'])).toEqual([reservaAna]);
    expect(await beatriz('GET', '/api/reservas')).toMatchObject({ status: 200, json: { em_andamento: [], historico: [] } });
    const alheia = await beatriz('GET', `/api/reservas/${reservaAna}`);
    const inexistente = await beatriz('GET', '/api/reservas/99999');
    expect([alheia.status, alheia.json]).toEqual([inexistente.status, inexistente.json]);
    expect(alheia.status).toBe(404);
    expect((await ana('GET', `/api/reservas/${reservaAna}`)).status).toBe(200);
  });

  it('o passageiro nao vem da URL nem do corpo: parametros extras sao ignorados', async () => {
    const id = publicar();
    await reservar(ana, id);
    const r = await beatriz('GET', '/api/reservas?usuario_id=1&passageiro_id=1');
    expect(listaDe(r).em_andamento).toEqual([]);
  });

  it('metodo errado na lista responde 405 com Allow', async () => {
    const r = await ana('PUT', '/api/reservas', {});
    expect(r.status).toBe(405);
    expect(r.headers.get('allow')).toBe('GET, POST');
  });
});

describe('conteudo da lista e do detalhe (RF-029, RF-030)', () => {
  it('traz a excursao com local e ponto de embarque, modalidade, situacao, valores e parcelas', async () => {
    const id = publicar();
    const reservaId = await reservar(ana, id, 'parcelada');
    const item = listaDe(await ana('GET', '/api/reservas')).em_andamento[0] as Record<string, unknown>;
    expect(item).toMatchObject({
      id: reservaId,
      situacao: 'aguardando_pagamento',
      modalidade: 'parcelada',
      motivo_cancelamento: null,
      pode_desistir: true,
      excursao: { id, nome: 'Excursao Ficticia Serra', local: 'Serra Ficticia', ponto_embarque: 'Praca Ficticia', data_inicial: '2026-12-10', data_final: '2026-12-12' },
    });
    expect((item['valores'] as { total_centavos: number; parcelas: unknown[] }).total_centavos).toBe(15000);
    expect((item['valores'] as { parcelas: unknown[] }).parcelas).toHaveLength(2);
    const detalhe = reservaDe(await ana('GET', `/api/reservas/${reservaId}`));
    expect(detalhe).toEqual(item);
  });

  it('as respostas nao contem dados de outras pessoas nem campos internos', async () => {
    const id = publicar();
    await reservar(ana, id);
    await reservar(beatriz, id);
    const texto = (await ana('GET', '/api/reservas')).texto;
    for (const proibido of ['beatriz', 'Beatriz', '12345678909', '11144477735', 'usuario_id', 'vagas_ocupadas', 'capacidade', 'pendencia_administrativa', 'senha', 'hash', SENHA]) {
      expect(texto).not.toContain(proibido);
    }
    expect(texto).not.toContain('ana.passageira');
  });

  it('a reserva paga e confirmada aparece em andamento como Pronto para embarque, com a parcela paga', async () => {
    const id = publicar();
    const reservaId = await ateProntaParaEmbarque(ana, id);
    const item = listaDe(await ana('GET', '/api/reservas')).em_andamento[0] as { id: number; situacao: string; valores: { parcelas: Array<{ situacao_pagamento: string }> } };
    expect([item.id, item.situacao, item.valores.parcelas[0]?.situacao_pagamento]).toEqual([reservaId, 'pronto_para_embarque', 'confirmado']);
  });
});

describe('ordenacao e composicao (decisao 2)', () => {
  it('em andamento: da excursao mais proxima para a mais distante; empate pelo identificador', async () => {
    const longe = publicar({ nome: 'Longe', data_inicial: '2026-12-20', data_final: '2026-12-22', partida_utc: '2026-12-20T10:00:00.000Z', prazo_segunda_parcela: '2026-12-15' });
    const perto = publicar({ nome: 'Perto', data_inicial: '2026-12-08', data_final: '2026-12-09', partida_utc: '2026-12-08T10:00:00.000Z', prazo_segunda_parcela: '2026-12-03' });
    const meio = publicar({ nome: 'Meio' });
    const rLonge = await reservar(ana, longe);
    const rPerto = await reservar(ana, perto);
    const rMeio = await reservar(ana, meio);
    expect(listaDe(await ana('GET', '/api/reservas')).em_andamento.map((r) => r['id'])).toEqual([rPerto, rMeio, rLonge]);
  });

  it('desistir manda a reserva para o historico como cancelada, e uma nova reserva da mesma excursao fica em andamento', async () => {
    const id = publicar();
    const primeira = await reservar(ana, id);
    expect((await ana('POST', `/api/reservas/${primeira}/desistir`)).status).toBe(200);
    const segunda = await reservar(ana, id);
    const lista = listaDe(await ana('GET', '/api/reservas'));
    expect(lista.em_andamento.map((r) => r['id'])).toEqual([segunda]);
    expect(lista.historico.map((r) => [r['id'], r['situacao'], r['motivo_cancelamento']])).toEqual([[primeira, 'cancelada', null]]);
  });

  it('cancelada por inadimplencia vai ao historico com o motivo e a primeira parcela segue confirmada', async () => {
    const id = publicar();
    const reservaId = await reservar(ana, id, 'parcelada');
    await ana('POST', `/api/reservas/${reservaId}/checkout`);
    await ana('POST', `/api/reservas/${reservaId}/pagamento`);
    await ana('POST', `/api/reservas/${reservaId}/pagamento/simulacao`, { resultado: 'aprovado' });
    irPara(new Date('2026-12-06T03:00:00.000Z')); // depois do prazo da segunda parcela
    const lista = listaDe(await ana('GET', '/api/reservas'));
    expect(lista.em_andamento).toEqual([]);
    expect(lista.historico.map((r) => [r['id'], r['situacao'], r['motivo_cancelamento']])).toEqual([[reservaId, 'cancelada', 'inadimplencia']]);
    expect(contar('pagamento', "reserva_id = " + reservaId + " AND situacao = 'confirmado'")).toBe(1);
  });

  it('historico: da excursao mais recente para a mais antiga', async () => {
    const antiga = publicar({ nome: 'Antiga', data_inicial: '2026-12-08', data_final: '2026-12-09', partida_utc: '2026-12-08T10:00:00.000Z', prazo_segunda_parcela: '2026-12-03' });
    const recente = publicar({ nome: 'Recente', data_inicial: '2026-12-20', data_final: '2026-12-22', partida_utc: '2026-12-20T10:00:00.000Z', prazo_segunda_parcela: '2026-12-15' });
    const rAntiga = await reservar(ana, antiga);
    const rRecente = await reservar(ana, recente);
    await ana('POST', `/api/reservas/${rAntiga}/desistir`);
    await ana('POST', `/api/reservas/${rRecente}/desistir`);
    expect(listaDe(await ana('GET', '/api/reservas')).historico.map((r) => r['id'])).toEqual([rRecente, rAntiga]);
  });
});

describe('conclusao automatica (RN-025, RN-026, decisao 1)', () => {
  it('antes de 00:00 de Brasilia do dia seguinte a data final a reserva continua Pronta para embarque', async () => {
    const id = publicar();
    const reservaId = await ateProntaParaEmbarque(ana, id);
    irPara(ULTIMO_INSTANTE_ANTES);
    const lista = listaDe(await ana('GET', '/api/reservas'));
    expect(lista.em_andamento.map((r) => [r['id'], r['situacao']])).toEqual([[reservaId, 'pronto_para_embarque']]);
    expect(lista.historico).toEqual([]);
    expect(situacaoNoBanco(reservaId)).toBe('pronto_para_embarque');
    expect(contar('auditoria', "acao = 'reserva.concluida'")).toBe(0);
  });

  it('a partir desse instante a lista a grava como Concluida, com auditoria do sistema, e ela vai ao historico', async () => {
    const id = publicar();
    const reservaId = await ateProntaParaEmbarque(ana, id);
    irPara(PRIMEIRO_INSTANTE_DEPOIS);
    const lista = listaDe(await ana('GET', '/api/reservas'));
    expect(lista.em_andamento).toEqual([]);
    expect(lista.historico.map((r) => [r['id'], r['situacao'], r['pode_desistir']])).toEqual([[reservaId, 'concluida', false]]);
    expect(situacaoNoBanco(reservaId)).toBe('concluida');
    const audit = db.prepare("SELECT ator_usuario_id AS a, estado_anterior AS ant, estado_novo AS nov FROM auditoria WHERE acao = 'reserva.concluida'").all();
    expect(audit).toHaveLength(1);
    expect(audit[0]?.['a']).toBeNull();
    expect(JSON.parse(String(audit[0]?.['ant']))).toEqual({ situacao: 'pronto_para_embarque' });
    expect(JSON.parse(String(audit[0]?.['nov']))).toEqual({ situacao: 'concluida', excursao_id: id });
  });

  it('o detalhe tambem efetiva a conclusao, e repetir a leitura nao grava nada de novo (idempotente)', async () => {
    const id = publicar();
    const reservaId = await ateProntaParaEmbarque(ana, id);
    irPara(PRIMEIRO_INSTANTE_DEPOIS);
    expect(reservaDe(await ana('GET', `/api/reservas/${reservaId}`))['situacao']).toBe('concluida');
    expect(situacaoNoBanco(reservaId)).toBe('concluida');
    const antes = db.prepare('SELECT atualizado_em AS a FROM reserva WHERE id = ?').get(reservaId)?.['a'];
    irPara(new Date(PRIMEIRO_INSTANTE_DEPOIS.getTime() + 3_600_000));
    await ana('GET', '/api/reservas');
    await ana('GET', `/api/reservas/${reservaId}`);
    expect(contar('auditoria', "acao = 'reserva.concluida'")).toBe(1);
    expect(db.prepare('SELECT atualizado_em AS a FROM reserva WHERE id = ?').get(reservaId)?.['a']).toBe(antes);
  });

  it('nao altera vagas nem pagamentos: a vaga da reserva concluida continua ocupada', async () => {
    const id = publicar();
    await ateProntaParaEmbarque(ana, id);
    const pagamentosAntes = JSON.stringify(db.prepare('SELECT * FROM pagamento ORDER BY id').all());
    expect(ocupadas(id)).toBe(1);
    irPara(PRIMEIRO_INSTANTE_DEPOIS);
    await ana('GET', '/api/reservas');
    expect(ocupadas(id)).toBe(1);
    expect(JSON.stringify(db.prepare('SELECT * FROM pagamento ORDER BY id').all())).toBe(pagamentosAntes);
  });

  it('a reserva concluida permanece no historico e nao some com o passar do tempo (RN-026)', async () => {
    const id = publicar();
    const reservaId = await ateProntaParaEmbarque(ana, id);
    irPara(PRIMEIRO_INSTANTE_DEPOIS);
    await ana('GET', '/api/reservas');
    irPara(new Date('2027-06-01T12:00:00.000Z'));
    const lista = listaDe(await ana('GET', '/api/reservas'));
    expect(lista.historico.map((r) => [r['id'], r['situacao']])).toEqual([[reservaId, 'concluida']]);
  });

  it('so conclui as reservas do passageiro que consulta: a de outra pessoa fica para a consulta dela', async () => {
    const id = publicar();
    const deAna = await ateProntaParaEmbarque(ana, id);
    const deBeatriz = await ateProntaParaEmbarque(beatriz, id);
    irPara(PRIMEIRO_INSTANTE_DEPOIS);
    await ana('GET', '/api/reservas');
    expect(situacaoNoBanco(deAna)).toBe('concluida');
    expect(situacaoNoBanco(deBeatriz)).toBe('pronto_para_embarque');
    expect(listaDe(await beatriz('GET', '/api/reservas')).historico.map((r) => r['id'])).toEqual([deBeatriz]);
    expect(situacaoNoBanco(deBeatriz)).toBe('concluida');
  });

  it('reserva que ainda aguarda pagamento depois do fim da excursao nao e elegivel e continua em andamento', async () => {
    const id = publicar();
    const reservaId = await reservar(ana, id);
    irPara(PRIMEIRO_INSTANTE_DEPOIS);
    const lista = listaDe(await ana('GET', '/api/reservas'));
    expect(lista.em_andamento.map((r) => [r['id'], r['situacao']])).toEqual([[reservaId, 'aguardando_pagamento']]);
    expect(situacaoNoBanco(reservaId)).toBe('aguardando_pagamento');
    expect(contar('auditoria', "acao = 'reserva.concluida'")).toBe(0);
  });

  it('a reserva cancelada nunca vira concluida', async () => {
    const id = publicar();
    const reservaId = await reservar(ana, id);
    await ana('POST', `/api/reservas/${reservaId}/desistir`);
    irPara(PRIMEIRO_INSTANTE_DEPOIS);
    const lista = listaDe(await ana('GET', '/api/reservas'));
    expect(lista.historico.map((r) => r['situacao'])).toEqual(['cancelada']);
    expect(contar('auditoria', "acao = 'reserva.concluida'")).toBe(0);
  });

  it('a auditoria da conclusao nao tem dados pessoais', async () => {
    const id = publicar();
    await ateProntaParaEmbarque(ana, id);
    irPara(PRIMEIRO_INSTANTE_DEPOIS);
    await ana('GET', '/api/reservas');
    const dump = JSON.stringify(db.prepare("SELECT * FROM auditoria WHERE acao = 'reserva.concluida'").all());
    for (const proibido of ['ana.passageira', '11144477735', 'Maria', SENHA]) expect(dump).not.toContain(proibido);
  });
});
