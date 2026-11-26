import { passosDaRotina } from '../comunicacao/passos.ts';
import { emailDoAmbiente } from '../comunicacao/provedor.ts';
import { loadDatabaseConfig } from '../db/config.ts';
import { openDatabase } from '../db/connection.ts';
import { runMigrations } from '../db/migrate.ts';
import { descreverErro, executarRotina, linhasDoResultado } from './rotina.ts';

/** npm run rotina: executa os processos automaticos uma vez (AGT-014, decisao 1A). Sai com codigo 1 se algum passo falhar. */
try {
  const db = openDatabase(loadDatabaseConfig().path);
  try {
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
