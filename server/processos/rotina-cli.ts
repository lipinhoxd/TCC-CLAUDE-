import { passosDaRotina } from '../comunicacao/passos.ts';
import { emailDoAmbiente } from '../comunicacao/provedor.ts';
import { loadDatabaseConfig } from '../db/config.ts';
import { openDatabase } from '../db/connection.ts';
import { runMigrations } from '../db/migrate.ts';
import { descreverErro, executarRotina, linhasDoResultado } from './rotina.ts';

/** npm run rotina: executa os processos automaticos uma vez (AGT-014, decisao 1A). Sai com codigo 1 se algum passo falhar. */

/**
 * Quanto o comando espera por um banco ocupado antes de desistir de um passo (AGT-017, decisao do pesquisador). So neste comando: ele
 * disputa o banco com a rotina da API e nao atende ninguem enquanto espera. A API continua com o limite padrao de openDatabase.
 */
const ESPERA_PELO_BANCO_MS = 20_000;

try {
  const db = openDatabase(loadDatabaseConfig().path);
  try {
    db.exec(`PRAGMA busy_timeout = ${ESPERA_PELO_BANCO_MS}`);
    runMigrations(db);
    const resultado = executarRotina(db, new Date(), passosDaRotina(emailDoAmbiente()));
    for (const linha of linhasDoResultado(resultado)) console.log(linha);
    if (resultado.falhas.length > 0) process.exitCode = 1;
  } finally {
    db.close();
  }
} catch (erro) {
  console.error(`Nao foi possivel executar a rotina automatica (${descreverErro(erro)}).`);
  process.exitCode = 1;
}
