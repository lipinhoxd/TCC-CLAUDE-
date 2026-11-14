import { loadAuthConfig } from './config.ts';
import { loadDatabaseConfig } from '../db/config.ts';
import { openDatabase } from '../db/connection.ts';
import { runMigrations } from '../db/migrate.ts';
import { AuthService } from './service.ts';
import { HttpError, noOutbox } from './support.ts';

/**
 * Cria o primeiro administrador a partir de variaveis de ambiente informadas pelo operador.
 * E o unico caminho para criar o perfil administrador; nenhuma rota HTTP o faz (AGT-003).
 * Uso: ADMIN_NOME=... ADMIN_CPF=... ADMIN_EMAIL=... ADMIN_NASCIMENTO=AAAA-MM-DD ADMIN_TELEFONE=... \
 *      ADMIN_SENHA=... npm run admin:create
 */
const input = {
  nome_completo: process.env['ADMIN_NOME'],
  cpf: process.env['ADMIN_CPF'],
  email: process.env['ADMIN_EMAIL'],
  data_nascimento: process.env['ADMIN_NASCIMENTO'],
  telefone: process.env['ADMIN_TELEFONE'],
  senha: process.env['ADMIN_SENHA'],
};

const db = openDatabase(loadDatabaseConfig().path);
runMigrations(db);
const service = new AuthService({ db, config: loadAuthConfig(), outbox: noOutbox });

try {
  const user = await service.createAdministrator(input);
  console.log(`Administrador criado (id ${user.id}).`);
} catch (error) {
  if (error instanceof HttpError) {
    const detail = error.fields === undefined ? '' : ` Campos: ${JSON.stringify(error.fields)}`;
    console.error(`Nao foi possivel criar o administrador: ${error.code}.${detail}`);
  } else {
    console.error('Nao foi possivel criar o administrador: erro interno.');
  }
  process.exitCode = 1;
} finally {
  db.close();
}
