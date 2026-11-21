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
import { provedorSimulado } from '../server/pagamentos/provedor.ts';
import { ReservaService } from '../server/reservas/service.ts';

/** Pagamento parcelado (AGT-010): RF-024, RF-027, RF-028, RN-012, RN-013, RN-017 a RN-020, RN-024, RN-032. */

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
  preco_centavos: 15001,
  parcelamento_habilitado: true,
  prazo_segunda_parcela: '2026-12-05',
};
const QUINZE_MIN = 15 * 60_000;
/** Fim do prazo da segunda parcela: 23:59:59 de Brasilia de 05/12/2026 = 06/12/2026 02:59:59 UTC. */
const PRAZO = new Date('2026-12-06T02:59:59.000Z');
const ANTES_DO_PRAZO = new Date('2026-12-04T15:00:00.000Z');
const DEPOIS_DO_PRAZO = new Date('2026-12-06T03:00:00.000Z');

let db: DatabaseSync;
let server: Server;
let baseUrl: string;
let relogio: Date;
let excursoes: ExcursaoService;
let adminId: number;
let anaCookie: string;
let beatrizCookie: string;

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
type Quem = typeof ana;
const reservaDe = (res: { json: Record<string, unknown> | null }) => res.json?.['reserva'] as Record<string, unknown>;
const pagamentoDe = (res: { json: Record<string, unknown> | null }) => reservaDe(res)['pagamento'] as Record<string, unknown> | null;
const parcelasDe = (res: { json: Record<string, unknown> | null }) => (reservaDe(res)['valores'] as { parcelas: Array<Record<string, unknown>> }).parcelas;
const reservarParcelada = async (quem: Quem, excursaoId: number): Promise<number> => {
  const r = await quem('POST', '/api/reservas', { excursao_id: excursaoId, modalidade: 'parcelada' });
  expect(r.status).toBe(201);
  return Number(reservaDe(r)['id']);
};
const checkout = (quem: Quem, reservaId: number) => quem('POST', `/api/reservas/${reservaId}/checkout`);
const pagar = (quem: Quem, reservaId: number) => quem('POST', `/api/reservas/${reservaId}/pagamento`);
const simular = (quem: Quem, reservaId: number, resultado: unknown) => quem('POST', `/api/reservas/${reservaId}/pagamento/simulacao`, { resultado });
const ver = (quem: Quem, reservaId: number) => quem('GET', `/api/reservas/${reservaId}`);
const contar = (tabela: string, onde = '1 = 1'): number => Number(db.prepare(`SELECT COUNT(*) AS n FROM ${tabela} WHERE ${onde}`).get()?.['n']);
const ocupadas = (id: number): number => Number(db.prepare('SELECT vagas_ocupadas AS v FROM excursao WHERE id = ?').get(id)?.['v']);
const livres = async (id: number): Promise<unknown> => ((await chamar('GET', `/api/excursoes/${id}`)).json?.['excursao'] as Record<string, unknown>)['vagas_disponiveis'];
const irPara = (instante: Date) => {
  relogio = instante;
};
/** Reserva parcelada, checkout, primeira parcela paga e aprovada: a vaga passa a ser do passageiro. */
const ateAPrimeira = async (quem: Quem, excursaoId: number): Promise<number> => {
  const reservaId = await reservarParcelada(quem, excursaoId);
  expect((await checkout(quem, reservaId)).status).toBe(200);
  expect((await pagar(quem, reservaId)).status).toBe(200);
  expect((await simular(quem, reservaId, 'aprovado')).status).toBe(200);
  return reservaId;
};

beforeEach(async () => {
  db = openDatabase(MEMORY_DATABASE);
  runMigrations(db);
  relogio = new Date('2026-11-13T12:00:00.000Z');
  // A sessao usa um relogio fixo: os testes avancam o relogio dos servicos por dias e nao querem expirar o login.
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
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  db.close();
});

describe('primeira parcela (RF-024, RN-017)', () => {
  it('o servidor decide a parcela e o valor: metade para baixo, sem ocupar vaga ainda', async () => {
    const id = publicar();
    const reservaId = await reservarParcelada(ana, id);
    await checkout(ana, reservaId);
    const res = await ana('POST', `/api/reservas/${reservaId}/pagamento`, { parcela: 'segunda', valor_centavos: 1 });
    expect(res.status).toBe(200);
    expect(pagamentoDe(res)).toEqual({ parcela: 'primeira', situacao: 'pendente', valor_centavos: 7500, confirmado_em: null, requer_tratamento_administrativo: false });
    expect(reservaDe(res)).toMatchObject({ proxima_parcela: 'primeira', situacao: 'aguardando_pagamento', pode_desistir: false });
    expect(ocupadas(id)).toBe(0);
    expect(await livres(id)).toBe(19); // a retencao continua segurando a vaga
  });

  it('exige retencao ativa, como o pagamento integral', async () => {
    const reservaId = await reservarParcelada(ana, publicar());
    expect((await pagar(ana, reservaId)).json).toEqual({ error: 'retencao_inativa' });
    await checkout(ana, reservaId);
    irPara(new Date(relogio.getTime() + QUINZE_MIN + 1000));
    expect((await pagar(ana, reservaId)).json).toEqual({ error: 'retencao_inativa' });
    expect(contar('pagamento')).toBe(0);
  });

  it('repetir com a primeira pendente devolve a mesma e nunca pula para a segunda (a ordem e do servidor)', async () => {
    const reservaId = await reservarParcelada(ana, publicar());
    await checkout(ana, reservaId);
    const a = await pagar(ana, reservaId);
    const b = await pagar(ana, reservaId);
    expect(pagamentoDe(b)).toEqual(pagamentoDe(a));
    expect(contar('pagamento')).toBe(1);
    expect(db.prepare('SELECT parcela FROM pagamento').get()?.['parcela']).toBe('primeira');
  });

  it('aprovada: ocupa exatamente uma vaga, converte a retencao e mantem a reserva aguardando a segunda parcela', async () => {
    const id = publicar();
    const reservaId = await ateAPrimeira(ana, id);
    const res = await ver(ana, reservaId);
    expect(reservaDe(res)).toMatchObject({ situacao: 'aguardando_pagamento', proxima_parcela: 'segunda', pode_desistir: false });
    expect(parcelasDe(res).map((p) => p['situacao_pagamento'])).toEqual(['confirmado', null]);
    expect(reservaDe(res)['retencao']).toMatchObject({ situacao: 'confirmada' });
    expect(ocupadas(id)).toBe(1);
    expect(await livres(id)).toBe(19);
  });

  it('a confirmacao e idempotente, inclusive simultanea: uma unica vaga ocupada', async () => {
    const id = publicar();
    const reservaId = await reservarParcelada(ana, id);
    await checkout(ana, reservaId);
    await pagar(ana, reservaId);
    const [a, b] = await Promise.all([simular(ana, reservaId, 'aprovado'), simular(ana, reservaId, 'aprovado')]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(ocupadas(id)).toBe(1);
    expect(contar('auditoria', "acao = 'pagamento.confirmado'")).toBe(1);
  });

  it('recusada: vira falhou e reaproveita a mesma linha na nova tentativa; a desistencia fica liberada so enquanto nada esta pendente ou confirmado', async () => {
    const reservaId = await reservarParcelada(ana, publicar());
    await checkout(ana, reservaId);
    await pagar(ana, reservaId);
    expect((await ana('POST', `/api/reservas/${reservaId}/desistir`)).json).toEqual({ error: 'reserva_com_pagamento' });
    await simular(ana, reservaId, 'recusado');
    expect(pagamentoDe(await ver(ana, reservaId))).toMatchObject({ parcela: 'primeira', situacao: 'falhou' });
    const linha = Number(db.prepare('SELECT id FROM pagamento').get()?.['id']);
    await pagar(ana, reservaId);
    expect(contar('pagamento')).toBe(1);
    expect(Number(db.prepare('SELECT id FROM pagamento').get()?.['id'])).toBe(linha);
  });

  it('com a primeira confirmada a desistencia continua recusada (o reembolso e da AGT-013)', async () => {
    const reservaId = await ateAPrimeira(ana, publicar());
    expect((await ana('POST', `/api/reservas/${reservaId}/desistir`)).json).toEqual({ error: 'reserva_com_pagamento' });
    expect(reservaDe(await ver(ana, reservaId))['situacao']).toBe('aguardando_pagamento');
  });

  it('a reserva de outra pessoa responde 404 igual a inexistente, tambem no parcelamento', async () => {
    const reservaId = await ateAPrimeira(ana, publicar());
    const alheia = await pagar(beatriz, reservaId);
    const inexistente = await pagar(beatriz, 9999);
    expect([alheia.status, inexistente.status]).toEqual([404, 404]);
    expect(alheia.json).toEqual(inexistente.json);
    expect(contar('pagamento')).toBe(1);
  });
});

describe('segunda parcela e quitacao (RF-027, RN-018, RN-024)', () => {
  it('o valor e o restante, a soma e igual ao total e nao exige retencao', async () => {
    const id = publicar({ preco_centavos: 99999 });
    const reservaId = await ateAPrimeira(ana, id);
    const res = await pagar(ana, reservaId);
    expect(res.status).toBe(200);
    expect(pagamentoDe(res)).toMatchObject({ parcela: 'segunda', situacao: 'pendente', valor_centavos: 50000 });
    const soma = db.prepare('SELECT SUM(valor_centavos) AS s FROM pagamento').get()?.['s'];
    expect(soma).toBe(99999);
    expect(db.prepare('SELECT parcela, valor_centavos AS v FROM pagamento ORDER BY id').all()).toEqual([
      { parcela: 'primeira', v: 49999 },
      { parcela: 'segunda', v: 50000 },
    ]);
    expect(contar('retencao_vaga', "situacao = 'ativa'")).toBe(0); // a vaga ja esta ocupada; a segunda parcela nao pede retencao
  });

  it('aprovada: conclui a quitacao, deixa a reserva pronta para embarque e nao ocupa outra vaga', async () => {
    const id = publicar();
    const reservaId = await ateAPrimeira(ana, id);
    await pagar(ana, reservaId);
    const res = await simular(ana, reservaId, 'aprovado');
    expect(reservaDe(res)).toMatchObject({ situacao: 'pronto_para_embarque', proxima_parcela: null, pode_desistir: false });
    expect(parcelasDe(res).map((p) => p['situacao_pagamento'])).toEqual(['confirmado', 'confirmado']);
    expect(ocupadas(id)).toBe(1);
    expect(contar('auditoria', "acao = 'reserva.pronta_para_embarque'")).toBe(1);
    const quitacao = db.prepare("SELECT estado_novo AS e FROM auditoria WHERE acao = 'pagamento.confirmado' ORDER BY id DESC").get();
    expect(JSON.parse(String(quitacao?.['e']))).toMatchObject({ parcela: 'segunda', quitacao: true });
    expect((await pagar(ana, reservaId)).json).toEqual({ error: 'pagamento_ja_confirmado' });
  });

  it('a quitacao e idempotente e simultanea: uma so vez', async () => {
    const reservaId = await ateAPrimeira(ana, publicar());
    await pagar(ana, reservaId);
    const [a, b] = await Promise.all([simular(ana, reservaId, 'aprovado'), simular(ana, reservaId, 'aprovado')]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(contar('auditoria', "acao = 'reserva.pronta_para_embarque'")).toBe(1);
    expect(contar('pagamento', "situacao = 'confirmado'")).toBe(2);
  });

  it('recusada: tenta de novo na mesma linha ate o prazo e depois quita', async () => {
    const reservaId = await ateAPrimeira(ana, publicar());
    await pagar(ana, reservaId);
    await simular(ana, reservaId, 'recusado');
    expect(pagamentoDe(await ver(ana, reservaId))).toMatchObject({ parcela: 'segunda', situacao: 'falhou' });
    const linhas = contar('pagamento');
    await pagar(ana, reservaId);
    expect(contar('pagamento')).toBe(linhas);
    expect(reservaDe(await simular(ana, reservaId, 'aprovado'))['situacao']).toBe('pronto_para_embarque');
  });

  it('pode ser paga ate o fim do prazo e a excursao encerrada para novas reservas nao impede (cancelada, sim)', async () => {
    const id = publicar();
    const reservaId = await ateAPrimeira(ana, id);
    irPara(new Date(PRAZO.getTime() - 1000));
    db.prepare("UPDATE excursao SET situacao = 'encerrada' WHERE id = ?").run(id);
    expect((await pagar(ana, reservaId)).status).toBe(200);
    db.prepare("UPDATE excursao SET situacao = 'cancelada' WHERE id = ?").run(id);
    await simular(ana, reservaId, 'recusado');
    expect((await pagar(ana, reservaId)).json).toEqual({ error: 'reservas_encerradas' });
  });
});

describe('vencimento da segunda parcela (RN-019, RN-020, RN-032, RF-028)', () => {
  it('depois do prazo a vaga e liberada uma unica vez e a reserva fica cancelada por inadimplencia, com a primeira parcela confirmada', async () => {
    const id = publicar();
    const reservaId = await ateAPrimeira(ana, id);
    expect(ocupadas(id)).toBe(1);
    irPara(DEPOIS_DO_PRAZO);
    const recusado = await pagar(ana, reservaId);
    expect(recusado.status).toBe(409);
    expect(recusado.json).toEqual({ error: 'prazo_da_segunda_parcela_vencido' });
    expect(ocupadas(id)).toBe(0);
    expect(db.prepare('SELECT situacao, motivo_cancelamento AS m FROM reserva WHERE id = ?').get(reservaId)).toEqual({ situacao: 'cancelada', m: 'inadimplencia' });
    expect(db.prepare("SELECT situacao FROM pagamento WHERE parcela = 'primeira'").get()?.['situacao']).toBe('confirmado');
    expect(contar('pagamento', "parcela = 'segunda'")).toBe(0);
    const evento = db.prepare("SELECT ator_usuario_id AS ator, estado_novo AS e FROM auditoria WHERE acao = 'reserva.vencimento_segunda_parcela'").get();
    expect(evento?.['ator']).toBeNull();
    expect(JSON.parse(String(evento?.['e']))).toMatchObject({ situacao: 'cancelada', motivo_cancelamento: 'inadimplencia', vaga_liberada: true });
    // repetir qualquer gravacao nao libera de novo nem deixa a ocupacao negativa
    await pagar(ana, reservaId);
    await checkout(ana, reservaId);
    expect(ocupadas(id)).toBe(0);
    expect(contar('auditoria', "acao = 'reserva.vencimento_segunda_parcela'")).toBe(1);
  });

  it('a leitura ja mostra o vencimento sem gravar, e a disponibilidade publica ja conta a vaga como livre', async () => {
    const id = publicar({ capacidade: 1 });
    const reservaId = await ateAPrimeira(ana, id);
    expect(await livres(id)).toBe(0);
    irPara(DEPOIS_DO_PRAZO);
    const res = await ver(ana, reservaId);
    expect(reservaDe(res)).toMatchObject({ situacao: 'cancelada', motivo_cancelamento: 'inadimplencia', proxima_parcela: null, pode_desistir: false });
    expect(await livres(id)).toBe(1); // vaga liberada pelo prazo, na leitura
    expect(ocupadas(id)).toBe(1); // nada foi gravado pela leitura
    expect(db.prepare('SELECT situacao FROM reserva WHERE id = ?').get(reservaId)?.['situacao']).toBe('aguardando_pagamento');
    expect(contar('auditoria', "acao = 'reserva.vencimento_segunda_parcela'")).toBe(0);
  });

  it('outra pessoa consegue a vaga liberada pelo vencimento, na gravacao seguinte', async () => {
    const id = publicar({ capacidade: 1 });
    await ateAPrimeira(ana, id);
    expect((await beatriz('POST', '/api/reservas', { excursao_id: id })).json).toEqual({ error: 'sem_vagas' });
    irPara(DEPOIS_DO_PRAZO);
    const nova = await beatriz('POST', '/api/reservas', { excursao_id: id });
    expect(nova.status).toBe(201);
    expect(ocupadas(id)).toBe(0);
  });

  it('segunda parcela confirmada depois do prazo e da liberacao fica registrada para a administracao, sem recriar a vaga', async () => {
    const id = publicar();
    const reservaId = await ateAPrimeira(ana, id);
    await pagar(ana, reservaId); // segunda pendente antes do prazo
    irPara(DEPOIS_DO_PRAZO);
    const res = await simular(ana, reservaId, 'aprovado'); // a confirmacao chega tarde
    expect(res.status).toBe(200);
    expect(reservaDe(res)).toMatchObject({ situacao: 'cancelada', motivo_cancelamento: 'inadimplencia' });
    expect(pagamentoDe(res)).toMatchObject({ parcela: 'segunda', situacao: 'confirmado', requer_tratamento_administrativo: true });
    expect(ocupadas(id)).toBe(0);
    expect(db.prepare("SELECT pendencia_administrativa AS p FROM pagamento WHERE parcela = 'segunda'").get()?.['p']).toBe('confirmacao_sem_vaga');
    expect(contar('auditoria', "acao = 'pagamento.confirmado_sem_vaga'")).toBe(1);
    const repetida = await simular(ana, reservaId, 'aprovado');
    expect(repetida.status).toBe(200);
    expect(contar('auditoria', "acao = 'pagamento.confirmado_sem_vaga'")).toBe(1);
    expect(ocupadas(id)).toBe(0);
  });

  it('segunda parcela pendente ou recusada na hora do vencimento nao impede a liberacao da vaga', async () => {
    const id = publicar();
    const pendente = await ateAPrimeira(ana, id);
    await pagar(ana, pendente);
    const recusada = await ateAPrimeira(beatriz, id);
    await pagar(beatriz, recusada);
    await simular(beatriz, recusada, 'recusado');
    expect(ocupadas(id)).toBe(2);
    irPara(DEPOIS_DO_PRAZO);
    await ver(ana, pendente);
    await ana('POST', '/api/reservas', { excursao_id: id }); // uma gravacao qualquer da excursao efetiva os dois vencimentos
    expect(ocupadas(id)).toBe(0);
    expect(contar('reserva', "motivo_cancelamento = 'inadimplencia'")).toBe(2);
  });

  it('a passageira pode reservar de novo a mesma excursao depois do vencimento, e o pedido efetiva o vencimento antes das verificacoes', async () => {
    const id = publicar({ capacidade: 1 });
    const velha = await ateAPrimeira(ana, id);
    irPara(DEPOIS_DO_PRAZO);
    const nova = await ana('POST', '/api/reservas', { excursao_id: id });
    expect(nova.status).toBe(201);
    expect(Number(reservaDe(nova)['id'])).not.toBe(velha);
    expect(db.prepare('SELECT situacao, motivo_cancelamento AS m FROM reserva WHERE id = ?').get(velha)).toEqual({ situacao: 'cancelada', m: 'inadimplencia' });
    expect(ocupadas(id)).toBe(0);
  });

  it('uma reserva quitada nunca vence', async () => {
    const id = publicar();
    const reservaId = await ateAPrimeira(ana, id);
    await pagar(ana, reservaId);
    await simular(ana, reservaId, 'aprovado');
    irPara(DEPOIS_DO_PRAZO);
    expect(reservaDe(await ver(ana, reservaId))).toMatchObject({ situacao: 'pronto_para_embarque', motivo_cancelamento: null });
    await beatriz('POST', '/api/reservas', { excursao_id: id });
    expect(ocupadas(id)).toBe(1);
    expect(contar('auditoria', "acao = 'reserva.vencimento_segunda_parcela'")).toBe(0);
  });
});

describe('primeira parcela confirmada depois da expiracao (RN-022)', () => {
  it('sem vaga, o pagamento fica sinalizado, a reserva continua aguardando e nao ha segunda parcela a pagar', async () => {
    const id = publicar({ capacidade: 1 });
    const daBeatriz = await reservarParcelada(beatriz, id);
    const daAna = await reservarParcelada(ana, id);
    await checkout(ana, daAna);
    await pagar(ana, daAna);
    irPara(new Date(relogio.getTime() + QUINZE_MIN + 1000)); // a retencao da Ana expira
    await checkout(beatriz, daBeatriz);
    await pagar(beatriz, daBeatriz);
    await simular(beatriz, daBeatriz, 'aprovado'); // a Beatriz ocupa a unica vaga com a primeira parcela
    expect(ocupadas(id)).toBe(1);
    const tardia = await simular(ana, daAna, 'aprovado');
    expect(pagamentoDe(tardia)).toMatchObject({ parcela: 'primeira', situacao: 'confirmado', requer_tratamento_administrativo: true });
    expect(reservaDe(tardia)).toMatchObject({ situacao: 'aguardando_pagamento', proxima_parcela: null });
    expect(ocupadas(id)).toBe(1);
    expect((await pagar(ana, daAna)).json).toEqual({ error: 'pagamento_ja_confirmado' });
  });
});

describe('privacidade e forma da resposta', () => {
  it('a resposta do parcelamento nao traz dados de outras pessoas, de cartao nem campos internos', async () => {
    const reservaId = await ateAPrimeira(ana, publicar());
    await pagar(ana, reservaId);
    const res = await simular(ana, reservaId, 'aprovado');
    const texto = JSON.stringify(res.json);
    for (const proibido of ['ana.passageira', 'beatriz', '11144477735', 'usuario_id', 'vagas_ocupadas', 'capacidade', 'pendencia_administrativa', SENHA]) {
      expect(texto).not.toContain(proibido);
    }
    const tudo = JSON.stringify(db.prepare('SELECT * FROM auditoria').all()) + JSON.stringify(db.prepare('SELECT * FROM pagamento').all());
    for (const proibido of ['ana.passageira', 'beatriz', '11144477735', 'senha', 'Maria da Silva', 'cartao']) expect(tudo).not.toContain(proibido);
  });

  it('a consulta publica continua sem expor pagamento, parcela nem motivo', async () => {
    const id = publicar();
    await ateAPrimeira(ana, id);
    irPara(DEPOIS_DO_PRAZO);
    const corpo = JSON.stringify((await chamar('GET', `/api/excursoes/${id}`)).json);
    for (const proibido of ['pagamento', 'parcela_', 'inadimplencia', 'vencidas', 'retidas', 'vagas_ocupadas', 'capacidade']) expect(corpo).not.toContain(proibido);
    expect(ANTES_DO_PRAZO.getTime()).toBeLessThan(PRAZO.getTime());
  });
});
