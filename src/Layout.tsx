import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useRouter } from './router.tsx';
import { useSession } from './session.tsx';
import { Notice, useAppName } from './ui.tsx';

export const ADMIN_ITEM = { to: '/admin/excursoes', label: 'Administração' } as const;

export const ADMIN_ITENS = [
  { to: '/admin/reservas', label: 'Reservas' },
  { to: '/admin/passageiros', label: 'Passageiros' },
] as const;

export const PASSAGEIRO_ITEM = { to: '/reservas', label: 'Minhas reservas' } as const;
export const AVISOS_ITEM = { to: '/avisos', label: 'Avisos' } as const;

export const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/excursoes', label: 'Excursões' },
  { to: '/sobre', label: 'Sobre' },
  { to: '/como-funciona', label: 'Como funciona' },
  { to: '/contato', label: 'Contato' },
] as const;

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function AuthArea() {
  const { status, user, logout } = useSession();
  const { navigate } = useRouter();
  const [failed, setFailed] = useState(false);

  if (status === 'loading') {
    return <div className="auth-area" aria-busy="true" />;
  }
  if (user === null) {
    return (
      <div className="auth-area">
        <Link to="/cadastro" className="btn btn-secondary" indicateCurrent>
          Cadastro
        </Link>
        <Link to="/login" className="btn btn-primary" indicateCurrent>
          Login
        </Link>
      </div>
    );
  }
  const handleLogout = async () => {
    setFailed(false);
    if (await logout()) {
      navigate('/', { flash: 'Você saiu da sua conta.' });
    } else {
      setFailed(true);
    }
  };
  return (
    <div className="auth-area">
      <span className="user-name">Olá, {firstName(user.nome_completo)}</span>
      <button type="button" className="btn btn-secondary" onClick={() => void handleLogout()}>
        Sair
      </button>
      {failed ? (
        <span className="field-error" role="alert">
          Não foi possível sair. Tente novamente.
        </span>
      ) : null}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const appName = useAppName();
  const { path, flash } = useRouter();
  const { checkFailed, user } = useSession();
  // Conveniencia de navegacao: o servidor continua sendo a autoridade sobre o acesso.
  const itensMenu = user?.perfil === 'administrador' ? [...NAV_ITEMS, ADMIN_ITEM, ...ADMIN_ITENS] : user?.perfil === 'passageiro' ? [...NAV_ITEMS, PASSAGEIRO_ITEM, AVISOS_ITEM] : NAV_ITEMS;
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // A cada troca de pagina: fecha o menu e leva o foco ao conteudo (leitores de tela e teclado).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setMenuOpen(false);
    mainRef.current?.focus();
  }, [path]);

  return (
    <div className="shell">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <div className="container header-row">
          <Link to="/" className="brand">
            {appName}
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="menu-principal"
            onClick={() => setMenuOpen((open) => !open)}
          >
            Menu
          </button>
          <div id="menu-principal" className={menuOpen ? 'menu open' : 'menu'}>
            <nav aria-label="Principal">
              <ul>
                {itensMenu.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} indicateCurrent>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <AuthArea />
          </div>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} ref={mainRef} className="container">
        {checkFailed ? (
          <Notice kind="info">Não foi possível confirmar se você está conectado. Algumas opções podem estar indisponíveis.</Notice>
        ) : null}
        {flash ? <Notice kind="success">{flash}</Notice> : null}
        {children}
      </main>
      <footer className="site-footer">
        <div className="container footer-row">
          <p>{appName} · Projeto de demonstração. Os dados exibidos são fictícios.</p>
          <nav aria-label="Rodapé">
            <ul>
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
