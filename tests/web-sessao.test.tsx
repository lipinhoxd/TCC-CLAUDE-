// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App.tsx';
import { empty, json, mockApi, MARIA } from './helpers/api-mock.ts';
import type { Handler } from './helpers/api-mock.ts';

const SENHA = 'Boa-senha-2026';
const visitor: Record<string, Handler> = { 'GET /api/me': () => json(401, { error: 'nao_autenticado' }) };
const authed: Record<string, Handler> = { 'GET /api/me': () => json(200, { usuario: MARIA }) };

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const h1 = () => screen.getByRole('heading', { level: 1 }).textContent;
const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

function show(path: string) {
  render(<App appName="BPM Trip" initialPath={path} />);
}

describe('estado de sessao no cabecalho (RF-008)', () => {
  it('visitante ve Cadastro e Login e nao ve Sair', async () => {
    mockApi(visitor);
    show('/');
    expect(await screen.findByRole('link', { name: 'Cadastro' })).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Login' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull();
  });

  it('usuario autenticado ve o primeiro nome e Sair, e nao ve Cadastro nem Login', async () => {
    mockApi(authed);
    show('/');
    expect(await screen.findByText('Olá, Maria')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Sair' })).not.toBeNull();
    expect(screen.queryByRole('link', { name: 'Cadastro' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Login' })).toBeNull();
  });

  it('o front-end so decide o estado pelo que o servidor responde em GET /api/me', async () => {
    const calls = mockApi(authed);
    show('/');
    await screen.findByText('Olá, Maria');
    expect(calls[0]).toMatchObject({ method: 'GET', path: '/api/me' });
    expect(window.localStorage.length + window.sessionStorage.length).toBe(0);
  });

  it('Sair chama a API, volta ao estado de visitante e avisa', async () => {
    const calls = mockApi({ ...authed, 'POST /api/auth/logout': () => empty(204) });
    show('/sobre');
    await screen.findByText('Olá, Maria');
    press('Sair');
    expect(await screen.findByText('Você saiu da sua conta.')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Login' })).not.toBeNull();
    expect(h1()).toBe('BPM Trip');
    expect(calls.some((c) => c.method === 'POST' && c.path === '/api/auth/logout')).toBe(true);
  });

  it('se a saida falhar, mantem a sessao e mostra o erro', async () => {
    mockApi({ ...authed, 'POST /api/auth/logout': () => json(500, { error: 'erro_interno' }) });
    show('/');
    await screen.findByText('Olá, Maria');
    press('Sair');
    expect(await screen.findByText('Não foi possível sair. Tente novamente.')).not.toBeNull();
    expect(screen.getByText('Olá, Maria')).not.toBeNull();
  });

  it('erro do servidor ou de rede na verificacao nao deixa a tela em branco', async () => {
    mockApi({ 'GET /api/me': () => json(500, { error: 'erro_interno' }) });
    show('/');
    expect(await screen.findByText(/Não foi possível confirmar se você está conectado/)).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Login' })).not.toBeNull();
    cleanup();
    mockApi({ 'GET /api/me': () => 'network' });
    show('/');
    expect(await screen.findByText(/Não foi possível confirmar se você está conectado/)).not.toBeNull();
  });

  it('paginas de cadastro e login avisam quem ja esta conectado', async () => {
    mockApi(authed);
    show('/login');
    expect(await screen.findByRole('heading', { name: 'Você já está conectado' })).not.toBeNull();
    cleanup();
    show('/cadastro');
    expect(await screen.findByRole('heading', { name: 'Você já está conectado' })).not.toBeNull();
  });
});

describe('login', () => {
  const fill = (email = 'maria.ficticia@exemplo.com', senha = SENHA) => {
    type('E-mail', email);
    type('Senha', senha);
  };

  it('envia e-mail e senha em JSON, entra e leva a Home com aviso', async () => {
    const calls = mockApi({
      ...visitor,
      'POST /api/auth/login': () => json(200, { usuario: MARIA, expira_em: '2026-11-14T09:00:00.000Z' }),
    });
    show('/login');
    await screen.findByRole('button', { name: 'Entrar' });
    fill();
    press('Entrar');
    expect(await screen.findByText('Você entrou na sua conta.')).not.toBeNull();
    expect(screen.getByText('Olá, Maria')).not.toBeNull();
    expect(h1()).toBe('BPM Trip');
    const post = calls.find((c) => c.path === '/api/auth/login');
    expect(post?.body).toEqual({ email: 'maria.ficticia@exemplo.com', senha: SENHA });
  });

  it('credenciais invalidas mostram uma mensagem unica e permanecem na pagina', async () => {
    mockApi({ ...visitor, 'POST /api/auth/login': () => json(401, { error: 'credenciais_invalidas' }) });
    show('/login');
    await screen.findByRole('button', { name: 'Entrar' });
    fill('quem@exemplo.com', 'Senha-errada-1');
    press('Entrar');
    expect((await screen.findByRole('alert')).textContent).toBe('E-mail ou senha incorretos.');
    expect(h1()).toBe('Login');
  });

  it('excesso de tentativas (429) informa o tempo de espera do Retry-After', async () => {
    mockApi({
      ...visitor,
      'POST /api/auth/login': () => json(429, { error: 'muitas_tentativas' }, { 'Retry-After': '600' }),
    });
    show('/login');
    await screen.findByRole('button', { name: 'Entrar' });
    fill();
    press('Entrar');
    expect((await screen.findByRole('alert')).textContent).toBe('Muitas tentativas. Tente novamente em cerca de 10 min.');
  });

  it('falha de rede e erro inesperado tem mensagens proprias', async () => {
    mockApi({ ...visitor, 'POST /api/auth/login': () => 'network' });
    show('/login');
    await screen.findByRole('button', { name: 'Entrar' });
    fill();
    press('Entrar');
    expect((await screen.findByRole('alert')).textContent).toMatch(/Sem conexão com o servidor/);
    cleanup();
    mockApi({ ...visitor, 'POST /api/auth/login': () => json(500, { error: 'erro_interno' }) });
    show('/login');
    await screen.findByRole('button', { name: 'Entrar' });
    fill();
    press('Entrar');
    expect((await screen.findByRole('alert')).textContent).toMatch(/Algo deu errado/);
  });

  it('campos vazios nao chamam a API', async () => {
    const calls = mockApi(visitor);
    show('/login');
    await screen.findByRole('button', { name: 'Entrar' });
    press('Entrar');
    expect((await screen.findByRole('alert')).textContent).toBe('Informe e-mail e senha.');
    expect(calls.some((c) => c.path === '/api/auth/login')).toBe(false);
  });

  it('o campo de senha e do tipo password', async () => {
    mockApi(visitor);
    show('/login');
    await screen.findByRole('button', { name: 'Entrar' });
    expect(screen.getByLabelText('Senha').getAttribute('type')).toBe('password');
  });
});

describe('cadastro', () => {
  const NOVO = {
    'Nome completo': 'Joao Ficticio Santos',
    CPF: '529.982.247-25',
    'Data de nascimento': '1992-07-01',
    'Telefone ou WhatsApp': '(11) 90000-0000',
    'E-mail': 'joao.ficticio@exemplo.com',
    Senha: SENHA,
  };
  const fillAll = () => Object.entries(NOVO).forEach(([label, value]) => type(label, value));

  it('enviar vazio mostra o erro em cada campo obrigatorio e leva o foco ao primeiro', async () => {
    const calls = mockApi(visitor);
    show('/cadastro');
    await screen.findByRole('button', { name: 'Criar conta' });
    press('Criar conta');
    expect(await screen.findAllByText('Preencha este campo.')).toHaveLength(6);
    expect(calls.some((c) => c.path === '/api/auth/register')).toBe(false);
    await waitFor(() => expect(document.activeElement?.id).toBe('nome_completo'));
    expect(screen.getByLabelText('Nome completo').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Nome completo').getAttribute('aria-describedby')).toBe('nome_completo-error');
  });

  it('mostra por campo os erros que a API devolve', async () => {
    mockApi({
      ...visitor,
      'POST /api/auth/register': () =>
        json(400, {
          error: 'validacao',
          fields: { data_nascimento: 'menor_de_idade', cpf: 'invalido', telefone: 'invalido', senha: 'comum' },
        }),
    });
    show('/cadastro');
    await screen.findByRole('button', { name: 'Criar conta' });
    fillAll();
    press('Criar conta');
    expect(await screen.findByText('É preciso ter 18 anos ou mais.')).not.toBeNull();
    expect(screen.getByText('CPF inválido. Confira os 11 números.')).not.toBeNull();
    expect(screen.getByText(/Telefone inválido/)).not.toBeNull();
    expect(screen.getByText('Essa senha é muito comum. Escolha outra.')).not.toBeNull();
    await waitFor(() => expect(document.activeElement?.id).toBe('cpf'));
  });

  it('cadastro duplicado nao revela qual dado repetiu', async () => {
    mockApi({ ...visitor, 'POST /api/auth/register': () => json(409, { error: 'cadastro_duplicado' }) });
    show('/cadastro');
    await screen.findByRole('button', { name: 'Criar conta' });
    fillAll();
    press('Criar conta');
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/Se você já tem conta, entre pelo Login/);
    expect(alert.textContent).not.toMatch(/CPF|e-mail/i);
  });

  it('cria a conta, entra automaticamente e leva a Home com aviso', async () => {
    const calls = mockApi({
      ...visitor,
      'POST /api/auth/register': () => json(201, { usuario: MARIA }),
      'POST /api/auth/login': () => json(200, { usuario: MARIA, expira_em: '2026-11-14T09:00:00.000Z' }),
    });
    show('/cadastro');
    await screen.findByRole('button', { name: 'Criar conta' });
    fillAll();
    press('Criar conta');
    expect(await screen.findByText('Conta criada. Você já está conectado.')).not.toBeNull();
    expect(screen.getByText('Olá, Maria')).not.toBeNull();
    const register = calls.find((c) => c.path === '/api/auth/register');
    expect(register?.body).toMatchObject({ nome_completo: NOVO['Nome completo'], cpf: NOVO.CPF, senha: SENHA });
    expect(calls.find((c) => c.path === '/api/auth/login')?.body).toEqual({ email: NOVO['E-mail'], senha: SENHA });
  });

  it('se a conta for criada mas o login automatico falhar, leva ao Login com aviso', async () => {
    mockApi({
      ...visitor,
      'POST /api/auth/register': () => json(201, { usuario: MARIA }),
      'POST /api/auth/login': () => json(500, { error: 'erro_interno' }),
    });
    show('/cadastro');
    await screen.findByRole('button', { name: 'Criar conta' });
    fillAll();
    press('Criar conta');
    expect(await screen.findByText('Conta criada. Entre para continuar.')).not.toBeNull();
    expect(h1()).toBe('Login');
  });

  it('falha de rede no cadastro mostra mensagem e mantem os dados digitados', async () => {
    mockApi({ ...visitor, 'POST /api/auth/register': () => 'network' });
    show('/cadastro');
    await screen.findByRole('button', { name: 'Criar conta' });
    fillAll();
    press('Criar conta');
    expect((await screen.findByRole('alert')).textContent).toMatch(/Sem conexão com o servidor/);
    expect(screen.getByLabelText<HTMLInputElement>('E-mail').value).toBe(NOVO['E-mail']);
  });
});

describe('dados sensiveis no navegador (RNF-005, RNF-028)', () => {
  it('senha e dados pessoais nao vao ao armazenamento, aos cookies, ao console nem ficam na tela', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m));
    mockApi({
      ...visitor,
      'POST /api/auth/register': () => json(201, { usuario: MARIA }),
      'POST /api/auth/login': () => json(200, { usuario: MARIA, expira_em: '2026-11-14T09:00:00.000Z' }),
    });
    show('/cadastro');
    await screen.findByRole('button', { name: 'Criar conta' });
    type('Nome completo', 'Joao Ficticio Santos');
    type('CPF', '529.982.247-25');
    type('Data de nascimento', '1992-07-01');
    type('Telefone ou WhatsApp', '(11) 90000-0000');
    type('E-mail', 'joao.ficticio@exemplo.com');
    type('Senha', SENHA);
    press('Criar conta');
    await screen.findByText('Conta criada. Você já está conectado.');

    const storage = JSON.stringify({ ...window.localStorage }) + JSON.stringify({ ...window.sessionStorage });
    for (const segredo of [SENHA, '52998224725', '529.982.247-25', 'joao.ficticio@exemplo.com']) {
      expect(storage).not.toContain(segredo);
      expect(document.cookie).not.toContain(segredo);
      expect(document.body.textContent).not.toContain(segredo);
      for (const spy of spies) expect(JSON.stringify(spy.mock.calls)).not.toContain(segredo);
    }
    expect(window.localStorage.length + window.sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
  });
});
