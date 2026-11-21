import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/app.ts';
import type { AuthConfig } from '../server/auth/config.ts';
import { AuthService } from '../server/auth/service.ts';
import { HttpError } from '../server/auth/support.ts';
import { MEMORY_DATABASE, openDatabase } from '../server/db/connection.ts';
import { runMigrations } from '../server/db/migrate.ts';
import { ExcursaoService } from '../server/excursoes/service.ts';
import { calcularParcelas, LIMITE_PENDENTES, ReservaService } from '../server/reservas/service.ts';

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

async function chamar(metodo: string, caminho: string, corpo?: unknown, cookie?: string, extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...extra };
  if (corpo !== undefined && headers['Content-Type'] === undefined) headers['Content-Type'] = 'application/json';
  if (cookie !== undefined) headers['Cookie'] = cookie;
  const res = await fetch(`${baseUrl}${caminho}`, {
    method: metodo,
    headers,
    ...(corpo === undefined ? {} : { body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo) }),
  });
  const texto = await res.text();
  return { status: res.status, json: texto === '' ? null : (JSON.parse(texto) as Record<string, unknown>), headers: res.headers };
}

const cookieDe = (h: Headers): string => (h.get('set-cookie') ?? '').split(';')[0] ?? '';
async function entrar(email: string): Promise<string> {
  const res = await chamar('POST', '/api/auth/login', { email, senha: SENHA });
  expect(res.status).toBe(200);
  return cookieDe(res.headers);
}

/** Cria e publica uma excursao pelo servico (como o administrador faria). */
function publicar(extra: Record<string, unknown> = {}): number {
  const e = excursoes.criar(adminId, { ...VALIDA, ...extra });
  excursoes.mudarSituacao(adminId, e.id, { situacao: 'publicada' });
  return e.id;
}

const ana = (m: string, c: string, corpo?: unknown) => chamar(m, c, corpo, anaCookie);
const beatriz = (m: string, c: string, corpo?: unknown) => chamar(m, c, corpo, beatrizCookie);
const reservar = (excursaoId: number, extra: Record<string, unknown> = {}) => ana('POST', '/api/reservas', { excursao_id: excursaoId, ...extra });
const reservaDe = (res: { json: Record<string, unknown> | null }) => res.json?.['reserva'] as Record<string, unknown>;
const contar = (tabela: string): number => Number(db.prepare(`SELECT COUNT(*) AS n FROM ${tabela}`).get()?.['n']);

beforeEach(async () => {
  db = openDatabase(MEMORY_DATABASE);
  runMigrations(db);
  relogio = new Date('2026-11-13T12:00:00.000Z');
  const auth = new AuthService({ db, config: CONFIG, outbox: () => undefined, now: () => relogio });
  adminId = (await auth.createAdministrator({ ...PESSOA, cpf: '529.982.247-25', email: 'admin.ficticio@exemplo.com' })).id;
  anaId = (await auth.register({ ...PESSOA, cpf: '111.444.777-35', email: 'ana.passageira@exemplo.com' })).id;
  beatrizId = (await auth.register({ ...PESSOA, nome_completo: 'Beatriz Souza Ficticia', cpf: '123.456.789-09', email: 'beatriz.passageira@exemplo.com' })).id;
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

describe('valores das parcelas (RN-012, RN-038)', () => {
  it('a soma das parcelas e sempre igual ao total, e o centavo que sobra fica na ultima', () => {
    expect(calcularParcelas(150000, 'integral', null)).toEqual([{ parcela: 'unica', valor_centavos: 150000, vencimento: null }]);
    expect(calcularParcelas(150000, 'parcelada', '2026-12-05')).toEqual([
      { parcela: 'primeira', valor_centavos: 75000, vencimento: null },
      { parcela: 'segunda', valor_centavos: 75000, vencimento: '2026-12-05' },
    ]);
    expect(calcularParcelas(15001, 'parcelada', '2026-12-05').map((p) => p.valor_centavos)).toEqual([7500, 7501]);
    for (const total of [1, 2, 3, 99, 100, 12345, 9_999_999, 10_000_000]) {
      const parcelas = calcularParcelas(total, 'parcelada', '2026-12-05');
      expect(parcelas.reduce((soma, p) => soma + p.valor_centavos, 0), String(total)).toBe(total);
      expect(parcelas[0]?.valor_centavos).toBeLessThanOrEqual(parcelas[1]?.valor_centavos ?? 0);
      expect(Number.isInteger(parcelas[0]?.valor_centavos)).toBe(true);
    }
  });
});

describe('autorizacao (RN-009, RNF-004)', () => {
  const rotas: [string, string, unknown][] = [
    ['POST', '/api/reservas', { excursao_id: 1 }],
    ['GET', '/api/reservas/1', undefined],
    ['POST', '/api/reservas/1/checkout', undefined],
    ['POST', '/api/reservas/1/desistir', undefined],
  ];

  it.each(rotas)('%s %s: visitante recebe 401 e administrador recebe 403', async (metodo, caminho, corpo) => {
    expect((await chamar(metodo, caminho, corpo)).status).toBe(401);
    const negado = await chamar(metodo, caminho, corpo, adminCookie);
    expect(negado.status).toBe(403);
    expect(negado.json).toEqual({ error: 'acesso_negado' });
  });

  it('a autorizacao vem antes de ler o corpo e nada e criado por quem nao e passageiro', async () => {
    publicar();
    expect((await chamar('POST', '/api/reservas', '{quebrado', adminCookie)).status).toBe(403);
    expect((await chamar('POST', '/api/reservas', { excursao_id: 1 }, adminCookie)).status).toBe(403);
    expect(contar('reserva')).toBe(0);
  });

  it('metodo errado responde 405 com Allow; sem os servicos responde 503', async () => {
    expect((await ana('GET', '/api/reservas')).headers.get('allow')).toBe('POST');
    expect((await ana('DELETE', '/api/reservas/1')).headers.get('allow')).toBe('GET');
    const sem = createApp();
    await new Promise<void>((resolve) => sem.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${(sem.address() as AddressInfo).port}`;
    expect((await fetch(`${url}/api/reservas/1`)).status).toBe(503);
    await new Promise<void>((resolve) => sem.close(() => resolve()));
  });
});

describe('solicitacao de reserva (RF-018, RF-019, RN-009, RN-023)', () => {
  it('cria a reserva integral por padrao, aguardando pagamento, vinculada ao passageiro da sessao', async () => {
    const id = publicar();
    const res = await reservar(id);
    expect(res.status).toBe(201);
    const r = reservaDe(res);
    expect(r).toMatchObject({ situacao: 'aguardando_pagamento', modalidade: 'integral', pode_desistir: true });
    expect(r['excursao']).toMatchObject({ id, nome: 'Excursao Ficticia Serra', data_inicial: '2026-12-10', partida_brasilia: { data: '2026-12-10', hora: '07:00' } });
    expect(r['valores']).toEqual({ total_centavos: 150000, parcelas: [{ parcela: 'unica', valor_centavos: 150000, vencimento: null, situacao_pagamento: null }] });
    const linha = db.prepare('SELECT usuario_id, excursao_id, modalidade, situacao FROM reserva').get();
    expect(linha).toMatchObject({ usuario_id: anaId, excursao_id: id, modalidade: 'integral', situacao: 'aguardando_pagamento' });
  });

  it('o corpo nao escolhe o passageiro nem a situacao: campos desconhecidos sao recusados', async () => {
    const id = publicar();
    const res = await reservar(id, { usuario_id: beatrizId, situacao: 'pronto_para_embarque', valor: 1, vagas_ocupadas: 5 });
    expect(res.status).toBe(400);
    expect(res.json?.['fields']).toEqual({ usuario_id: 'campo_nao_permitido', situacao: 'campo_nao_permitido', valor: 'campo_nao_permitido', vagas_ocupadas: 'campo_nao_permitido' });
    expect(contar('reserva')).toBe(0);
  });

  it('valida a excursao e a modalidade', async () => {
    expect((await ana('POST', '/api/reservas', {})).json).toEqual({ error: 'validacao', fields: { excursao_id: 'obrigatorio' } });
    for (const ruim of ['7', 1.5, 0, -2, true, null]) {
      expect((await ana('POST', '/api/reservas', { excursao_id: ruim })).status, String(ruim)).toBe(400);
    }
    const id = publicar();
    expect((await reservar(id, { modalidade: 'tres_vezes' })).json).toEqual({ error: 'validacao', fields: { modalidade: 'invalido' } });
    expect((await ana('POST', '/api/reservas', [1])).json).toEqual({ error: 'requisicao_invalida' });
    expect((await chamar('POST', '/api/reservas', 'x=1', anaCookie, { 'Content-Type': 'text/plain' })).status).toBe(415);
  });

  it('so reserva excursao publicada, ainda nao terminada: as demais respondem 404', async () => {
    const rascunho = excursoes.criar(adminId, VALIDA).id;
    const encerrada = publicar();
    excursoes.mudarSituacao(adminId, encerrada, { situacao: 'encerrada' });
    const cancelada = publicar();
    excursoes.mudarSituacao(adminId, cancelada, { situacao: 'cancelada' });
    for (const id of [rascunho, encerrada, cancelada, 99999]) {
      const res = await reservar(id);
      expect(res.status, String(id)).toBe(404);
      expect(res.json).toEqual({ error: 'excursao_nao_encontrada' });
    }
    expect(contar('reserva')).toBe(0);
  });

  it('excursao que ja terminou fica fora; a de hoje com partida passada recusa com erro claro', async () => {
    const id = publicar({ data_inicial: '2026-11-13', data_final: '2026-11-13', partida_utc: '2026-11-13T20:00:00.000Z', parcelamento_habilitado: false, prazo_segunda_parcela: undefined });
    relogio = new Date('2026-11-13T21:00:00.000Z'); // 18:00 em Brasilia: a partida (17:00) ja passou, mas o dia ainda nao acabou
    anaCookie = await entrar('ana.passageira@exemplo.com');
    const res = await reservar(id);
    expect(res.status).toBe(409);
    expect(res.json).toEqual({ error: 'reservas_encerradas' });
    relogio = new Date('2026-11-14T03:00:00.000Z'); // 00:00 do dia 14: terminou
    anaCookie = await entrar('ana.passageira@exemplo.com');
    expect((await reservar(id)).json).toEqual({ error: 'excursao_nao_encontrada' });
    expect(contar('reserva')).toBe(0);
  });

  it('nao mexe em vagas ocupadas, pagamentos nem retencoes (RN-021)', async () => {
    const id = publicar();
    db.prepare('UPDATE excursao SET vagas_ocupadas = 4 WHERE id = ?').run(id);
    await reservar(id);
    await beatriz('POST', '/api/reservas', { excursao_id: id, modalidade: 'parcelada' });
    expect(Number(db.prepare('SELECT vagas_ocupadas FROM excursao WHERE id = ?').get(id)?.['vagas_ocupadas'])).toBe(4);
    expect([contar('reserva'), contar('pagamento'), contar('retencao_vaga')]).toEqual([2, 0, 0]);
    const publica = (await chamar('GET', `/api/excursoes/${id}`)).json?.['excursao'] as Record<string, unknown>;
    expect(publica['vagas_disponiveis']).toBe(16);
  });

  it('modalidade parcelada: duas parcelas com a segunda vencendo no prazo da excursao', async () => {
    const id = publicar({ preco_centavos: 15001 });
    const r = reservaDe(await reservar(id, { modalidade: 'parcelada' }));
    expect(r['modalidade']).toBe('parcelada');
    expect(r['valores']).toEqual({
      total_centavos: 15001,
      parcelas: [
        { parcela: 'primeira', valor_centavos: 7500, vencimento: null, situacao_pagamento: null },
        { parcela: 'segunda', valor_centavos: 7501, vencimento: '2026-12-05', situacao_pagamento: null },
      ],
    });
  });

  it('parcelada so se a excursao habilita e o prazo da segunda parcela nao passou', async () => {
    const semParcelamento = publicar({ parcelamento_habilitado: false, prazo_segunda_parcela: undefined });
    const recusa = await reservar(semParcelamento, { modalidade: 'parcelada' });
    expect(recusa.json).toEqual({ error: 'validacao', fields: { modalidade: 'parcelamento_indisponivel' } });
    expect((await reservar(semParcelamento)).status).toBe(201);

    const comPrazo = publicar({ data_inicial: '2026-12-20', data_final: '2026-12-21', partida_utc: '2026-12-20T10:00:00.000Z', prazo_segunda_parcela: '2026-11-14' });
    relogio = new Date('2026-11-15T12:00:00.000Z'); // o prazo (14/11 23:59:59) passou, a partida ainda nao
    anaCookie = await entrar('ana.passageira@exemplo.com');
    const vencido = await reservar(comPrazo, { modalidade: 'parcelada' });
    expect(vencido.json).toEqual({ error: 'validacao', fields: { modalidade: 'prazo_da_segunda_parcela_vencido' } });
    expect((await reservar(comPrazo)).status).toBe(201);
  });

  it('com zero vagas livres a solicitacao e recusada; com uma vaga, varias pessoas podem ter reserva pendente (limitacao ate a AGT-008)', async () => {
    const cheia = publicar();
    db.prepare('UPDATE excursao SET vagas_ocupadas = capacidade WHERE id = ?').run(cheia);
    expect((await reservar(cheia)).json).toEqual({ error: 'sem_vagas' });
    const ultima = publicar({ nome: 'Ultima Vaga Ficticia' });
    db.prepare('UPDATE excursao SET vagas_ocupadas = capacidade - 1 WHERE id = ?').run(ultima);
    expect((await reservar(ultima)).status).toBe(201);
    expect((await beatriz('POST', '/api/reservas', { excursao_id: ultima })).status).toBe(201);
    expect(Number(db.prepare('SELECT vagas_ocupadas FROM excursao WHERE id = ?').get(ultima)?.['vagas_ocupadas'])).toBe(19);
  });
});

describe('uma reserva por passageiro e excursao (RN-009)', () => {
  it('pedido repetido recebe 409 com o numero da reserva existente e nao cria outra', async () => {
    const id = publicar();
    const primeira = reservaDe(await reservar(id));
    const repetido = await reservar(id, { modalidade: 'parcelada' });
    expect(repetido.status).toBe(409);
    expect(repetido.json).toEqual({ error: 'reserva_ativa_existente', fields: { reserva_id: String(primeira['id']) } });
    expect(contar('reserva')).toBe(1);
  });

  it('dois pedidos simultaneos criam uma unica reserva', async () => {
    const id = publicar();
    const [a, b] = await Promise.all([reservar(id), reservar(id)]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(contar('reserva')).toBe(1);
  });

  it('o indice unico do banco vale mesmo se a verificacao for contornada', () => {
    const id = publicar();
    const iso = relogio.toISOString();
    const inserir = () => db.prepare("INSERT INTO reserva (usuario_id, excursao_id, modalidade, situacao, criado_em, atualizado_em) VALUES (?, ?, 'integral', 'aguardando_pagamento', ?, ?)").run(anaId, id, iso, iso);
    inserir();
    expect(inserir).toThrow(/UNIQUE/);
  });

  it('pessoas diferentes podem reservar a mesma excursao', async () => {
    const id = publicar();
    expect((await reservar(id)).status).toBe(201);
    expect((await beatriz('POST', '/api/reservas', { excursao_id: id })).status).toBe(201);
    expect(contar('reserva')).toBe(2);
  });

  it('limita a tres reservas pendentes por passageiro; desistir libera uma', async () => {
    expect(LIMITE_PENDENTES).toBe(3);
    const ids = [1, 2, 3, 4].map((n) => publicar({ nome: `Excursao Ficticia ${n}` }));
    const criadas: Record<string, unknown>[] = [];
    for (const id of ids.slice(0, 3)) criadas.push(reservaDe(await reservar(id)));
    const quarta = await reservar(ids[3] as number);
    expect(quarta.status).toBe(409);
    expect(quarta.json).toEqual({ error: 'limite_de_reservas_pendentes' });
    await ana('POST', `/api/reservas/${String(criadas[0]?.['id'])}/desistir`);
    expect((await reservar(ids[3] as number)).status).toBe(201);
    expect(contar('reserva')).toBe(4);
  });
});

describe('privacidade entre passageiros e consulta da reserva', () => {
  it('o passageiro ve a propria reserva; a de outra pessoa responde 404, igual a inexistente', async () => {
    const id = publicar();
    const r = reservaDe(await reservar(id));
    expect(((await ana('GET', `/api/reservas/${String(r['id'])}`)).json?.['reserva'] as Record<string, unknown>)['id']).toBe(r['id']);
    const alheia = await beatriz('GET', `/api/reservas/${String(r['id'])}`);
    const inexistente = await beatriz('GET', '/api/reservas/99999');
    expect([alheia.status, alheia.json]).toEqual([inexistente.status, inexistente.json]);
    expect(alheia.status).toBe(404);
  });

  it('a resposta nao contem dados de outras pessoas nem campos internos', async () => {
    const id = publicar();
    const r = reservaDe(await reservar(id));
    expect(Object.keys(r).sort()).toEqual(['criada_em', 'excursao', 'id', 'modalidade', 'motivo_cancelamento', 'pagamento', 'pagamento_disponivel', 'pagamento_simulado', 'pode_desistir', 'proxima_parcela', 'retencao', 'situacao', 'valores']);
    const texto = JSON.stringify(r);
    for (const proibido of ['ana.passageira', 'beatriz', '11144477735', 'usuario_id', 'vagas_ocupadas', 'capacidade', SENHA]) {
      expect(texto).not.toContain(proibido);
    }
  });
});

describe('desistencia (decisao 1)', () => {
  it('cancela a reserva sem pagamento, libera o indice unico e permite reservar de novo', async () => {
    const id = publicar();
    const r = reservaDe(await reservar(id));
    const res = await ana('POST', `/api/reservas/${String(r['id'])}/desistir`);
    expect(res.status).toBe(200);
    expect(reservaDe(res)).toMatchObject({ situacao: 'cancelada', pode_desistir: false });
    const nova = reservaDe(await reservar(id));
    expect(nova['id']).not.toBe(r['id']);
    expect(contar('reserva')).toBe(2);
  });

  it('nao desiste de reserva alheia, de reserva ja cancelada, de reserva paga nem de reserva que nao aguarda pagamento', async () => {
    const id = publicar();
    const r = reservaDe(await reservar(id));
    const url = `/api/reservas/${String(r['id'])}/desistir`;
    expect((await beatriz('POST', url)).status).toBe(404);
    expect(db.prepare('SELECT situacao FROM reserva WHERE id = ?').get(Number(r['id']))?.['situacao']).toBe('aguardando_pagamento');

    const iso = relogio.toISOString();
    db.prepare("INSERT INTO pagamento (reserva_id, parcela, valor_centavos, situacao, criado_em, atualizado_em) VALUES (?, 'unica', 150000, 'pendente', ?, ?)").run(Number(r['id']), iso, iso);
    expect((await ana('POST', url)).json).toEqual({ error: 'reserva_com_pagamento' });
    db.prepare('DELETE FROM pagamento').run();

    db.prepare("UPDATE reserva SET situacao = 'pronto_para_embarque' WHERE id = ?").run(Number(r['id']));
    expect((await ana('POST', url)).json).toEqual({ error: 'reserva_nao_cancelavel' });
    db.prepare("UPDATE reserva SET situacao = 'aguardando_pagamento' WHERE id = ?").run(Number(r['id']));
    expect((await ana('POST', url)).status).toBe(200);
    expect((await ana('POST', url)).json).toEqual({ error: 'reserva_nao_cancelavel' });
  });
});

describe('auditoria e regras de outras atividades', () => {
  it('registra a criacao e a desistencia com o passageiro como ator, sem dados pessoais', async () => {
    const id = publicar();
    const r = reservaDe(await reservar(id, { modalidade: 'parcelada' }));
    await ana('POST', `/api/reservas/${String(r['id'])}/desistir`);
    const eventos = db.prepare("SELECT ator_usuario_id, acao, estado_anterior, estado_novo FROM auditoria WHERE entidade = 'reserva' ORDER BY id").all();
    expect(eventos.map((e) => e['acao'])).toEqual(['reserva.criada', 'reserva.desistencia']);
    expect(eventos.every((e) => e['ator_usuario_id'] === anaId)).toBe(true);
    expect(JSON.parse(String(eventos[0]?.['estado_novo']))).toEqual({ situacao: 'aguardando_pagamento', modalidade: 'parcelada', excursao_id: id });
    const dump = JSON.stringify(db.prepare('SELECT * FROM auditoria').all());
    for (const segredo of [SENHA, '11144477735', '12345678909', 'ana.passageira', 'beatriz.passageira', 'scrypt$']) {
      expect(dump).not.toContain(segredo);
    }
  });

  it('tentativas recusadas nao deixam rastro de reserva', async () => {
    const id = publicar();
    await reservar(id);
    await reservar(id);
    await reservar(99999);
    expect(db.prepare("SELECT acao FROM auditoria WHERE entidade = 'reserva'").all().map((e) => e['acao'])).toEqual(['reserva.criada']);
  });

  it('com a reserva criada, a RN-036 da AGT-005 passa a valer: preco bloqueado e cancelamento da excursao recusado', async () => {
    const id = publicar();
    await reservar(id);
    const versao = excursoes.obter(id).versao;
    expect(() => excursoes.editar(adminId, id, { versao, preco_centavos: 1000 })).toThrow(HttpError);
    expect(() => excursoes.mudarSituacao(adminId, id, { situacao: 'cancelada' })).toThrow(HttpError);
    expect(excursoes.obter(id).edicao_restrita).toBe(true);
  });
});
