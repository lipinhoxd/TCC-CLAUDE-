import { loadDatabaseConfig } from '../db/config.ts';
import { openDatabase } from '../db/connection.ts';
import { runMigrations } from '../db/migrate.ts';
import { DemoError, semearDemonstracao } from './demo.ts';

/** npm run seed:demo: cria excursoes ficticias de demonstracao. Recusa rodar em producao e nao apaga nada. */
if (process.env['NODE_ENV'] === 'production') {
  console.error('seed:demo nao roda em producao.');
  process.exit(1);
}

const db = openDatabase(loadDatabaseConfig().path);
try {
  runMigrations(db);
  const resultado = semearDemonstracao(db);
  console.log(
    resultado.jaExistia
      ? 'Os dados de demonstracao ja existem; nada foi alterado.'
      : `Excursoes de demonstracao criadas: ${resultado.criadas} (4 visiveis ao publico, 1 rascunho e 1 encerrada).`,
  );
} catch (error) {
  console.error(error instanceof DemoError ? error.message : 'Nao foi possivel criar os dados de demonstracao.');
  process.exitCode = 1;
} finally {
  db.close();
}
