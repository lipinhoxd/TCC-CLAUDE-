import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { NetworkError, apiRequest } from './api.ts';

/** Estado de sessao do front-end. O servidor e a autoridade: aqui so se espelha o que GET /api/me devolve. */

export interface SessionUser {
  id: number;
  nome_completo: string;
  email: string;
  perfil: 'passageiro' | 'administrador';
}

export interface RegisterInput {
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  senha: string;
}

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: 'credenciais' | 'rede' | 'erro' }
  | { ok: false; reason: 'bloqueado'; retryAfter: number | null };

export type RegisterResult =
  | { ok: true; loggedIn: boolean }
  | { ok: false; reason: 'validacao'; fields: Record<string, string> }
  | { ok: false; reason: 'duplicado' | 'rede' | 'erro' };

interface SessionValue {
  /** "loading" ate a primeira resposta de GET /api/me. */
  status: 'loading' | 'ready';
  user: SessionUser | null;
  /** true se nao foi possivel confirmar a sessao (rede ou erro do servidor). */
  checkFailed: boolean;
  login: (email: string, senha: string) => Promise<LoginResult>;
  register: (input: RegisterInput) => Promise<RegisterResult>;
  logout: () => Promise<boolean>;
}

const SessionContext = createContext<SessionValue | null>(null);

interface UserBody {
  usuario?: SessionUser;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkFailed, setCheckFailed] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest<UserBody>('GET', '/api/me')
      .then((result) => {
        if (!active) return;
        if (result.status === 200 && result.data?.usuario) {
          setUser(result.data.usuario);
        } else if (result.status !== 401) {
          setCheckFailed(true);
        }
      })
      .catch(() => {
        if (active) setCheckFailed(true);
      })
      .finally(() => {
        if (active) setStatus('ready');
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, senha: string): Promise<LoginResult> => {
    try {
      const result = await apiRequest<UserBody>('POST', '/api/auth/login', { email, senha });
      if (result.status === 200 && result.data?.usuario) {
        setUser(result.data.usuario);
        setCheckFailed(false);
        return { ok: true };
      }
      if (result.status === 401) return { ok: false, reason: 'credenciais' };
      if (result.status === 429) return { ok: false, reason: 'bloqueado', retryAfter: result.retryAfter };
      return { ok: false, reason: 'erro' };
    } catch (error) {
      return { ok: false, reason: error instanceof NetworkError ? 'rede' : 'erro' };
    }
  }, []);

  const register = useCallback(
    async (input: RegisterInput): Promise<RegisterResult> => {
      try {
        const result = await apiRequest<{ error?: string; fields?: Record<string, string> }>(
          'POST',
          '/api/auth/register',
          input,
        );
        if (result.status === 201) {
          const entered = await login(input.email, input.senha);
          return { ok: true, loggedIn: entered.ok };
        }
        if (result.status === 400 && result.data?.fields) {
          return { ok: false, reason: 'validacao', fields: result.data.fields };
        }
        if (result.status === 409) return { ok: false, reason: 'duplicado' };
        return { ok: false, reason: 'erro' };
      } catch (error) {
        return { ok: false, reason: error instanceof NetworkError ? 'rede' : 'erro' };
      }
    },
    [login],
  );

  const logout = useCallback(async (): Promise<boolean> => {
    try {
      const result = await apiRequest('POST', '/api/auth/logout');
      if (result.status === 204 || result.status === 401) {
        setUser(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({ status, user, checkFailed, login, register, logout }),
    [status, user, checkFailed, login, register, logout],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error('useSession precisa estar dentro de SessionProvider.');
  }
  return value;
}
