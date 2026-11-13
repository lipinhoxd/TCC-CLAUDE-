import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const MEMORY_DATABASE = ':memory:';

/**
 * Abre o banco SQLite e aplica os PRAGMAs que o esquema exige.
 * `foreign_keys` e por conexao e vem desligado por padrao no SQLite; sem ele a integridade
 * referencial nao e verificada.
 */
export function openDatabase(path: string): DatabaseSync {
  if (path !== MEMORY_DATABASE) {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  if (path !== MEMORY_DATABASE) {
    db.exec('PRAGMA journal_mode = WAL');
  }
  return db;
}
