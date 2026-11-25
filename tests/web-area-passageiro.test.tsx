// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App.tsx';
import { json, mockApi } from './helpers/api-mock.ts';
import type { Handler } from './helpers/api-mock.ts';

/** Area do passageiro na interface (AGT-011): RF-029, RF-030, RF-031. */

const PASSAGEIRO = { id: 2, nome_completo: 'Paulo Passageiro Ficticio', email: 'paulo@exemplo.com', perfil: 'passageiro' };
const ADMIN = { ...PASSAGEIRO, id: 1, nome_completo: 'Ana Admin Ficticia', perfil: 'administrador' };
const comoPassageiro: Record<string, Handler> = { 'GET /api/me': () => json(200, { usuario: PASSAGEIRO }) };

function reserva(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 31,
    situacao: 'aguardando_pagamento',
    modalidade: 'integral',
    criada_em: '2026-11-19T12:00:00.000Z',
    excursao: {
      id: 7,
      nome: 'Excursao Ficticia Serra',
      local: 'Serra Ficticia',
      ponto_embarque: 'Praca Ficticia',
      data_inicial: '2026-12-10',
      data_final: '2026-12-12',
      partida_brasilia: { data: '2026-12-10', hora: '07:00' },
    },
    valores: { total_centavos: 150001, parcelas: [{ parcela: 'unica', valor_centavos: 150001, vencimento: null, situacao_pagamento: null }] },
    pode_desistir: true,
    retencao: null,
    pagamento: null,
    proxima_parcela: 'unica',
    motivo_cancelamento: null,
    pagamento_disponivel: true,
    pagamento_simulado: true,
    ...extra,
  };
}
const paga = { parcela: 'unica', situacao: 'confirmado', valor_centavos: 150001, confirmado_em: '2026-11-20T12:00:00.000Z', requer_tratamento_administrativo: false };
const unicaPaga = { total_centavos: 150001, parcelas: [{ parcela: 'unica', valor_centavos: 150001, vencimento: null, situacao_pagamento: 'confirmado' }] };
const pronta = reserva({ id: 32, situacao: 'pronto_para_embarque', pode_desistir: false, pagamento: paga, proxima_parcela: null, valores: unicaPaga });
const concluida = reserva({
  id: 33,
  situacao: 'concluida',
  pode_desistir: false,
  pagamento: paga,
  proxima_parcela: null,
  valores: unicaPaga,
  excursao: { id: 5, nome: 'Excursao Ficticia Praia', local: 'Praia Ficticia', ponto_embarque: 'Terminal Ficticio', data_inicial: '2026-10-01', data_final: '2026-10-03', partida_brasilia: { data: '2026-10-01', hora: '06:30' } },
});
const inadimplente = reserva({
  id: 34,
  situacao: 'cancelada',
  modalidade: 'parcelada',
  pode_desistir: false,
  motivo_cancelamento: 'inadimplencia',
  proxima_parcela: null,
  valores: {
    total_centavos: 150001,
    parcelas: [
      { parcela: 'primeira', valor_centavos: 75000, vencimento: null, situacao_pagamento: 'confirmado' },
      { parcela: 'segunda', valor_centavos: 75001, vencimento: '2026-12-05', situacao_pagamento: null },
    ],
  },
  pagamento: { ...paga, parcela: 'primeira', valor_centavos: 75000 },
});
const desistida = reserva({ id: 35, situacao: 'cancelada', pode_desistir: false, proxima_parcela: null });
const LISTA = { em_andamento: [reserva(), pronta], historico: [concluida, inadimplente, desistida] };

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

describe('menu e acesso', () => {
  it('o item "Minhas reservas" aparece so para o passageiro autenticado', async () => {
    mockApi(comoPassageiro);
    abrir('/');
    await screen.findByText('Olá, Paulo');
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Minhas reservas' }).getAttribute('href')).toBe('/reservas');
    cleanup();
    mockApi({ 'GET /api/me': () => json(401, { error: 'nao_autenticado' }) });
    abrir('/');
    await screen.findByRole('link', { name: 'Login' });
    expect(screen.queryByRole('link', { name: 'Minhas reservas' })).toBeNull();
    cleanup();
    mockApi({ 'GET /api/me': () => json(200, { usuario: ADMIN }) });
    abrir('/');
    await screen.findByText('Olá, Ana');
    expect(screen.queryByRole('link', { name: 'Minhas reservas' })).toBeNull();
  });

  it('visitante e administrador veem acesso restrito, sem consultar as reservas', async () => {
    const calls = mockApi({ 'GET /api/me': () => json(401, { error: 'nao_autenticado' }) });
    abrir('/reservas');
    expect(await screen.findByText(/Entre na sua conta para ver suas reservas/)).not.toBeNull();
    expect(calls.some((c) => c.path.startsWith('/api/reservas'))).toBe(false);
    cleanup();
    const calls2 = mockApi({ 'GET /api/me': () => json(200, { usuario: ADMIN }) });
    abrir('/reservas/31');
    expect(await screen.findByText('Acesso restrito a passageiros.')).not.toBeNull();
    expect(calls2.some((c) => c.path.startsWith('/api/reservas'))).toBe(false);
  });
});

describe('lista de reservas (RF-029, RF-031)', () => {
  it('sem reservas: mensagem e convite para ver as excursoes', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/reservas': () => json(200, { em_andamento: [], historico: [] }) });
    abrir('/reservas');
    expect(await screen.findByText('Você ainda não tem reservas.')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Ver excursões' }).getAttribute('href')).toBe('/excursoes');
  });

  it('mostra o bloco "Em andamento" e o "Historico", cada reserva com situacao, valor e acoes', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/reservas': () => json(200, LISTA) });
    abrir('/reservas');
    const andamento = await screen.findByRole('region', { name: 'Em andamento' });
    const historico = screen.getByRole('region', { name: 'Histórico' });
    const linhasAndamento = within(andamento).getAllByRole('row').slice(1);
    expect(linhasAndamento).toHaveLength(2);
    expect(linhasAndamento[0]?.textContent).toContain('Aguardando pagamento');
    expect(linhasAndamento[0]?.textContent).toContain('R$ 1.500,01');
    expect(within(linhasAndamento[0] as HTMLElement).getByRole('link', { name: 'Continuar o pagamento' }).getAttribute('href')).toBe('/reservas/31/checkout');
    expect(linhasAndamento[1]?.textContent).toContain('Pronto para embarque');
    expect(within(linhasAndamento[1] as HTMLElement).queryByRole('link', { name: 'Continuar o pagamento' })).toBeNull();
    const linhasHistorico = within(historico).getAllByRole('row').slice(1);
    expect(linhasHistorico.map((l) => l.textContent)).toEqual([
      expect.stringContaining('Concluída'),
      expect.stringContaining('Cancelada (segunda parcela não paga)'),
      expect.stringContaining('Cancelada'),
    ]);
    expect(within(historico).queryByRole('link', { name: 'Continuar o pagamento' })).toBeNull();
    expect(within(historico).getAllByRole('link', { name: 'Ver detalhe' })).toHaveLength(3);
  });

  it('so historico: o bloco "Em andamento" diz que nao ha reservas em andamento', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/reservas': () => json(200, { em_andamento: [], historico: [concluida] }) });
    abrir('/reservas');
    expect(await screen.findByText('Nenhuma reserva em andamento.')).not.toBeNull();
    expect(within(screen.getByRole('region', { name: 'Histórico' })).getByText(/Excursao Ficticia Praia/)).not.toBeNull();
  });

  it('o titulo da pagina e o cabecalho principal', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/reservas': () => json(200, LISTA) });
    abrir('/reservas');
    expect(await screen.findByRole('heading', { level: 1, name: 'Minhas reservas' })).not.toBeNull();
    await waitFor(() => expect(document.title).toContain('Minhas reservas'));
  });

  it('erro do servidor e falha de rede tem mensagens proprias', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/reservas': () => json(500, { error: 'erro_interno' }) });
    abrir('/reservas');
    expect(await screen.findByText('Não foi possível carregar suas reservas agora.')).not.toBeNull();
    cleanup();
    mockApi({ ...comoPassageiro, 'GET /api/reservas': () => 'network' });
    abrir('/reservas');
    expect(await screen.findByText(/Sem conexão com o servidor/)).not.toBeNull();
  });

  it('ver detalhe leva a pagina da reserva', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/reservas': () => json(200, LISTA), 'GET /api/reservas/32': () => json(200, { reserva: pronta }) });
    abrir('/reservas');
    const andamento = await screen.findByRole('region', { name: 'Em andamento' });
    fireEvent.click(within(andamento).getAllByRole('link', { name: 'Ver detalhe' })[1] as HTMLElement);
    expect(await screen.findByRole('heading', { level: 1, name: 'Reserva nº 32' })).not.toBeNull();
    expect(window.location.pathname).toBe('/reservas/32');
  });

  it('nao grava nada no navegador nem no console e nao usa recursos externos', async () => {
    const espioes = (['log', 'warn', 'error'] as const).map((m) => vi.spyOn(console, m));
    mockApi({ ...comoPassageiro, 'GET /api/reservas': () => json(200, LISTA) });
    abrir('/reservas');
    await screen.findByRole('region', { name: 'Em andamento' });
    expect(window.localStorage.length + window.sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
    for (const e of espioes) expect(e).not.toHaveBeenCalled();
    expect(document.querySelectorAll('script[src], link[href], iframe')).toHaveLength(0);
  });
});

describe('detalhe da reserva (RF-030)', () => {
  const abrirReserva = async (r: Record<string, unknown>, extra: Record<string, Handler> = {}) => {
    mockApi({ ...comoPassageiro, [`GET /api/reservas/${String(r['id'])}`]: () => json(200, { reserva: r }), ...extra });
    abrir(`/reservas/${String(r['id'])}`);
    await screen.findByRole('heading', { level: 1, name: `Reserva nº ${String(r['id'])}` });
  };

  it('mostra excursao, local, ponto de embarque, datas, partida, forma de pagamento, situacao e valores', async () => {
    await abrirReserva(reserva());
    const detalhes = document.querySelector('dl.detalhes')?.textContent ?? '';
    for (const trecho of ['Excursao Ficticia Serra', 'Serra Ficticia', 'Praca Ficticia', '10/12/2026 a 12/12/2026', '10/12/2026 às 07:00 (horário de Brasília)', 'Pagamento integral', 'Aguardando pagamento']) {
      expect(detalhes).toContain(trecho);
    }
    expect(screen.getByText('R$ 1.500,01', { selector: 'strong' })).not.toBeNull();
  });

  it('aguardando pagamento: leva ao checkout e permite desistir com confirmacao', async () => {
    const cancelada = { ...reserva(), situacao: 'cancelada', pode_desistir: false, proxima_parcela: null };
    await abrirReserva(reserva(), { 'POST /api/reservas/31/desistir': () => json(200, { reserva: cancelada }) });
    expect(screen.getByRole('link', { name: 'Continuar o pagamento' }).getAttribute('href')).toBe('/reservas/31/checkout');
    fireEvent.click(screen.getByRole('button', { name: 'Desistir da reserva' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar desistência' }));
    expect(await screen.findByText(/Reserva cancelada\./)).not.toBeNull();
    expect(screen.queryByRole('link', { name: 'Continuar o pagamento' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Desistir da reserva' })).toBeNull();
  });

  it('o servidor recusa a desistencia: a razao aparece e a reserva continua', async () => {
    await abrirReserva(reserva(), { 'POST /api/reservas/31/desistir': () => json(409, { error: 'reserva_com_pagamento' }) });
    fireEvent.click(screen.getByRole('button', { name: 'Desistir da reserva' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar desistência' }));
    expect(await screen.findByText('Esta reserva já tem pagamento e não pode ser cancelada por aqui.')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Continuar o pagamento' })).not.toBeNull();
  });

  it('primeira parcela paga: avisa que a vaga e do passageiro e ate quando falta a segunda; sem desistir', async () => {
    const parcial = reserva({
      modalidade: 'parcelada',
      pode_desistir: false,
      proxima_parcela: 'segunda',
      pagamento: { ...paga, parcela: 'primeira', valor_centavos: 75000 },
      valores: {
        total_centavos: 150001,
        parcelas: [
          { parcela: 'primeira', valor_centavos: 75000, vencimento: null, situacao_pagamento: 'confirmado' },
          { parcela: 'segunda', valor_centavos: 75001, vencimento: '2026-12-05', situacao_pagamento: null },
        ],
      },
    });
    await abrirReserva(parcial);
    expect(screen.getByText('Primeira parcela confirmada: a vaga é sua. Falta a segunda parcela, até 05/12/2026.')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Desistir da reserva' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Continuar o pagamento' })).not.toBeNull();
  });

  it('pronto para embarque e concluida: so informam, sem acoes', async () => {
    await abrirReserva(pronta);
    expect(screen.getByText('Pagamento confirmado. Sua reserva está pronta para embarque.')).not.toBeNull();
    expect(screen.queryByRole('link', { name: 'Continuar o pagamento' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Desistir da reserva' })).toBeNull();
    cleanup();
    await abrirReserva(concluida);
    expect(screen.getByText('Esta reserva foi concluída e permanece no seu histórico.')).not.toBeNull();
    expect(screen.getByText('Terminal Ficticio')).not.toBeNull();
    expect(screen.queryByRole('link', { name: 'Continuar o pagamento' })).toBeNull();
  });

  it('cancelada por inadimplencia: primeira parcela nao reembolsavel, sem prometer devolucao', async () => {
    await abrirReserva(inadimplente);
    expect(screen.getByText('O prazo da segunda parcela venceu: a vaga foi liberada e a primeira parcela não é reembolsável.')).not.toBeNull();
    expect(document.body.textContent).not.toMatch(/devolv|reembolsad|estorn/i);
    expect(screen.queryByRole('link', { name: 'Continuar o pagamento' })).toBeNull();
  });

  it('segunda parcela confirmada depois do prazo e pagamento confirmado sem vaga: a organizacao vai tratar, sem campo interno', async () => {
    const tardia = { ...inadimplente, id: 36, pagamento: { ...paga, parcela: 'segunda', valor_centavos: 75001, requer_tratamento_administrativo: true } };
    await abrirReserva(tardia);
    expect(screen.getByText('Recebemos o pagamento da segunda parcela depois do prazo. A organização vai tratar o caso.')).not.toBeNull();
    cleanup();
    const semVaga = reserva({ id: 37, pode_desistir: false, pagamento: { ...paga, requer_tratamento_administrativo: true }, valores: unicaPaga });
    await abrirReserva(semVaga);
    expect(screen.getByText('Recebemos o seu pagamento, mas a vaga não está mais disponível. A organização vai tratar o caso.')).not.toBeNull();
    expect(screen.queryByRole('link', { name: 'Continuar o pagamento' })).toBeNull();
    expect(document.body.textContent).not.toContain('pendencia_administrativa');
    expect(document.body.textContent).not.toContain('confirmacao_sem_vaga');
  });

  it('reserva inexistente ou de outra pessoa, erro, falha de rede e id invalido tem telas proprias', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/reservas/99': () => json(404, { error: 'nao_encontrada' }) });
    abrir('/reservas/99');
    expect(await screen.findByRole('heading', { name: 'Reserva não encontrada' })).not.toBeNull();
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Minhas reservas' }).getAttribute('href')).toBe('/reservas');
    cleanup();
    mockApi({ ...comoPassageiro, 'GET /api/reservas/31': () => json(500, { error: 'erro_interno' }) });
    abrir('/reservas/31');
    expect(await screen.findByText('Não foi possível carregar a reserva agora.')).not.toBeNull();
    cleanup();
    mockApi({ ...comoPassageiro, 'GET /api/reservas/31': () => 'network' });
    abrir('/reservas/31');
    expect(await screen.findByText(/Sem conexão com o servidor/)).not.toBeNull();
    cleanup();
    mockApi(comoPassageiro);
    abrir('/reservas/abc');
    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).not.toBeNull();
  });

  it('o checkout continua em /reservas/:id/checkout (a rota nova nao o substitui)', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/reservas/31': () => json(200, { reserva: reserva({ retencao: { situacao: 'ativa', expira_em: '2026-11-19T12:10:00.000Z', segundos_restantes: 600 } }) }) });
    abrir('/reservas/31/checkout');
    expect(await screen.findByRole('heading', { level: 1, name: /Checkout da reserva nº 31/ })).not.toBeNull();
  });
});
