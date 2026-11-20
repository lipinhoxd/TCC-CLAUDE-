// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App.tsx';
import { empty, json, mockApi } from './helpers/api-mock.ts';
import type { Handler, RecordedCall } from './helpers/api-mock.ts';

const ADMIN = { id: 1, nome_completo: 'Ana Admin Ficticia', email: 'ana.admin@exemplo.com', perfil: 'administrador' };
const PASSAGEIRO = { ...ADMIN, id: 2, nome_completo: 'Paulo Passageiro Ficticio', perfil: 'passageiro' };

const comoAdmin: Record<string, Handler> = { 'GET /api/me': () => json(200, { usuario: ADMIN }) };

function excursao(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 7,
    nome: 'Excursao Ficticia Serra',
    descricao: 'Passeio ficticio',
    imagem_ref: 'imagens/serra.jpg',
    local: 'Serra Ficticia',
    ponto_embarque: 'Praca Ficticia',
    data_inicial: '2026-12-10',
    data_final: '2026-12-12',
    partida_utc: '2026-12-10T10:00:00.000Z',
    capacidade: 20,
    vagas_ocupadas: 0,
    preco_centavos: 150000,
    parcelamento_habilitado: true,
    prazo_segunda_parcela: '2026-12-05',
    situacao: 'rascunho',
    versao: '2026-11-13T12:00:00.000Z',
    edicao_restrita: false,
    campos_bloqueados: [],
    transicoes: [
      { para: 'publicada', disponivel: true, motivo: null },
      { para: 'cancelada', disponivel: true, motivo: null },
    ],
    ...extra,
  };
}

const HISTORICO = [
  { id: 2, ator_usuario_id: 1, acao: 'excursao.editada', estado_anterior: { nome: 'A' }, estado_novo: { nome: 'B', preco_centavos: 1 }, ocorrido_em: '2026-11-13T15:30:00.000Z' },
  { id: 1, ator_usuario_id: 1, acao: 'excursao.criada', estado_anterior: null, estado_novo: { situacao: 'rascunho' }, ocorrido_em: '2026-11-13T12:00:00.000Z' },
];

const ver: Handler = () => json(200, { excursao: excursao() });
const hist: Handler = () => json(200, { historico: HISTORICO });

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const campo = (rotulo: string) => screen.getByLabelText<HTMLInputElement>(rotulo);
const digitar = (rotulo: string, valor: string) => fireEvent.change(campo(rotulo), { target: { value: valor } });
const clicar = (nome: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nome }));
const chamadas = (calls: RecordedCall[], metodo: string, caminho: string) => calls.filter((c) => c.method === metodo && c.path === caminho);

function abrir(caminho: string) {
  render(<App appName="BPM Trip" initialPath={caminho} />);
}

describe('acesso restrito (RNF-002, RNF-004)', () => {
  it('visitante ve aviso com link para o login e nenhuma chamada administrativa e feita', async () => {
    const calls = mockApi({ 'GET /api/me': () => json(401, { error: 'nao_autenticado' }) });
    abrir('/admin/excursoes');
    expect(await screen.findByText(/Acesso restrito\. Entre como administrador/)).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Ir para o login' })).not.toBeNull();
    expect(calls.some((c) => c.path.startsWith('/api/admin'))).toBe(false);
  });

  it('passageiro ve acesso restrito a administradores e nenhuma chamada administrativa e feita', async () => {
    const calls = mockApi({ 'GET /api/me': () => json(200, { usuario: PASSAGEIRO }) });
    abrir('/admin/excursoes/nova');
    expect(await screen.findByText('Acesso restrito a administradores.')).not.toBeNull();
    expect(calls.some((c) => c.path.startsWith('/api/admin'))).toBe(false);
  });

  it('o item Administracao so aparece no menu do administrador', async () => {
    mockApi({ 'GET /api/me': () => json(200, { usuario: PASSAGEIRO }) });
    abrir('/');
    await screen.findByText('Olá, Paulo');
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).queryByRole('link', { name: 'Administração' })).toBeNull();
    cleanup();
    mockApi({ ...comoAdmin, 'GET /api/admin/excursoes': () => json(200, { excursoes: [] }) });
    abrir('/');
    await screen.findByText('Olá, Ana');
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Administração' })).not.toBeNull();
  });

  it('se o servidor responder 403 (sessao sem perfil), a tela mostra acesso restrito, nao tela em branco', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/excursoes': () => json(403, { error: 'acesso_negado' }) });
    abrir('/admin/excursoes');
    expect(await screen.findByText('Acesso restrito a administradores.')).not.toBeNull();
  });
});

describe('lista de excursoes', () => {
  it('mostra situacao, datas, vagas e preco em reais, com link para editar', async () => {
    mockApi({
      ...comoAdmin,
      'GET /api/admin/excursoes': () =>
        json(200, {
          excursoes: [
            { id: 7, nome: 'Excursao Ficticia Serra', situacao: 'publicada', data_inicial: '2026-12-10', data_final: '2026-12-12', capacidade: 20, vagas_ocupadas: 3, preco_centavos: 150000, parcelamento_habilitado: true },
            { id: 8, nome: 'Outra Ficticia', situacao: 'cancelada', data_inicial: '2027-01-02', data_final: '2027-01-03', capacidade: 10, vagas_ocupadas: 0, preco_centavos: 9990, parcelamento_habilitado: false },
          ],
        }),
    });
    abrir('/admin/excursoes');
    const linha = (await screen.findByRole('link', { name: 'Excursao Ficticia Serra' })).closest('tr');
    expect(linha?.textContent).toContain('Publicada');
    expect(linha?.textContent).toContain('10/12/2026 a 12/12/2026');
    expect(linha?.textContent).toContain('3 de 20');
    expect(linha?.textContent).toContain('R$ 1.500,00 (em 2x)');
    expect(screen.getByRole('link', { name: 'Excursao Ficticia Serra' }).getAttribute('href')).toBe('/admin/excursoes/7');
    expect(screen.getByText('R$ 99,90')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Nova excursão' }).getAttribute('href')).toBe('/admin/excursoes/nova');
  });

  it('lista vazia, erro do servidor e falha de rede tem mensagens proprias', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/excursoes': () => json(200, { excursoes: [] }) });
    abrir('/admin/excursoes');
    expect(await screen.findByText('Nenhuma excursão cadastrada ainda')).not.toBeNull();
    cleanup();
    mockApi({ ...comoAdmin, 'GET /api/admin/excursoes': () => json(500, { error: 'erro_interno' }) });
    abrir('/admin/excursoes');
    expect(await screen.findByText('Não foi possível carregar as excursões.')).not.toBeNull();
    cleanup();
    mockApi({ ...comoAdmin, 'GET /api/admin/excursoes': () => 'network' });
    abrir('/admin/excursoes');
    expect(await screen.findByText(/Sem conexão com o servidor/)).not.toBeNull();
  });
});

describe('nova excursao', () => {
  async function preencher() {
    await screen.findByRole('button', { name: 'Criar excursão' });
    digitar('Nome', 'Excursao Ficticia Serra');
    digitar('Descrição', 'Passeio ficticio');
    digitar('Imagem (opcional)', 'imagens/serra.jpg');
    digitar('Local', 'Serra Ficticia');
    digitar('Ponto de embarque', 'Praca Ficticia');
    digitar('Data inicial', '2026-12-10');
    digitar('Data final', '2026-12-12');
    digitar('Partida (horário de Brasília)', '2026-12-10T07:00');
    digitar('Capacidade (vagas)', '20');
    digitar('Preço (R$)', '1.500,00');
  }

  it('converte reais em centavos e a partida de Brasilia em UTC antes de enviar, e leva a excursao criada', async () => {
    const calls = mockApi({
      ...comoAdmin,
      'POST /api/admin/excursoes': () => json(201, { excursao: excursao() }),
      'GET /api/admin/excursoes/7': ver,
      'GET /api/admin/excursoes/7/historico': hist,
    });
    abrir('/admin/excursoes/nova');
    await preencher();
    fireEvent.click(screen.getByLabelText('Permitir pagamento em duas parcelas de 50%'));
    digitar('Prazo da segunda parcela', '2026-12-05');
    clicar('Criar excursão');
    expect(await screen.findByText('Excursão criada em Rascunho. Publique quando estiver pronta.')).not.toBeNull();
    expect(window.location.pathname).toBe('/admin/excursoes/7');
    const corpo = chamadas(calls, 'POST', '/api/admin/excursoes')[0]?.body;
    expect(corpo).toEqual({
      nome: 'Excursao Ficticia Serra',
      descricao: 'Passeio ficticio',
      imagem_ref: 'imagens/serra.jpg',
      local: 'Serra Ficticia',
      ponto_embarque: 'Praca Ficticia',
      data_inicial: '2026-12-10',
      data_final: '2026-12-12',
      partida_utc: '2026-12-10T10:00:00.000Z',
      capacidade: 20,
      preco_centavos: 150000,
      parcelamento_habilitado: true,
      prazo_segunda_parcela: '2026-12-05',
    });
  });

  it('o aviso de criacao some quando a propria pagina mostra um aviso mais novo', async () => {
    mockApi({
      ...comoAdmin,
      'POST /api/admin/excursoes': () => json(201, { excursao: excursao() }),
      'GET /api/admin/excursoes/7': ver,
      'GET /api/admin/excursoes/7/historico': hist,
      'PATCH /api/admin/excursoes/7': () => json(200, { excursao: excursao({ nome: 'Nome Novo Ficticio' }) }),
    });
    abrir('/admin/excursoes/nova');
    await preencher();
    clicar('Criar excursão');
    await screen.findByText(/Excursão criada em Rascunho/);
    await screen.findByRole('button', { name: 'Salvar alterações' }); // espera a pagina de edicao terminar de carregar
    digitar('Nome', 'Nome Novo Ficticio');
    clicar('Salvar alterações');
    await screen.findByText('Alterações salvas.');
    expect(screen.queryByText(/Excursão criada em Rascunho/)).toBeNull();
  });

  it('sem parcelamento nao envia prazo; o prazo some da tela', async () => {
    const calls = mockApi({ ...comoAdmin, 'POST /api/admin/excursoes': () => json(201, { excursao: excursao({ parcelamento_habilitado: false, prazo_segunda_parcela: null }) }), 'GET /api/admin/excursoes/7': ver, 'GET /api/admin/excursoes/7/historico': hist });
    abrir('/admin/excursoes/nova');
    await preencher();
    expect(screen.queryByLabelText('Prazo da segunda parcela')).toBeNull();
    clicar('Criar excursão');
    await screen.findByText(/Excursão criada em Rascunho/);
    expect(chamadas(calls, 'POST', '/api/admin/excursoes')[0]?.body).toMatchObject({ parcelamento_habilitado: false, prazo_segunda_parcela: null });
  });

  it('valores impossiveis de converter sao recusados na tela e nada e enviado', async () => {
    const calls = mockApi(comoAdmin);
    abrir('/admin/excursoes/nova');
    await preencher();
    digitar('Preço (R$)', '1,234.56');
    digitar('Capacidade (vagas)', '10.5');
    clicar('Criar excursão');
    expect(await screen.findByText('Informe o preço em reais, por exemplo 1.500,00.')).not.toBeNull();
    expect(screen.getByText('Informe um número inteiro.')).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/admin/excursoes')).toHaveLength(0);
    await waitFor(() => expect(document.activeElement?.id).toBe('capacidade'));
  });

  it('formulario vazio mostra os campos que a tela valida e nao chama a API', async () => {
    const calls = mockApi(comoAdmin);
    abrir('/admin/excursoes/nova');
    await screen.findByRole('button', { name: 'Criar excursão' });
    clicar('Criar excursão');
    expect(await screen.findAllByText('Preencha este campo.')).toHaveLength(3);
    expect(chamadas(calls, 'POST', '/api/admin/excursoes')).toHaveLength(0);
  });

  it('mostra por campo os erros que o servidor devolve e leva o foco ao primeiro', async () => {
    mockApi({
      ...comoAdmin,
      'POST /api/admin/excursoes': () =>
        json(400, { error: 'validacao', fields: { partida_utc: 'fora_da_data_inicial', preco_centavos: 'fora_do_limite', data_final: 'anterior_a_data_inicial', imagem_ref: 'invalido' } }),
    });
    abrir('/admin/excursoes/nova');
    await preencher();
    clicar('Criar excursão');
    expect(await screen.findByText('A partida deve ser na data inicial ou no dia anterior (horário de Brasília).')).not.toBeNull();
    expect(screen.getByText('O preço deve ficar entre R$ 0,01 e R$ 100.000,00.')).not.toBeNull();
    expect(screen.getByText('A data final não pode ser anterior à data inicial.')).not.toBeNull();
    expect(screen.getByText(/Use um caminho como imagens\/nome\.jpg/)).not.toBeNull();
    expect(screen.getByRole('alert').textContent).toBe('Corrija os campos destacados.');
    await waitFor(() => expect(document.activeElement?.id).toBe('imagem_ref'));
    expect(campo('Partida (horário de Brasília)').getAttribute('aria-invalid')).toBe('true');
  });

  it('falha de rede e erro inesperado mantem os dados digitados', async () => {
    mockApi({ ...comoAdmin, 'POST /api/admin/excursoes': () => 'network' });
    abrir('/admin/excursoes/nova');
    await preencher();
    clicar('Criar excursão');
    expect((await screen.findByRole('alert')).textContent).toMatch(/Sem conexão com o servidor/);
    expect(campo('Nome').value).toBe('Excursao Ficticia Serra');
  });
});

describe('edicao', () => {
  const base: Record<string, Handler> = { ...comoAdmin, 'GET /api/admin/excursoes/7': ver, 'GET /api/admin/excursoes/7/historico': hist };

  it('carrega os dados convertidos (reais e horario de Brasilia), a situacao e o historico', async () => {
    mockApi(base);
    abrir('/admin/excursoes/7');
    await screen.findByRole('button', { name: 'Salvar alterações' });
    expect(campo('Nome').value).toBe('Excursao Ficticia Serra');
    expect(campo('Partida (horário de Brasília)').value).toBe('2026-12-10T07:00');
    expect(campo('Preço (R$)').value).toBe('1.500,00');
    expect(campo('Capacidade (vagas)').value).toBe('20');
    expect(campo('Prazo da segunda parcela').value).toBe('2026-12-05');
    expect(screen.getByRole('heading', { level: 1, name: /Editar excursão/ }).textContent).toContain('Rascunho');
    const historico = screen.getByRole('heading', { name: 'Histórico' }).closest('section');
    expect(historico?.textContent).toContain('Excursão editada');
    expect(historico?.textContent).toContain('Campos: nome, preço');
    expect(historico?.textContent).toContain('13/11/2026 12:30 (Brasília)');
    expect(historico?.textContent).toContain('administrador nº 1');
    expect(historico?.textContent).toContain('Criada em Rascunho');
  });

  it('envia so o que mudou, com a versao, e atualiza a tela e o historico', async () => {
    const calls = mockApi({
      ...base,
      'PATCH /api/admin/excursoes/7': () => json(200, { excursao: excursao({ nome: 'Nome Novo Ficticio', versao: '2026-11-13T12:00:00.001Z' }) }),
    });
    abrir('/admin/excursoes/7');
    await screen.findByRole('button', { name: 'Salvar alterações' });
    digitar('Nome', 'Nome Novo Ficticio');
    clicar('Salvar alterações');
    expect(await screen.findByText('Alterações salvas.')).not.toBeNull();
    expect(chamadas(calls, 'PATCH', '/api/admin/excursoes/7')[0]?.body).toEqual({ nome: 'Nome Novo Ficticio', versao: '2026-11-13T12:00:00.000Z' });
    expect(chamadas(calls, 'GET', '/api/admin/excursoes/7/historico')).toHaveLength(2);
  });

  it('converte preco e partida editados e envia o prazo junto ao parcelamento', async () => {
    const calls = mockApi({ ...base, 'PATCH /api/admin/excursoes/7': () => json(200, { excursao: excursao() }) });
    abrir('/admin/excursoes/7');
    await screen.findByRole('button', { name: 'Salvar alterações' });
    digitar('Preço (R$)', '1.299,90');
    digitar('Partida (horário de Brasília)', '2026-12-10T06:30');
    clicar('Salvar alterações');
    await screen.findByText('Alterações salvas.');
    expect(chamadas(calls, 'PATCH', '/api/admin/excursoes/7')[0]?.body).toEqual({
      preco_centavos: 129990,
      partida_utc: '2026-12-10T09:30:00.000Z',
      versao: '2026-11-13T12:00:00.000Z',
    });
  });

  it('sem alteracoes nao chama a API', async () => {
    const calls = mockApi(base);
    abrir('/admin/excursoes/7');
    await screen.findByRole('button', { name: 'Salvar alterações' });
    clicar('Salvar alterações');
    expect(await screen.findByText('Nenhuma alteração para salvar.')).not.toBeNull();
    expect(chamadas(calls, 'PATCH', '/api/admin/excursoes/7')).toHaveLength(0);
  });

  it('com reserva ou retencao ativa, trava as condicoes comerciais e deixa editar nome, imagem, descricao, local e embarque', async () => {
    mockApi({
      ...base,
      'GET /api/admin/excursoes/7': () =>
        json(200, {
          excursao: excursao({
            edicao_restrita: true,
            campos_bloqueados: ['preco_centavos', 'capacidade'],
            situacao: 'publicada',
            transicoes: [
              { para: 'encerrada', disponivel: true, motivo: null },
              { para: 'rascunho', disponivel: false, motivo: 'reservas_ativas' },
              { para: 'cancelada', disponivel: false, motivo: 'reservas_ativas' },
            ],
          }),
        }),
    });
    abrir('/admin/excursoes/7');
    await screen.findByRole('button', { name: 'Salvar alterações' });
    expect(screen.getByText(/Há reserva ou retenção ativa\. Preço, capacidade/)).not.toBeNull();
    for (const bloqueado of ['Data inicial', 'Data final', 'Partida (horário de Brasília)', 'Capacidade (vagas)', 'Preço (R$)', 'Prazo da segunda parcela']) {
      expect(campo(bloqueado).disabled, bloqueado).toBe(true);
    }
    expect(screen.getByLabelText<HTMLInputElement>('Permitir pagamento em duas parcelas de 50%').disabled).toBe(true);
    for (const livre of ['Nome', 'Imagem (opcional)', 'Local', 'Ponto de embarque']) {
      expect(campo(livre).disabled, livre).toBe(false);
    }
    expect(screen.getByLabelText<HTMLTextAreaElement>('Descrição').disabled).toBe(false);
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Cancelar excursão' }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Voltar para rascunho' }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Encerrar vendas' }).disabled).toBe(false);
    expect(screen.getAllByText(/Indisponível: há reservas ou retenções ativas/)).toHaveLength(2);
  });

  it('o servidor recusa edicao bloqueada: a mensagem aparece nos campos', async () => {
    mockApi({
      ...base,
      'PATCH /api/admin/excursoes/7': () => json(409, { error: 'edicao_bloqueada', fields: { preco_centavos: 'bloqueado_por_reserva_ativa' } }),
    });
    abrir('/admin/excursoes/7');
    await screen.findByRole('button', { name: 'Salvar alterações' });
    digitar('Preço (R$)', '1.000,00');
    clicar('Salvar alterações');
    expect(await screen.findByText('Bloqueado: há reserva ou retenção ativa nesta excursão.')).not.toBeNull();
    expect(screen.getByRole('alert').textContent).toMatch(/Há reserva ou retenção ativa: as condições comerciais e temporais não podem ser alteradas/);
  });

  it('conflito de edicao avisa e oferece recarregar a versao atual', async () => {
    const calls = mockApi({ ...base, 'PATCH /api/admin/excursoes/7': () => json(409, { error: 'conflito_de_edicao' }) });
    abrir('/admin/excursoes/7');
    await screen.findByRole('button', { name: 'Salvar alterações' });
    digitar('Nome', 'Nome Novo Ficticio');
    clicar('Salvar alterações');
    expect(await screen.findByText(/Outra pessoa alterou esta excursão/)).not.toBeNull();
    clicar('Recarregar');
    await waitFor(() => expect(campo('Nome').value).toBe('Excursao Ficticia Serra'));
    expect(chamadas(calls, 'GET', '/api/admin/excursoes/7').length).toBeGreaterThanOrEqual(2);
  });

  it('id inexistente, id invalido e erro de carga tem telas proprias', async () => {
    mockApi({ ...comoAdmin, 'GET /api/admin/excursoes/999': () => json(404, { error: 'nao_encontrada' }) });
    abrir('/admin/excursoes/999');
    expect(await screen.findByRole('heading', { name: 'Excursão não encontrada' })).not.toBeNull();
    cleanup();
    mockApi(comoAdmin);
    abrir('/admin/excursoes/abc');
    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).not.toBeNull();
    cleanup();
    mockApi({ ...comoAdmin, 'GET /api/admin/excursoes/7': () => json(500, { error: 'erro_interno' }) });
    abrir('/admin/excursoes/7');
    expect(await screen.findByText('Não foi possível carregar a excursão.')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).not.toBeNull();
  });
});

describe('situacao', () => {
  const base: Record<string, Handler> = { ...comoAdmin, 'GET /api/admin/excursoes/7': ver, 'GET /api/admin/excursoes/7/historico': hist };

  it('publicar e uma acao propria: envia a situacao e a versao e mostra o novo estado', async () => {
    const calls = mockApi({
      ...base,
      'POST /api/admin/excursoes/7/situacao': () =>
        json(200, { excursao: excursao({ situacao: 'publicada', versao: 'v2', transicoes: [{ para: 'encerrada', disponivel: true, motivo: null }] }) }),
    });
    abrir('/admin/excursoes/7');
    await screen.findByRole('button', { name: 'Publicar' });
    clicar('Publicar');
    expect(await screen.findByText('Situação alterada para Publicada.')).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/admin/excursoes/7/situacao')[0]?.body).toEqual({ situacao: 'publicada', versao: '2026-11-13T12:00:00.000Z' });
    expect(screen.getByRole('heading', { level: 1, name: /Editar excursão/ }).textContent).toContain('Publicada');
    expect(screen.getByRole('button', { name: 'Encerrar vendas' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull();
  });

  it('cancelar pede confirmacao antes de chamar a API; Voltar desiste', async () => {
    const calls = mockApi({
      ...base,
      'POST /api/admin/excursoes/7/situacao': () => json(200, { excursao: excursao({ situacao: 'cancelada', transicoes: [] }) }),
    });
    abrir('/admin/excursoes/7');
    await screen.findByRole('button', { name: 'Cancelar excursão' });
    clicar('Cancelar excursão');
    expect(screen.getByText('Cancelar esta excursão?')).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/admin/excursoes/7/situacao')).toHaveLength(0);
    clicar('Voltar');
    expect(screen.queryByText('Cancelar esta excursão?')).toBeNull();
    clicar('Cancelar excursão');
    clicar('Confirmar cancelamento');
    expect(await screen.findByText('Situação alterada para Cancelada.')).not.toBeNull();
    expect(chamadas(calls, 'POST', '/api/admin/excursoes/7/situacao')[0]?.body).toMatchObject({ situacao: 'cancelada' });
    expect(screen.getByText(/Excursão cancelada: não pode mais ser editada/)).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull();
    expect(campo('Nome').disabled).toBe(true);
  });

  it('o servidor recusa: a razao aparece, inclusive a validacao de publicacao', async () => {
    mockApi({
      ...base,
      'POST /api/admin/excursoes/7/situacao': () => json(400, { error: 'validacao', fields: { partida_utc: 'no_passado' } }),
    });
    abrir('/admin/excursoes/7');
    await screen.findByRole('button', { name: 'Publicar' });
    clicar('Publicar');
    expect((await screen.findByRole('alert')).textContent).toBe('Corrija os campos destacados. A partida já passou.');
    cleanup();
    mockApi({ ...base, 'POST /api/admin/excursoes/7/situacao': () => json(409, { error: 'excursao_com_reservas_ativas' }) });
    abrir('/admin/excursoes/7');
    await screen.findByRole('button', { name: 'Cancelar excursão' });
    clicar('Cancelar excursão');
    clicar('Confirmar cancelamento');
    expect((await screen.findByRole('alert')).textContent).toMatch(/Há reservas ou retenções ativas/);
  });

  it('com alteracoes nao salvas os botoes de situacao ficam desligados, com explicacao', async () => {
    mockApi(base);
    abrir('/admin/excursoes/7');
    await screen.findByRole('button', { name: 'Publicar' });
    digitar('Nome', 'Nome Ainda Nao Salvo');
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Publicar' }).disabled).toBe(true);
    expect(screen.getByText(/Salve ou descarte as alterações do formulário/)).not.toBeNull();
  });

  it('se a sessao expirar durante o uso (401), mostra acesso restrito', async () => {
    mockApi({ ...base, 'POST /api/admin/excursoes/7/situacao': () => json(401, { error: 'nao_autenticado' }) });
    abrir('/admin/excursoes/7');
    await screen.findByRole('button', { name: 'Publicar' });
    clicar('Publicar');
    expect(await screen.findByText('Acesso restrito a administradores.')).not.toBeNull();
  });
});

describe('dados no navegador', () => {
  it('nada da area administrativa vai ao armazenamento do navegador nem ao console', async () => {
    const spies = (['log', 'warn', 'error'] as const).map((m) => vi.spyOn(console, m));
    mockApi({ ...comoAdmin, 'GET /api/admin/excursoes/7': ver, 'GET /api/admin/excursoes/7/historico': hist, 'PATCH /api/admin/excursoes/7': () => json(200, { excursao: excursao() }) });
    abrir('/admin/excursoes/7');
    await screen.findByRole('button', { name: 'Salvar alterações' });
    digitar('Nome', 'Nome Novo Ficticio');
    clicar('Salvar alterações');
    await screen.findByText('Alterações salvas.');
    expect(window.localStorage.length + window.sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    expect(empty(204).status).toBe(204);
  });
});
