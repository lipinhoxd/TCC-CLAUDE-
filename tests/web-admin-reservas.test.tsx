// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App.tsx';
import { json, mockApi } from './helpers/api-mock.ts';
import type { Handler, RecordedCall } from './helpers/api-mock.ts';

/** Administracao de reservas e passageiros na interface (AGT-012): RF-037, RF-038, RF-039. */

const ADMIN = { id: 1, nome_completo: 'Adriana Admin Ficticia', email: 'admin@exemplo.com', perfil: 'administrador' };
const PASSAGEIRO = { ...ADMIN, id: 2, nome_completo: 'Paulo Passageiro Ficticio', perfil: 'passageiro' };
const comoAdmin: Record<string, Handler> = {
  'GET /api/me': () => json(200, { usuario: ADMIN }),
  'GET /api/admin/excursoes': () => json(200, { excursoes: [{ id: 7, nome: 'Excursao Ficticia Serra', situacao: 'publicada', data_inicial: '2026-12-10', data_final: '2026-12-12', capacidade: 20, vagas_ocupadas: 1, preco_centavos: 15000, parcelamento_habilitado: true }] }),
};

const resumo = (extra: Record<string, unknown> = {}) => ({
  id: 31,
  situacao: 'aguardando_pagamento',
  modalidade: 'integral',
  criada_em: '2026-11-19T12:00:00.000Z',
  motivo_cancelamento: null,
  passageiro: { id: 2, nome_completo: 'Ana Passageira Ficticia', email: 'ana.passageira@exemplo.com' },
  excursao: { id: 7, nome: 'Excursao Ficticia Serra', data_inicial: '2026-12-10', data_final: '2026-12-12' },
  total_centavos: 15000,
  tem_pendencia: false,
  ...extra,
});
const LISTA = { reservas: [resumo(), resumo({ id: 30, situacao: 'concluida', modalidade: 'parcelada', tem_pendencia: true, passageiro: { id: 3, nome_completo: 'Beatriz Souza Ficticia', email: 'beatriz.passageira@exemplo.com' } })], total: 2, pagina: 1, limite: 20 };

const detalhe = (extra: Record<string, unknown> = {}) => ({
  id: 31,
  situacao: 'aguardando_pagamento',
  modalidade: 'integral',
  criada_em: '2026-11-19T12:00:00.000Z',
  atualizada_em: '2026-11-19T12:05:00.000Z',
  motivo_cancelamento: null,
  passageiro: { id: 2, nome_completo: 'Ana Passageira Ficticia', email: 'ana.passageira@exemplo.com' },
  excursao: { id: 7, nome: 'Excursao Ficticia Serra', local: 'Serra Ficticia', situacao: 'publicada', data_inicial: '2026-12-10', data_final: '2026-12-12' },
  valores: { total_centavos: 15000, parcelas: [{ parcela: 'unica', valor_centavos: 15000, vencimento: null }] },
  pagamentos: [],
  retencoes: [{ id: 5, situacao: 'ativa', criada_em: '2026-11-19T12:00:00.000Z', expira_em: '2026-11-19T12:15:00.000Z' }],
  pendencias: [],
  alteracoes_permitidas: [
    { para: 'cancelada', disponivel: true, motivo: null },
    { para: 'concluida', disponivel: false, motivo: 'transicao_nao_autorizada' },
  ],
  auditoria: [
    { id: 9, ator_usuario_id: 2, acao: 'reserva.criada', entidade: 'reserva', registro_id: 31, estado_anterior: null, estado_novo: { situacao: 'aguardando_pagamento' }, ocorrido_em: '2026-11-19T12:00:00.000Z' },
  ],
  ...extra,
});

const PASSAGEIROS = {
  passageiros: [{ id: 2, nome_completo: 'Ana Passageira Ficticia', email: 'ana.passageira@exemplo.com', cpf_mascarado: '***.***.***-35', telefone_mascarado: '(**) *****-4321', criado_em: '2026-11-01T12:00:00.000Z', total_reservas: 2 }],
  total: 1,
  pagina: 1,
  limite: 20,
};
const PASSAGEIRO_DETALHE = {
  id: 2,
  nome_completo: 'Ana Passageira Ficticia',
  email: 'ana.passageira@exemplo.com',
  cpf: '11144477735',
  telefone: '+5511987654321',
  data_nascimento: '1990-05-20',
  criado_em: '2026-11-01T12:00:00.000Z',
  reservas: [{ id: 31, situacao: 'cancelada', modalidade: 'parcelada', criada_em: '2026-11-19T12:00:00.000Z', motivo_cancelamento: 'inadimplencia', excursao: { id: 7, nome: 'Excursao Ficticia Serra', data_inicial: '2026-12-10', data_final: '2026-12-12' }, total_centavos: 15000 }],
};

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
const chamadas = (calls: RecordedCall[], metodo: string, caminho: string) => calls.filter((c) => c.method === metodo && c.path === caminho);

describe('menu e acesso', () => {
  it('o menu do administrador tem Reservas e Passageiros; o do passageiro nao', async () => {
    mockApi(comoAdmin);
    abrir('/');
    await screen.findByText('Olá, Adriana');
    const menu = within(screen.getByRole('navigation', { name: 'Principal' }));
    expect(menu.getByRole('link', { name: 'Reservas' }).getAttribute('href')).toBe('/admin/reservas');
    expect(menu.getByRole('link', { name: 'Passageiros' }).getAttribute('href')).toBe('/admin/passageiros');
    cleanup();
    mockApi({ 'GET /api/me': () => json(200, { usuario: PASSAGEIRO }) });
    abrir('/');
    await screen.findByText('Olá, Paulo');
    const menu2 = within(screen.getByRole('navigation', { name: 'Principal' }));
    expect(menu2.queryByRole('link', { name: 'Reservas' })).toBeNull();
    expect(menu2.queryByRole('link', { name: 'Passageiros' })).toBeNull();
  });

  it('visitante e passageiro veem acesso restrito em todas as paginas, sem consultar a API de administracao', async () => {
    for (const caminho of ['/admin/reservas', '/admin/reservas/31', '/admin/passageiros', '/admin/passageiros/2', '/admin/pendencias']) {
      const calls = mockApi({ 'GET /api/me': () => json(401, { error: 'nao_autenticado' }) });
      abrir(caminho);
      expect(await screen.findByText(/Acesso restrito\. Entre como administrador/), caminho).not.toBeNull();
      expect(calls.some((c) => c.path.startsWith('/api/admin')), caminho).toBe(false);
      cleanup();
      const calls2 = mockApi({ 'GET /api/me': () => json(200, { usuario: PASSAGEIRO }) });
      abrir(caminho);
      expect(await screen.findByText('Acesso restrito a administradores.'), caminho).not.toBeNull();
      expect(calls2.some((c) => c.path.startsWith('/api/admin')), caminho).toBe(false);
      cleanup();
    }
  });

  it('id invalido na rota mostra pagina nao encontrada', async () => {
    mockApi(comoAdmin);
    abrir('/admin/reservas/abc');
    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).not.toBeNull();
  });
});

describe('lista de reservas (RF-037)', () => {
  it('mostra as reservas com passageiro, excursao, situacao e pendencia, sem CPF nem telefone', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/reservas': () => json(200, LISTA) });
    abrir('/admin/reservas');
    const tabela = await screen.findByRole('table', { name: 'Reservas' });
    const linhas = within(tabela).getAllByRole('row').slice(1);
    expect(linhas).toHaveLength(2);
    expect(linhas[0]?.textContent).toContain('Ana Passageira Ficticia');
    expect(linhas[0]?.textContent).toContain('Aguardando pagamento');
    expect(linhas[0]?.textContent).toContain('R$ 150,00');
    expect(linhas[1]?.textContent).toContain('Concluída');
    expect(linhas[1]?.textContent).toContain('Em 2 parcelas de 50%');
    expect(linhas[1]?.textContent).toContain('Sim');
    expect(within(linhas[0] as HTMLElement).getByRole('link', { name: 'Reserva nº 31' }).getAttribute('href')).toBe('/admin/reservas/31');
    expect(screen.getByRole('heading', { level: 1, name: 'Reservas' })).not.toBeNull();
    await waitFor(() => expect(document.title).toContain('reservas'));
  });

  it('o filtro envia os parametros ao servidor e limpar volta a lista completa', async () => {
    const calls = mockApi({
      ...comoAdmin,
      'GET /api/admin/reservas': () => json(200, LISTA),
      'GET /api/admin/reservas?excursao_id=7&situacao=cancelada&modalidade=parcelada&q=ana': () => json(200, { reservas: [], total: 0, pagina: 1, limite: 20 }),
    });
    abrir('/admin/reservas');
    await screen.findByRole('table', { name: 'Reservas' });
    await waitFor(() => expect(screen.getByLabelText<HTMLSelectElement>('Excursão').options.length).toBe(2));
    fireEvent.change(screen.getByLabelText('Excursão'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Situação'), { target: { value: 'cancelada' } });
    fireEvent.change(screen.getByLabelText('Forma de pagamento'), { target: { value: 'parcelada' } });
    fireEvent.change(screen.getByLabelText(/Passageiro \(nome/), { target: { value: 'ana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));
    expect(await screen.findByText('Nenhuma reserva encontrada.')).not.toBeNull();
    expect(chamadas(calls, 'GET', '/api/admin/reservas?excursao_id=7&situacao=cancelada&modalidade=parcelada&q=ana')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(await screen.findByRole('table', { name: 'Reservas' })).not.toBeNull();
    expect(screen.getByLabelText<HTMLSelectElement>('Situação').value).toBe('');
  });

  it('pagina: Proxima pede a pagina 2 e Anterior volta', async () => {
    const calls = mockApi({
      ...comoAdmin,
      'GET /api/admin/reservas': () => json(200, { ...LISTA, total: 45, limite: 20 }),
      'GET /api/admin/reservas?pagina=2': () => json(200, { ...LISTA, total: 45, pagina: 2, limite: 20 }),
    });
    abrir('/admin/reservas');
    await screen.findByText(/Página 1 de 3 \(45 resultados\)/);
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Anterior' }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    await screen.findByText(/Página 2 de 3/);
    expect(chamadas(calls, 'GET', '/api/admin/reservas?pagina=2')).toHaveLength(1);
  });

  it('lista vazia, erro do servidor e falha de rede tem mensagens proprias', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/reservas': () => json(200, { reservas: [], total: 0, pagina: 1, limite: 20 }) });
    abrir('/admin/reservas');
    expect(await screen.findByText('Nenhuma reserva encontrada.')).not.toBeNull();
    cleanup();
    mockApi({ ...comoAdmin, 'GET /api/admin/reservas': () => json(500, { error: 'erro_interno' }) });
    abrir('/admin/reservas');
    expect(await screen.findByText('Não foi possível carregar agora.')).not.toBeNull();
    cleanup();
    mockApi({ ...comoAdmin, 'GET /api/admin/reservas': () => 'network' });
    abrir('/admin/reservas');
    expect(await screen.findByText(/Sem conexão com o servidor/)).not.toBeNull();
  });

  it('nao grava nada no navegador nem no console e nao usa recursos externos', async () => {
    const espioes = (['log', 'warn', 'error'] as const).map((m) => vi.spyOn(console, m));
    mockApi({ ...comoAdmin, 'GET /api/admin/reservas': () => json(200, LISTA) });
    abrir('/admin/reservas');
    await screen.findByRole('table', { name: 'Reservas' });
    expect(window.localStorage.length + window.sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
    for (const e of espioes) expect(e).not.toHaveBeenCalled();
    expect(document.querySelectorAll('script[src], link[href], iframe')).toHaveLength(0);
  });
});

describe('detalhe e alteracao manual (RF-039)', () => {
  const cancelada = detalhe({
    situacao: 'cancelada',
    alteracoes_permitidas: [
      { para: 'cancelada', disponivel: false, motivo: 'ja_cancelada' },
      { para: 'concluida', disponivel: false, motivo: 'transicao_nao_autorizada' },
    ],
    auditoria: [{ id: 10, ator_usuario_id: 1, acao: 'reserva.cancelamento_manual', entidade: 'reserva', registro_id: 31, estado_anterior: { situacao: 'aguardando_pagamento' }, estado_novo: { situacao: 'cancelada', justificativa: 'Pedido por telefone.' }, ocorrido_em: '2026-11-19T13:00:00.000Z' }],
  });

  it('mostra passageiro, excursao, situacao, parcelas, retencao e o historico de auditoria', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/reservas/31': () => json(200, { reserva: detalhe() }) });
    abrir('/admin/reservas/31');
    expect(await screen.findByRole('heading', { level: 1, name: 'Reserva nº 31' })).not.toBeNull();
    const dados = document.querySelector('dl.detalhes')?.textContent ?? '';
    for (const trecho of ['Ana Passageira Ficticia', 'ana.passageira@exemplo.com', 'Excursao Ficticia Serra', 'Serra Ficticia', 'Pagamento integral', 'Aguardando pagamento']) expect(dados).toContain(trecho);
    expect(screen.getByRole('link', { name: 'Ana Passageira Ficticia' }).getAttribute('href')).toBe('/admin/passageiros/2');
    expect(within(screen.getByRole('table', { name: 'Parcelas da reserva e seus pagamentos' })).getByText('Sem pagamento')).not.toBeNull();
    expect(screen.getByText(/Ativa: criada em/)).not.toBeNull();
    expect(within(screen.getByRole('table', { name: 'Eventos de auditoria da reserva' })).getByText('Reserva criada')).not.toBeNull();
  });

  it('cancelar pede justificativa e confirmacao e envia situacao e justificativa, sem enviar o administrador', async () => {
    const calls = mockApi({
      ...comoAdmin,
      'GET /api/admin/reservas/31': () => json(200, { reserva: detalhe() }),
      'POST /api/admin/reservas/31/situacao': () => json(200, { reserva: cancelada }),
    });
    abrir('/admin/reservas/31');
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva' }));
    expect(chamadas(calls, 'POST', '/api/admin/reservas/31/situacao')).toHaveLength(0);
    fireEvent.change(screen.getByLabelText('Justificativa (obrigatória)'), { target: { value: 'Pedido por telefone.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));
    expect(await screen.findByText('Reserva cancelada e registrada na auditoria.')).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/admin/reservas/31/situacao')[0]?.body).toEqual({ situacao: 'cancelada', justificativa: 'Pedido por telefone.' });
    expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).toBeNull();
    expect(screen.getByText(/Nenhuma alteração manual está disponível/)).not.toBeNull();
    expect(screen.getByText('Pedido por telefone.')).not.toBeNull();
    expect(screen.getByText('Usuário nº 1')).not.toBeNull();
  });

  it('justificativa vazia: o servidor recusa e a tela pede a justificativa, sem mudar a reserva', async () => {
    mockApi({
      ...comoAdmin,
      'GET /api/admin/reservas/31': () => json(200, { reserva: detalhe() }),
      'POST /api/admin/reservas/31/situacao': () => json(400, { error: 'validacao', fields: { justificativa: 'obrigatorio' } }),
    });
    abrir('/admin/reservas/31');
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));
    expect(await screen.findByText('Informe a justificativa.')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Confirmar cancelamento' })).not.toBeNull();
  });

  it('voltar fecha o formulario sem enviar nada', async () => {
    const calls = mockApi({ ...comoAdmin, 'GET /api/admin/reservas/31': () => json(200, { reserva: detalhe() }) });
    abrir('/admin/reservas/31');
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva' }));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.queryByLabelText('Justificativa (obrigatória)')).toBeNull();
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('o servidor recusa por pagamento ou por transicao: a razao aparece e a reserva continua', async () => {
    mockApi({
      ...comoAdmin,
      'GET /api/admin/reservas/31': () => json(200, { reserva: detalhe() }),
      'POST /api/admin/reservas/31/situacao': () => json(409, { error: 'reserva_com_pagamento' }),
    });
    abrir('/admin/reservas/31');
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva' }));
    fireEvent.change(screen.getByLabelText('Justificativa (obrigatória)'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));
    expect(await screen.findByText(/tem pagamento pendente ou confirmado e não pode ser cancelada/)).not.toBeNull();
  });

  it('reserva com pagamento: nenhuma alteracao disponivel, e a pendencia aparece sem acao de tratamento', async () => {
    const paga = detalhe({
      situacao: 'aguardando_pagamento',
      pagamentos: [{ id: 3, parcela: 'unica', situacao: 'confirmado', valor_centavos: 15000, confirmado_em: '2026-11-19T12:30:00.000Z', criado_em: '2026-11-19T12:10:00.000Z', pendencia: 'confirmado_sem_vaga' }],
      pendencias: ['confirmado_sem_vaga'],
      alteracoes_permitidas: [
        { para: 'cancelada', disponivel: false, motivo: 'reserva_com_pagamento' },
        { para: 'concluida', disponivel: false, motivo: 'transicao_nao_autorizada' },
      ],
    });
    mockApi({ ...comoAdmin, 'GET /api/admin/reservas/31': () => json(200, { reserva: paga }) });
    abrir('/admin/reservas/31');
    expect(await screen.findByText(/Pendência administrativa: Pagamento confirmado sem vaga/)).not.toBeNull();
    expect(screen.getByText(/ela tem pagamento pendente ou confirmado/)).not.toBeNull();
    expect(screen.queryByRole('button', { name: /Cancelar reserva|Marcar como concluída/ })).toBeNull();
    expect(screen.getByText(/Pago \(sem vaga\)/)).not.toBeNull();
    expect(document.body.textContent).not.toContain('confirmacao_sem_vaga');
  });

  it('marcar como concluida aparece quando o servidor a disponibiliza', async () => {
    const pronta = detalhe({
      situacao: 'pronto_para_embarque',
      alteracoes_permitidas: [
        { para: 'cancelada', disponivel: false, motivo: 'transicao_nao_autorizada' },
        { para: 'concluida', disponivel: true, motivo: null },
      ],
    });
    const concluida = detalhe({ situacao: 'concluida', alteracoes_permitidas: [{ para: 'cancelada', disponivel: false, motivo: 'transicao_nao_autorizada' }, { para: 'concluida', disponivel: false, motivo: 'ja_concluida' }] });
    const calls = mockApi({ ...comoAdmin, 'GET /api/admin/reservas/31': () => json(200, { reserva: pronta }), 'POST /api/admin/reservas/31/situacao': () => json(200, { reserva: concluida }) });
    abrir('/admin/reservas/31');
    fireEvent.click(await screen.findByRole('button', { name: 'Marcar como concluída' }));
    fireEvent.change(screen.getByLabelText('Justificativa (obrigatória)'), { target: { value: 'Viagem realizada.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar conclusão' }));
    expect(await screen.findByText('Reserva marcada como concluída e registrada na auditoria.')).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/admin/reservas/31/situacao')[0]?.body).toEqual({ situacao: 'concluida', justificativa: 'Viagem realizada.' });
  });

  it('reserva inexistente, erro e falha de rede tem telas proprias', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/reservas/99': () => json(404, { error: 'nao_encontrada' }) });
    abrir('/admin/reservas/99');
    expect(await screen.findByRole('heading', { name: 'Reserva não encontrada' })).not.toBeNull();
    cleanup();
    mockApi({ ...comoAdmin, 'GET /api/admin/reservas/31': () => json(500, { error: 'erro_interno' }) });
    abrir('/admin/reservas/31');
    expect(await screen.findByText('Não foi possível carregar agora.')).not.toBeNull();
    cleanup();
    mockApi({ ...comoAdmin, 'GET /api/admin/reservas/31': () => 'network' });
    abrir('/admin/reservas/31');
    expect(await screen.findByText(/Sem conexão com o servidor/)).not.toBeNull();
  });
});

describe('pendencias administrativas (RF-026)', () => {
  const PENDENCIAS = {
    pendencias: [
      { tipo: 'confirmado_sem_vaga', pagamento: { id: 3, parcela: 'unica', situacao: 'confirmado', valor_centavos: 15000, confirmado_em: '2026-11-19T12:30:00.000Z' }, reserva: { id: 31, situacao: 'aguardando_pagamento' }, passageiro: { id: 2, nome_completo: 'Ana Passageira Ficticia' }, excursao: { id: 7, nome: 'Excursao Ficticia Serra' }, reembolso: null },
      { tipo: 'segunda_parcela_apos_vencimento', pagamento: { id: 4, parcela: 'segunda', situacao: 'confirmado', valor_centavos: 7500, confirmado_em: '2026-12-07T12:00:00.000Z' }, reserva: { id: 30, situacao: 'cancelada' }, passageiro: { id: 3, nome_completo: 'Beatriz Souza Ficticia' }, excursao: { id: 7, nome: 'Excursao Ficticia Serra' }, reembolso: null },
    ],
    total: 2,
  };

  it('lista as pendencias com a acao de reembolso (AGT-013) e filtra por tipo', async () => {
    const calls = mockApi({
      ...comoAdmin,
      'GET /api/admin/pendencias': () => json(200, PENDENCIAS),
      'GET /api/admin/pendencias?tipo=confirmado_sem_vaga': () => json(200, { pendencias: [PENDENCIAS.pendencias[0]], total: 1 }),
    });
    abrir('/admin/pendencias');
    const tabela = await screen.findByRole('table', { name: 'Pendências administrativas' });
    const linhas = within(tabela).getAllByRole('row').slice(1);
    expect(linhas).toHaveLength(2);
    expect(linhas[0]?.textContent).toContain('Pagamento confirmado sem vaga');
    expect(linhas[1]?.textContent).toContain('Segunda parcela confirmada depois do vencimento');
    expect(within(tabela).getAllByRole('button', { name: 'Reembolsar' })).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'confirmado_sem_vaga' } });
    await waitFor(() => expect(within(screen.getByRole('table', { name: 'Pendências administrativas' })).getAllByRole('row')).toHaveLength(2));
    expect(chamadas(calls, 'GET', '/api/admin/pendencias?tipo=confirmado_sem_vaga')).toHaveLength(1);
  });

  it('sem pendencias mostra a mensagem', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/pendencias': () => json(200, { pendencias: [], total: 0 }) });
    abrir('/admin/pendencias');
    expect(await screen.findByText('Nenhuma pendência.')).not.toBeNull();
  });
});

describe('passageiros (RF-038; decisao 1)', () => {
  it('a lista mostra CPF e telefone mascarados e a busca envia o termo', async () => {
    const calls = mockApi({
      ...comoAdmin,
      'GET /api/admin/passageiros': () => json(200, PASSAGEIROS),
      'GET /api/admin/passageiros?q=ana': () => json(200, PASSAGEIROS),
    });
    abrir('/admin/passageiros');
    const tabela = await screen.findByRole('table', { name: 'Passageiros' });
    const linha = within(tabela).getAllByRole('row')[1] as HTMLElement;
    for (const trecho of ['Ana Passageira Ficticia', 'ana.passageira@exemplo.com', '***.***.***-35', '(**) *****-4321']) expect(linha.textContent).toContain(trecho);
    expect(document.body.textContent).not.toContain('11144477735');
    expect(within(linha).getByRole('link', { name: 'Ana Passageira Ficticia' }).getAttribute('href')).toBe('/admin/passageiros/2');
    fireEvent.change(screen.getByLabelText(/Buscar \(nome/), { target: { value: 'ana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await waitFor(() => expect(chamadas(calls, 'GET', '/api/admin/passageiros?q=ana')).toHaveLength(1));
  });

  it('o detalhe mostra os dados completos, avisa que a consulta e auditada e lista as reservas', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/passageiros/2': () => json(200, { passageiro: PASSAGEIRO_DETALHE }) });
    abrir('/admin/passageiros/2');
    expect(await screen.findByRole('heading', { level: 1, name: 'Ana Passageira Ficticia' })).not.toBeNull();
    expect(screen.getByText(/Esta consulta foi registrada na auditoria/)).not.toBeNull();
    const dados = document.querySelector('dl.detalhes')?.textContent ?? '';
    for (const trecho of ['11144477735', '+5511987654321', '20/05/1990', 'ana.passageira@exemplo.com']) expect(dados).toContain(trecho);
    const tabela = screen.getByRole('table', { name: 'Reservas do passageiro' });
    expect(tabela.textContent).toContain('Cancelada (segunda parcela não paga)');
    expect(within(tabela).getByRole('link', { name: 'Reserva nº 31' }).getAttribute('href')).toBe('/admin/reservas/31');
  });

  it('passageiro inexistente, lista vazia e erro tem telas proprias', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/passageiros/9': () => json(404, { error: 'nao_encontrada' }) });
    abrir('/admin/passageiros/9');
    expect(await screen.findByRole('heading', { name: 'Passageiro não encontrado' })).not.toBeNull();
    cleanup();
    mockApi({ ...comoAdmin, 'GET /api/admin/passageiros': () => json(200, { passageiros: [], total: 0, pagina: 1, limite: 20 }) });
    abrir('/admin/passageiros');
    expect(await screen.findByText('Nenhum passageiro encontrado.')).not.toBeNull();
    cleanup();
    mockApi({ ...comoAdmin, 'GET /api/admin/passageiros': () => json(500, { error: 'erro_interno' }) });
    abrir('/admin/passageiros');
    expect(await screen.findByText('Não foi possível carregar agora.')).not.toBeNull();
  });
});
