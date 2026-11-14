import type { ComponentType } from 'react';
import { loadWebConfig } from './config/env.ts';
import { Layout } from './Layout.tsx';
import { Cadastro, Login } from './pages/AuthPages.tsx';
import { ComoFunciona, Contato, Excursoes, Home, NaoEncontrada, Sobre } from './pages/InfoPages.tsx';
import { RouterProvider, useRouter } from './router.tsx';
import { SessionProvider } from './session.tsx';
import { AppNameProvider } from './ui.tsx';

interface AppProps {
  appName?: string;
  /** Caminho inicial fixo; usado em testes e na renderizacao no servidor. */
  initialPath?: string;
}

export const ROUTES: Record<string, ComponentType> = {
  '/': Home,
  '/excursoes': Excursoes,
  '/sobre': Sobre,
  '/como-funciona': ComoFunciona,
  '/contato': Contato,
  '/cadastro': Cadastro,
  '/login': Login,
};

function Routes() {
  const { path } = useRouter();
  const Page = ROUTES[path] ?? NaoEncontrada;
  return <Page />;
}

export function App({ appName = loadWebConfig().appName, initialPath }: AppProps) {
  return (
    <AppNameProvider value={appName}>
      <RouterProvider {...(initialPath === undefined ? {} : { initialPath })}>
        <SessionProvider>
          <Layout>
            <Routes />
          </Layout>
        </SessionProvider>
      </RouterProvider>
    </AppNameProvider>
  );
}
