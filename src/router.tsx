import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';

/** Roteador minimo sobre a History API (decisao 1 da AGT-004): URLs limpas e nenhuma dependencia. */

interface NavigateOptions {
  /** Mensagem exibida uma vez na pagina de destino (ex.: "Conta criada"). */
  flash?: string;
  replace?: boolean;
}

interface RouterValue {
  path: string;
  flash: string | null;
  navigate: (to: string, options?: NavigateOptions) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

/** Remove a barra final (exceto na raiz) para que "/sobre/" e "/sobre" sejam a mesma rota. */
export function normalizePath(path: string): string {
  const clean = path.split(/[?#]/)[0] ?? '/';
  const withSlash = clean.startsWith('/') ? clean : `/${clean}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') || '/' : '/';
}

function browserPath(): string {
  return typeof window === 'undefined' ? '/' : normalizePath(window.location.pathname);
}

interface RouterProviderProps {
  children: ReactNode;
  /** Caminho inicial fixo (testes e renderizacao no servidor). */
  initialPath?: string;
}

export function RouterProvider({ children, initialPath }: RouterProviderProps) {
  const [path, setPath] = useState(() => (initialPath === undefined ? browserPath() : normalizePath(initialPath)));
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const onPop = () => {
      setPath(browserPath());
      setFlash(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string, options: NavigateOptions = {}) => {
    const target = normalizePath(to);
    if (options.replace) {
      window.history.replaceState(null, '', target);
    } else {
      window.history.pushState(null, '', target);
    }
    setPath(target);
    setFlash(options.flash ?? null);
  }, []);

  const value = useMemo(() => ({ path, flash, navigate }), [path, flash, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const value = useContext(RouterContext);
  if (value === null) {
    throw new Error('useRouter precisa estar dentro de RouterProvider.');
  }
  return value;
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  /** Marca o link com aria-current="page" quando aponta para a pagina atual. */
  indicateCurrent?: boolean;
}

export function Link({ to, indicateCurrent = false, onClick, children, ...rest }: LinkProps) {
  const { path, navigate } = useRouter();
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (event.defaultPrevented || event.button !== 0 || modified || rest.target === '_blank') {
      return;
    }
    event.preventDefault();
    navigate(to);
  };
  const current = indicateCurrent && normalizePath(to) === path;
  return (
    <a {...rest} href={to} onClick={handleClick} {...(current ? { 'aria-current': 'page' as const } : {})}>
      {children}
    </a>
  );
}
