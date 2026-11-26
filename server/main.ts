import { AdminService } from './admin/service.ts';
import { createApp } from './app.ts';
import { CancelamentoService } from './cancelamentos/service.ts';
import { passosDaRotina } from './comunicacao/passos.ts';
import { emailDoAmbiente } from './comunicacao/provedor.ts';
import { AvisoService } from './comunicacao/service.ts';
import { loadAuthConfig } from './auth/config.ts';
import { AuthService } from './auth/service.ts';
import { fileOutbox, noOutbox } from './auth/support.ts';
import { loadServerConfig } from './config.ts';
import { ExcursaoService } from './excursoes/service.ts';
import { PagamentoService } from './pagamentos/service.ts';
import { iniciarAgendador } from './processos/agendador.ts';
import type { Agendador } from './processos/agendador.ts';
import { loadRotinaConfig } from './processos/config.ts';
import { executarRotina } from './processos/rotina.ts';
import { provedorDoAmbiente } from './pagamentos/provedor.ts';
import { loadReservaConfig } from './reservas/config.ts';
import { ReservaService } from './reservas/service.ts';
import { loadDatabaseConfig } from './db/config.ts';
import { openDatabase } from './db/connection.ts';
import { runMigrations } from './db/migrate.ts';

const { host, port } = loadServerConfig();
const authConfig = loadAuthConfig();
const rotinaConfig = loadRotinaConfig();
const passos = passosDaRotina(emailDoAmbiente());
const db = openDatabase(loadDatabaseConfig().path);
runMigrations(db);

const service = new AuthService({
  db,
  config: authConfig,
  outbox: authConfig.recoveryOutboxPath === null ? noOutbox : fileOutbox(authConfig.recoveryOutboxPath),
});
const provedor = provedorDoAmbiente();
const reservas = new ReservaService(db, undefined, loadReservaConfig().retencaoMs, provedor);
const server = createApp({
  auth: { service, config: authConfig },
  excursoes: new ExcursaoService(db),
  reservas,
  pagamentos: new PagamentoService(db, reservas, provedor),
  admin: new AdminService(db),
  cancelamentos: new CancelamentoService(db, reservas, provedor),
  avisos: new AvisoService(db),
});

let agendador: Agendador | undefined;

server.listen(port, host, () => {
  console.log(`API em http://${host}:${port}`);
  // Processos automaticos (AGT-014): so depois de a API estar no ar; parados antes de fechar o banco.
  agendador = iniciarAgendador({ db, intervaloMs: rotinaConfig.intervaloMs, executar: (banco, agora) => executarRotina(banco, agora, passos) });
});

function shutdown(): void {
  agendador?.parar();
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
