import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/app.ts';
import type { AuthConfig } from '../server/auth/config.ts';
import { AuthService } from '../server/auth/service.ts';
import { MEMORY_DATABASE, openDatabase } from '../server/db/connection.ts';
import { runMigrations } from '../server/db/migrate.ts';
import { LIMITE_LISTA_PUBLICA, vagasDisponiveis } from '../server/excursoes/publico.ts';
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

const CAMPOS_PUBLICOS = [
  'data_final',
  'data_inicial',
  'descricao',
  'id',
  'imagem_ref',
  'local',
  'nome',
  'parcelamento_habilitado',
  'partida_brasilia',
  'partida_utc',
  'ponto_embarque',
  'prazo_segunda_parcela',
  'preco_centavos',
  'vagas_disponiveis',
];

let db: DatabaseSync;
let server: Server;
let baseUrl: string;
let relogio: Date;
let servico: ExcursaoService;
let adminId: number;

async function chamar(metodo: string, caminho: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${baseUrl}${caminho}`, { method: metodo, headers });
  const texto = await res.text();
  return { status: res.status, json: texto === '' ? null : (JSON.parse(texto) as Record<string, unknown>), headers: res.headers };
}

const lista = async (): Promise<Record<string, unknown>[]> => ((await chamar('GET', '/api/excursoes')).json?.['excursoes'] as Record<string, unknown>[]);

/** Cria pelo servico (como o administrador faria) e deixa na situacao pedida. */
function criar(extra: Record<string, unknown> = {}, situacao: 'rascunho' | 'publicada' | 'encerrada' | 'cancelada' = 'publicada'): number {
  const e = servico.criar(adminId, { ...VALIDA, ...extra });
  if (situacao === 'rascunho') return e.id;
  servico.mudarSituacao(adminId, e.id, { situacao: 'publicada' });
  if (situacao === 'encerrada') servico.mudarSituacao(adminId, e.id, { situacao: 'encerrada' });
  if (situacao === 'cancelada') servico.mudarSituacao(adminId, e.id, { situacao: 'cancelada' });
  return e.id;
}

const contar = (tabela: string): number => Number(db.prepare(`SELECT COUNT(*) AS n FROM ${tabela}`).get()?.['n']);

beforeEach(async () => {
  db = openDatabase(MEMORY_DATABASE);
  runMigrations(db);
  relogio = new Date('2026-11-13T12:00:00.000Z');
  const auth = new AuthService({ db, config: CONFIG, outbox: () => undefined, now: () => relogio });
  adminId = (
    await auth.createAdministrator({
      nome_completo: 'Ana Admin Ficticia',
      cpf: '529.982.247-25',
      data_nascimento: '1990-05-20',
      telefone: '(11) 98765-4321',
      email: 'ana.admin@exemplo.com',
      senha: SENHA,
    })
  ).id;
  servico = new ExcursaoService(db, () => relogio);
  server = createApp({ auth: { service: auth, config: CONFIG }, excursoes: servico });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  db.close();
});

describe('acesso publico (RF-015, RF-016)', () => {
  it('lista e detalhe respondem sem login e igual com ou sem cookie de sessao', async () => {
    const id = criar();
    const sem = await chamar('GET', '/api/excursoes');
    const com = await chamar('GET', '/api/excursoes', { Cookie: `sid=${'A'.repeat(43)}` });
    expect(sem.status).toBe(200);
    expect(com.json).toEqual(sem.json);
    expect((await chamar('GET', `/api/excursoes/${id}`)).status).toBe(200);
  });

  it('so aceita GET: os outros metodos respondem 405 com Allow', async () => {
    const id = criar();
    for (const metodo of ['POST', 'PATCH', 'PUT', 'DELETE']) {
      for (const caminho of ['/api/excursoes', `/api/excursoes/${id}`]) {
        const res = await chamar(metodo, caminho);
        expect(res.status, `${metodo} ${caminho}`).toBe(405);
        expect(res.headers.get('allow')).toBe('GET');
      }
    }
  });

  it('nao muda nada no banco: nem excursoes, nem auditoria, nem sessoes', async () => {
    const id = criar();
    const antes = [contar('excursao'), contar('auditoria'), contar('sessao'), JSON.stringify(db.prepare('SELECT * FROM excursao').all())];
    await chamar('GET', '/api/excursoes');
    await chamar('GET', `/api/excursoes/${id}`);
    await chamar('GET', '/api/excursoes/999');
    expect([contar('excursao'), contar('auditoria'), contar('sessao'), JSON.stringify(db.prepare('SELECT * FROM excursao').all())]).toEqual(antes);
  });

  it('sem o servico configurado responde 503, e id que nao e numero cai na rota desconhecida', async () => {
    const sem = createApp();
    await new Promise<void>((resolve) => sem.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${(sem.address() as AddressInfo).port}`;
    expect((await fetch(`${url}/api/excursoes`)).status).toBe(503);
    await new Promise<void>((resolve) => sem.close(() => resolve()));
    expect((await chamar('GET', '/api/excursoes/abc')).json).toEqual({ error: 'not_found' });
    expect((await chamar('GET', '/api/excursoes/1234567890123456')).json).toEqual({ error: 'not_found' });
  });
});

describe('quais excursoes aparecem (decisao 1)', () => {
  it('so as publicadas: rascunho, encerrada e cancelada ficam fora da lista e do detalhe', async () => {
    const publicada = criar({ nome: 'Publicada Ficticia' });
    const rascunho = criar({ nome: 'Rascunho Ficticio' }, 'rascunho');
    const encerrada = criar({ nome: 'Encerrada Ficticia' }, 'encerrada');
    const cancelada = criar({ nome: 'Cancelada Ficticia' }, 'cancelada');
    expect((await lista()).map((e) => e['nome'])).toEqual(['Publicada Ficticia']);
    expect((await chamar('GET', `/api/excursoes/${publicada}`)).status).toBe(200);
    for (const id of [rascunho, encerrada, cancelada]) {
      const res = await chamar('GET', `/api/excursoes/${id}`);
      expect(res.status).toBe(404);
      expect(res.json).toEqual({ error: 'nao_encontrada' });
    }
  });

  it('excursao nao publicada e excursao inexistente recebem exatamente a mesma resposta', async () => {
    const rascunho = criar({}, 'rascunho');
    const a = await chamar('GET', `/api/excursoes/${rascunho}`);
    const b = await chamar('GET', '/api/excursoes/99999');
    expect([a.status, a.json]).toEqual([b.status, b.json]);
  });

  it('despublicar ou encerrar tira da lista na hora', async () => {
    const id = criar();
    expect(await lista()).toHaveLength(1);
    servico.mudarSituacao(adminId, id, { situacao: 'encerrada' });
    expect(await lista()).toHaveLength(0);
  });

  it('esconde a excursao cuja data final ja passou, em Brasilia, e mostra a que termina hoje', async () => {
    const id = criar({ data_inicial: '2026-11-13', data_final: '2026-11-13', partida_utc: '2026-11-13T20:00:00.000Z', prazo_segunda_parcela: undefined, parcelamento_habilitado: false });
    // 2026-11-13T12:00Z = 09:00 em Brasilia: ainda e o dia 13
    expect((await lista()).map((e) => e['id'])).toEqual([id]);
    expect((await chamar('GET', `/api/excursoes/${id}`)).status).toBe(200);
    // 2026-11-14T02:30Z = 23:30 do dia 13 em Brasilia: ainda visivel
    relogio = new Date('2026-11-14T02:30:00.000Z');
    expect(await lista()).toHaveLength(1);
    // 2026-11-14T03:00Z = 00:00 do dia 14 em Brasilia: terminou
    relogio = new Date('2026-11-14T03:00:00.000Z');
    expect(await lista()).toHaveLength(0);
    expect((await chamar('GET', `/api/excursoes/${id}`)).status).toBe(404);
  });

  it('ordena da data inicial mais proxima para a mais distante, desempatando pelo id', async () => {
    const longe = criar({ nome: 'Longe', data_inicial: '2027-02-10', data_final: '2027-02-11', partida_utc: '2027-02-10T10:00:00.000Z', prazo_segunda_parcela: '2027-02-01' });
    const perto = criar({ nome: 'Perto', data_inicial: '2026-12-01', data_final: '2026-12-02', partida_utc: '2026-12-01T10:00:00.000Z', prazo_segunda_parcela: '2026-11-25' });
    const igual1 = criar({ nome: 'Igual 1', data_inicial: '2027-01-05', data_final: '2027-01-06', partida_utc: '2027-01-05T10:00:00.000Z', prazo_segunda_parcela: '2026-12-30' });
    const igual2 = criar({ nome: 'Igual 2', data_inicial: '2027-01-05', data_final: '2027-01-06', partida_utc: '2027-01-05T10:00:00.000Z', prazo_segunda_parcela: '2026-12-30' });
    expect((await lista()).map((e) => e['id'])).toEqual([perto, igual1, igual2, longe]);
  });

  it('limita a lista a 100 excursoes, as de data mais proxima', async () => {
    const iso = relogio.toISOString();
    const inserir = db.prepare(
      `INSERT INTO excursao (nome, descricao, local, ponto_embarque, data_inicial, data_final, partida_utc, capacidade, vagas_ocupadas, preco_centavos,
         parcelamento_habilitado, situacao, criado_em, atualizado_em)
       VALUES (?, '', 'Local', 'Ponto', ?, ?, '2027-06-01T10:00:00.000Z', 10, 0, 1000, 0, 'publicada', ?, ?)`,
    );
    for (let i = 0; i < 105; i += 1) {
      const dia = new Date(Date.UTC(2027, 5, 1 + i)).toISOString().slice(0, 10);
      inserir.run(`E${String(i).padStart(3, '0')}`, dia, dia, iso, iso);
    }
    const itens = await lista();
    expect(LIMITE_LISTA_PUBLICA).toBe(100);
    expect(itens).toHaveLength(100);
    expect(itens[0]?.['nome']).toBe('E000');
    expect(itens[99]?.['nome']).toBe('E099');
  });
});

describe('o que a resposta publica expoe (decisao 2, RNF-028)', () => {
  it('traz exatamente os campos decididos e nenhum campo interno', async () => {
    const id = criar();
    const detalhe = (await chamar('GET', `/api/excursoes/${id}`)).json?.['excursao'] as Record<string, unknown>;
    const item = (await lista())[0] as Record<string, unknown>;
    expect(Object.keys(detalhe).sort()).toEqual(CAMPOS_PUBLICOS);
    expect(Object.keys(item).sort()).toEqual(CAMPOS_PUBLICOS);
    for (const interno of ['capacidade', 'vagas_ocupadas', 'versao', 'criado_em', 'atualizado_em', 'situacao', 'edicao_restrita', 'campos_bloqueados', 'transicoes', 'prazo_segunda_parcela_utc']) {
      expect(detalhe).not.toHaveProperty(interno);
    }
  });

  it('a resposta nao contem nenhum dado pessoal do administrador nem da auditoria', async () => {
    criar();
    const corpo = JSON.stringify((await chamar('GET', '/api/excursoes')).json);
    for (const segredo of ['ana.admin', '52998224725', 'scrypt', SENHA, 'Ana Admin']) {
      expect(corpo).not.toContain(segredo);
    }
  });

  it('formatos: preco em centavos inteiros, partida em UTC e em Brasilia, prazo como data', async () => {
    const id = criar();
    const e = (await chamar('GET', `/api/excursoes/${id}`)).json?.['excursao'] as Record<string, unknown>;
    expect(e).toMatchObject({
      preco_centavos: 150000,
      partida_utc: '2026-12-10T10:00:00.000Z',
      partida_brasilia: { data: '2026-12-10', hora: '07:00' },
      parcelamento_habilitado: true,
      prazo_segunda_parcela: '2026-12-05',
      data_inicial: '2026-12-10',
      data_final: '2026-12-12',
    });
    expect(Number.isInteger(e['preco_centavos'])).toBe(true);
  });

  it('sem parcelamento, o prazo da segunda parcela vem nulo', async () => {
    const id = criar({ parcelamento_habilitado: false, prazo_segunda_parcela: undefined });
    const e = (await chamar('GET', `/api/excursoes/${id}`)).json?.['excursao'] as Record<string, unknown>;
    expect(e).toMatchObject({ parcelamento_habilitado: false, prazo_segunda_parcela: null });
  });

  it('imagem: devolve o caminho valido e esconde (null) qualquer valor fora do formato', async () => {
    const id = criar();
    const url = `/api/excursoes/${id}`;
    expect(((await chamar('GET', url)).json?.['excursao'] as Record<string, unknown>)['imagem_ref']).toBe('imagens/serra.jpg');
    for (const ruim of ['https://exemplo.com/a.jpg', '../segredo.jpg', 'imagens/../x.jpg', 'javascript:alert(1)']) {
      db.prepare('UPDATE excursao SET imagem_ref = ? WHERE id = ?').run(ruim, id);
      expect(((await chamar('GET', url)).json?.['excursao'] as Record<string, unknown>)['imagem_ref'], ruim).toBeNull();
    }
    db.prepare('UPDATE excursao SET imagem_ref = NULL WHERE id = ?').run(id);
    expect(((await chamar('GET', url)).json?.['excursao'] as Record<string, unknown>)['imagem_ref']).toBeNull();
  });
});

describe('disponibilidade de vagas (RF-017, RN-021)', () => {
  it('vagas livres = capacidade menos ocupadas, e zero quando esgotada', async () => {
    const id = criar({ capacidade: 20 });
    const ver = async () => ((await chamar('GET', `/api/excursoes/${id}`)).json?.['excursao'] as Record<string, unknown>)['vagas_disponiveis'];
    expect(await ver()).toBe(20);
    db.prepare('UPDATE excursao SET vagas_ocupadas = 7 WHERE id = ?').run(id);
    expect(await ver()).toBe(13);
    db.prepare('UPDATE excursao SET vagas_ocupadas = 19 WHERE id = ?').run(id);
    expect(await ver()).toBe(1);
    db.prepare('UPDATE excursao SET vagas_ocupadas = 20 WHERE id = ?').run(id);
    expect(await ver()).toBe(0);
    expect((await lista())[0]?.['vagas_disponiveis']).toBe(0);
  });

  it('excursao esgotada continua na lista', async () => {
    const id = criar();
    db.prepare('UPDATE excursao SET vagas_ocupadas = capacidade WHERE id = ?').run(id);
    expect(await lista()).toHaveLength(1);
  });

  it('a funcao nunca devolve valor negativo', () => {
    expect(vagasDisponiveis(10, 3)).toBe(7);
    expect(vagasDisponiveis(10, 10)).toBe(0);
    expect(vagasDisponiveis(10, 15)).toBe(0);
  });

  it('a retencao ativa reduz o numero exibido; expirada ou cancelada nao (RF-017, AGT-008)', async () => {
    const id = criar();
    const iso = relogio.toISOString();
    const ver = async () => ((await chamar('GET', `/api/excursoes/${id}`)).json?.['excursao'] as Record<string, unknown>)['vagas_disponiveis'];
    db.prepare("INSERT INTO usuario (nome_completo, cpf, email, data_nascimento, telefone, senha_hash, perfil, criado_em, atualizado_em) VALUES ('P F','11144477735','p@exemplo.com','1990-01-01','+5511900000000','x','passageiro',?,?)").run(iso, iso);
    const uid = Number(db.prepare("SELECT id FROM usuario WHERE email = 'p@exemplo.com'").get()?.['id']);
    const reserva = Number(db.prepare("INSERT INTO reserva (usuario_id, excursao_id, modalidade, situacao, criado_em, atualizado_em) VALUES (?,?,'integral','aguardando_pagamento',?,?)").run(uid, id, iso, iso).lastInsertRowid);
    const retencao = Number(
      db.prepare("INSERT INTO retencao_vaga (reserva_id, criado_em, expira_em, situacao) VALUES (?,?,?, 'ativa')").run(reserva, iso, new Date(relogio.getTime() + 600_000).toISOString()).lastInsertRowid,
    );
    expect(await ver()).toBe(19);
    expect((await lista())[0]?.['vagas_disponiveis']).toBe(19);
    // prazo vencido (mesmo sem ter sido marcada como expirada) nao conta
    db.prepare('UPDATE retencao_vaga SET criado_em = ?, expira_em = ? WHERE id = ?').run(new Date(relogio.getTime() - 2000).toISOString(), new Date(relogio.getTime() - 1000).toISOString(), retencao);
    expect(await ver()).toBe(20);
    // cancelada, expirada e confirmada nao contam como retencao
    db.prepare("UPDATE retencao_vaga SET expira_em = ?, situacao = 'cancelada' WHERE id = ?").run(new Date(relogio.getTime() + 600_000).toISOString(), retencao);
    expect(await ver()).toBe(20);
    // a resposta publica continua sem capacidade, ocupacao nem retencoes
    const corpo = JSON.stringify((await chamar('GET', `/api/excursoes/${id}`)).json);
    for (const proibido of ['retidas', 'retencao', 'vagas_ocupadas', 'capacidade']) expect(corpo).not.toContain(proibido);
  });
});
