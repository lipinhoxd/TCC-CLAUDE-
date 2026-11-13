import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadDatabaseConfig } from '../server/db/config.ts';
import { MEMORY_DATABASE, openDatabase } from '../server/db/connection.ts';
import { MigrationError, runMigrations } from '../server/db/migrate.ts';
import { migrations } from '../server/db/migrations.ts';

const T = '2026-12-01T12:00:00.000Z';

function usuario(db: DatabaseSync, over: Record<string, string> = {}): number {
  const v = {
    nome: 'Pessoa Ficticia',
    cpf: '00000000001',
    email: 'pessoa1@exemplo.invalid',
    nasc: '1990-01-01',
    tel: '+5500000000001',
    perfil: 'passageiro',
    ...over,
  };
  const r = db
    .prepare(
      `INSERT INTO usuario (nome_completo, cpf, email, data_nascimento, telefone, senha_hash, perfil, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, 'hash-ficticio', ?, ?, ?)`,
    )
    .run(v.nome, v.cpf, v.email, v.nasc, v.tel, v.perfil, T, T);
  return Number(r.lastInsertRowid);
}

function excursao(db: DatabaseSync, over: Record<string, string | number | null> = {}): number {
  const v = {
    capacidade: 2,
    ocupadas: 0,
    parcelamento: 0,
    prazo: null as string | number | null,
    ...over,
  };
  const r = db
    .prepare(
      `INSERT INTO excursao (nome, local, ponto_embarque, data_inicial, data_final, partida_utc, capacidade,
         vagas_ocupadas, preco_centavos, parcelamento_habilitado, prazo_segunda_parcela_utc, criado_em, atualizado_em)
       VALUES ('Excursao Ficticia', 'Local', 'Ponto', '2027-01-10', '2027-01-12', '2027-01-10T08:00:00.000Z',
         ?, ?, 15000, ?, ?, ?, ?)`,
    )
    .run(v.capacidade, v.ocupadas, v.parcelamento, v.prazo, T, T);
  return Number(r.lastInsertRowid);
}

function reserva(db: DatabaseSync, usuarioId: number, excursaoId: number): number {
  const r = db
    .prepare('INSERT INTO reserva (usuario_id, excursao_id, criado_em, atualizado_em) VALUES (?, ?, ?, ?)')
    .run(usuarioId, excursaoId, T, T);
  return Number(r.lastInsertRowid);
}

let db: DatabaseSync;

beforeEach(() => {
  db = openDatabase(MEMORY_DATABASE);
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

describe('migracoes', () => {
  it('cria todas as entidades do modelo conceitual', () => {
    const tabelas = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((r) => String(r['name']));
    expect(tabelas).toEqual(
      expect.arrayContaining([
        'usuario',
        'excursao',
        'reserva',
        'pagamento',
        'retencao_vaga',
        'reembolso',
        'auditoria',
        'sessao',
        'token_acesso',
        'schema_migrations',
      ]),
    );
  });

  it('e repetivel: a segunda execucao nao aplica nada', () => {
    expect(runMigrations(db)).toEqual([]);
    expect(db.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get()?.['n']).toBe(migrations.length);
  });

  it('recria o banco do zero em arquivo e o configura com chaves estrangeiras', () => {
    const dir = mkdtempSync(join(tmpdir(), 'excursoes-db-'));
    try {
      const arquivo = openDatabase(join(dir, 'sub', 'teste.sqlite'));
      expect(runMigrations(arquivo)).toEqual(migrations.map((m) => m.version));
      expect(arquivo.prepare('PRAGMA foreign_keys').get()?.['foreign_keys']).toBe(1);
      arquivo.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('detecta migracao aplicada que foi alterada', () => {
    const alterada = migrations.map((m) => ({ ...m, sql: `${m.sql}\n-- editada` }));
    expect(() => runMigrations(db, alterada)).toThrow(MigrationError);
  });

  it('desfaz a migracao inteira se uma instrucao falhar', () => {
    const outro = openDatabase(MEMORY_DATABASE);
    const ruim = [{ version: 1, name: 'ruim', sql: 'CREATE TABLE a (x INTEGER); CREATE TABLE a (y INTEGER);' }];
    expect(() => runMigrations(outro, ruim)).toThrow();
    const a = outro.prepare("SELECT name FROM sqlite_master WHERE name = 'a'").all();
    expect(a).toHaveLength(0);
    expect(outro.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get()?.['n']).toBe(0);
    outro.close();
  });

  it('rejeita versoes fora de ordem', () => {
    const outro = openDatabase(MEMORY_DATABASE);
    const fora = [
      { version: 2, name: 'b', sql: 'SELECT 1' },
      { version: 1, name: 'a', sql: 'SELECT 1' },
    ];
    expect(() => runMigrations(outro, fora)).toThrow(MigrationError);
    outro.close();
  });
});

describe('configuracao', () => {
  it('usa o padrao e le DATABASE_PATH', () => {
    expect(loadDatabaseConfig({}).path).toBe('data/excursoes.sqlite');
    expect(loadDatabaseConfig({ DATABASE_PATH: ' :memory: ' }).path).toBe(':memory:');
  });
});

describe('usuario (RN-002, RN-003)', () => {
  it('rejeita CPF duplicado', () => {
    usuario(db);
    expect(() => usuario(db, { email: 'outro@exemplo.invalid' })).toThrow(/UNIQUE/);
  });

  it('rejeita e-mail duplicado', () => {
    usuario(db);
    expect(() => usuario(db, { cpf: '00000000002' })).toThrow(/UNIQUE/);
  });

  it('exige CPF com 11 digitos e e-mail em minusculas', () => {
    expect(() => usuario(db, { cpf: '123' })).toThrow(/CHECK/);
    expect(() => usuario(db, { cpf: '0000000000a' })).toThrow(/CHECK/);
    expect(() => usuario(db, { email: 'Maiuscula@exemplo.invalid', cpf: '00000000003' })).toThrow(/CHECK/);
  });

  it('restringe o perfil', () => {
    expect(() => usuario(db, { perfil: 'root' })).toThrow(/CHECK/);
  });
});

describe('excursao: capacidade, centavos e UTC (RN-021, RN-038, RN-039)', () => {
  it('nao aceita ocupacao acima da capacidade na criacao', () => {
    expect(() => excursao(db, { capacidade: 2, ocupadas: 3 })).toThrow(/CHECK/);
  });

  it('nao aceita atualizar a ocupacao acima da capacidade nem abaixo de zero', () => {
    const id = excursao(db, { capacidade: 1 });
    expect(() => db.prepare('UPDATE excursao SET vagas_ocupadas = 2 WHERE id = ?').run(id)).toThrow(/CHECK/);
    expect(() => db.prepare('UPDATE excursao SET vagas_ocupadas = -1 WHERE id = ?').run(id)).toThrow(/CHECK/);
  });

  it('reserva vaga com UPDATE condicional: a ultima vaga so e obtida uma vez', () => {
    const id = excursao(db, { capacidade: 1 });
    const reservar = db.prepare(
      'UPDATE excursao SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = ? AND vagas_ocupadas < capacidade',
    );
    expect(reservar.run(id).changes).toBe(1);
    expect(reservar.run(id).changes).toBe(0);
  });

  it('exige capacidade positiva, preco inteiro nao negativo e instante em formato UTC', () => {
    expect(() => excursao(db, { capacidade: 0 })).toThrow(/CHECK/);
    expect(() =>
      db.prepare("UPDATE excursao SET preco_centavos = -1 WHERE id = ?").run(excursao(db)),
    ).toThrow(/CHECK/);
    expect(() =>
      db.prepare("UPDATE excursao SET partida_utc = '2027-01-10 08:00' WHERE id = ?").run(excursao(db)),
    ).toThrow(/CHECK/);
  });

  it('o tipo STRICT recusa preco com casas decimais', () => {
    const id = excursao(db);
    expect(() => db.prepare('UPDATE excursao SET preco_centavos = 10.5 WHERE id = ?').run(id)).toThrow();
  });

  it('exige prazo da 2a parcela anterior a partida quando ha parcelamento', () => {
    expect(() => excursao(db, { parcelamento: 1 })).toThrow(/CHECK/);
    expect(() => excursao(db, { parcelamento: 1, prazo: '2027-01-11T00:00:00.000Z' })).toThrow(/CHECK/);
    expect(excursao(db, { parcelamento: 1, prazo: '2027-01-05T23:59:59.000Z' })).toBeGreaterThan(0);
  });
});

describe('integridade referencial e reservas', () => {
  it('nao aceita reserva de usuario ou excursao inexistente', () => {
    expect(() => reserva(db, 999, 999)).toThrow(/FOREIGN KEY/);
  });

  it('nao permite excluir usuario com reserva', () => {
    const u = usuario(db);
    reserva(db, u, excursao(db));
    expect(() => db.prepare('DELETE FROM usuario WHERE id = ?').run(u)).toThrow(/FOREIGN KEY/);
  });

  it('permite so uma reserva nao cancelada por passageiro e excursao', () => {
    const u = usuario(db);
    const e = excursao(db);
    const r = reserva(db, u, e);
    expect(() => reserva(db, u, e)).toThrow(/UNIQUE/);
    db.prepare("UPDATE reserva SET situacao = 'cancelada' WHERE id = ?").run(r);
    expect(reserva(db, u, e)).toBeGreaterThan(r);
  });

  it('restringe as situacoes da reserva (RN-023)', () => {
    const r = reserva(db, usuario(db), excursao(db));
    expect(() => db.prepare("UPDATE reserva SET situacao = 'qualquer' WHERE id = ?").run(r)).toThrow(/CHECK/);
  });

  it('pagamento: valor positivo, uma linha por parcela e confirmacao com data', () => {
    const r = reserva(db, usuario(db), excursao(db));
    const ins = db.prepare(
      'INSERT INTO pagamento (reserva_id, parcela, valor_centavos, situacao, confirmado_em, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    expect(() => ins.run(r, 'unica', 0, 'pendente', null, T, T)).toThrow(/CHECK/);
    expect(() => ins.run(r, 'unica', 100, 'confirmado', null, T, T)).toThrow(/CHECK/);
    ins.run(r, 'unica', 100, 'pendente', null, T, T);
    expect(() => ins.run(r, 'unica', 100, 'pendente', null, T, T)).toThrow(/UNIQUE/);
  });

  it('retencao: validade posterior a criacao e uma ativa por reserva', () => {
    const r = reserva(db, usuario(db), excursao(db));
    const ins = db.prepare('INSERT INTO retencao_vaga (reserva_id, criado_em, expira_em) VALUES (?, ?, ?)');
    expect(() => ins.run(r, T, T)).toThrow(/CHECK/);
    ins.run(r, T, '2026-12-01T12:15:00.000Z');
    expect(() => ins.run(r, T, '2026-12-01T12:20:00.000Z')).toThrow(/UNIQUE/);
  });

  it('reembolso: percentual entre 0 e 100 e valor nao negativo', () => {
    const r = reserva(db, usuario(db), excursao(db));
    const ins = db.prepare(
      'INSERT INTO reembolso (reserva_id, valor_centavos, percentual_aplicado, motivo, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?)',
    );
    expect(() => ins.run(r, 100, 101, 'x', T, T)).toThrow(/CHECK/);
    expect(() => ins.run(r, -1, 50, 'x', T, T)).toThrow(/CHECK/);
    ins.run(r, 7500, 50, 'cancelamento', T, T);
  });
});

describe('sessao e token: so hash e validade', () => {
  it('nao guarda segredo em claro e exige validade positiva', () => {
    const u = usuario(db);
    const colunas = db
      .prepare("SELECT name FROM pragma_table_info('sessao') UNION SELECT name FROM pragma_table_info('token_acesso')")
      .all()
      .map((r) => String(r['name']));
    expect(colunas).toContain('token_hash');
    expect(colunas).not.toContain('token');
    const ins = db.prepare('INSERT INTO sessao (usuario_id, token_hash, criado_em, expira_em) VALUES (?, ?, ?, ?)');
    expect(() => ins.run(u, 'h1', T, T)).toThrow(/CHECK/);
    ins.run(u, 'h1', T, '2026-12-02T12:00:00.000Z');
    expect(() => ins.run(u, 'h1', T, '2026-12-02T12:00:00.000Z')).toThrow(/UNIQUE/);
  });

  it('apaga sessoes e tokens junto com o usuario sem reservas', () => {
    const u = usuario(db);
    db.prepare('INSERT INTO sessao (usuario_id, token_hash, criado_em, expira_em) VALUES (?, ?, ?, ?)').run(
      u,
      'h2',
      T,
      '2026-12-02T12:00:00.000Z',
    );
    db.prepare('DELETE FROM usuario WHERE id = ?').run(u);
    expect(db.prepare('SELECT COUNT(*) AS n FROM sessao').get()?.['n']).toBe(0);
  });
});
