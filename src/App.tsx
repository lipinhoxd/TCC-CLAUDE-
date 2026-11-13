import { loadWebConfig } from './config/env.ts';

interface AppProps {
  appName?: string;
}

export function App({ appName = loadWebConfig().appName }: AppProps) {
  return (
    <main className="app">
      <h1>{appName}</h1>
      <p>Fundação técnica do projeto. As funcionalidades serão adicionadas nas próximas atividades.</p>
    </main>
  );
}
