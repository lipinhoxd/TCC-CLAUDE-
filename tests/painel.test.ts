import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { montarPainel } from '../server/admin/painel.ts';
import type { EventoDoHistorico } from '../server/admin/painel.ts';
import { AdminService } from '../server/admin/service.ts';
import { createApp } from '../server/app.ts';
import type { AuthConfig } from '../server/auth/config.ts';
import { AuthService } from '../server/auth/service.ts';
import { CancelamentoService } from '../server/cancelamentos/service.ts';
import { entregarMensagens } from '../server/comunicacao/entrega.ts';
import { gerarMensagens } from '../server/comunicacao/gerador.ts';
import { registrarAuditoria } from '../server/db/audit.ts';
import { MEMORY_DATABASE, openDatabase } from '../server/db/connection.ts';
import { runMigrations } from '../server/db/migrate.ts';
import { withTransaction } from '../server/db/transaction.ts';
import { ExcursaoService } from '../server/excursoes/service.ts';
import { provedorSimulado } from '../server/pagamentos/provedor.ts';
import { PagamentoService } from '../server/pagamentos/service.ts';
import { executarRotina } from '../server/processos/rotina.ts';
import { ReservaService } from '../server/reservas/service.ts';

/** Painel consolidado e historico administrativo (AGT-016, RF-041, RF-042) e as decisoes 1 a 3 do pesquisador. */

const INICIO = new Date('2026-11-13T12:00:00.000Z');
const MIN = 60_000;
const PRAZO = new Date('2026-12-06T02:59:59.000Z');
const DEPOIS_DO_FIM = new Date('2026-12-13T03:00:00.000Z');
const SENHA = 'Boa-senha-2026';
const CONFIG: AuthConfig = {
  sessionTtlMs: 8 * 3_600_000,
  recoveryTtlMs: 30 * MIN,
  loginMaxAttempts: 50,
  loginWindowMs: 15 * MIN,
  cookieSecure: false,
  scrypt: { N: 1024, r: 8, p: 1 },
  recoveryOutboxPath: null,
};
const EXCURSAO = {
  nome: 'Excursao Ficticia Serra',
  descricao: 'Passeio ficticio de teste',
  local: 'Serra Ficticia',
  ponto_embarque: 'Praca Ficticia',
  data_inicial: '2026-12-10',
  data_final: '2026-12-12',
  partida_utc: '2026-12-10T10:00:00.000Z',
  capacidade: 20,
  preco_centavos: 15001,
  parcelamento_habilitado: true,
  prazo_segunda_parcela: '2026-12-05',
};

let db: DatabaseSync;
let relogio: Date;
let excursoes: ExcursaoService;
let reservas: ReservaService;
let pagamentos: PagamentoService;
let cancelamentos: CancelamentoService;
let admin: AdminService;
let adminId: number;
let pessoas = 0;

function inserirUsuario(perfil: 'passageiro' | 'administrador' = 'passageiro'): number {
  pessoas += 1;
  const iso = INICIO.toISOString();
  return Number(
    db
      .prepare(
        "INSERT INTO usuario (nome_completo, cpf, email, data_nascimento, telefone, senha_hash, perfil, criado_em, atualizado_em) VALUES (?, ?, ?, '1991-02-03', '+5511911112222', 'x', ?, ?, ?)",
      )
      .run(`Joana${pessoas} Passageira Ficticia`, String(40_000_000_000 + pessoas), `joana${pessoas}@exemplo.com`, perfil, iso, iso).lastInsertRowid,
  );
}

beforeEach(() => {
  db = openDatabase(MEMORY_DATABASE);
  runMigrations(db);
  relogio = INICIO;
  const agora = () => relogio;
  excursoes = new ExcursaoService(db, agora);
  reservas = new ReservaService(db, agora, 15 * MIN, provedorSimulado);
  pagamentos = new PagamentoService(db, reservas, provedorSimulado, agora);
  cancelamentos = new CancelamentoService(db, reservas, provedorSimulado, agora);
  admin = new AdminService(db, agora);
  adminId = inserirUsuario('administrador');
});
afterEach(() => db.close());

function publicar(extra: Record<string, unknown> = {}): number {
  const e = excursoes.criar(adminId, { ...EXCURSAO, ...extra });
  excursoes.mudarSituacao(adminId, e.id, { situacao: 'publicada' });
  return e.id;
}
interface Criada {
  passageiro: number;
  id: number;
}
function reservar(excursaoId: number, modalidade: 'integral' | 'parcelada' = 'integral'): Criada {
  const passageiro = inserirUsuario();
  return { passageiro, id: reservas.solicitar(passageiro, { excursao_id: excursaoId, modalidade }).id };
}
function pagar(r: Criada, resultado: 'aprovado' | 'recusado' = 'aprovado'): Criada {
  pagamentos.iniciar(r.passageiro, r.id);
  pagamentos.simular(r.passageiro, r.id, { resultado });
  return r;
}
function paga(excursaoId: number, modalidade: 'integral' | 'parcelada' = 'integral'): Criada {
  const r = reservar(excursaoId, modalidade);
  reservas.iniciarCheckout(r.passageiro, r.id);
  return pagar(r);
}
const reembolsoDe = (reservaId: number): number => Number(db.prepare('SELECT id FROM reembolso WHERE reserva_id = ?').get(reservaId)?.['id']);
const painel = () => admin.painel({});
const contar = (sql: string): number => Number(db.prepare(sql).get()?.['n']);
const retrato = () =>
  JSON.stringify(['usuario', 'excursao', 'reserva', 'pagamento', 'retencao_vaga', 'reembolso', 'auditoria', 'mensagem'].map((tabela) => db.prepare(`SELECT * FROM ${tabela} ORDER BY id`).all()));

/** Cenario com valores conhecidos: preco 15001; parcelas 7500 e 7501; metade do reembolso 7500. */
function cenario() {
  const e = publicar();
  const integral = paga(e);
  const soPrimeira = paga(e, 'parcelada');
  const quitada = paga(e, 'parcelada');
  pagar(quitada);
  const cancelada = paga(e);
  cancelamentos.cancelarReserva(cancelada.passageiro, cancelada.id, { percentual_previsto: 100 });
  const metade = paga(e);
  relogio = new Date('2026-12-01T10:00:00.000Z'); // 9 dias antes da partida: 50%
  cancelamentos.cancelarReserva(metade.passageiro, metade.id, { percentual_previsto: 50 });
  cancelamentos.processarReembolso(adminId, reembolsoDe(metade.id), { resultado: 'aprovado' });
  const retida = reservar(e);
  reservas.iniciarCheckout(retida.passageiro, retida.id);
  return { e, integral, soPrimeira, quitada, cancelada, metade, retida };
}

describe('painel (RF-041, decisao 1)', () => {
  it('sem dados mostra tudo zerado', () => {
    expect(painel()).toEqual({
      gerado_em: INICIO.toISOString(),
      excursoes: { itens: [], total: 0 },
      reservas: { aguardando_pagamento: 0, pronto_para_embarque: 0, concluida: 0, cancelada: 0, total: 0 },
      valores: { recebido_centavos: 0, devolvido_centavos: 0, liquido_centavos: 0, a_devolver_centavos: 0, a_receber_centavos: 0 },
      pendencias: 0,
      emails_com_falha: 0,
    });
  });

  it('calcula cada valor, a ocupacao e as reservas por situacao com dados conhecidos', () => {
    const c = cenario();
    const p = painel();
    expect(p.valores).toEqual({
      recebido_centavos: 15001 + 7500 + 15001 + 15001 + 15001, // integral, primeira, quitada, cancelada (ainda nao devolvida), metade
      devolvido_centavos: 7500,
      liquido_centavos: 67504 - 7500,
      a_devolver_centavos: 15001,
      a_receber_centavos: 7501,
    });
    expect(p.reservas).toEqual({ aguardando_pagamento: 2, pronto_para_embarque: 2, concluida: 0, cancelada: 2, total: 6 });
    expect(p.excursoes).toEqual({
      total: 1,
      itens: [{ id: c.e, nome: EXCURSAO.nome, situacao: 'publicada', data_inicial: '2026-12-10', data_final: '2026-12-12', capacidade: 20, ocupadas: 3, retidas: 1, livres: 16 }],
    });
  });

  it('reembolso integral processado continua no recebido (pagamento estornado) e sai do a devolver; o recusado continua a devolver', () => {
    const c = cenario();
    cancelamentos.processarReembolso(adminId, reembolsoDe(c.cancelada.id), { resultado: 'recusado' });
    expect(painel().valores).toMatchObject({ a_devolver_centavos: 15001, devolvido_centavos: 7500 });
    cancelamentos.processarReembolso(adminId, reembolsoDe(c.cancelada.id), { resultado: 'aprovado' });
    expect(contar("SELECT COUNT(*) AS n FROM pagamento WHERE situacao = 'estornado'")).toBe(1);
    expect(painel().valores).toMatchObject({ recebido_centavos: 67504, devolvido_centavos: 22501, liquido_centavos: 45003, a_devolver_centavos: 0 });
  });

  it('confere com as telas de detalhe', () => {
    const c = cenario();
    const p = painel();
    for (const situacao of ['aguardando_pagamento', 'pronto_para_embarque', 'concluida', 'cancelada'] as const) {
      expect(admin.listarReservas({ situacao }).total).toBe(p.reservas[situacao]);
    }
    expect(admin.listarPendencias({}).total).toBe(p.pendencias);
    const daAdministracao = excursoes.listar().find((x) => x.id === c.e);
    expect(daAdministracao?.vagas_ocupadas).toBe(p.excursoes.itens[0]?.ocupadas);
    const lista = cancelamentos.listarReembolsos({ limite: '50' }).reembolsos;
    const soma = (situacoes: string[]) => lista.filter((r) => situacoes.includes(r.situacao)).reduce((t, r) => t + r.valor_centavos, 0);
    expect(soma(['processado'])).toBe(p.valores.devolvido_centavos);
    expect(soma(['pendente', 'recusado'])).toBe(p.valores.a_devolver_centavos);
  });

  it('conta pendencias pelo mesmo criterio da tela e so a quantidade de e-mails que falharam', () => {
    const cheia = publicar({ capacidade: 1 });
    const semVaga = reservar(cheia);
    reservas.iniciarCheckout(semVaga.passageiro, semVaga.id);
    pagamentos.iniciar(semVaga.passageiro, semVaga.id);
    relogio = new Date(INICIO.getTime() + 16 * MIN);
    paga(cheia);
    pagamentos.simular(semVaga.passageiro, semVaga.id, { resultado: 'aprovado' });
    expect(painel().pendencias).toBe(1);
    expect(painel().valores.recebido_centavos).toBe(30002); // o valor em analise entra no recebido
    withTransaction(db, () => gerarMensagens(db, relogio));
    const falhaSoUma = {
      nome: 'teste',
      enviar: (m: { mensagemId: number }) => {
        if (m.mensagemId === 1) throw new Error('falha');
      },
    };
    for (let i = 0; i < 2; i += 1) entregarMensagens(db, falhaSoUma, relogio);
    expect(painel().emails_com_falha).toBe(0); // ainda pendente apos 2 tentativas
    entregarMensagens(db, falhaSoUma, relogio);
    expect(painel().emails_com_falha).toBe(1);
  });

  it('efetiva o vencimento no instante exato do prazo e o a receber deixa de contar (decisao 3.1)', () => {
    const e = publicar();
    const r = paga(e, 'parcelada');
    relogio = new Date(PRAZO.getTime() - 1);
    expect(painel().valores.a_receber_centavos).toBe(7501);
    expect(painel().reservas.cancelada).toBe(0);
    relogio = PRAZO;
    const p = painel();
    expect(p.valores.a_receber_centavos).toBe(0);
    expect(p.reservas).toMatchObject({ aguardando_pagamento: 0, cancelada: 1 });
    expect(p.excursoes.itens[0]?.ocupadas).toBe(0);
    expect(db.prepare('SELECT situacao FROM reserva WHERE id = ?').get(r.id)?.['situacao']).toBe('cancelada');
  });

  it('efetiva a conclusao e tira da lista a excursao terminada; nao aplica o cancelamento exclusivo da rotina', () => {
    const e = publicar();
    const pronta = paga(e);
    const semPagamento = reservar(e);
    relogio = new Date(DEPOIS_DO_FIM.getTime() - 1);
    expect(painel().excursoes.total).toBe(1);
    relogio = DEPOIS_DO_FIM;
    const p = painel();
    expect(p.excursoes.total).toBe(0);
    expect(p.reservas).toMatchObject({ concluida: 1, aguardando_pagamento: 1, pronto_para_embarque: 0 });
    expect(db.prepare('SELECT situacao FROM reserva WHERE id = ?').get(pronta.id)?.['situacao']).toBe('concluida');
    expect(db.prepare('SELECT situacao FROM reserva WHERE id = ?').get(semPagamento.id)?.['situacao']).toBe('aguardando_pagamento');
  });

  it('sem prazos vencidos, abrir o painel e o historico nao altera nenhum dado', () => {
    cenario();
    const antes = retrato();
    painel();
    admin.historico({});
    expect(retrato()).toBe(antes);
  });

  it('lista so publicadas e encerradas nao terminadas, da mais proxima para a mais distante, ate 100', () => {
    const encerrada = publicar({ nome: 'Encerrada Ficticia', data_inicial: '2026-12-01', data_final: '2026-12-02', partida_utc: '2026-12-01T10:00:00.000Z', prazo_segunda_parcela: '2026-11-25' });
    excursoes.mudarSituacao(adminId, encerrada, { situacao: 'encerrada' });
    const depois = publicar({ nome: 'Depois Ficticia' });
    excursoes.criar(adminId, { ...EXCURSAO, nome: 'Rascunho Ficticio' });
    const cancelada = publicar({ nome: 'Cancelada Ficticia' });
    cancelamentos.cancelarExcursao(adminId, cancelada, { justificativa: 'Teste.' });
    expect(painel().excursoes.itens.map((x) => [x.id, x.situacao])).toEqual([
      [encerrada, 'encerrada'],
      [depois, 'publicada'],
    ]);
    const iso = INICIO.toISOString();
    for (let i = 0; i < 99; i += 1) {
      db.prepare(
        "INSERT INTO excursao (nome, local, ponto_embarque, data_inicial, data_final, partida_utc, capacidade, preco_centavos, situacao, criado_em, atualizado_em) VALUES ('Lote Ficticio', 'L', 'P', '2027-05-01', '2027-05-02', '2027-05-01T10:00:00.000Z', 10, 100, 'publicada', ?, ?)",
      ).run(iso, iso);
    }
    expect(painel().excursoes.total).toBe(101);
    expect(painel().excursoes.itens).toHaveLength(100);
  });

  it('exige transacao e recusa parametros', () => {
    expect(() => montarPainel(db, relogio)).toThrow(/transacao/);
    expect(() => admin.painel({ de: '2026-01-01' })).toThrow(/validacao/);
  });
});

describe('historico (RF-042, decisao 2)', () => {
  const historico = (consulta: Record<string, string> = {}) => admin.historico(consulta);
  const acoes = (consulta: Record<string, string> = {}) => historico(consulta).eventos.map((e) => e.acao);
  const registrar = (acao: string, quando: string, extra: Partial<Parameters<typeof registrarAuditoria>[1]> = {}) =>
    registrarAuditoria(db, { atorUsuarioId: null, acao, entidade: 'reserva', registroId: 1, ocorridoEm: new Date(quando), ...extra });
  const errosDe = (consulta: Record<string, string>): unknown => {
    try {
      historico(consulta);
    } catch (erro) {
      return (erro as { fields?: unknown }).fields;
    }
    return null;
  };

  it('mostra so acoes do administrador e do sistema; deixa de fora passageiros e acessos', () => {
    const passageiro = inserirUsuario();
    registrar('reserva.criada', '2026-11-13T12:00:00.000Z', { atorUsuarioId: passageiro });
    registrar('auth.login', '2026-11-13T12:00:00.000Z', { atorUsuarioId: adminId, entidade: 'sessao' });
    registrar('auth.login_falha', '2026-11-13T12:00:00.000Z', { entidade: 'sessao' });
    registrar('excursao.criada', '2026-11-13T12:00:00.000Z', { atorUsuarioId: adminId, entidade: 'excursao' });
    registrar('retencao.expirada', '2026-11-13T12:00:00.000Z', { entidade: 'retencao_vaga' });
    const r = historico();
    expect(r.eventos.map((e) => [e.acao, e.ator_usuario_id])).toEqual([
      ['retencao.expirada', null],
      ['excursao.criada', adminId],
    ]);
    expect(r.total).toBe(2);
    expect(r.acoes).toEqual(['excursao.criada', 'retencao.expirada']);
    expect(acoes({ acao: 'auth.login' })).toEqual([]);
    expect(acoes({ acao: 'reserva.criada' })).toEqual([]);
  });

  it('inclui as operacoes reais do administrador e da rotina', () => {
    const c = cenario();
    relogio = DEPOIS_DO_FIM;
    executarRotina(db, relogio);
    const r = historico();
    expect(r.acoes).toEqual(
      expect.arrayContaining(['excursao.criada', 'excursao.situacao_alterada', 'reembolso.processado', 'reserva.concluida', 'reserva.vencimento_segunda_parcela', 'reserva.cancelamento_automatico', 'retencao.expirada']),
    );
    expect(r.acoes).not.toEqual(expect.arrayContaining(['reserva.cancelamento_passageiro']));
    const processado = historico({ acao: 'reembolso.processado' }).eventos[0];
    expect(processado).toMatchObject({ ator_usuario_id: adminId, entidade: 'reembolso', reserva_id: c.metade.id, valor_centavos: 7500, situacao_anterior: 'pendente', situacao_nova: 'processado' });
  });

  it('entrega so os campos aprovados', () => {
    registrar('reserva.cancelamento_organizacao', '2026-11-13T12:00:00.000Z', {
      atorUsuarioId: adminId,
      registroId: 9,
      estadoAnterior: { situacao: 'pronto_para_embarque' },
      estadoNovo: { situacao: 'cancelada', valor_reembolso_centavos: 100, percentual: 100, justificativa: 'Falta de transporte.', vaga_liberada: true, campo_extra: 'x', campos_alterados: ['nome_completo'] },
    });
    const [e] = historico().eventos as [EventoDoHistorico];
    expect(e).toEqual({
      id: e.id,
      ocorrido_em: '2026-11-13T12:00:00.000Z',
      acao: 'reserva.cancelamento_organizacao',
      entidade: 'reserva',
      registro_id: 9,
      ator_usuario_id: adminId,
      reserva_id: 9,
      situacao_anterior: 'pronto_para_embarque',
      situacao_nova: 'cancelada',
      valor_centavos: null,
      valor_reembolso_centavos: 100,
      valor_total_centavos: null,
      percentual: 100,
      justificativa: 'Falta de transporte.',
    });
  });

  it('filtra por origem, acao e registro', () => {
    registrar('excursao.criada', '2026-11-13T12:00:00.000Z', { atorUsuarioId: adminId, entidade: 'excursao', registroId: 5 });
    registrar('reserva.concluida', '2026-11-13T12:00:00.000Z', { registroId: 5 });
    registrar('reserva.concluida', '2026-11-13T12:00:00.000Z', { registroId: 6 });
    expect(acoes({ origem: 'administrador' })).toEqual(['excursao.criada']);
    expect(acoes({ origem: 'sistema' })).toEqual(['reserva.concluida', 'reserva.concluida']);
    expect(acoes({ acao: 'excursao.criada' })).toEqual(['excursao.criada']);
    expect(historico({ entidade: 'reserva' }).total).toBe(2);
    expect(historico({ entidade: 'reserva', registro: '5' }).eventos.map((e) => e.registro_id)).toEqual([5]);
    expect(historico({ entidade: 'excursao', registro: '5' }).total).toBe(1);
    expect(historico({ origem: '', acao: '', entidade: '', registro: '', de: '', ate: '' }).total).toBe(3);
  });

  it('o periodo usa o dia de Brasilia, do inicio do "de" ao fim do "ate"', () => {
    registrar('reserva.concluida', '2026-11-13T02:59:59.999Z', { registroId: 1 }); // 12/11 em Brasilia
    registrar('reserva.concluida', '2026-11-13T03:00:00.000Z', { registroId: 2 }); // 13/11 00:00
    registrar('reserva.concluida', '2026-11-14T02:59:59.999Z', { registroId: 3 }); // 13/11 23:59
    registrar('reserva.concluida', '2026-11-14T03:00:00.000Z', { registroId: 4 }); // 14/11
    const ids = (consulta: Record<string, string>) => historico(consulta).eventos.map((e) => e.registro_id);
    expect(ids({ de: '2026-11-13', ate: '2026-11-13' })).toEqual([3, 2]);
    expect(ids({ de: '2026-11-14' })).toEqual([4]);
    expect(ids({ ate: '2026-11-12' })).toEqual([1]);
  });

  it('pagina de 20, do mais recente para o mais antigo', () => {
    for (let i = 1; i <= 45; i += 1) registrar('reserva.concluida', '2026-11-13T12:00:00.000Z', { registroId: i });
    const primeira = historico();
    expect(primeira).toMatchObject({ total: 45, pagina: 1, limite: 20 });
    expect(primeira.eventos).toHaveLength(20);
    expect(primeira.eventos[0]?.registro_id).toBe(45);
    expect(historico({ pagina: '3' }).eventos.map((e) => e.registro_id)).toEqual([5, 4, 3, 2, 1]);
    expect(historico({ pagina: '4' }).eventos).toEqual([]);
  });

  it('recusa parametros invalidos por campo, sem executar nada neles', () => {
    expect(errosDe({ origem: 'todos' })).toEqual({ origem: 'invalido' });
    expect(errosDe({ acao: "x' OR '1'='1" })).toEqual({ acao: 'invalido' });
    expect(errosDe({ entidade: 'senha' })).toEqual({ entidade: 'invalido' });
    expect(errosDe({ registro: '1' })).toEqual({ entidade: 'obrigatorio' });
    expect(errosDe({ entidade: 'reserva', registro: '0' })).toEqual({ registro: 'invalido' });
    expect(errosDe({ entidade: 'reserva', registro: '1 OR 1=1' })).toEqual({ registro: 'invalido' });
    expect(errosDe({ de: '2026-02-30' })).toEqual({ de: 'invalido' });
    expect(errosDe({ ate: 'ontem' })).toEqual({ ate: 'invalido' });
    expect(errosDe({ de: '2026-11-14', ate: '2026-11-13' })).toEqual({ ate: 'anterior_ao_inicio' });
    expect(errosDe({ pagina: '0' })).toEqual({ pagina: 'invalido' });
    expect(errosDe({ limite: '1000' })).toEqual({ limite: 'campo_nao_permitido' });
  });

  it('a auditoria continua somente de inclusao', () => {
    registrar('reserva.concluida', '2026-11-13T12:00:00.000Z');
    expect(() => db.exec('DELETE FROM auditoria')).toThrow(/somente de inclusao/);
    expect(() => db.exec("UPDATE auditoria SET acao = 'x'")).toThrow(/somente de inclusao/);
  });
});

describe('rotas /api/admin/painel e /api/admin/historico', () => {
  let server: Server;
  let base: string;
  let cookieAdmin: string;
  let cookiePassageiro: string;

  async function chamar(caminho: string, cookie?: string, metodo = 'GET', corpo?: unknown) {
    const headers: Record<string, string> = cookie === undefined ? {} : { Cookie: cookie };
    if (corpo !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${base}${caminho}`, { method: metodo, headers, ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }) });
    const texto = await res.text();
    return { status: res.status, texto, json: (texto === '' ? null : JSON.parse(texto)) as Record<string, unknown> | null, headers: res.headers };
  }

  beforeEach(async () => {
    const auth = new AuthService({ db, config: CONFIG, outbox: () => undefined, now: () => INICIO });
    const dados = { nome_completo: 'Ana Ficticia', data_nascimento: '1990-05-20', telefone: '(11) 98765-4321', senha: SENHA };
    await auth.createAdministrator({ ...dados, cpf: '529.982.247-25', email: 'admin.ficticio@exemplo.com' });
    await auth.register({ ...dados, cpf: '123.456.789-09', email: 'passageira.ficticia@exemplo.com' });
    server = createApp({ auth: { service: auth, config: CONFIG }, admin });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const entrar = async (email: string) => {
      const r = await chamar('/api/auth/login', undefined, 'POST', { email, senha: SENHA });
      expect(r.status).toBe(200);
      return (r.headers.get('set-cookie') ?? '').split(';')[0] ?? '';
    };
    cookieAdmin = await entrar('admin.ficticio@exemplo.com');
    cookiePassageiro = await entrar('passageira.ficticia@exemplo.com');
    await chamar('/api/auth/login', undefined, 'POST', { email: 'passageira.ficticia@exemplo.com', senha: 'errada-errada' });
  });
  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it.each(['/api/admin/painel', '/api/admin/historico'])('%s: visitante 401, passageiro 403, administrador 200, outro metodo 405', async (caminho) => {
    expect((await chamar(caminho)).status).toBe(401);
    expect((await chamar(caminho, cookiePassageiro)).status).toBe(403);
    const ok = await chamar(caminho, cookieAdmin);
    expect(ok.status).toBe(200);
    expect(ok.headers.get('cache-control')).toBe('no-store');
    expect((await chamar(caminho, cookieAdmin, 'POST', {})).status).toBe(405);
  });

  it('quem nao e administrador nao dispara nenhum efeito', async () => {
    paga(publicar(), 'parcelada');
    relogio = PRAZO;
    const antes = retrato();
    await chamar('/api/admin/painel');
    await chamar('/api/admin/painel', cookiePassageiro);
    await chamar('/api/admin/painel?x=1', cookieAdmin);
    expect(retrato()).toBe(antes);
    await chamar('/api/admin/painel', cookieAdmin);
    expect(retrato()).not.toBe(antes);
  });

  it('as respostas nao trazem dados pessoais nem texto de mensagens', async () => {
    cenario();
    withTransaction(db, () => gerarMensagens(db, relogio));
    const textos = (await chamar('/api/admin/painel', cookieAdmin)).texto + (await chamar('/api/admin/historico', cookieAdmin)).texto;
    expect(textos).not.toMatch(/@|Joana|Passageira|Ana Ficticia|52998224725|400000000|1991-02-03|911112222|senha|token|Confirmamos|Olá/);
  });

  it('erro de validacao vem por campo', async () => {
    const r = await chamar('/api/admin/historico?pagina=x&estranho=1', cookieAdmin);
    expect(r.status).toBe(400);
    expect(r.json).toEqual({ error: 'validacao', fields: { estranho: 'campo_nao_permitido', pagina: 'invalido' } });
  });
});
