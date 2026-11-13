import { createApp } from './app.ts';
import { readServerConfig } from './config.ts';

const { host, port } = readServerConfig();
const server = createApp();

server.listen(port, host, () => {
  console.log(`API em http://${host}:${port}`);
});
