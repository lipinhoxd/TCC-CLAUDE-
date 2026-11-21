import { createApp } from './app.ts';
import { loadAuthConfig } from './auth/config.ts';
import { AuthService } from './auth/service.ts';
import { fileOutbox, noOutbox } from './auth/support.ts';
import { loadServerConfig } from './config.ts';
import { ExcursaoService } from './excursoes/service.ts';
import { loadReservaConfig } from './reservas/config.ts';
import { ReservaService } from './reservas/service.ts';
import { loadDatabaseConfig } from './db/config.ts';
import { openDatabase } from './db/connection.ts';
import { runMigrations } from './db/migrate.ts';

const { host, port } = loadServerConfig();
const authConfig = loadAuthConfig();
const db = openDatabase(loadDatabaseConfig().path);
runMigrations(db);

const service = new AuthService({
  db,
  config: authConfig,
  outbox: authConfig.recoveryOutboxPath === null ? noOutbox : fileOutbox(authConfig.recoveryOutboxPath),
});
const server = createApp({ auth: { service, config: authConfig }, excursoes: new ExcursaoService(db), reservas: new ReservaService(db, undefined, loadReservaConfig().retencaoMs) });

server.listen(port, host, () => {
  console.log(`API em http://${host}:${port}`);
});

function shutdown(): void {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
