import { mkdtempSync, rmSync } from 'node:fs';
import { request } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/app.ts';
import { loadAuthConfig } from '../server/auth/config.ts';
import type { AuthConfig } from '../server/auth/config.ts';
import { AuthService } from '../server/auth/service.ts';
import { HttpError } from '../server/auth/support.ts';
import { MEMORY_DATABASE, openDatabase } from '../server/db/connection.ts';
import { runMigrations } from '../server/db/migrate.ts';
import { EXCURSAO, INICIO, MIN, SENHA, criarPlataforma } from './helpers/plataforma.ts';
import type { Plataforma } from './helpers/plataforma.ts';

/**
 * Revisao tecnica final (AGT-018): verificacoes dos requisitos nao funcionais que valem para o sistema inteiro e a reproducao dos
 * defeitos encontrados na revisao do codigo.
 */

const CONFIG: AuthConfig = {
  sessionTtlMs: 8 * 3_600_000,
  recoveryTtlMs: 30 * MIN,
  loginMaxAttempts: 3,
  loginWindowMs: 15 * MIN,
  cookieSecure: false,
  scrypt: { N: 1024, r: 8, p: 1 },
  recoveryOutboxPath: null,
};

/** Todas as rotas administrativas e do passageiro, com um identificador qualquer. */
const ROTAS_ADMIN: Array<[string, string]> = [
  ['GET', '/api/admin/ping'],
  ['GET', '/api/admin/painel'],
  ['GET', '/api/admin/historico'],
  ['GET', '/api/admin/reservas'],
  ['GET', '/api/admin/reservas/1'],
  ['POST', '/api/admin/reservas/1/situacao'],
  ['GET', '/api/admin/pendencias'],
  ['POST', '/api/admin/pendencias/1/reembolso'],
  ['GET', '/api/admin/excursoes/1/cancelamento'],
  ['POST', '/api/admin/excursoes/1/cancelamento'],
  ['GET', '/api/admin/reembolsos'],
  ['POST', '/api/admin/reembolsos/1/processar'],
  ['GET', '/api/admin/passageiros'],
  ['GET', '/api/admin/passageiros/1'],
  ['GET', '/api/admin/excursoes'],
  ['POST', '/api/admin/excursoes'],
  ['GET', '/api/admin/excursoes/1'],
  ['PATCH', '/api/admin/excursoes/1'],
  ['POST', '/api/admin/excursoes/1/situacao'],
  ['GET', '/api/admin/excursoes/1/historico'],
];
const ROTAS_PASSAGEIRO: Array<[string, string]> = [
  ['GET', '/api/reservas'],
  ['POST', '/api/reservas'],
  ['GET', '/api/reservas/1'],
  ['POST', '/api/reservas/1/checkout'],
  ['POST', '/api/reservas/1/pagamento'],
  ['POST', '/api/reservas/1/pagamento/simulacao'],
  ['GET', '/api/reservas/1/cancelamento'],
  ['POST', '/api/reservas/1/cancelamento'],
  ['POST', '/api/reservas/1/desistir'],
  ['GET', '/api/avisos'],
];

describe('acesso em todas as rotas (RNF-002, RNF-004)', () => {
  let p: Plataforma;
  beforeEach(async () => {
    p = await criarPlataforma();
  });
  afterEach(async () => {
    await p.fechar();
  });

  it('administracao: visitante 401, passageiro 403, sem alterar o banco', async () => {
    const e = await p.publicar();
    const passageiro = await p.passageiro();
    await p.reservaPaga(passageiro, e);
    const retrato = () => JSON.stringify(['excursao', 'reserva', 'pagamento', 'reembolso'].map((t) => p.db.prepare(`SELECT * FROM ${t}`).all()));
    const antes = retrato();
    for (const [metodo, caminho] of ROTAS_ADMIN) {
      const corpo = metodo === 'GET' ? undefined : {};
      expect((await p.chamar(metodo, caminho, corpo)).status, `${metodo} ${caminho}`).toBe(401);
      expect((await passageiro.chamar(metodo, caminho, corpo)).status, `${metodo} ${caminho}`).toBe(403);
    }
    expect(retrato()).toBe(antes);
  });

  it('passageiro: visitante 401, administrador 403, e a reserva de outra pessoa nao existe', async () => {
    const e = await p.publicar();
    const dona = await p.passageiro();
    const outra = await p.passageiro();
    const id = await p.reservar(dona, e);
    expect(id).toBe(1);
    for (const [metodo, caminho] of ROTAS_PASSAGEIRO) {
      const corpo = metodo === 'GET' ? undefined : {};
      expect((await p.chamar(metodo, caminho, corpo)).status, `${metodo} ${caminho}`).toBe(401);
      expect((await p.admin.chamar(metodo, caminho, corpo)).status, `${metodo} ${caminho}`).toBe(403);
    }
    for (const [metodo, caminho] of ROTAS_PASSAGEIRO.filter(([, c]) => c.includes('/1'))) {
      const corpo = metodo === 'GET' ? undefined : caminho.endsWith('cancelamento') ? { percentual_previsto: 100 } : caminho.endsWith('simulacao') ? { resultado: 'aprovado' } : {};
      expect((await outra.chamar(metodo, caminho, corpo)).status, `${metodo} ${caminho}`).toBe(404);
    }
    expect(p.situacao(id)).toBe('aguardando_pagamento');
  });
});

describe('entradas invalidas nunca viram erro interno (RNF-003, RNF-010)', () => {
  it('cada rota que recebe corpo responde 4xx a corpos malformados', async () => {
    const p = await criarPlataforma();
    try {
      const e = await p.publicar();
      const passageiro = await p.passageiro();
      await p.reservar(passageiro, e);
      const corpos: unknown[] = [
        '{quebrado',
        'null',
        '[]',
        '"texto"',
        '{}',
        JSON.stringify({ campo_estranho: 'x' }),
        JSON.stringify({ excursao_id: '1; DROP TABLE usuario', modalidade: 7, resultado: {}, situacao: [], justificativa: 9, percentual_previsto: '100', versao: 1 }),
        JSON.stringify({ nome_completo: 'a'.repeat(5000), cpf: 1, email: [], senha: {}, data_nascimento: 0, telefone: true, token: 'x', nova_senha: 1 }),
        JSON.stringify({ nome: '\u0000', capacidade: 1e308, preco_centavos: -1, partida_utc: 'amanha', data_inicial: '2026-02-30' }),
        'x'.repeat(40_000),
      ];
      const publicas: Array<[string, string]> = [
        ['POST', '/api/auth/register'],
        ['POST', '/api/auth/login'],
        ['POST', '/api/auth/recovery/request'],
        ['POST', '/api/auth/recovery/confirm'],
      ];
      const alvos = [
        ...publicas.map((r) => ({ r, quem: p.chamar })),
        ...[...ROTAS_ADMIN, ['PATCH', '/api/me'] as [string, string]].filter(([m]) => m !== 'GET').map((r) => ({ r, quem: p.admin.chamar })),
        ...ROTAS_PASSAGEIRO.filter(([m]) => m !== 'GET').map((r) => ({ r, quem: passageiro.chamar })),
      ];
      for (const { r: [metodo, caminho], quem } of alvos) {
        for (const corpo of corpos) {
          // o texto vai cru, para testar tambem o que nao e JSON valido
          const resposta = await quem(metodo, caminho, typeof corpo === 'string' ? JSON.parse(JSON.stringify(corpo)) : corpo);
          expect(resposta.status, `${metodo} ${caminho} ${String(corpo).slice(0, 40)}`).toBeLessThan(500);
        }
      }
      p.invariantes();
    } finally {
      await p.fechar();
    }
  });

  it('endereco malformado responde 400, e nao 500', async () => {
    const server = createApp();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const status = await new Promise<number>((resolve, reject) => {
        request({ host: '127.0.0.1', port: (server.address() as AddressInfo).port, path: '//[', method: 'GET' }, (res) => {
          res.resume();
          resolve(res.statusCode ?? 0);
        })
          .on('error', reject)
          .end();
      });
      expect(status).toBe(400);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

describe('banco ocupado responde 503 em qualquer area (RNF-010)', () => {
  it('cadastro, entrada, excursoes, reservas e administracao', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'excursoes-ocupado-'));
    const caminho = join(dir, 'ocupado.sqlite');
    const p = await criarPlataforma(openDatabase(caminho));
    const outra = openDatabase(caminho);
    try {
      const e = await p.publicar();
      const passageiro = await p.passageiro();
      p.db.exec('PRAGMA busy_timeout = 0');
      outra.exec('BEGIN IMMEDIATE');
      const pedidos = {
        cadastro: await p.chamar('POST', '/api/auth/register', p.dadosDeCadastro()),
        entrada: await p.entrar(passageiro.email),
        excursao: await p.admin.chamar('POST', '/api/admin/excursoes', EXCURSAO),
        reserva: await passageiro.chamar('POST', '/api/reservas', { excursao_id: e }),
        pendencias: await p.admin.chamar('GET', '/api/admin/pendencias'),
      };
      outra.exec('ROLLBACK');
      for (const [nome, r] of Object.entries(pedidos)) {
        expect([nome, r.status, r.json['error']]).toEqual([nome, 503, 'banco_ocupado']);
      }
    } finally {
      outra.close();
      await p.fechar();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('limite de tentativas e recuperacao de acesso (RNF-001, RNF-006)', () => {
  function servico(config: Partial<AuthConfig> = {}) {
    const db = openDatabase(MEMORY_DATABASE);
    runMigrations(db);
    const auth = new AuthService({ db, config: { ...CONFIG, ...config }, outbox: () => undefined, now: () => INICIO });
    return { db, auth };
  }
  const codigos = async (pedidos: Array<Promise<unknown>>) =>
    (await Promise.allSettled(pedidos)).map((r) => (r.status === 'fulfilled' ? 200 : r.reason instanceof HttpError ? r.reason.status : 500));
  const cadastro = { nome_completo: 'Joana Passageira Ficticia', cpf: '52998224725', data_nascimento: '1990-05-20', telefone: '(11) 98765-4321', email: 'joana@exemplo.com', senha: SENHA };

  it('pedidos simultaneos nao passam do limite de tentativas por conta', async () => {
    const { db, auth } = servico();
    await auth.register(cadastro);
    const respostas = await codigos(Array.from({ length: 12 }, () => auth.login({ email: cadastro.email, senha: 'Senha-errada-2026' }, '10.0.0.1')));
    expect(respostas.filter((s) => s === 401)).toHaveLength(3);
    expect(respostas.filter((s) => s === 429)).toHaveLength(9);
    db.close();
  });

  it('pedidos simultaneos nao passam do limite por endereco, e entradas certas nao contam como falha', async () => {
    const { db, auth } = servico();
    await auth.register(cadastro);
    for (let i = 0; i < 20; i += 1) await auth.login({ email: cadastro.email, senha: SENHA }, '10.0.0.2');
    const respostas = await codigos(Array.from({ length: 30 }, (_, i) => auth.login({ email: `ninguem${i}@exemplo.com`, senha: 'Senha-errada-2026' }, '10.0.0.2')));
    expect(respostas.filter((s) => s === 401)).toHaveLength(12); // limite por endereco: 4 vezes o da conta
    expect(respostas.filter((s) => s === 429)).toHaveLength(18);
    db.close();
  });

  it('token desconhecido e recusado antes de calcular o hash da senha nova', async () => {
    // parametro impossivel: se o hash fosse calculado, o erro seria outro
    const { db, auth } = servico({ scrypt: { N: 3, r: 8, p: 1 } });
    await expect(auth.confirmRecovery({ token: 'A'.repeat(43), nova_senha: 'Nova-senha-2026' })).rejects.toMatchObject({ status: 400, code: 'token_invalido' });
    db.close();
  });

  it('a configuracao de producao usa scrypt forte e cookie seguro, e o banco guarda so os resumos', async () => {
    const producao = loadAuthConfig({ NODE_ENV: 'production' });
    expect(producao.scrypt).toEqual({ N: 65536, r: 8, p: 2 });
    expect(producao.cookieSecure).toBe(true);
    expect(producao.recoveryOutboxPath).toBeNull();
    const { db, auth } = servico();
    await auth.register(cadastro);
    const entrada = await auth.login({ email: cadastro.email, senha: SENHA }, '10.0.0.3');
    const guardado = JSON.stringify([db.prepare('SELECT senha_hash FROM usuario').all(), db.prepare('SELECT token_hash FROM sessao').all()]);
    expect(guardado).toContain('scrypt$1024$8$1$');
    expect(guardado).not.toContain(SENHA);
    expect(guardado).not.toContain(entrada.token);
    db.close();
  });
});

describe('integridade do banco depois dos fluxos (RNF-007)', () => {
  it('as chaves estrangeiras e a estrutura continuam integras', async () => {
    const p = await criarPlataforma();
    try {
      const e = await p.publicar();
      const a = await p.passageiro();
      const b = await p.passageiro();
      await p.reservaPaga(a, e);
      const parcelada = await p.reservaPaga(b, e, 'parcelada');
      await p.cancelar(b, parcelada);
      await p.admin.chamar('POST', `/api/admin/excursoes/${e}/cancelamento`, { justificativa: 'Motivo ficticio.' });
      p.rotina();
      expect(p.db.prepare('PRAGMA foreign_keys').get()).toMatchObject({ foreign_keys: 1 });
      expect(p.db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
      expect(p.db.prepare('PRAGMA integrity_check').get()).toMatchObject({ integrity_check: 'ok' });
      p.invariantes();
    } finally {
      await p.fechar();
    }
  });
});

describe('dados pessoais nas respostas (RNF-005, RNF-028)', () => {
  it('as respostas publicas e do passageiro nao trazem CPF, telefone nem dados de outras pessoas', async () => {
    const p = await criarPlataforma();
    try {
      const e = await p.publicar();
      const a = await p.passageiro();
      const b = await p.passageiro();
      await p.reservaPaga(a, e);
      await p.reservaPaga(b, e);
      p.rotina();
      const publicas = (await p.chamar('GET', '/api/excursoes')).texto + (await p.chamar('GET', `/api/excursoes/${e}`)).texto;
      expect(publicas).not.toMatch(/@exemplo|Passageira|cpf|telefone|vagas_ocupadas|capacidade/);
      const doA = (await a.chamar('GET', '/api/reservas')).texto + (await a.chamar('GET', '/api/reservas/1')).texto + (await a.chamar('GET', '/api/avisos')).texto;
      expect(doA).not.toContain(b.email);
      expect(doA).not.toContain(a.cpf);
      expect(doA).not.toMatch(/98765-?4321|senha|hash/);
      const eu = await a.chamar('GET', '/api/me');
      expect(eu.texto).not.toContain(a.cpf);
      expect(eu.texto).toContain(`***.***.***-${a.cpf.slice(9)}`);
      const listaAdmin = (await p.admin.chamar('GET', '/api/admin/passageiros')).texto;
      expect(listaAdmin).not.toContain(a.cpf);
      expect(listaAdmin).not.toMatch(/98765-?4321|1990-05-20|senha|hash/);
    } finally {
      await p.fechar();
    }
  });
});
