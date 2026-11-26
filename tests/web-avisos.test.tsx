// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App.tsx';
import { json, mockApi } from './helpers/api-mock.ts';
import type { Handler } from './helpers/api-mock.ts';

/** Tela de avisos do passageiro (AGT-015, RF-040). */

const PASSAGEIRO = { id: 2, nome_completo: 'Paulo Passageiro Ficticio', email: 'paulo@exemplo.com', perfil: 'passageiro' };
const ADMIN = { ...PASSAGEIRO, id: 1, nome_completo: 'Ana Admin Ficticia', perfil: 'administrador' };
const comoPassageiro: Record<string, Handler> = { 'GET /api/me': () => json(200, { usuario: PASSAGEIRO }) };

const AVISO = {
  id: 7,
  reserva_id: 31,
  tipo: 'pagamento_confirmado',
  assunto: 'Reserva nº 31: pagamento confirmado',
  corpo: 'Olá, Paulo.\nConfirmamos o pagamento de R$ 150,01.\nExcursão: <img src=x onerror=alert(1)> (10/12/2026 a 12/12/2026). Reserva nº 31.',
  evento_em: '2026-11-20T02:30:00.000Z',
};
const pagina = (avisos: unknown[], total = avisos.length) => () => json(200, { avisos, total, pagina: 1, limite: 20 });

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  document.title = '';
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const abrir = (caminho: string) => render(<App appName="BPM Trip" initialPath={caminho} />);

describe('menu e acesso', () => {
  it('o item "Avisos" aparece so para o passageiro', async () => {
    mockApi(comoPassageiro);
    abrir('/');
    await screen.findByText('Olá, Paulo');
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Avisos' }).getAttribute('href')).toBe('/avisos');
    cleanup();
    mockApi({ 'GET /api/me': () => json(200, { usuario: ADMIN }) });
    abrir('/');
    await screen.findByText('Olá, Ana');
    expect(screen.queryByRole('link', { name: 'Avisos' })).toBeNull();
  });

  it('visitante e administrador veem acesso restrito, sem consultar os avisos', async () => {
    const calls = mockApi({ 'GET /api/me': () => json(401, { error: 'nao_autenticado' }) });
    abrir('/avisos');
    expect(await screen.findByText(/Entre na sua conta para ver seus avisos/)).not.toBeNull();
    expect(calls.some((c) => c.path.startsWith('/api/avisos'))).toBe(false);
    cleanup();
    const doAdmin = mockApi({ 'GET /api/me': () => json(200, { usuario: ADMIN }) });
    abrir('/avisos');
    expect(await screen.findByText('Acesso restrito a passageiros.')).not.toBeNull();
    expect(doAdmin.some((c) => c.path.startsWith('/api/avisos'))).toBe(false);
  });
});

describe('lista de avisos', () => {
  it('mostra assunto, data em Brasilia, linhas do texto como texto simples e o link da reserva', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/avisos': pagina([AVISO]) });
    abrir('/avisos');
    expect(await screen.findByRole('heading', { level: 2, name: AVISO.assunto })).not.toBeNull();
    await waitFor(() => expect(document.title).toContain('Avisos'));
    expect(screen.getByText('19/11/2026 23:30 (horário de Brasília)')).not.toBeNull();
    expect(screen.getByText('Confirmamos o pagamento de R$ 150,01.')).not.toBeNull();
    expect(screen.getByText(/Excursão: <img src=x onerror=alert\(1\)>/)).not.toBeNull();
    expect(document.querySelector('main img')).toBeNull();
    expect(screen.getByRole('link', { name: 'Ver a reserva nº 31' }).getAttribute('href')).toBe('/reservas/31');
    expect(screen.queryByRole('navigation', { name: 'Páginas de avisos' })).toBeNull();
  });

  it('sem avisos mostra o texto de lista vazia', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/avisos': pagina([]) });
    abrir('/avisos');
    expect(await screen.findByText('Você ainda não tem avisos.')).not.toBeNull();
  });

  it('pagina os avisos', async () => {
    const calls = mockApi({
      ...comoPassageiro,
      'GET /api/avisos': pagina([AVISO], 25),
      'GET /api/avisos?pagina=2': () => json(200, { avisos: [{ ...AVISO, id: 1, assunto: 'Aviso antigo' }], total: 25, pagina: 2, limite: 20 }),
    });
    abrir('/avisos');
    expect(await screen.findByText('Página 1 de 2')).not.toBeNull();
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Mais recentes' }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Mais antigos' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Aviso antigo' })).not.toBeNull();
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Mais antigos' }).disabled).toBe(true);
    expect(calls.filter((c) => c.path === '/api/avisos?pagina=2')).toHaveLength(1);
  });

  it('erro permite tentar de novo; sem conexao tem mensagem propria; 403 vira acesso restrito', async () => {
    let vezes = 0;
    mockApi({ ...comoPassageiro, 'GET /api/avisos': () => (vezes++ === 0 ? json(500, { error: 'erro_interno' }) : json(200, { avisos: [AVISO], total: 1, pagina: 1, limite: 20 })) });
    abrir('/avisos');
    expect(await screen.findByText('Não foi possível carregar seus avisos agora.')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('heading', { level: 2, name: AVISO.assunto })).not.toBeNull();
    cleanup();
    mockApi({
      ...comoPassageiro,
      'GET /api/avisos': () => {
        throw new TypeError('rede');
      },
    });
    abrir('/avisos');
    expect(await screen.findByText('Sem conexão com o servidor. Tente novamente.')).not.toBeNull();
    cleanup();
    mockApi({ ...comoPassageiro, 'GET /api/avisos': () => json(403, { error: 'acesso_negado' }) });
    abrir('/avisos');
    expect(await screen.findByText('Acesso restrito a passageiros.')).not.toBeNull();
  });
});
