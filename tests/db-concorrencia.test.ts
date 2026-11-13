import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../server/db/connection.ts';
import { runMigrations } from '../server/db/migrate.ts';
import { withTransaction } from '../server/db/transaction.ts';

const T = '2026-12-01T12:00:00.000Z';
let dir: string;
let a: DatabaseSync;
let b: DatabaseSync;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'excursoes-conc-'));
  const caminho = join(dir, 'conc.sqlite');
  a = openDatabase(caminho);
  runMigrations(a);
  b = openDatabase(caminho);
  b.exec('PRAGMA busy_timeout = 0');
  a.prepare(
    `INSERT INTO excursao (nome, local, ponto_embarque, data_inicial, data_final, partida_utc, capacidade,
       preco_centavos, criado_em, atualizado_em)
     VALUES ('Excursao Ficticia', 'Local', 'Ponto', '2027-01-10', '2027-01-12', '2027-01-10T08:00:00.000Z', 1, 100, ?, ?)`,
  ).run(T, T);
});

afterEach(() => {
  a.close();
  b.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('concorrencia entre conexoes (base para RN-040 na AGT-008)', () => {
  it('uma transacao IMMEDIATE impede a segunda conexao de iniciar escrita', () => {
    withTransaction(a, () => {
      expect(() => b.exec('BEGIN IMMEDIATE')).toThrow(/locked|busy/i);
    });
    // Liberado o bloqueio, a segunda conexao consegue.
    expect(() => withTransaction(b, () => 1)).not.toThrow();
  });

  it('com a ultima vaga, so uma das conexoes consegue ocupa-la', () => {
    const reservar = (db: DatabaseSync): number =>
      Number(
        db
          .prepare(
            'UPDATE excursao SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = 1 AND vagas_ocupadas < capacidade',
          )
          .run().changes,
      );
    const resultados = [withTransaction(a, () => reservar(a)), withTransaction(b, () => reservar(b))];
    expect(resultados.sort()).toEqual([0, 1]);
    expect(a.prepare('SELECT vagas_ocupadas AS v FROM excursao WHERE id = 1').get()?.['v']).toBe(1);
  });

  it('uma leitura feita antes da escrita nao e atropelada: o UPDATE condicional continua correto', () => {
    // b leu "ha vaga" antes de a ocupar; ao gravar, a condicao do UPDATE reavalia e falha.
    const antes = b.prepare('SELECT capacidade - vagas_ocupadas AS livres FROM excursao WHERE id = 1').get();
    expect(antes?.['livres']).toBe(1);
    withTransaction(a, () => a.prepare('UPDATE excursao SET vagas_ocupadas = 1 WHERE id = 1').run());
    const r = withTransaction(b, () =>
      b
        .prepare('UPDATE excursao SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = 1 AND vagas_ocupadas < capacidade')
        .run(),
    );
    expect(Number(r.changes)).toBe(0);
  });
});
