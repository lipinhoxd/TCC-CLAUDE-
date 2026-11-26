// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App.tsx';
import { json, mockApi } from './helpers/api-mock.ts';
import type { Handler } from './helpers/api-mock.ts';

/** Painel e historico administrativo na interface (AGT-016): RF-041, RF-042. */

const ADMIN = { id: 1, nome_completo: 'Adriana Admin Ficticia', email: 'admin@exemplo.com', perfil: 'administrador' };
const PASSAGEIRO = { ...ADMIN, id: 2, nome_completo: 'Paulo Passageiro Ficticio', perfil: 'passageiro' };
const comoAdmin: Record<string, Handler> = { 'GET /api/me': () => json(200, { usuario: ADMIN }) };

const PAINEL = {
  gerado_em: '2026-11-20T02:30:00.000Z',
  excursoes: {
    total: 2,
    itens: [
      { id: 7, nome: 'Excursao Ficticia Serra', situacao: 'publicada', data_inicial: '2026-12-10', data_final: '2026-12-12', capacidade: 20, ocupadas: 3, retidas: 1, livres: 16 },
      { id: 8, nome: 'Excursao Ficticia Lago', situacao: 'encerrada', data_inicial: '2026-12-20', data_final: '2026-12-21', capacidade: 5, ocupadas: 5, retidas: 0, livres: 0 },
    ],
  },
  reservas: { aguardando_pagamento: 2, pronto_para_embarque: 3, concluida: 4, cancelada: 5, total: 14 },
  valores: { recebido_centavos: 6750400, devolvido_centavos: 750000, liquido_centavos: 6000400, a_devolver_centavos: 1500100, a_receber_centavos: 750100 },
  pendencias: 6,
  emails_com_falha: 7,
};
const VAZIO = {
  gerado_em: '2026-11-20T12:00:00.000Z',
  excursoes: { total: 0, itens: [] },
  reservas: { aguardando_pagamento: 0, pronto_para_embarque: 0, concluida: 0, cancelada: 0, total: 0 },
  valores: { recebido_centavos: 0, devolvido_centavos: 0, liquido_centavos: 0, a_devolver_centavos: 0, a_receber_centavos: 0 },
  pendencias: 0,
  emails_com_falha: 0,
};
const evento = (extra: Record<string, unknown> = {}) => ({
  id: 1,
  ocorrido_em: '2026-11-20T02:30:00.000Z',
  acao: 'reembolso.processado',
  entidade: 'reembolso',
  registro_id: 4,
  ator_usuario_id: 1,
  reserva_id: 31,
  situacao_anterior: 'pendente',
  situacao_nova: 'processado',
  valor_centavos: 7500,
  valor_reembolso_centavos: null,
  valor_total_centavos: null,
  percentual: null,
  justificativa: null,
  ...extra,
});
const EVENTOS = [
  evento(),
  evento({ id: 2, acao: 'excursao.cancelamento', entidade: 'excursao', registro_id: 7, reserva_id: null, situacao_anterior: 'publicada', situacao_nova: 'cancelada', valor_centavos: null, valor_total_centavos: 283500, justificativa: 'Falta de <b>transporte</b>.' }),
  evento({ id: 3, acao: 'reserva.cancelamento_automatico', entidade: 'reserva', registro_id: 12, reserva_id: 12, ator_usuario_id: null, situacao_anterior: 'aguardando_pagamento', situacao_nova: 'cancelada', valor_centavos: null }),
  evento({ id: 4, acao: 'passageiro.consultado', entidade: 'usuario', registro_id: 9, reserva_id: null, situacao_anterior: null, situacao_nova: null, valor_centavos: null }),
];
const pagina = (eventos: unknown[], total = eventos.length, numero = 1) => () => json(200, { eventos, total, pagina: numero, limite: 20, acoes: ['excursao.cancelamento', 'reembolso.processado'] });

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
  it('"Painel" e o primeiro item da administracao no menu e no submenu, com "Historico" ao lado', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/painel': () => json(200, { painel: PAINEL }) });
    abrir('/admin');
    await screen.findByRole('heading', { level: 2, name: 'Valores' });
    const principal = within(screen.getByRole('navigation', { name: 'Principal' })).getAllByRole('link').map((a) => a.textContent);
    expect(principal.indexOf('Painel')).toBe(principal.indexOf('Administração') - 1);
    const submenu = within(screen.getByRole('navigation', { name: 'Administração' })).getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')]);
    expect(submenu.slice(0, 2)).toEqual([
      ['Painel', '/admin'],
      ['Histórico', '/admin/historico'],
    ]);
    cleanup();
    mockApi({ 'GET /api/me': () => json(200, { usuario: PASSAGEIRO }) });
    abrir('/');
    await screen.findByText('Olá, Paulo');
    expect(screen.queryByRole('link', { name: 'Painel' })).toBeNull();
  });

  it.each(['/admin', '/admin/historico'])('%s: visitante e passageiro veem acesso restrito sem consultar a API', async (caminho) => {
    const visitante = mockApi({ 'GET /api/me': () => json(401, { error: 'nao_autenticado' }) });
    abrir(caminho);
    expect(await screen.findByText(/Acesso restrito/)).not.toBeNull();
    expect(visitante.some((c) => c.path.startsWith('/api/admin'))).toBe(false);
    cleanup();
    const passageiro = mockApi({ 'GET /api/me': () => json(200, { usuario: PASSAGEIRO }) });
    abrir(caminho);
    expect(await screen.findByText('Acesso restrito a administradores.')).not.toBeNull();
    expect(passageiro.some((c) => c.path.startsWith('/api/admin'))).toBe(false);
  });
});

describe('painel (RF-041)', () => {
  it('mostra os cinco valores com definicao, as reservas, os pontos de atencao e a ocupacao', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/painel': () => json(200, { painel: PAINEL }) });
    abrir('/admin');
    await screen.findByRole('heading', { level: 2, name: 'Valores' });
    await waitFor(() => expect(document.title).toContain('Painel'));
    const texto = (document.querySelector('main')?.textContent ?? '').replace(/ /g, ' ');
    for (const trecho of [
      'RecebidoR$ 67.504,00 Todos os pagamentos confirmados, inclusive os depois estornados.',
      'DevolvidoR$ 7.500,00',
      'LíquidoR$ 60.004,00',
      'A devolverR$ 15.001,00',
      'A receberR$ 7.501,00',
      'Aguardando pagamento2',
      'Pronto para embarque3',
      'Concluída4',
      'Cancelada5',
      'Total14',
      'Pendências administrativas6',
      'E-mails que falharam7',
      '19/11/2026 23:30',
    ]) {
      expect(texto).toContain(trecho);
    }
    const tabela = screen.getByRole('table', { name: 'Ocupação das excursões a realizar' });
    expect(within(tabela).getByRole('link', { name: 'Excursao Ficticia Serra' }).getAttribute('href')).toBe('/admin/excursoes/7');
    expect(within(tabela).getByText('0 (esgotada)')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Ver pendências' }).getAttribute('href')).toBe('/admin/pendencias');
  });

  it('estado sem dados e aviso de lista cortada', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/painel': () => json(200, { painel: VAZIO }) });
    abrir('/admin');
    expect(await screen.findByText('Nenhuma excursão publicada ou encerrada por terminar.')).not.toBeNull();
    cleanup();
    mockApi({ ...comoAdmin, 'GET /api/admin/painel': () => json(200, { painel: { ...PAINEL, excursoes: { ...PAINEL.excursoes, total: 150 } } }) });
    abrir('/admin');
    expect(await screen.findByText(/Mostrando as 2 mais próximas de 150/)).not.toBeNull();
  });

  it('"Atualizar" consulta de novo; erro e mostrado', async () => {
    let vezes = 0;
    const calls = mockApi({ ...comoAdmin, 'GET /api/admin/painel': () => (vezes++ === 0 ? json(500, { error: 'erro_interno' }) : json(200, { painel: PAINEL })) });
    abrir('/admin');
    expect(await screen.findByText('Não foi possível carregar agora.')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
    await screen.findByRole('heading', { level: 2, name: 'Valores' });
    expect(calls.filter((c) => c.path === '/api/admin/painel')).toHaveLength(2);
    expect(screen.queryByText('Não foi possível carregar agora.')).toBeNull();
  });

  it('403 do servidor vira acesso restrito', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/painel': () => json(403, { error: 'acesso_negado' }) });
    abrir('/admin');
    expect(await screen.findByText('Acesso restrito a administradores.')).not.toBeNull();
  });
});

describe('historico (RF-042)', () => {
  it('mostra autor, registro com link, situacao, valores e justificativa como texto', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/historico': pagina(EVENTOS) });
    abrir('/admin/historico');
    const tabela = await screen.findByRole('table', { name: 'Histórico de operações' });
    const linhas = within(tabela).getAllByRole('row').slice(1).map((tr) => (tr.textContent ?? '').replace(/ /g, ' '));
    expect(linhas[0]).toBe('19/11/2026 23:30Reembolso processadoAdministrador nº 1Reembolso nº 4 · Reserva nº 31Pendente → ProcessadoValor: R$ 75,00');
    expect(linhas[1]).toContain('Publicada → Cancelada');
    expect(linhas[1]).toContain('Total a reembolsar: R$ 2.835,00');
    expect(linhas[1]).toContain('Justificativa: Falta de <b>transporte</b>.');
    expect(tabela.querySelector('b')).toBeNull();
    expect(linhas[2]).toContain('Sistema');
    expect(linhas[3]).toBe('19/11/2026 23:30Consulta aos dados de um passageiroAdministrador nº 1Passageiro nº 9——');
    expect(within(tabela).getByRole('link', { name: 'Reserva nº 31' }).getAttribute('href')).toBe('/admin/reservas/31');
    expect(within(tabela).getByRole('link', { name: 'Excursão nº 7' }).getAttribute('href')).toBe('/admin/excursoes/7');
    expect(within(tabela).getByRole('link', { name: 'Reserva nº 12' }).getAttribute('href')).toBe('/admin/reservas/12');
    expect(within(tabela).getByRole('link', { name: 'Passageiro nº 9' }).getAttribute('href')).toBe('/admin/passageiros/9');
  });

  it('envia os filtros, volta a pagina 1 e limpa', async () => {
    const calls = mockApi({
      ...comoAdmin,
      'GET /api/admin/historico': pagina(EVENTOS),
      'GET /api/admin/historico?origem=sistema&acao=reembolso.processado&entidade=reserva&registro=31&de=2026-11-01&ate=2026-11-30': pagina([]),
    });
    abrir('/admin/historico');
    await screen.findByRole('table', { name: 'Histórico de operações' });
    fireEvent.change(screen.getByLabelText('Origem'), { target: { value: 'sistema' } });
    fireEvent.change(screen.getByLabelText('Ação'), { target: { value: 'reembolso.processado' } });
    fireEvent.change(screen.getByLabelText('Tipo de registro'), { target: { value: 'reserva' } });
    fireEvent.change(screen.getByLabelText('Número do registro'), { target: { value: '31' } });
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-11-30' } });
    expect(calls.filter((c) => c.path.startsWith('/api/admin/historico'))).toHaveLength(1); // so ao clicar em Filtrar
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));
    expect(await screen.findByText('Nenhum evento encontrado.')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    await screen.findByRole('table', { name: 'Histórico de operações' });
    expect(screen.getByLabelText<HTMLSelectElement>('Origem').value).toBe('');
    expect(calls.filter((c) => c.path === '/api/admin/historico')).toHaveLength(2);
  });

  it('pagina o historico', async () => {
    mockApi({
      ...comoAdmin,
      'GET /api/admin/historico': pagina(EVENTOS, 45),
      'GET /api/admin/historico?pagina=2': pagina([evento({ id: 99, registro_id: 99 })], 45, 2),
    });
    abrir('/admin/historico');
    expect(await screen.findByText('Página 1 de 3 (45 resultados)')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(await screen.findByText('Página 2 de 3 (45 resultados)')).not.toBeNull();
    expect(screen.getByText(/Reembolso nº 99/)).not.toBeNull();
  });

  it('erro de filtro vem por campo e some quando corrigido', async () => {
    mockApi({
      ...comoAdmin,
      'GET /api/admin/historico': pagina(EVENTOS),
      'GET /api/admin/historico?registro=5': () => json(400, { error: 'validacao', fields: { entidade: 'obrigatorio' } }),
    });
    abrir('/admin/historico');
    await screen.findByRole('table', { name: 'Histórico de operações' });
    fireEvent.change(screen.getByLabelText('Número do registro'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));
    expect(await screen.findByText('Para filtrar pelo número, escolha também o tipo de registro.')).not.toBeNull();
    expect(screen.queryByRole('table', { name: 'Histórico de operações' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    await screen.findByRole('table', { name: 'Histórico de operações' });
    expect(screen.queryByText('Para filtrar pelo número, escolha também o tipo de registro.')).toBeNull();
  });

  it('falha de rede tem mensagem propria', async () => {
    mockApi({
      ...comoAdmin,
      'GET /api/admin/historico': () => {
        throw new TypeError('rede');
      },
    });
    abrir('/admin/historico');
    expect(await screen.findByText('Sem conexão com o servidor. Tente novamente.')).not.toBeNull();
  });
});
