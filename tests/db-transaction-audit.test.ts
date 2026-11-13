import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuditError, registrarAuditoria } from '../server/db/audit.ts';
import { MEMORY_DATABASE, openDatabase } from '../server/db/connection.ts';
import { runMigrations } from '../server/db/migrate.ts';
import { withTransaction } from '../server/db/transaction.ts';

const T = '2026-12-01T12:00:00.000Z';
let db: DatabaseSync;

function inserirExcursao(): number {
  const r = db
    .prepare(
      `INSERT INTO excursao (nome, local, ponto_embarque, data_inicial, data_final, partida_utc, capacidade,
         preco_centavos, criado_em, atualizado_em)
       VALUES ('Excursao Ficticia', 'Local', 'Ponto', '2027-01-10', '2027-01-12', '2027-01-10T08:00:00.000Z', 1, 100, ?, ?)`,
    )
    .run(T, T);
  return Number(r.lastInsertRowid);
}

const contar = (tabela: string): number => Number(db.prepare(`SELECT COUNT(*) AS n FROM ${tabela}`).get()?.['n']);

beforeEach(() => {
  db = openDatabase(MEMORY_DATABASE);
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

describe('transacoes (RNF-009)', () => {
  it('confirma as gravacoes quando a funcao termina', () => {
    const id = withTransaction(db, () => inserirExcursao());
    expect(id).toBeGreaterThan(0);
    expect(contar('excursao')).toBe(1);
    expect(db.isTransaction).toBe(false);
  });

  it('desfaz tudo quando a funcao lanca erro', () => {
    expect(() =>
      withTransaction(db, () => {
        inserirExcursao();
        throw new Error('falha no meio da operacao');
      }),
    ).toThrow('falha no meio da operacao');
    expect(contar('excursao')).toBe(0);
    expect(db.isTransaction).toBe(false);
  });

  it('desfaz tudo quando uma restricao do banco e violada', () => {
    const id = inserirExcursao();
    expect(() =>
      withTransaction(db, () => {
        db.prepare('UPDATE excursao SET vagas_ocupadas = 1 WHERE id = ?').run(id);
        db.prepare('UPDATE excursao SET vagas_ocupadas = 2 WHERE id = ?').run(id);
      }),
    ).toThrow(/CHECK/);
    expect(db.prepare('SELECT vagas_ocupadas AS v FROM excursao WHERE id = ?').get(id)?.['v']).toBe(0);
  });

  it('nao aceita transacao aninhada', () => {
    expect(() => withTransaction(db, () => withTransaction(db, () => 1))).toThrow(/aninhadas/);
    expect(db.isTransaction).toBe(false);
  });
});

describe('auditoria (RN-041, RN-042)', () => {
  it('registra evento sem dados sensiveis', () => {
    const id = registrarAuditoria(db, {
      atorUsuarioId: null,
      acao: 'excursao.publicar',
      entidade: 'excursao',
      registroId: 1,
      estadoAnterior: { situacao: 'rascunho' },
      estadoNovo: { situacao: 'publicada' },
      ocorridoEm: new Date(T),
    });
    const linha = db.prepare('SELECT * FROM auditoria WHERE id = ?').get(id);
    expect(linha?.['ocorrido_em']).toBe(T);
    expect(JSON.parse(String(linha?.['estado_novo']))).toEqual({ situacao: 'publicada' });
  });

  it.each(['senha', 'senha_hash', 'token', 'token_hash', 'cpf', 'email', 'telefone'])(
    'rejeita o campo sensivel "%s", inclusive aninhado',
    (campo) => {
      expect(() =>
        registrarAuditoria(db, {
          atorUsuarioId: null,
          acao: 'x',
          entidade: 'usuario',
          registroId: 1,
          estadoNovo: { dados: { [campo]: 'valor' } },
        }),
      ).toThrow(AuditError);
      expect(contar('auditoria')).toBe(0);
    },
  );

  it('e somente de inclusao: nao permite alterar nem apagar', () => {
    const id = registrarAuditoria(db, { atorUsuarioId: null, acao: 'a', entidade: 'e', registroId: null });
    expect(() => db.prepare("UPDATE auditoria SET acao = 'b' WHERE id = ?").run(id)).toThrow(/somente de inclusao/);
    expect(() => db.prepare('DELETE FROM auditoria WHERE id = ?').run(id)).toThrow(/somente de inclusao/);
  });
});
