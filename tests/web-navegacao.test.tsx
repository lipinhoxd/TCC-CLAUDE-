// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App.tsx';
import { json, mockApi } from './helpers/api-mock.ts';

const visitor = { 'GET /api/me': () => json(401, { error: 'nao_autenticado' }) };

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  document.title = '';
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function open(path = '/') {
  const calls = mockApi(visitor);
  render(<App appName="BPM Trip" initialPath={path} />);
  await screen.findByRole('link', { name: 'Login' });
  return calls;
}

const heading = () => screen.getByRole('heading', { level: 1 }).textContent;

describe('estrutura publica (RF-007)', () => {
  it('Home mostra a marca como titulo principal, os destaques e o aviso de conteudo provisorio', async () => {
    await open('/');
    expect(heading()).toBe('BPM Trip');
    expect(screen.getByRole('heading', { level: 2, name: 'O que você encontra aqui' })).not.toBeNull();
    expect(screen.getByText(/Conteúdo provisório/)).not.toBeNull();
    expect(document.title).toBe('BPM Trip');
  });

  it.each([
    ['/excursoes', 'Excursões'],
    ['/sobre', 'Sobre'],
    ['/como-funciona', 'Como funciona'],
    ['/contato', 'Contato'],
    ['/cadastro', 'Cadastro'],
    ['/login', 'Login'],
  ])('%s tem titulo principal e titulo de aba proprios', async (path, title) => {
    await open(path);
    expect(heading()).toBe(title);
    expect(document.title).toBe(`${title} · BPM Trip`);
  });

  it('aceita barra final e ignora o resto da URL ao escolher a pagina', async () => {
    await open('/sobre/');
    expect(heading()).toBe('Sobre');
  });

  it('rota desconhecida mostra "nao encontrada" com caminho de volta', async () => {
    await open('/nao-existe');
    expect(heading()).toBe('Página não encontrada');
    fireEvent.click(screen.getByRole('link', { name: 'Voltar para a Home' }));
    expect(heading()).toBe('BPM Trip');
    expect(window.location.pathname).toBe('/');
  });

  it('Excursoes mostra o estado vazio e nao consulta dados de excursoes', async () => {
    const calls = await open('/excursoes');
    expect(screen.getByText('Nenhuma excursão para mostrar ainda')).not.toBeNull();
    expect(calls.map((c) => c.path)).toEqual(['/api/me']);
  });

  it('Como funciona descreve o fluxo em lista ordenada', async () => {
    await open('/como-funciona');
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(6);
    expect(document.querySelector('ol.steps')).not.toBeNull();
  });

  it('Contato traz so dados ficticios identificados e nenhum formulario de envio', async () => {
    await open('/contato');
    expect(screen.getByText(/Os dados abaixo são fictícios/)).not.toBeNull();
    expect(screen.getByText('contato@exemplo.com.br')).not.toBeNull();
    expect(document.querySelector('form')).toBeNull();
  });
});

describe('navegacao (RF-008)', () => {
  it('cabecalho e rodape aparecem em todas as paginas, com as cinco paginas no menu', async () => {
    await open('/sobre');
    const principal = screen.getByRole('navigation', { name: 'Principal' });
    const labels = Array.from(principal.querySelectorAll('a')).map((a) => a.textContent);
    expect(labels).toEqual(['Home', 'Excursões', 'Sobre', 'Como funciona', 'Contato']);
    expect(screen.getByRole('navigation', { name: 'Rodapé' })).not.toBeNull();
    expect(document.querySelector('footer')?.textContent).toContain('dados exibidos são fictícios');
  });

  it('clicar no menu troca a pagina, atualiza a URL, o titulo e a pagina atual', async () => {
    await open('/');
    const principal = screen.getByRole('navigation', { name: 'Principal' });
    expect(principal.querySelector('[aria-current="page"]')?.textContent).toBe('Home');
    fireEvent.click(within('Principal', 'Contato'));
    expect(heading()).toBe('Contato');
    expect(window.location.pathname).toBe('/contato');
    expect(document.title).toBe('Contato · BPM Trip');
    expect(principal.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(principal.querySelector('[aria-current="page"]')?.textContent).toBe('Contato');
  });

  it('o botao voltar do navegador volta a pagina anterior', async () => {
    await open('/');
    fireEvent.click(within('Principal', 'Sobre'));
    expect(heading()).toBe('Sobre');
    act(() => {
      window.history.replaceState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(heading()).toBe('BPM Trip');
  });

  it('ao trocar de pagina, o foco vai para o conteudo principal', async () => {
    await open('/');
    fireEvent.click(within('Principal', 'Sobre'));
    await waitFor(() => expect(document.activeElement?.id).toBe('conteudo'));
  });

  it('tem link para pular ao conteudo e a regiao principal correspondente', async () => {
    await open('/');
    const skip = screen.getByRole('link', { name: 'Pular para o conteúdo' });
    expect(skip.getAttribute('href')).toBe('#conteudo');
    expect(screen.getByRole('main').id).toBe('conteudo');
  });

  it('o botao Menu abre e fecha o menu em tela de celular (aria-expanded)', async () => {
    await open('/');
    const toggle = screen.getByRole('button', { name: 'Menu' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('menu-principal')?.className).toContain('open');
    fireEvent.click(within('Principal', 'Sobre'));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('cliques com Ctrl ou botao do meio nao sao interceptados', async () => {
    await open('/');
    const link = within('Principal', 'Sobre');
    // O navegador abriria outra aba; aqui so impedimos o jsdom de tentar navegar.
    const block = (event: Event) => event.preventDefault();
    document.addEventListener('click', block);
    fireEvent.click(link, { ctrlKey: true });
    document.removeEventListener('click', block);
    expect(heading()).toBe('BPM Trip');
  });

  it('nao carrega recursos externos nem usa armazenamento do navegador', async () => {
    await open('/');
    expect(document.querySelectorAll('script[src], link[href], img[src]')).toHaveLength(0);
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });
});

function within(navLabel: string, linkName: string): HTMLElement {
  const nav = screen.getByRole('navigation', { name: navLabel });
  const link = Array.from(nav.querySelectorAll('a')).find((a) => a.textContent === linkName);
  if (!link) throw new Error(`link nao encontrado: ${linkName}`);
  return link;
}
