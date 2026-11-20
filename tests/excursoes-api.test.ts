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

const PESSOA = {
  nome_completo: 'Maria da Silva Ficticia',
  cpf: '529.982.247-25',
  data_nascimento: '1990-05-20',
  telefone: '(11) 98765-4321',
  email: 'admin.ficticio@exemplo.com',
  senha: SENHA,
};

const VALIDA = {
  nome: 'Excursao Ficticia Serra',
  descricao: 'Passeio ficticio de teste',
  imagem_ref: 'imagens/serra.jpg',
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
let adminCookie: string;
let adminId: number;
let passageiroCookie: string;
let passageiroId: number;

async function chamar(
  metodo: string,
  caminho: string,
  corpo?: unknown,
  cookie?: string,
  extra: Record<string, string> = {},
): Promise<{ status: number; json: Record<string, unknown> | null; headers: Headers }> {
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

const admin = (m: string, c: string, corpo?: unknown) => chamar(m, c, corpo, adminCookie);
const cookieDe = (h: Headers): string => (h.get('set-cookie') ?? '').split(';')[0] ?? '';

async function entrar(email: string): Promise<string> {
  const res = await chamar('POST', '/api/auth/login', { email, senha: SENHA });
  expect(res.status).toBe(200);
  return cookieDe(res.headers);
}

async function criar(extra: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const res = await admin('POST', '/api/admin/excursoes', { ...VALIDA, ...extra });
  expect(res.status).toBe(201);
  return res.json?.['excursao'] as Record<string, unknown>;
}

/** Insere uma reserva (e opcionalmente uma retencao) direto no banco, sem criar funcionalidade de reserva. */
function semearReserva(excursaoId: number, situacao: string, retencao?: string): number {
  const iso = relogio.toISOString();
  const r = db
    .prepare('INSERT INTO reserva (usuario_id, excursao_id, modalidade, situacao, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?)')
    .run(passageiroId, excursaoId, 'integral', situacao, iso, iso);
  const id = Number(r.lastInsertRowid);
  if (retencao !== undefined) {
    const fim = new Date(relogio.getTime() + 600_000).toISOString();
    db.prepare('INSERT INTO retencao_vaga (reserva_id, criado_em, expira_em, situacao) VALUES (?, ?, ?, ?)').run(id, iso, fim, retencao);
  }
  return id;
}

beforeEach(async () => {
  db = openDatabase(MEMORY_DATABASE);
  runMigrations(db);
  relogio = new Date('2026-11-13T12:00:00.000Z');
  const auth = new AuthService({ db, config: CONFIG, outbox: () => undefined, now: () => relogio });
  adminId = (await auth.createAdministrator(PESSOA)).id;
  passageiroId = (
    await auth.register({ ...PESSOA, cpf: '11144477735', email: 'passageiro.ficticio@exemplo.com' })
  ).id;
  server = createApp({ auth: { service: auth, config: CONFIG }, excursoes: new ExcursaoService(db, () => relogio) });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  adminCookie = await entrar(PESSOA.email);
  passageiroCookie = await entrar('passageiro.ficticio@exemplo.com');
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  db.close();
});

describe('autorizacao (RNF-002, RNF-004)', () => {
  const rotas: [string, string, unknown][] = [
    ['GET', '/api/admin/excursoes', undefined],
    ['POST', '/api/admin/excursoes', VALIDA],
    ['GET', '/api/admin/excursoes/1', undefined],
    ['PATCH', '/api/admin/excursoes/1', { nome: 'Novo nome' }],
    ['POST', '/api/admin/excursoes/1/situacao', { situacao: 'publicada' }],
    ['GET', '/api/admin/excursoes/1/historico', undefined],
  ];

  it.each(rotas)('%s %s: visitante recebe 401 e passageiro recebe 403', async (metodo, caminho, corpo) => {
    expect((await chamar(metodo, caminho, corpo)).status).toBe(401);
    const negado = await chamar(metodo, caminho, corpo, passageiroCookie);
    expect(negado.status).toBe(403);
    expect(negado.json).toEqual({ error: 'acesso_negado' });
  });

  it('a autorizacao vem antes de qualquer leitura: passageiro nao cria nem altera nada', async () => {
    await chamar('POST', '/api/admin/excursoes', VALIDA, passageiroCookie);
    expect(Number(db.prepare('SELECT COUNT(*) AS n FROM excursao').get()?.['n'])).toBe(0);
  });

  it('o perfil e lido do banco a cada requisicao: rebaixar o administrador vale na hora', async () => {
    expect((await admin('GET', '/api/admin/excursoes')).status).toBe(200);
    db.prepare("UPDATE usuario SET perfil = 'passageiro' WHERE id = ?").run(adminId);
    expect((await admin('GET', '/api/admin/excursoes')).status).toBe(403);
  });

  it('sem os servicos configurados, responde 503; metodo errado responde 405 com Allow', async () => {
    const sem = createApp();
    await new Promise<void>((resolve) => sem.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${(sem.address() as AddressInfo).port}`;
    expect((await fetch(`${url}/api/admin/excursoes`)).status).toBe(503);
    await new Promise<void>((resolve) => sem.close(() => resolve()));
    const metodo = await admin('DELETE', '/api/admin/excursoes/1');
    expect(metodo.status).toBe(405);
    expect(metodo.headers.get('allow')).toBe('GET, PATCH');
  });
});

describe('cadastro de excursao (RF-009 a RF-013, RN-037)', () => {
  it('cria em Rascunho com ocupacao zero, versao e conversoes de fuso', async () => {
    const e = await criar();
    expect(e).toMatchObject({
      situacao: 'rascunho',
      vagas_ocupadas: 0,
      capacidade: 20,
      preco_centavos: 150000,
      parcelamento_habilitado: true,
      prazo_segunda_parcela: '2026-12-05',
      prazo_segunda_parcela_utc: '2026-12-06T02:59:59.000Z',
      partida_utc: '2026-12-10T10:00:00.000Z',
      edicao_restrita: false,
      campos_bloqueados: [],
    });
    expect(typeof e['versao']).toBe('string');
    expect(e['transicoes']).toEqual([
      { para: 'publicada', disponivel: true, motivo: null },
      { para: 'cancelada', disponivel: true, motivo: null },
    ]);
  });

  it('guarda preco em centavos inteiros e instantes em UTC com Z (RN-038, RN-039)', async () => {
    await criar();
    const linha = db.prepare('SELECT preco_centavos, partida_utc, prazo_segunda_parcela_utc, criado_em, situacao FROM excursao').get();
    expect(linha).toMatchObject({ preco_centavos: 150000, situacao: 'rascunho' });
    for (const campo of ['partida_utc', 'prazo_segunda_parcela_utc', 'criado_em']) {
      expect(String(linha?.[campo])).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    }
    expect(typeof linha?.['preco_centavos']).toBe('number');
  });

  it('descricao e imagem sao opcionais; sem parcelamento nao ha prazo', async () => {
    const res = await admin('POST', '/api/admin/excursoes', {
      ...VALIDA,
      descricao: undefined,
      imagem_ref: undefined,
      parcelamento_habilitado: false,
      prazo_segunda_parcela: undefined,
    });
    expect(res.status).toBe(201);
    expect(res.json?.['excursao']).toMatchObject({ descricao: '', imagem_ref: null, prazo_segunda_parcela: null, prazo_segunda_parcela_utc: null });
  });

  it('o corpo vazio exige os campos obrigatorios', async () => {
    const res = await admin('POST', '/api/admin/excursoes', {});
    expect(res.status).toBe(400);
    expect(res.json).toEqual({
      error: 'validacao',
      fields: {
        nome: 'obrigatorio',
        local: 'obrigatorio',
        ponto_embarque: 'obrigatorio',
        data_inicial: 'obrigatorio',
        data_final: 'obrigatorio',
        partida_utc: 'obrigatorio',
        capacidade: 'obrigatorio',
        preco_centavos: 'obrigatorio',
      },
    });
  });

  const invalidos: [string, Record<string, unknown>, Record<string, string>][] = [
    ['preco zero', { preco_centavos: 0 }, { preco_centavos: 'fora_do_limite' }],
    ['preco acima de R$ 100.000,00', { preco_centavos: 10_000_001 }, { preco_centavos: 'fora_do_limite' }],
    ['preco decimal (nao e centavo inteiro)', { preco_centavos: 1500.5 }, { preco_centavos: 'invalido' }],
    ['preco em texto', { preco_centavos: '1500' }, { preco_centavos: 'invalido' }],
    ['capacidade zero', { capacidade: 0 }, { capacidade: 'fora_do_limite' }],
    ['capacidade acima de 1000', { capacidade: 1001 }, { capacidade: 'fora_do_limite' }],
    ['capacidade decimal', { capacidade: 10.5 }, { capacidade: 'invalido' }],
    ['data final antes da inicial', { data_final: '2026-12-09' }, { data_final: 'anterior_a_data_inicial' }],
    ['data inicial no passado', { data_inicial: '2026-11-12', data_final: '2026-11-13', partida_utc: '2026-11-12T10:00:00.000Z', prazo_segunda_parcela: '2026-11-10' }, { data_inicial: 'no_passado' }],
    ['partida dois dias antes da data inicial', { partida_utc: '2026-12-08T10:00:00.000Z' }, { partida_utc: 'fora_da_data_inicial' }],
    ['partida depois da data inicial', { partida_utc: '2026-12-11T10:00:00.000Z' }, { partida_utc: 'fora_da_data_inicial' }],
    ['partida sem fuso (nao e UTC)', { partida_utc: '2026-12-10T07:00:00' }, { partida_utc: 'invalido' }],
    ['partida com deslocamento no lugar de Z', { partida_utc: '2026-12-10T07:00:00-03:00' }, { partida_utc: 'invalido' }],
    ['parcelamento sem prazo', { prazo_segunda_parcela: undefined }, { prazo_segunda_parcela: 'obrigatorio' }],
    ['prazo no dia da partida', { prazo_segunda_parcela: '2026-12-10' }, { prazo_segunda_parcela: 'nao_anterior_a_partida' }],
    ['prazo depois da partida', { prazo_segunda_parcela: '2026-12-11' }, { prazo_segunda_parcela: 'nao_anterior_a_partida' }],
    ['prazo com data inexistente', { prazo_segunda_parcela: '2026-02-30' }, { prazo_segunda_parcela: 'invalido' }],
    ['nome curto demais', { nome: 'Ab' }, { nome: 'invalido' }],
    ['local vazio', { local: '   ' }, { local: 'obrigatorio' }],
    ['parcelamento nao booleano', { parcelamento_habilitado: 'sim' }, { parcelamento_habilitado: 'invalido' }],
  ];
  it.each(invalidos)('recusa %s', async (_nome, alteracao, esperado) => {
    const res = await admin('POST', '/api/admin/excursoes', { ...VALIDA, ...alteracao });
    expect(res.status).toBe(400);
    expect(res.json).toEqual({ error: 'validacao', fields: esperado });
    expect(Number(db.prepare('SELECT COUNT(*) AS n FROM excursao').get()?.['n'])).toBe(0);
  });

  it('recusa campos que a API nao aceita, como situacao e vagas ocupadas, ja na criacao', async () => {
    const res = await admin('POST', '/api/admin/excursoes', { ...VALIDA, situacao: 'publicada', vagas_ocupadas: 5, id: 99 });
    expect(res.status).toBe(400);
    expect(res.json?.['fields']).toEqual({ situacao: 'campo_nao_permitido', vagas_ocupadas: 'campo_nao_permitido', id: 'campo_nao_permitido' });
  });

  it('referencia de imagem: so caminho relativo a pasta de imagens (decisao 3)', async () => {
    for (const ok of ['imagens/serra.jpg', 'imagens/praia-1.webp', 'imagens/a_b.PNG'.toLowerCase()]) {
      expect((await admin('POST', '/api/admin/excursoes', { ...VALIDA, imagem_ref: ok })).status).toBe(201);
    }
    for (const ruim of ['https://exemplo.com/a.jpg', '//exemplo.com/a.jpg', '/imagens/a.jpg', 'imagens/../segredo.jpg', 'imagens/a/b.jpg', 'imagens/A.JPG', 'imagens/a.svg', 'imagens/a.jpg?x=1', 'file:///c:/a.jpg', 'javascript:alert(1)']) {
      const res = await admin('POST', '/api/admin/excursoes', { ...VALIDA, imagem_ref: ruim });
      expect(res.status, ruim).toBe(400);
      expect(res.json?.['fields']).toEqual({ imagem_ref: 'invalido' });
    }
  });

  it('exige JSON, recusa corpo invalido e corpo que nao e objeto', async () => {
    expect((await chamar('POST', '/api/admin/excursoes', 'x=1', adminCookie, { 'Content-Type': 'text/plain' })).status).toBe(415);
    expect((await chamar('POST', '/api/admin/excursoes', '{quebrado', adminCookie)).status).toBe(400);
    expect((await admin('POST', '/api/admin/excursoes', '[1]')).json).toEqual({ error: 'requisicao_invalida' });
  });
});

describe('consulta e lista', () => {
  it('lista com situacao e ocupacao, e mostra uma excursao', async () => {
    const a = await criar();
    await criar({ nome: 'Outra Excursao Ficticia', data_inicial: '2026-12-20', data_final: '2026-12-21', partida_utc: '2026-12-20T10:00:00.000Z', prazo_segunda_parcela: '2026-12-15' });
    const lista = (await admin('GET', '/api/admin/excursoes')).json?.['excursoes'] as Record<string, unknown>[];
    expect(lista).toHaveLength(2);
    expect(lista[0]).toMatchObject({ nome: 'Outra Excursao Ficticia', situacao: 'rascunho', capacidade: 20, vagas_ocupadas: 0 });
    const um = await admin('GET', `/api/admin/excursoes/${String(a['id'])}`);
    expect(um.status).toBe(200);
    expect((um.json?.['excursao'] as Record<string, unknown>)['nome']).toBe('Excursao Ficticia Serra');
  });

  it('id inexistente responde 404 e id que nao e numero cai na rota desconhecida', async () => {
    expect((await admin('GET', '/api/admin/excursoes/999')).json).toEqual({ error: 'nao_encontrada' });
    expect((await admin('GET', '/api/admin/excursoes/abc')).json).toEqual({ error: 'not_found' });
    expect((await admin('GET', '/api/admin/excursoes/999/historico')).status).toBe(404);
  });
});

describe('edicao (RF-010 a RF-013, RN-036)', () => {
  it('edita campos livres e comerciais sem reserva ativa e troca a versao', async () => {
    const e = await criar();
    const res = await admin('PATCH', `/api/admin/excursoes/${String(e['id'])}`, {
      versao: e['versao'],
      nome: 'Nome Atualizado Ficticio',
      preco_centavos: 99990,
      capacidade: 30,
    });
    expect(res.status).toBe(200);
    const nova = res.json?.['excursao'] as Record<string, unknown>;
    expect(nova).toMatchObject({ nome: 'Nome Atualizado Ficticio', preco_centavos: 99990, capacidade: 30 });
    expect(nova['versao']).not.toBe(e['versao']);
  });

  it('exige a versao, recusa campo desconhecido e alteracao vazia', async () => {
    const e = await criar();
    const url = `/api/admin/excursoes/${String(e['id'])}`;
    expect((await admin('PATCH', url, { nome: 'Outro Nome Ficticio' })).json).toEqual({ error: 'validacao', fields: { versao: 'obrigatorio' } });
    expect((await admin('PATCH', url, { versao: e['versao'], situacao: 'publicada', vagas_ocupadas: 3 })).json?.['fields']).toEqual({ situacao: 'campo_nao_permitido', vagas_ocupadas: 'campo_nao_permitido' });
    expect((await admin('PATCH', url, { versao: e['versao'], nome: e['nome'] })).json).toEqual({ error: 'validacao', fields: { corpo: 'sem_alteracoes' } });
  });

  it('edicao simultanea: a segunda edicao com a versao antiga e recusada, sem sobrescrever a primeira', async () => {
    const e = await criar();
    const url = `/api/admin/excursoes/${String(e['id'])}`;
    const [um, dois] = [
      await admin('PATCH', url, { versao: e['versao'], nome: 'Primeiro Nome Ficticio' }),
      await admin('PATCH', url, { versao: e['versao'], nome: 'Segundo Nome Ficticio' }),
    ];
    expect(um.status).toBe(200);
    expect(dois.status).toBe(409);
    expect(dois.json).toEqual({ error: 'conflito_de_edicao' });
    expect((await admin('GET', url)).json?.['excursao']).toMatchObject({ nome: 'Primeiro Nome Ficticio' });
  });

  it('duas edicoes no mesmo milissegundo ainda geram versoes diferentes', async () => {
    const e = await criar();
    const url = `/api/admin/excursoes/${String(e['id'])}`;
    const a = (await admin('PATCH', url, { versao: e['versao'], nome: 'Primeiro Nome Ficticio' })).json?.['excursao'] as Record<string, unknown>;
    const b = (await admin('PATCH', url, { versao: a['versao'], nome: 'Segundo Nome Ficticio' })).json?.['excursao'] as Record<string, unknown>;
    expect(new Set([e['versao'], a['versao'], b['versao']]).size).toBe(3);
  });

  it('com reserva ativa, bloqueia condicoes comerciais e temporais e libera nome, imagem, descricao, local e embarque', async () => {
    const e = await criar();
    const id = Number(e['id']);
    semearReserva(id, 'aguardando_pagamento');
    const url = `/api/admin/excursoes/${String(id)}`;
    const visto = (await admin('GET', url)).json?.['excursao'] as Record<string, unknown>;
    expect(visto['edicao_restrita']).toBe(true);
    expect(visto['campos_bloqueados']).toEqual(['preco_centavos', 'parcelamento_habilitado', 'prazo_segunda_parcela', 'capacidade', 'data_inicial', 'data_final', 'partida_utc']);

    const bloqueado = await admin('PATCH', url, { versao: visto['versao'], preco_centavos: 1000, capacidade: 40, data_final: '2026-12-13', parcelamento_habilitado: false, nome: 'Nome Livre Ficticio' });
    expect(bloqueado.status).toBe(409);
    expect(bloqueado.json).toEqual({
      error: 'edicao_bloqueada',
      fields: {
        preco_centavos: 'bloqueado_por_reserva_ativa',
        capacidade: 'bloqueado_por_reserva_ativa',
        data_final: 'bloqueado_por_reserva_ativa',
        parcelamento_habilitado: 'bloqueado_por_reserva_ativa',
      },
    });
    expect((await admin('GET', url)).json?.['excursao']).toMatchObject({ nome: 'Excursao Ficticia Serra', preco_centavos: 150000 });

    const livre = await admin('PATCH', url, {
      versao: visto['versao'],
      nome: 'Nome Livre Ficticio',
      descricao: 'Nova descricao',
      imagem_ref: 'imagens/nova.png',
      local: 'Outro Local Ficticio',
      ponto_embarque: 'Outro Ponto Ficticio',
    });
    expect(livre.status).toBe(200);
  });

  it('reenviar um campo protegido sem mudar o valor nao e bloqueado', async () => {
    const e = await criar();
    const id = Number(e['id']);
    semearReserva(id, 'pronto_para_embarque');
    const res = await admin('PATCH', `/api/admin/excursoes/${String(id)}`, { versao: e['versao'], preco_centavos: 150000, nome: 'Nome Livre Ficticio' });
    expect(res.status).toBe(200);
  });

  it('retencao ativa tambem bloqueia, mesmo com a reserva cancelada; reserva concluida ou cancelada sem retencao nao bloqueia', async () => {
    const e = await criar();
    const id = Number(e['id']);
    const url = `/api/admin/excursoes/${String(id)}`;
    semearReserva(id, 'concluida');
    semearReserva(id, 'cancelada');
    const livre = await admin('PATCH', url, { versao: e['versao'], preco_centavos: 120000 });
    expect(livre.status).toBe(200);
    const versao = (livre.json?.['excursao'] as Record<string, unknown>)['versao'];
    semearReserva(id, 'cancelada', 'ativa');
    const trava = await admin('PATCH', url, { versao, preco_centavos: 110000 });
    expect(trava.status).toBe(409);
    expect(trava.json?.['error']).toBe('edicao_bloqueada');
  });

  it('retencao expirada, confirmada ou cancelada nao bloqueia', async () => {
    const e = await criar();
    const id = Number(e['id']);
    semearReserva(id, 'cancelada', 'expirada');
    expect(((await admin('GET', `/api/admin/excursoes/${String(id)}`)).json?.['excursao'] as Record<string, unknown>)['edicao_restrita']).toBe(false);
  });

  it('a capacidade nunca fica abaixo das vagas ocupadas (RN-021)', async () => {
    const e = await criar();
    const id = Number(e['id']);
    db.prepare('UPDATE excursao SET vagas_ocupadas = 5 WHERE id = ?').run(id);
    const url = `/api/admin/excursoes/${String(id)}`;
    const menor = await admin('PATCH', url, { versao: e['versao'], capacidade: 4 });
    expect(menor.status).toBe(400);
    expect(menor.json).toEqual({ error: 'validacao', fields: { capacidade: 'menor_que_vagas_ocupadas' } });
    expect((await admin('PATCH', url, { versao: e['versao'], capacidade: 5 })).status).toBe(200);
    expect(Number(db.prepare('SELECT capacidade FROM excursao WHERE id = ?').get(id)?.['capacidade'])).toBe(5);
  });

  it('desligar o parcelamento limpa o prazo; ligar exige o prazo', async () => {
    const e = await criar();
    const url = `/api/admin/excursoes/${String(e['id'])}`;
    const desligado = await admin('PATCH', url, { versao: e['versao'], parcelamento_habilitado: false });
    expect(desligado.json?.['excursao']).toMatchObject({ parcelamento_habilitado: false, prazo_segunda_parcela: null, prazo_segunda_parcela_utc: null });
    const versao = (desligado.json?.['excursao'] as Record<string, unknown>)['versao'];
    const sem = await admin('PATCH', url, { versao, parcelamento_habilitado: true });
    expect(sem.json).toEqual({ error: 'validacao', fields: { prazo_segunda_parcela: 'obrigatorio' } });
    expect((await admin('PATCH', url, { versao, parcelamento_habilitado: true, prazo_segunda_parcela: '2026-12-08' })).status).toBe(200);
  });

  it('o preco editado continua inteiro em centavos e as datas continuam coerentes', async () => {
    const e = await criar();
    const url = `/api/admin/excursoes/${String(e['id'])}`;
    expect((await admin('PATCH', url, { versao: e['versao'], preco_centavos: 99.9 })).json?.['fields']).toEqual({ preco_centavos: 'invalido' });
    expect((await admin('PATCH', url, { versao: e['versao'], data_final: '2026-12-01' })).json?.['fields']).toEqual({ data_final: 'anterior_a_data_inicial' });
    expect((await admin('PATCH', url, { versao: e['versao'], partida_utc: '2026-12-10T04:00:00.000Z' })).json?.['fields']).toBeUndefined();
  });

  it('excursao cancelada nao pode ser editada', async () => {
    const e = await criar();
    const id = String(e['id']);
    const c = await admin('POST', `/api/admin/excursoes/${id}/situacao`, { situacao: 'cancelada' });
    expect(c.status).toBe(200);
    const res = await admin('PATCH', `/api/admin/excursoes/${id}`, { versao: (c.json?.['excursao'] as Record<string, unknown>)['versao'], nome: 'Nome Qualquer Ficticio' });
    expect(res.status).toBe(409);
    expect(res.json).toEqual({ error: 'excursao_cancelada' });
  });
});

describe('situacoes (decisao 1, RN-035, RN-037)', () => {
  const situacao = (id: unknown, para: string, versao?: unknown) =>
    admin('POST', `/api/admin/excursoes/${String(id)}/situacao`, versao === undefined ? { situacao: para } : { situacao: para, versao });

  it('percorre rascunho, publicada, encerrada; so a acao muda a situacao, nunca o cadastro', async () => {
    const e = await criar();
    const id = e['id'];
    expect(e['situacao']).toBe('rascunho');
    const pub = await situacao(id, 'publicada');
    expect(pub.json?.['excursao']).toMatchObject({ situacao: 'publicada' });
    expect((pub.json?.['excursao'] as Record<string, unknown>)['transicoes']).toEqual([
      { para: 'encerrada', disponivel: true, motivo: null },
      { para: 'rascunho', disponivel: true, motivo: null },
      { para: 'cancelada', disponivel: true, motivo: null },
    ]);
    expect((await situacao(id, 'encerrada')).json?.['excursao']).toMatchObject({ situacao: 'encerrada' });
  });

  it('recusa transicoes fora da matriz e valores desconhecidos', async () => {
    const e = await criar();
    const id = e['id'];
    expect((await situacao(id, 'encerrada')).json).toEqual({ error: 'transicao_invalida' });
    expect((await situacao(id, 'rascunho')).json).toEqual({ error: 'transicao_invalida' });
    expect((await situacao(id, 'concluida')).json).toEqual({ error: 'validacao', fields: { situacao: 'invalido' } });
    expect((await admin('POST', `/api/admin/excursoes/${String(id)}/situacao`, {})).json).toEqual({ error: 'validacao', fields: { situacao: 'obrigatorio' } });
    await situacao(id, 'publicada');
    await situacao(id, 'encerrada');
    expect((await situacao(id, 'publicada')).json).toEqual({ error: 'transicao_invalida' });
    await situacao(id, 'cancelada');
    for (const destino of ['rascunho', 'publicada', 'encerrada', 'cancelada']) {
      expect((await situacao(id, destino)).json, destino).toEqual({ error: 'transicao_invalida' });
    }
  });

  it('despublicar volta para rascunho quando nao ha reservas ativas', async () => {
    const e = await criar();
    await situacao(e['id'], 'publicada');
    expect((await situacao(e['id'], 'rascunho')).json?.['excursao']).toMatchObject({ situacao: 'rascunho' });
  });

  it('publicar exige partida no futuro e, com parcelamento, prazo ainda por vir', async () => {
    const e = await criar({ parcelamento_habilitado: false, prazo_segunda_parcela: undefined });
    relogio = new Date('2026-12-10T12:00:00.000Z');
    adminCookie = await entrar(PESSOA.email); // a sessao anterior expirou com o relogio adiantado
    expect((await situacao(e['id'], 'publicada')).json).toEqual({ error: 'validacao', fields: { partida_utc: 'no_passado' } });
    const f = await criar({ data_inicial: '2027-01-10', data_final: '2027-01-11', partida_utc: '2027-01-10T10:00:00.000Z', prazo_segunda_parcela: '2026-12-01' });
    const res = await situacao(f['id'], 'publicada');
    expect(res.status).toBe(400);
    expect(res.json?.['fields']).toEqual({ prazo_segunda_parcela: 'no_passado' });
  });

  it('com reserva ou retencao ativa: cancelar e despublicar sao bloqueados, encerrar nao', async () => {
    const e = await criar();
    const id = Number(e['id']);
    await situacao(id, 'publicada');
    semearReserva(id, 'pronto_para_embarque');
    const visto = (await admin('GET', `/api/admin/excursoes/${String(id)}`)).json?.['excursao'] as Record<string, unknown>;
    expect(visto['transicoes']).toEqual([
      { para: 'encerrada', disponivel: true, motivo: null },
      { para: 'rascunho', disponivel: false, motivo: 'reservas_ativas' },
      { para: 'cancelada', disponivel: false, motivo: 'reservas_ativas' },
    ]);
    expect((await situacao(id, 'cancelada')).json).toEqual({ error: 'excursao_com_reservas_ativas' });
    expect((await situacao(id, 'rascunho')).json).toEqual({ error: 'excursao_com_reservas_ativas' });
    expect((await situacao(id, 'encerrada')).status).toBe(200);
    expect((await situacao(id, 'cancelada')).json).toEqual({ error: 'excursao_com_reservas_ativas' });
    expect(db.prepare('SELECT situacao FROM excursao WHERE id = ?').get(id)?.['situacao']).toBe('encerrada');
  });

  it('versao desatualizada na mudanca de situacao e recusada', async () => {
    const e = await criar();
    await admin('PATCH', `/api/admin/excursoes/${String(e['id'])}`, { versao: e['versao'], nome: 'Outro Nome Ficticio' });
    expect((await situacao(e['id'], 'publicada', e['versao'])).json).toEqual({ error: 'conflito_de_edicao' });
  });
});

describe('historico e auditoria (RF-042, RN-035, RN-041, RN-042)', () => {
  it('registra criacao, edicao e mudanca de situacao com o ator, do mais recente ao mais antigo', async () => {
    const e = await criar();
    const id = String(e['id']);
    await admin('PATCH', `/api/admin/excursoes/${id}`, { versao: e['versao'], nome: 'Nome Mudado Ficticio', preco_centavos: 90000 });
    await admin('POST', `/api/admin/excursoes/${id}/situacao`, { situacao: 'publicada' });
    const h = (await admin('GET', `/api/admin/excursoes/${id}/historico`)).json?.['historico'] as Record<string, unknown>[];
    expect(h.map((x) => x['acao'])).toEqual(['excursao.situacao_alterada', 'excursao.editada', 'excursao.criada']);
    expect(h.every((x) => x['ator_usuario_id'] === adminId)).toBe(true);
    expect(h[0]).toMatchObject({ estado_anterior: { situacao: 'rascunho' }, estado_novo: { situacao: 'publicada' } });
    expect(h[1]).toMatchObject({
      estado_anterior: { nome: 'Excursao Ficticia Serra', preco_centavos: 150000 },
      estado_novo: { nome: 'Nome Mudado Ficticio', preco_centavos: 90000 },
    });
    expect(h[2]).toMatchObject({ estado_novo: { situacao: 'rascunho' } });
  });

  it('tentativas recusadas nao deixam rastro de alteracao', async () => {
    const e = await criar();
    const id = Number(e['id']);
    semearReserva(id, 'aguardando_pagamento');
    await admin('PATCH', `/api/admin/excursoes/${String(id)}`, { versao: e['versao'], preco_centavos: 1000 });
    await admin('POST', `/api/admin/excursoes/${String(id)}/situacao`, { situacao: 'cancelada' });
    const acoes = db.prepare("SELECT acao FROM auditoria WHERE entidade = 'excursao' AND registro_id = ?").all(id).map((r) => r['acao']);
    expect(acoes).toEqual(['excursao.criada']);
  });

  it('a auditoria da excursao nao contem dados pessoais, senha, token nem hash', async () => {
    const e = await criar();
    const id = String(e['id']);
    await admin('PATCH', `/api/admin/excursoes/${id}`, { versao: e['versao'], nome: 'Nome Mudado Ficticio' });
    await admin('POST', `/api/admin/excursoes/${id}/situacao`, { situacao: 'publicada' });
    const dump = JSON.stringify(db.prepare('SELECT * FROM auditoria').all());
    for (const segredo of [SENHA, '52998224725', '11144477735', 'admin.ficticio@exemplo.com', 'passageiro.ficticio@exemplo.com', '987654321', 'scrypt$']) {
      expect(dump).not.toContain(segredo);
    }
  });
});
