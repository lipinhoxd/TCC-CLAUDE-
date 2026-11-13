import { existsSync, rmSync } from 'node:fs';
import { loadDatabaseConfig } from './config.ts';
import { MEMORY_DATABASE, openDatabase } from './connection.ts';
import { runMigrations } from './migrate.ts';

const command = process.argv[2];
const { path } = loadDatabaseConfig();

if (command !== 'migrate' && command !== 'reset') {
  console.error('Uso: node server/db/cli.ts <migrate|reset>');
  process.exit(1);
}

if (command === 'reset' && path !== MEMORY_DATABASE) {
  let removed = false;
  for (const file of [path, `${path}-wal`, `${path}-shm`]) {
    if (existsSync(file)) {
      rmSync(file);
      removed = true;
    }
  }
  console.log(removed ? `Banco removido: ${path}` : `Nenhum banco a remover em: ${path}`);
}

const db = openDatabase(path);
const applied = runMigrations(db);
db.close();
console.log(
  applied.length > 0 ? `Migracoes aplicadas: ${applied.join(', ')}` : 'Banco ja esta atualizado.',
);
