import type { ComponentType } from 'react';
import { loadWebConfig } from './config/env.ts';
import { Layout } from './Layout.tsx';
import { AdminExcursoes, FormularioExcursao } from './pages/AdminExcursoes.tsx';
import { Cadastro, Login } from './pages/AuthPages.tsx';
import { DetalhePublico, ListaPublica } from './pages/ExcursoesPublicas.tsx';
import { ComoFunciona, Contato, Home, NaoEncontrada, Sobre } from './pages/InfoPages.tsx';
import { RouterProvider, matchPath, useRouter } from './router.tsx';
import { SessionProvider } from './session.tsx';
import { AppNameProvider } from './ui.tsx';

interface AppProps {
  appName?: string;
  /** Caminho inicial fixo; usado em testes e na renderizacao no servidor. */
  initialPath?: string;
}

/** Parametros extraidos da URL (ex.: o id em /admin/excursoes/:id); as paginas estaticas os ignoram. */
export interface PageProps {
  params: Record<string, string>;
}

function EditarExcursao({ params }: PageProps) {
  const id = /^\d{1,15}$/.test(params['id'] ?? '') ? Number(params['id']) : null;
  return id === null ? <NaoEncontrada /> : <FormularioExcursao id={id} />;
}

function DetalheExcursao({ params }: PageProps) {
  const id = /^\d{1,15}$/.test(params['id'] ?? '') ? Number(params['id']) : null;
  return id === null ? <NaoEncontrada /> : <DetalhePublico id={id} />;
}

export const ROUTES: Record<string, ComponentType<PageProps>> = {
  '/': Home,
  '/excursoes': ListaPublica,
  '/sobre': Sobre,
  '/como-funciona': ComoFunciona,
  '/contato': Contato,
  '/cadastro': Cadastro,
  '/login': Login,
  '/admin/excursoes': AdminExcursoes,
  '/admin/excursoes/nova': () => <FormularioExcursao />,
};

export const DYNAMIC_ROUTES: [string, ComponentType<PageProps>][] = [
  ['/excursoes/:id', DetalheExcursao],
  ['/admin/excursoes/:id', EditarExcursao],
];

function Routes() {
  const { path } = useRouter();
  const fixa = ROUTES[path];
  if (fixa !== undefined) {
    const Pagina = fixa;
    return <Pagina params={{}} />;
  }
  for (const [padrao, Pagina] of DYNAMIC_ROUTES) {
    const params = matchPath(padrao, path);
    if (params !== null) return <Pagina params={params} />;
  }
  return <NaoEncontrada />;
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
