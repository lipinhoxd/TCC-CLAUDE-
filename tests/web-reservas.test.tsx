// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App.tsx';
import { formatarRestante } from '../src/pages/Reservas.tsx';
import { json, mockApi } from './helpers/api-mock.ts';
import type { Handler, RecordedCall } from './helpers/api-mock.ts';

const PASSAGEIRO = { id: 2, nome_completo: 'Paulo Passageiro Ficticio', email: 'paulo@exemplo.com', perfil: 'passageiro' };
const ADMIN = { ...PASSAGEIRO, id: 1, nome_completo: 'Ana Admin Ficticia', perfil: 'administrador' };
const comoPassageiro: Record<string, Handler> = { 'GET /api/me': () => json(200, { usuario: PASSAGEIRO }) };

function excursao(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 7,
    nome: 'Excursao Ficticia Serra',
    descricao: 'Passeio ficticio',
    imagem_ref: null,
    local: 'Serra Ficticia',
    ponto_embarque: 'Praca Ficticia',
    data_inicial: '2026-12-10',
    data_final: '2026-12-12',
    partida_utc: '2026-12-10T10:00:00.000Z',
    partida_brasilia: { data: '2026-12-10', hora: '07:00' },
    preco_centavos: 150001,
    parcelamento_habilitado: true,
    prazo_segunda_parcela: '2026-12-05',
    vagas_disponiveis: 12,
    ...extra,
  };
}

function reserva(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 31,
    situacao: 'aguardando_pagamento',
    modalidade: 'integral',
    criada_em: '2026-11-19T12:00:00.000Z',
    excursao: { id: 7, nome: 'Excursao Ficticia Serra', data_inicial: '2026-12-10', data_final: '2026-12-12', partida_brasilia: { data: '2026-12-10', hora: '07:00' } },
    valores: { total_centavos: 150001, parcelas: [{ parcela: 'unica', valor_centavos: 150001, vencimento: null }] },
    pode_desistir: true,
    retencao: { situacao: 'ativa', expira_em: '2026-11-19T12:10:00.000Z', segundos_restantes: 600 },
    ...extra,
  };
}

const parcelada = reserva({
  modalidade: 'parcelada',
  valores: {
    total_centavos: 150001,
    parcelas: [
      { parcela: 'primeira', valor_centavos: 75000, vencimento: null },
      { parcela: 'segunda', valor_centavos: 75001, vencimento: '2026-12-05' },
    ],
  },
});

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
const clicar = (nome: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nome }));
const chamadas = (calls: RecordedCall[], metodo: string, caminho: string) => calls.filter((c) => c.method === metodo && c.path === caminho);

describe('botao de reserva no detalhe da excursao (RF-018)', () => {
  it('o passageiro ve as formas de pagamento, com o prazo da segunda parcela, e o aviso sobre a vaga', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/excursoes/7': () => json(200, { excursao: excursao() }) });
    abrir('/excursoes/7');
    expect(await screen.findByRole('button', { name: 'Reservar' })).not.toBeNull();
    expect(screen.getByLabelText<HTMLInputElement>(/Pagamento integral/).checked).toBe(true);
    expect(screen.getByLabelText(/Em 2 parcelas de 50%/).parentElement?.textContent).toContain('segunda parcela até 05/12/2026');
    expect(screen.getByText(/A vaga só é garantida após o pagamento confirmado\./)).not.toBeNull();
  });

  it('sem parcelamento so existe pagamento integral', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/excursoes/7': () => json(200, { excursao: excursao({ parcelamento_habilitado: false, prazo_segunda_parcela: null }) }) });
    abrir('/excursoes/7');
    await screen.findByRole('button', { name: 'Reservar' });
    expect(screen.queryByLabelText(/Em 2 parcelas/)).toBeNull();
  });

  it('o administrador nao ve o bloco de reserva', async () => {
    mockApi({ 'GET /api/me': () => json(200, { usuario: ADMIN }), 'GET /api/excursoes/7': () => json(200, { excursao: excursao() }) });
    abrir('/excursoes/7');
    await screen.findByRole('heading', { level: 1, name: 'Excursao Ficticia Serra' });
    await screen.findByText('Olá, Ana');
    expect(screen.queryByRole('button', { name: 'Reservar' })).toBeNull();
    expect(screen.queryByText('Para reservar, é preciso ter conta.')).toBeNull();
  });

  it('excursao esgotada: mostra o aviso e nao oferece o botao', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/excursoes/7': () => json(200, { excursao: excursao({ vagas_disponiveis: 0 }) }) });
    abrir('/excursoes/7');
    expect(await screen.findByText('Esta excursão está esgotada. Não é possível reservar agora.')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Reservar' })).toBeNull();
  });

  it('reservar envia a excursao e a modalidade e leva ao checkout, sem enviar o passageiro', async () => {
    const calls = mockApi({
      ...comoPassageiro,
      'GET /api/excursoes/7': () => json(200, { excursao: excursao() }),
      'POST /api/reservas': () => json(201, { reserva: parcelada }),
      'GET /api/reservas/31': () => json(200, { reserva: parcelada }),
    });
    abrir('/excursoes/7');
    await screen.findByRole('button', { name: 'Reservar' });
    fireEvent.click(screen.getByLabelText(/Em 2 parcelas de 50%/));
    clicar('Reservar');
    expect(await screen.findByRole('heading', { level: 1, name: 'Checkout da reserva nº 31' })).not.toBeNull();
    expect(window.location.pathname).toBe('/reservas/31/checkout');
    expect(chamadas(calls, 'POST', '/api/reservas')[0]?.body).toEqual({ excursao_id: 7, modalidade: 'parcelada' });
  });

  it('pedido repetido (409) leva a reserva que ja existe, com aviso', async () => {
    mockApi({
      ...comoPassageiro,
      'GET /api/excursoes/7': () => json(200, { excursao: excursao() }),
      'POST /api/reservas': () => json(409, { error: 'reserva_ativa_existente', fields: { reserva_id: '31' } }),
      'GET /api/reservas/31': () => json(200, { reserva: reserva() }),
    });
    abrir('/excursoes/7');
    await screen.findByRole('button', { name: 'Reservar' });
    clicar('Reservar');
    expect(await screen.findByText('Você já tem uma reserva para esta excursão.')).not.toBeNull();
    expect(window.location.pathname).toBe('/reservas/31/checkout');
  });

  it.each([
    ['sem_vagas', 409, {}, /Não há vaga disponível agora/],
    ['limite_de_reservas_pendentes', 409, {}, /Você já tem 3 reservas aguardando pagamento/],
    ['reservas_encerradas', 409, {}, 'As reservas desta excursão estão encerradas.'],
    ['excursao_nao_encontrada', 404, {}, /não foi encontrada ou não está disponível/],
    ['validacao', 400, { modalidade: 'prazo_da_segunda_parcela_vencido' }, /O prazo da segunda parcela já passou/],
    ['validacao', 400, { modalidade: 'parcelamento_indisponivel' }, /não permite pagamento em duas parcelas/],
  ])('o servidor recusa com %s e a tela explica', async (codigo, status, campos, mensagem) => {
    mockApi({
      ...comoPassageiro,
      'GET /api/excursoes/7': () => json(200, { excursao: excursao() }),
      'POST /api/reservas': () => json(status, { error: codigo, fields: campos }),
    });
    abrir('/excursoes/7');
    await screen.findByRole('button', { name: 'Reservar' });
    clicar('Reservar');
    const alerta = await screen.findByRole('alert');
    if (typeof mensagem === 'string') expect(alerta.textContent).toBe(mensagem);
    else expect(alerta.textContent).toMatch(mensagem);
    // continua na pagina da excursao, sem ir ao checkout
    expect(screen.getByRole('heading', { level: 1, name: 'Excursao Ficticia Serra' })).not.toBeNull();
    expect(screen.queryByRole('heading', { name: /Checkout/ })).toBeNull();
  });

  it('falha de rede, erro inesperado e sessao expirada tem mensagens proprias', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/excursoes/7': () => json(200, { excursao: excursao() }), 'POST /api/reservas': () => 'network' });
    abrir('/excursoes/7');
    await screen.findByRole('button', { name: 'Reservar' });
    clicar('Reservar');
    expect((await screen.findByRole('alert')).textContent).toMatch(/Sem conexão com o servidor/);
    cleanup();
    mockApi({ ...comoPassageiro, 'GET /api/excursoes/7': () => json(200, { excursao: excursao() }), 'POST /api/reservas': () => json(500, { error: 'erro_interno' }) });
    abrir('/excursoes/7');
    await screen.findByRole('button', { name: 'Reservar' });
    clicar('Reservar');
    expect((await screen.findByRole('alert')).textContent).toMatch(/Algo deu errado/);
    cleanup();
    mockApi({ ...comoPassageiro, 'GET /api/excursoes/7': () => json(200, { excursao: excursao() }), 'POST /api/reservas': () => json(401, { error: 'nao_autenticado' }) });
    abrir('/excursoes/7');
    await screen.findByRole('button', { name: 'Reservar' });
    clicar('Reservar');
    expect((await screen.findByRole('alert')).textContent).toMatch(/Sua sessão expirou/);
  });
});

describe('checkout (RF-020)', () => {
  it('mostra o resumo, a parcela unica, o total, o aviso da vaga e o texto provisorio do pagamento', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/reservas/31': () => json(200, { reserva: reserva() }) });
    abrir('/reservas/31/checkout');
    expect(await screen.findByRole('heading', { level: 1, name: 'Checkout da reserva nº 31' })).not.toBeNull();
    const detalhes = document.querySelector('dl.detalhes')?.textContent ?? '';
    expect(detalhes).toContain('Excursao Ficticia Serra');
    expect(detalhes).toContain('10/12/2026 a 12/12/2026');
    expect(detalhes).toContain('10/12/2026 às 07:00 (horário de Brasília)');
    expect(detalhes).toContain('Pagamento integral');
    expect(detalhes).toContain('Aguardando pagamento');
    const tabela = document.querySelector('table')?.textContent ?? '';
    expect(tabela).toContain('Parcela única');
    expect(tabela).toContain('R$ 1.500,01');
    expect(tabela).toContain('Total');
    expect(await screen.findByText(/A vaga só é garantida após o pagamento confirmado\./)).not.toBeNull();
    expect(screen.getByText('10:00')).not.toBeNull();
    expect(screen.queryByText(/ainda não segura a vaga/)).toBeNull();
    expect(screen.getByText(/Pagamento: ainda não está disponível\. Será habilitado em uma próxima etapa\. Este texto é provisório\./)).not.toBeNull();
    expect(screen.queryByRole('button', { name: /pagar/i })).toBeNull();
    expect(document.title).toBe('Checkout · BPM Trip');
  });

  it('parcelada: duas parcelas somando o total, com o vencimento da segunda', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/reservas/31': () => json(200, { reserva: parcelada }) });
    abrir('/reservas/31/checkout');
    await screen.findByRole('heading', { level: 1 });
    const linhas = Array.from(document.querySelectorAll('tbody tr')).map((tr) => tr.textContent ?? '');
    expect(linhas[0]).toContain('Primeira parcela');
    expect(linhas[0]).toContain('R$ 750,00');
    expect(linhas[0]).toContain('Ao pagar');
    expect(linhas[1]).toContain('Segunda parcela');
    expect(linhas[1]).toContain('R$ 750,01');
    expect(linhas[1]).toContain('05/12/2026');
    expect(linhas[2]).toContain('R$ 1.500,01');
    expect(document.querySelector('dl.detalhes')?.textContent).toContain('Em 2 parcelas de 50%');
  });

  it('desistir pede confirmacao, cancela a reserva e some com o botao', async () => {
    const calls = mockApi({
      ...comoPassageiro,
      'GET /api/reservas/31': () => json(200, { reserva: reserva() }),
      'POST /api/reservas/31/desistir': () => json(200, { reserva: reserva({ situacao: 'cancelada', pode_desistir: false }) }),
    });
    abrir('/reservas/31/checkout');
    await screen.findByRole('button', { name: 'Desistir da reserva' });
    clicar('Desistir da reserva');
    expect(screen.getByText('Desistir desta reserva?')).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/reservas/31/desistir')).toHaveLength(0);
    clicar('Voltar');
    expect(screen.queryByText('Desistir desta reserva?')).toBeNull();
    clicar('Desistir da reserva');
    clicar('Confirmar desistência');
    expect(await screen.findByText('Reserva cancelada. Você pode reservar de novo quando quiser.')).not.toBeNull();
    expect(screen.getByText('Esta reserva está cancelada.')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Desistir da reserva' })).toBeNull();
    expect(document.querySelector('dl.detalhes')?.textContent).toContain('Cancelada');
    expect(screen.queryByText(/Pagamento: ainda não está disponível/)).toBeNull();
  });

  it('o servidor recusa a desistencia: a razao aparece e a reserva continua', async () => {
    mockApi({
      ...comoPassageiro,
      'GET /api/reservas/31': () => json(200, { reserva: reserva() }),
      'POST /api/reservas/31/desistir': () => json(409, { error: 'reserva_com_pagamento' }),
    });
    abrir('/reservas/31/checkout');
    await screen.findByRole('button', { name: 'Desistir da reserva' });
    clicar('Desistir da reserva');
    clicar('Confirmar desistência');
    expect((await screen.findByRole('alert')).textContent).toBe('Esta reserva já tem pagamento e não pode ser cancelada por aqui.');
    expect(document.querySelector('dl.detalhes')?.textContent).toContain('Aguardando pagamento');
  });

  it('reserva que nao existe ou nao e do passageiro vira "nao encontrada"', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/reservas/99': () => json(404, { error: 'nao_encontrada' }) });
    abrir('/reservas/99/checkout');
    expect(await screen.findByRole('heading', { name: 'Reserva não encontrada' })).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Ver excursões' }).getAttribute('href')).toBe('/excursoes');
  });

  it('visitante e administrador veem acesso restrito, sem consultar a reserva', async () => {
    const calls = mockApi({ 'GET /api/me': () => json(401, { error: 'nao_autenticado' }) });
    abrir('/reservas/31/checkout');
    expect(await screen.findByText(/Entre na sua conta para ver a reserva/)).not.toBeNull();
    expect(calls.some((c) => c.path.startsWith('/api/reservas'))).toBe(false);
    cleanup();
    const calls2 = mockApi({ 'GET /api/me': () => json(200, { usuario: ADMIN }) });
    abrir('/reservas/31/checkout');
    expect(await screen.findByText('Acesso restrito a passageiros.')).not.toBeNull();
    expect(calls2.some((c) => c.path.startsWith('/api/reservas'))).toBe(false);
  });

  it('erro do servidor, falha de rede e id invalido tem telas proprias', async () => {
    mockApi({ ...comoPassageiro, 'GET /api/reservas/31': () => json(500, { error: 'erro_interno' }) });
    abrir('/reservas/31/checkout');
    expect(await screen.findByText('Não foi possível carregar a reserva agora.')).not.toBeNull();
    cleanup();
    mockApi({ ...comoPassageiro, 'GET /api/reservas/31': () => 'network' });
    abrir('/reservas/31/checkout');
    expect(await screen.findByText(/Sem conexão com o servidor/)).not.toBeNull();
    cleanup();
    mockApi(comoPassageiro);
    abrir('/reservas/abc/checkout');
    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).not.toBeNull();
  });

  it('nao grava nada no navegador nem no console', async () => {
    const espioes = (['log', 'warn', 'error'] as const).map((m) => vi.spyOn(console, m));
    mockApi({ ...comoPassageiro, 'GET /api/reservas/31': () => json(200, { reserva: reserva() }) });
    abrir('/reservas/31/checkout');
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: /Checkout/ })).not.toBeNull());
    expect(window.localStorage.length + window.sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
    for (const e of espioes) expect(e).not.toHaveBeenCalled();
    expect(document.querySelectorAll('script[src], link[href], iframe')).toHaveLength(0);
  });
});

const ativa = (segundos: number) => ({ situacao: 'ativa', expira_em: '2026-11-19T12:15:00.000Z', segundos_restantes: segundos });

describe('retencao da vaga no checkout (AGT-008, RF-021)', () => {
  it('formata o tempo restante em mm:ss', () => {
    expect(formatarRestante(900)).toBe('15:00');
    expect(formatarRestante(65)).toBe('01:05');
    expect(formatarRestante(0)).toBe('00:00');
    expect(formatarRestante(-3)).toBe('00:00');
  });

  it('abrir o checkout sem retencao inicia a retencao uma unica vez e mostra o tempo', async () => {
    const calls = mockApi({
      ...comoPassageiro,
      'GET /api/reservas/31': () => json(200, { reserva: reserva({ retencao: null }) }),
      'POST /api/reservas/31/checkout': () => json(200, { reserva: reserva({ retencao: ativa(900) }) }),
    });
    abrir('/reservas/31/checkout');
    expect(await screen.findByText('15:00')).not.toBeNull();
    // o contador e um timer (sem regiao viva): leitores de tela nao anunciam a cada segundo
    expect(screen.getByRole('timer').textContent).toBe('15:00');
    expect(screen.getByRole('timer').closest('p')?.getAttribute('role')).toBeNull();
    expect(screen.getByText(/A vaga só é garantida após o pagamento confirmado\./)).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/reservas/31/checkout')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /Iniciar checkout|Retomar checkout/ })).toBeNull();
  });

  it('com a retencao ja ativa, nao inicia outra', async () => {
    const calls = mockApi({ ...comoPassageiro, 'GET /api/reservas/31': () => json(200, { reserva: reserva({ retencao: ativa(300) }) }) });
    abrir('/reservas/31/checkout');
    expect(await screen.findByText('05:00')).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/reservas/31/checkout')).toHaveLength(0);
  });

  it('sem vaga no checkout: explica, nao mostra tempo e permite tentar de novo', async () => {
    let tentativa = 0;
    const calls = mockApi({
      ...comoPassageiro,
      'GET /api/reservas/31': () => json(200, { reserva: reserva({ retencao: null }) }),
      'POST /api/reservas/31/checkout': () => {
        tentativa += 1;
        return tentativa === 1 ? json(409, { error: 'sem_vagas' }) : json(200, { reserva: reserva({ retencao: ativa(900) }) });
      },
    });
    abrir('/reservas/31/checkout');
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toMatch(/Não há vaga disponível agora/);
    expect(screen.queryByText(/Vaga retida para você/)).toBeNull();
    clicar('Tentar novamente');
    expect(await screen.findByText('15:00')).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/reservas/31/checkout')).toHaveLength(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('retencao expirada no servidor: ao abrir, tenta retomar sozinha', async () => {
    const calls = mockApi({
      ...comoPassageiro,
      'GET /api/reservas/31': () => json(200, { reserva: reserva({ retencao: { situacao: 'expirada', expira_em: '2026-11-19T11:00:00.000Z', segundos_restantes: 0 } }) }),
      'POST /api/reservas/31/checkout': () => json(200, { reserva: reserva({ retencao: ativa(900) }) }),
    });
    abrir('/reservas/31/checkout');
    expect(await screen.findByText('15:00')).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/reservas/31/checkout')).toHaveLength(1);
  });

  it('o tempo acaba na tela: avisa que a vaga foi liberada e oferece retomar', async () => {
    let retomadas = 0;
    const calls = mockApi({
      ...comoPassageiro,
      'GET /api/reservas/31': () => json(200, { reserva: reserva({ retencao: ativa(1) }) }),
      'POST /api/reservas/31/checkout': () => {
        retomadas += 1;
        return json(200, { reserva: reserva({ retencao: ativa(900) }) });
      },
    });
    abrir('/reservas/31/checkout');
    await screen.findByText('00:01');
    const aviso = await screen.findByText(/O tempo da retenção acabou e a vaga foi liberada/, {}, { timeout: 4000 });
    expect(aviso).not.toBeNull();
    expect(screen.queryByText(/Vaga retida para você/)).toBeNull();
    clicar('Retomar checkout');
    expect(await screen.findByText('15:00')).not.toBeNull();
    expect(retomadas).toBe(1);
    expect(chamadas(calls, 'POST', '/api/reservas/31/checkout')).toHaveLength(1);
  });

  it('falha ao iniciar o checkout: mostra o erro e deixa iniciar manualmente', async () => {
    mockApi({
      ...comoPassageiro,
      'GET /api/reservas/31': () => json(200, { reserva: reserva({ retencao: null }) }),
      'POST /api/reservas/31/checkout': () => json(500, { error: 'erro_interno' }),
    });
    abrir('/reservas/31/checkout');
    expect((await screen.findByRole('alert')).textContent).toMatch(/Algo deu errado/);
    expect(screen.getByRole('button', { name: 'Iniciar checkout' })).not.toBeNull();
  });

  it('reserva cancelada nao inicia retencao nem mostra tempo', async () => {
    const calls = mockApi({
      ...comoPassageiro,
      'GET /api/reservas/31': () => json(200, { reserva: reserva({ situacao: 'cancelada', pode_desistir: false, retencao: { situacao: 'cancelada', expira_em: '2026-11-19T12:15:00.000Z', segundos_restantes: 0 } }) }),
    });
    abrir('/reservas/31/checkout');
    expect(await screen.findByText('Esta reserva está cancelada.')).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/reservas/31/checkout')).toHaveLength(0);
    expect(screen.queryByText(/Vaga retida para você/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Iniciar checkout|Retomar checkout/ })).toBeNull();
  });

  it('o passageiro nao pode ter a retencao iniciada por visitante ou administrador', async () => {
    const calls = mockApi({ 'GET /api/me': () => json(200, { usuario: ADMIN }) });
    abrir('/reservas/31/checkout');
    expect(await screen.findByText('Acesso restrito a passageiros.')).not.toBeNull();
    expect(calls.some((c) => c.path.endsWith('/checkout'))).toBe(false);
  });
});
