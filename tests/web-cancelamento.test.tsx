// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App.tsx';
import { json, mockApi } from './helpers/api-mock.ts';
import type { Handler, RecordedCall } from './helpers/api-mock.ts';

/** Cancelamentos e reembolsos na interface (AGT-013): RF-032 a RF-035. */

const PASSAGEIRO = { id: 2, nome_completo: 'Paulo Passageiro Ficticio', email: 'paulo@exemplo.com', perfil: 'passageiro' };
const ADMIN = { ...PASSAGEIRO, id: 1, nome_completo: 'Adriana Admin Ficticia', perfil: 'administrador' };
const comoPassageiro: Record<string, Handler> = { 'GET /api/me': () => json(200, { usuario: PASSAGEIRO }) };
const comoAdmin: Record<string, Handler> = { 'GET /api/me': () => json(200, { usuario: ADMIN }) };

const reserva = (extra: Record<string, unknown> = {}) => ({
  id: 31,
  situacao: 'pronto_para_embarque',
  modalidade: 'integral',
  criada_em: '2026-11-19T12:00:00.000Z',
  excursao: { id: 7, nome: 'Excursao Ficticia Serra', local: 'Serra Ficticia', ponto_embarque: 'Praca Ficticia', data_inicial: '2026-12-10', data_final: '2026-12-12', partida_brasilia: { data: '2026-12-10', hora: '07:00' } },
  valores: { total_centavos: 150001, parcelas: [{ parcela: 'unica', valor_centavos: 150001, vencimento: null, situacao_pagamento: 'confirmado' }] },
  pode_desistir: false,
  pode_cancelar: true,
  reembolsos: [],
  retencao: null,
  pagamento: { parcela: 'unica', situacao: 'confirmado', valor_centavos: 150001, confirmado_em: '2026-11-20T12:00:00.000Z', requer_tratamento_administrativo: false },
  proxima_parcela: null,
  motivo_cancelamento: null,
  pagamento_disponivel: true,
  pagamento_simulado: true,
  ...extra,
});
const previa = (extra: Record<string, unknown> = {}) => ({
  permitido: true,
  motivo_impedimento: null,
  percentual: 100,
  valor_pago_centavos: 150001,
  valor_elegivel_centavos: 150001,
  valor_reembolso_centavos: 150001,
  parcelada_nao_quitada: false,
  tem_pagamento_a_tratar: false,
  partida_utc: '2026-12-10T10:00:00.000Z',
  ...extra,
});
const cancelada = reserva({ situacao: 'cancelada', pode_cancelar: false, reembolsos: [{ valor_centavos: 150001, percentual_aplicado: 100, motivo: 'cancelamento_passageiro', situacao: 'pendente' }] });

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  document.title = '';
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const abrir = (caminho: string) => render(<App appName="BPM Trip" initialPath={caminho} />);
const chamadas = (calls: RecordedCall[], metodo: string, caminho: string) => calls.filter((c) => c.method === metodo && c.path === caminho);
const clicar = async (nome: string) => fireEvent.click(await screen.findByRole('button', { name: nome }));

describe('cancelamento pelo passageiro (detalhe da reserva)', () => {
  const rotas = (extra: Record<string, Handler> = {}, r = reserva()) =>
    mockApi({ ...comoPassageiro, 'GET /api/reservas/31': () => json(200, { reserva: r }), 'GET /api/reservas/31/cancelamento': () => json(200, { previa: previa() }), ...extra });

  it('mostra o reembolso calculado antes de confirmar e so envia o percentual previsto', async () => {
    const calls = rotas({ 'POST /api/reservas/31/cancelamento': () => json(200, { reserva: cancelada }) });
    abrir('/reservas/31');
    await clicar('Cancelar reserva');
    const confirmar = await screen.findByRole('alertdialog');
    expect(confirmar.textContent).toContain('Pago: R$ 1.500,01. Reembolso: R$ 1.500,01 (100% do valor elegível).');
    expect(chamadas(calls, 'POST', '/api/reservas/31/cancelamento')).toHaveLength(0);
    await clicar('Confirmar cancelamento');
    expect(await screen.findByText('Reserva cancelada.')).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/reservas/31/cancelamento')[0]?.body).toEqual({ percentual_previsto: 100 });
    expect(screen.getByRole('region', { name: 'Reembolso' }).textContent).toContain('R$ 1.500,01 (100%), pelo seu cancelamento: pendente.');
    expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).toBeNull();
    expect(document.body.textContent).not.toMatch(/em até|dias úteis|prazo de devolução/i);
  });

  it('parcelada nao quitada e menos de uma semana sao explicadas', async () => {
    rotas({ 'GET /api/reservas/31/cancelamento': () => json(200, { previa: previa({ valor_pago_centavos: 75000, valor_elegivel_centavos: 0, valor_reembolso_centavos: 0, parcelada_nao_quitada: true }) }) });
    abrir('/reservas/31');
    await clicar('Cancelar reserva');
    expect(await screen.findByText(/primeira parcela de uma reserva parcelada que não foi quitada não é reembolsável/)).not.toBeNull();
    cleanup();
    rotas({ 'GET /api/reservas/31/cancelamento': () => json(200, { previa: previa({ percentual: 0, valor_reembolso_centavos: 0 }) }) });
    abrir('/reservas/31');
    await clicar('Cancelar reserva');
    expect(await screen.findByText(/menos de uma semana até a partida, não há reembolso/)).not.toBeNull();
  });

  it('se o valor mudou, consulta de novo e avisa, sem cancelar', async () => {
    let consultas = 0;
    const calls = rotas({
      'GET /api/reservas/31/cancelamento': () => json(200, { previa: previa(consultas++ === 0 ? {} : { percentual: 50, valor_reembolso_centavos: 75000 }) }),
      'POST /api/reservas/31/cancelamento': () => json(409, { error: 'reembolso_mudou' }),
    });
    abrir('/reservas/31');
    await clicar('Cancelar reserva');
    await clicar('Confirmar cancelamento');
    expect(await screen.findByText(/O prazo mudou desde a consulta/)).not.toBeNull();
    await waitFor(() => expect(screen.getByRole('alertdialog').textContent).toContain('R$ 750,00 (50% do valor elegível)'));
    expect(chamadas(calls, 'GET', '/api/reservas/31/cancelamento')).toHaveLength(2);
  });

  it('voltar fecha sem enviar; excursao ja partida mostra a razao', async () => {
    const calls = rotas();
    abrir('/reservas/31');
    await clicar('Cancelar reserva');
    await clicar('Voltar');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
    cleanup();
    rotas({ 'GET /api/reservas/31/cancelamento': () => json(200, { previa: previa({ permitido: false, motivo_impedimento: 'excursao_ja_partiu' }) }) });
    abrir('/reservas/31');
    await clicar('Cancelar reserva');
    expect(await screen.findByText('A excursão já partiu e a reserva não pode mais ser cancelada.')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Confirmar cancelamento' })).toBeNull();
  });

  it('erro e falha de rede na consulta e na confirmacao', async () => {
    rotas({ 'GET /api/reservas/31/cancelamento': () => json(500, { error: 'erro_interno' }) });
    abrir('/reservas/31');
    await clicar('Cancelar reserva');
    expect(await screen.findByText('Não foi possível consultar o reembolso agora.')).not.toBeNull();
    cleanup();
    rotas({ 'POST /api/reservas/31/cancelamento': () => 'network' });
    abrir('/reservas/31');
    await clicar('Cancelar reserva');
    await clicar('Confirmar cancelamento');
    expect(await screen.findByText(/Sem conexão com o servidor/)).not.toBeNull();
  });

  it('sem pagamento (so desistir) ou sem permissao de cancelar, o botao de cancelar nao aparece', async () => {
    rotas({}, reserva({ situacao: 'aguardando_pagamento', pode_desistir: true, pagamento: null }));
    abrir('/reservas/31');
    await screen.findByRole('button', { name: 'Desistir da reserva' });
    expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).toBeNull();
    cleanup();
    rotas({}, reserva({ situacao: 'concluida', pode_cancelar: false }));
    abrir('/reservas/31');
    await screen.findByRole('heading', { level: 1, name: 'Reserva nº 31' });
    expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Reembolso' })).toBeNull();
  });

  it('reserva cancelada pela organizacao mostra o motivo do reembolso', async () => {
    rotas({}, reserva({ situacao: 'cancelada', pode_cancelar: false, reembolsos: [{ valor_centavos: 150001, percentual_aplicado: 100, motivo: 'cancelamento_organizacao', situacao: 'processado' }] }));
    abrir('/reservas/31');
    expect((await screen.findByRole('region', { name: 'Reembolso' })).textContent).toContain('pelo cancelamento da excursão pela organização: processado.');
  });
});

const reembolso = (extra: Record<string, unknown> = {}) => ({ id: 4, reserva_id: 31, pagamento_id: null, valor_centavos: 150001, percentual_aplicado: 100, motivo: 'cancelamento_passageiro', situacao: 'pendente', criado_em: '2026-11-26T12:00:00.000Z', atualizado_em: '2026-11-26T12:00:00.000Z', passageiro: 'Ana Passageira Ficticia', excursao: 'Excursao Ficticia Serra', ...extra });
const lista = (itens: unknown[], processamento = true) => ({ reembolsos: itens, total: itens.length, pagina: 1, limite: 20, processamento_disponivel: processamento });

describe('reembolsos na administracao', () => {
  it('lista, filtra e processa no provedor simulado', async () => {
    let versao = 0;
    const calls = mockApi({
      ...comoAdmin,
      'GET /api/admin/reembolsos': () => json(200, lista([reembolso(versao === 0 ? {} : { situacao: 'processado' })])),
      'GET /api/admin/reembolsos?situacao=recusado': () => json(200, lista([])),
      'POST /api/admin/reembolsos/4/processar': () => {
        versao = 1;
        return json(200, { reembolso: reembolso({ situacao: 'processado' }) });
      },
    });
    abrir('/admin/reembolsos');
    const tabela = await screen.findByRole('table', { name: 'Reembolsos' });
    for (const trecho of ['Ana Passageira Ficticia', 'R$ 1.500,01 (100%)', 'Cancelamento pelo passageiro', 'Pendente']) expect(tabela.textContent).toContain(trecho);
    await clicar('Aprovar (simulado)');
    expect(await screen.findByText('Reembolso nº 4 processado.')).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/admin/reembolsos/4/processar')[0]?.body).toEqual({ resultado: 'aprovado' });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Aprovar (simulado)' })).toBeNull());
    fireEvent.change(screen.getByLabelText('Situação'), { target: { value: 'recusado' } });
    expect(await screen.findByText('Nenhum reembolso encontrado.')).not.toBeNull();
  });

  it('recusado pode ser tentado de novo (so aprovar); sem provedor nao ha acoes', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/reembolsos': () => json(200, lista([reembolso({ situacao: 'recusado' })])) });
    abrir('/admin/reembolsos');
    await screen.findByRole('button', { name: 'Aprovar (simulado)' });
    expect(screen.queryByRole('button', { name: 'Recusar (simulado)' })).toBeNull();
    cleanup();
    mockApi({ ...comoAdmin, 'GET /api/admin/reembolsos': () => json(200, lista([reembolso()], false)) });
    abrir('/admin/reembolsos');
    expect(await screen.findByText('O processamento de reembolso não está disponível neste ambiente.')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /simulado/ })).toBeNull();
  });

  it('a recusa do servidor aparece; visitante e passageiro veem acesso restrito sem consultar', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/reembolsos': () => json(200, lista([reembolso()])), 'POST /api/admin/reembolsos/4/processar': () => json(409, { error: 'reembolso_excede_pago' }) });
    abrir('/admin/reembolsos');
    await clicar('Aprovar (simulado)');
    expect(await screen.findByText('O reembolso passaria do valor pago e não foi processado.')).not.toBeNull();
    cleanup();
    const calls = mockApi(comoPassageiro);
    abrir('/admin/reembolsos');
    expect(await screen.findByText('Acesso restrito a administradores.')).not.toBeNull();
    cleanup();
    const calls2 = mockApi({ 'GET /api/me': () => json(401, { error: 'nao_autenticado' }) });
    abrir('/admin/excursoes/7/cancelamento');
    expect(await screen.findByText(/Acesso restrito\. Entre como administrador/)).not.toBeNull();
    expect([...calls, ...calls2].some((c) => c.path.startsWith('/api/admin'))).toBe(false);
  });

  it('pendencias: reembolsar cria o reembolso e passa a mostrar a situacao', async () => {
    let criado = false;
    const pendencia = () => ({ tipo: 'confirmado_sem_vaga', pagamento: { id: 3, parcela: 'unica', situacao: 'confirmado', valor_centavos: 15000, confirmado_em: '2026-11-19T12:30:00.000Z' }, reserva: { id: 31, situacao: 'aguardando_pagamento' }, passageiro: { id: 2, nome_completo: 'Ana Passageira Ficticia' }, excursao: { id: 7, nome: 'Excursao Ficticia Serra' }, reembolso: criado ? { id: 4, situacao: 'pendente' } : null });
    const calls = mockApi({
      ...comoAdmin,
      'GET /api/admin/pendencias': () => json(200, { pendencias: [pendencia()], total: 1 }),
      'POST /api/admin/pendencias/3/reembolso': () => {
        criado = true;
        return json(200, { reembolso: reembolso() });
      },
    });
    abrir('/admin/pendencias');
    await clicar('Reembolsar');
    expect(await screen.findByRole('link', { name: 'Reembolso: Pendente' })).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/admin/pendencias/3/reembolso')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Reembolsar' })).toBeNull();
  });
});

describe('cancelamento da excursao pela organizacao', () => {
  const previaExc = (extra: Record<string, unknown> = {}) => ({
    excursao: { id: 7, nome: 'Excursao Ficticia Serra', situacao: 'publicada', partida_utc: '2026-12-10T10:00:00.000Z' },
    permitido: true,
    motivo_impedimento: null,
    reservas: [{ id: 31, passageiro: 'Ana Passageira Ficticia', situacao: 'pronto_para_embarque', valor_reembolso_centavos: 15001 }],
    pendencias: [{ pagamento_id: 3, reserva_id: 30, valor_centavos: 7500 }],
    valor_total_centavos: 22501,
    ...extra,
  });

  it('mostra os afetados e o total, exige justificativa e confirmacao e informa o resultado', async () => {
    let enviado = false;
    const calls = mockApi({
      ...comoAdmin,
      'GET /api/admin/excursoes/7/cancelamento': () => json(200, { previa: previaExc() }),
      'POST /api/admin/excursoes/7/cancelamento': (c) => {
        if (c.body?.['justificativa'] === '') return json(400, { error: 'validacao', fields: { justificativa: 'obrigatorio' } });
        enviado = true;
        return json(200, { cancelamento: { ja_cancelada: false, reservas_canceladas: 1, reembolsos_criados: 2, valor_total_centavos: 22501 } });
      },
    });
    abrir('/admin/excursoes/7/cancelamento');
    expect(await screen.findByRole('heading', { level: 1, name: 'Cancelar excursão: Excursao Ficticia Serra' })).not.toBeNull();
    expect(within(screen.getByRole('table', { name: 'Reservas afetadas' })).getByText('Ana Passageira Ficticia')).not.toBeNull();
    expect(screen.getByText('R$ 225,01')).not.toBeNull();
    expect(screen.getByText(/Pagamentos pendentes de tratamento também serão reembolsados: 1\./)).not.toBeNull();
    await clicar('Cancelar excursão');
    expect(chamadas(calls, 'POST', '/api/admin/excursoes/7/cancelamento')).toHaveLength(0);
    await clicar('Confirmar cancelamento da excursão');
    expect(await screen.findByText('Informe a justificativa.')).not.toBeNull();
    expect(enviado).toBe(false);
    fireEvent.change(screen.getByLabelText(/Justificativa/), { target: { value: 'Falta de transporte.' } });
    await clicar('Confirmar cancelamento da excursão');
    expect(await screen.findByText(/Excursão cancelada\. Reservas canceladas: 1\. Reembolsos criados: 2/)).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/admin/excursoes/7/cancelamento').at(-1)?.body).toEqual({ justificativa: 'Falta de transporte.' });
  });

  it('excursao que ja partiu ou ja cancelada nao oferece o cancelamento; inexistente tem tela propria', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/excursoes/7/cancelamento': () => json(200, { previa: previaExc({ permitido: false, motivo_impedimento: 'excursao_ja_partiu' }) }) });
    abrir('/admin/excursoes/7/cancelamento');
    expect(await screen.findByText('A excursão já partiu e não pode mais ser cancelada por aqui.')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancelar excursão' })).toBeNull();
    cleanup();
    mockApi({ ...comoAdmin, 'GET /api/admin/excursoes/9/cancelamento': () => json(404, { error: 'nao_encontrada' }) });
    abrir('/admin/excursoes/9/cancelamento');
    expect(await screen.findByRole('heading', { name: 'Excursão não encontrada' })).not.toBeNull();
  });
});
