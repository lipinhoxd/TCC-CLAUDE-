import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { migrations as allMigrations, type Migration } from './migrations.ts';
import { withTransaction } from './transaction.ts';

export class MigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MigrationError';
  }
}

function checksum(migration: Migration): string {
  return createHash('sha256').update(migration.sql).digest('hex');
}

/**
 * Aplica as migracoes pendentes, cada uma em sua propria transacao. E repetivel: rodar de novo
 * nao altera nada. Detecta migracao ja aplicada que foi editada depois (checksum diferente).
 * Retorna as versoes aplicadas nesta chamada.
 */
export function runMigrations(
  db: DatabaseSync,
  migrations: readonly Migration[] = allMigrations,
  now: () => Date = () => new Date(),
): number[] {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    checksum TEXT NOT NULL,
    aplicada_em TEXT NOT NULL
  ) STRICT`);

  const versions = migrations.map((m) => m.version);
  if (versions.some((v, i) => i > 0 && v <= versions[i - 1]!)) {
    throw new MigrationError('As versoes das migracoes devem ser unicas e crescentes.');
  }

  const applied = new Map<number, string>();
  for (const row of db.prepare('SELECT version, checksum FROM schema_migrations').all()) {
    applied.set(Number(row['version']), String(row['checksum']));
  }

  const done: number[] = [];
  for (const migration of migrations) {
    const known = applied.get(migration.version);
    if (known !== undefined) {
      if (known !== checksum(migration)) {
        throw new MigrationError(
          `A migracao ${migration.version} (${migration.name}) foi alterada depois de aplicada.`,
        );
      }
      continue;
    }
    withTransaction(db, () => {
      db.exec(migration.sql);
      db.prepare(
        'INSERT INTO schema_migrations (version, name, checksum, aplicada_em) VALUES (?, ?, ?, ?)',
      ).run(migration.version, migration.name, checksum(migration), now().toISOString());
    });
    done.push(migration.version);
  }
  return done;
}
