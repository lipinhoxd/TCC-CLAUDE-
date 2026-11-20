// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App.tsx';
import { parcelamentoTexto, vagasTexto } from '../src/formato.ts';
import { json, mockApi } from './helpers/api-mock.ts';
import type { Handler } from './helpers/api-mock.ts';

const visitante: Record<string, Handler> = { 'GET /api/me': () => json(401, { error: 'nao_autenticado' }) };

function publica(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 7,
    nome: 'Excursao Ficticia Serra',
    descricao: 'Passeio ficticio de teste',
    imagem_ref: 'imagens/serra.jpg',
    local: 'Serra Ficticia',
    ponto_embarque: 'Praca Ficticia',
    data_inicial: '2026-12-10',
    data_final: '2026-12-12',
    partida_utc: '2026-12-10T10:00:00.000Z',
    partida_brasilia: { data: '2026-12-10', hora: '07:00' },
    preco_centavos: 150000,
    parcelamento_habilitado: true,
    prazo_segunda_parcela: '2026-12-05',
    vagas_disponiveis: 12,
    ...extra,
  };
}

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  document.title = '';
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function abrir(caminho: string) {
  render(<App appName="BPM Trip" initialPath={caminho} />);
}

const h1 = () => screen.getByRole('heading', { level: 1 }).textContent;

describe('textos da consulta publica', () => {
  it('vagas: esgotada, singular e plural', () => {
    expect(vagasTexto(0)).toBe('Esgotada');
    expect(vagasTexto(-3)).toBe('Esgotada');
    expect(vagasTexto(1)).toBe('1 vaga disponível');
    expect(vagasTexto(12)).toBe('12 vagas disponíveis');
  });

  it('parcelamento so aparece quando habilitado e com prazo', () => {
    expect(parcelamentoTexto(true, '2026-12-05')).toBe('Em até 2x de 50%. A segunda parcela vence em 05/12/2026.');
    expect(parcelamentoTexto(false, null)).toBe('Pagamento integral.');
    expect(parcelamentoTexto(true, null)).toBe('Pagamento integral.');
  });
});

describe('lista publica (RF-015, RF-017)', () => {
  it('mostra cada excursao com link, local, datas, preco em reais, parcelamento e vagas', async () => {
    mockApi({
      ...visitante,
      'GET /api/excursoes': () =>
        json(200, {
          excursoes: [
            publica(),
            publica({ id: 8, nome: 'Passeio de Um Dia Ficticio', data_inicial: '2026-12-20', data_final: '2026-12-20', preco_centavos: 9990, parcelamento_habilitado: false, prazo_segunda_parcela: null, vagas_disponiveis: 1, imagem_ref: null }),
            publica({ id: 9, nome: 'Esgotada Ficticia', vagas_disponiveis: 0 }),
          ],
        }),
    });
    abrir('/excursoes');
    const cartoes = await screen.findAllByRole('article');
    expect(cartoes).toHaveLength(3);
    expect(h1()).toBe('Excursões');
    const primeiro = cartoes[0]?.textContent ?? '';
    expect(primeiro).toContain('Excursao Ficticia Serra');
    expect(primeiro).toContain('Serra Ficticia · 10/12/2026 a 12/12/2026');
    expect(primeiro).toContain('R$ 1.500,00');
    expect(primeiro).toContain('ou em 2x');
    expect(primeiro).toContain('12 vagas disponíveis');
    const segundo = cartoes[1]?.textContent ?? '';
    expect(segundo).toContain('20/12/2026');
    expect(segundo).not.toContain('a 20/12/2026');
    expect(segundo).toContain('R$ 99,90');
    expect(segundo).not.toContain('ou em 2x');
    expect(segundo).toContain('1 vaga disponível');
    expect(cartoes[2]?.textContent).toContain('Esgotada');
    expect(screen.getByRole('link', { name: 'Excursao Ficticia Serra' }).getAttribute('href')).toBe('/excursoes/7');
    expect(document.querySelector('.vagas-esgotada')).not.toBeNull();
  });

  it('nao mostra capacidade total nem campos internos', async () => {
    mockApi({ ...visitante, 'GET /api/excursoes': () => json(200, { excursoes: [publica()] }) });
    abrir('/excursoes');
    await screen.findAllByRole('article');
    const texto = document.querySelector('main')?.textContent ?? '';
    expect(texto).not.toMatch(/capacidade|ocupad|versao|criado/i);
  });

  it('mostra carregamento, estado vazio, erro do servidor e falha de rede', async () => {
    mockApi({ ...visitante, 'GET /api/excursoes': () => json(200, { excursoes: [] }) });
    abrir('/excursoes');
    expect(screen.getByText('Carregando excursões…')).not.toBeNull();
    expect(await screen.findByText('Nenhuma excursão disponível no momento')).not.toBeNull();
    cleanup();
    mockApi({ ...visitante, 'GET /api/excursoes': () => json(500, { error: 'erro_interno' }) });
    abrir('/excursoes');
    expect((await screen.findByRole('alert')).textContent).toMatch(/Não foi possível carregar as excursões/);
    cleanup();
    mockApi({ ...visitante, 'GET /api/excursoes': () => 'network' });
    abrir('/excursoes');
    expect((await screen.findByRole('alert')).textContent).toMatch(/Sem conexão com o servidor/);
  });

  it('imagem: usa o arquivo quando existe, e cai no bloco de cor sem imagem, com imagem invalida ou se o arquivo falhar', async () => {
    mockApi({
      ...visitante,
      'GET /api/excursoes': () =>
        json(200, {
          excursoes: [
            publica({ id: 1, nome: 'Com Imagem' }),
            publica({ id: 2, nome: 'Sem Imagem', imagem_ref: null }),
            publica({ id: 3, nome: 'Imagem Invalida', imagem_ref: 'https://exemplo.com/a.jpg' }),
          ],
        }),
    });
    abrir('/excursoes');
    await screen.findAllByRole('article');
    const imagens = document.querySelectorAll('img');
    expect(imagens).toHaveLength(1);
    expect(imagens[0]?.getAttribute('src')).toBe('/imagens/serra.jpg');
    expect(imagens[0]?.getAttribute('alt')).toBe('');
    expect(document.querySelectorAll('.img-placeholder')).toHaveLength(2);
    fireEvent.error(imagens[0] as HTMLImageElement);
    expect(document.querySelectorAll('img')).toHaveLength(0);
    expect(document.querySelectorAll('.img-placeholder')).toHaveLength(3);
    expect(document.querySelector('.img-placeholder')?.textContent).toBe('Com Imagem');
  });

  it('clicar no nome leva ao detalhe sem recarregar a pagina', async () => {
    mockApi({
      ...visitante,
      'GET /api/excursoes': () => json(200, { excursoes: [publica()] }),
      'GET /api/excursoes/7': () => json(200, { excursao: publica() }),
    });
    abrir('/excursoes');
    fireEvent.click(await screen.findByRole('link', { name: 'Excursao Ficticia Serra' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Excursao Ficticia Serra' })).not.toBeNull();
    expect(window.location.pathname).toBe('/excursoes/7');
  });

  it('funciona igual para passageiro e administrador logados, sem chamada a rota administrativa', async () => {
    for (const perfil of ['passageiro', 'administrador']) {
      const calls = mockApi({
        'GET /api/me': () => json(200, { usuario: { id: 1, nome_completo: 'Fulano Ficticio Teste', email: 'f@exemplo.com', perfil } }),
        'GET /api/excursoes': () => json(200, { excursoes: [publica()] }),
      });
      abrir('/excursoes');
      expect(await screen.findAllByRole('article')).toHaveLength(1);
      expect(calls.some((c) => c.path.startsWith('/api/admin'))).toBe(false);
      cleanup();
    }
  });
});

describe('detalhe publico (RF-016, RF-017)', () => {
  it('mostra todos os dados decididos e o titulo da aba', async () => {
    const calls = mockApi({ ...visitante, 'GET /api/excursoes/7': () => json(200, { excursao: publica() }) });
    abrir('/excursoes/7');
    expect(await screen.findByRole('heading', { level: 1, name: 'Excursao Ficticia Serra' })).not.toBeNull();
    expect(document.title).toBe('Excursao Ficticia Serra · BPM Trip');
    const detalhes = document.querySelector('dl.detalhes')?.textContent ?? '';
    expect(detalhes).toContain('Serra Ficticia');
    expect(detalhes).toContain('Praca Ficticia');
    expect(detalhes).toContain('10/12/2026 a 12/12/2026');
    expect(detalhes).toContain('10/12/2026 às 07:00 (horário de Brasília)');
    expect(detalhes).toContain('Em até 2x de 50%. A segunda parcela vence em 05/12/2026.');
    expect(detalhes).toContain('12 vagas disponíveis');
    expect(document.querySelector('.excursao-destaque')?.textContent).toContain('R$ 1.500,00');
    expect(screen.getByText('Passeio ficticio de teste')).not.toBeNull();
    expect(chamadasPara(calls, '/api/excursoes/7')).toBe(1);
    expect(screen.getByRole('link', { name: '← Todas as excursões' }).getAttribute('href')).toBe('/excursoes');
  });

  it('sem parcelamento mostra pagamento integral; esgotada aparece em destaque', async () => {
    mockApi({ ...visitante, 'GET /api/excursoes/7': () => json(200, { excursao: publica({ parcelamento_habilitado: false, prazo_segunda_parcela: null, vagas_disponiveis: 0 }) }) });
    abrir('/excursoes/7');
    await screen.findByRole('heading', { level: 1 });
    expect(document.querySelector('dl.detalhes')?.textContent).toContain('Pagamento integral.');
    expect(screen.getAllByText('Esgotada').length).toBeGreaterThanOrEqual(2);
    expect(document.querySelector('.vagas-esgotada')).not.toBeNull();
  });

  it('nao ha botao nem link de reserva, so um texto provisorio identificado', async () => {
    mockApi({ ...visitante, 'GET /api/excursoes/7': () => json(200, { excursao: publica() }) });
    abrir('/excursoes/7');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('button', { name: /reserv/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /reservar/i })).toBeNull();
    expect(screen.getByText(/Reserva: será habilitada em uma próxima etapa\. Este texto é provisório\./)).not.toBeNull();
  });

  it('excursao inexistente ou nao publicada (404) vira "nao encontrada", com caminho de volta', async () => {
    mockApi({ ...visitante, 'GET /api/excursoes/99': () => json(404, { error: 'nao_encontrada' }) });
    abrir('/excursoes/99');
    expect(await screen.findByRole('heading', { name: 'Excursão não encontrada' })).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Ver todas as excursões' }).getAttribute('href')).toBe('/excursoes');
  });

  it('id que nao e numero cai na pagina nao encontrada sem consultar a API', async () => {
    const calls = mockApi(visitante);
    abrir('/excursoes/abc');
    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).not.toBeNull();
    expect(calls.some((c) => c.path.startsWith('/api/excursoes'))).toBe(false);
  });

  it('erro do servidor e falha de rede tem mensagens proprias', async () => {
    mockApi({ ...visitante, 'GET /api/excursoes/7': () => json(500, { error: 'erro_interno' }) });
    abrir('/excursoes/7');
    expect((await screen.findByRole('alert')).textContent).toMatch(/Não foi possível carregar a excursão/);
    cleanup();
    mockApi({ ...visitante, 'GET /api/excursoes/7': () => 'network' });
    abrir('/excursoes/7');
    expect((await screen.findByRole('alert')).textContent).toMatch(/Sem conexão com o servidor/);
  });

  it('nao carrega recursos externos e nao grava nada no navegador', async () => {
    mockApi({ ...visitante, 'GET /api/excursoes/7': () => json(200, { excursao: publica({ imagem_ref: null }) }) });
    abrir('/excursoes/7');
    await screen.findByRole('heading', { level: 1 });
    expect(document.querySelectorAll('script[src], link[href], iframe')).toHaveLength(0);
    expect(window.localStorage.length + window.sessionStorage.length).toBe(0);
  });
});

function chamadasPara(calls: { method: string; path: string }[], caminho: string): number {
  return calls.filter((c) => c.method === 'GET' && c.path === caminho).length;
}
