import { createApp } from './app.ts';
import { loadServerConfig } from './config.ts';

const { host, port } = loadServerConfig();
const server = createApp();

server.listen(port, host, () => {
  console.log(`API em http://${host}:${port}`);
});

function shutdown(): void {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
