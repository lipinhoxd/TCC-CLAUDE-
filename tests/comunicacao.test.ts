import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AdminService } from '../server/admin/service.ts';
import { createApp } from '../server/app.ts';
import type { AuthConfig } from '../server/auth/config.ts';
import { AuthService } from '../server/auth/service.ts';
import { CancelamentoService } from '../server/cancelamentos/service.ts';
import { entregarMensagens } from '../server/comunicacao/entrega.ts';
import { gerarMensagens } from '../server/comunicacao/gerador.ts';
import { passosDaRotina } from '../server/comunicacao/passos.ts';
import { ComunicacaoConfigError, emailDoAmbiente, provedorEmailEmArquivo } from '../server/comunicacao/provedor.ts';
import type { EmailASair, ProvedorEmail } from '../server/comunicacao/provedor.ts';
import { AvisoService } from '../server/comunicacao/service.ts';
import { limpar } from '../server/comunicacao/textos.ts';
import { MEMORY_DATABASE, openDatabase } from '../server/db/connection.ts';
import { runMigrations } from '../server/db/migrate.ts';
import { migrations } from '../server/db/migrations.ts';
import { withTransaction } from '../server/db/transaction.ts';
import { ExcursaoService } from '../server/excursoes/service.ts';
import { provedorSimulado } from '../server/pagamentos/provedor.ts';
import { PagamentoService } from '../server/pagamentos/service.ts';
import { executarRotina, linhasDoResultado } from '../server/processos/rotina.ts';
import { ReservaService } from '../server/reservas/service.ts';

/** Comunicacao transacional (AGT-015, RF-040) e as decisoes 1A, 2.1 a 2.5 e 3.1 a 3.4 do pesquisador. */

const INICIO = new Date('2026-11-13T12:00:00.000Z');
const MIN = 60_000;
const DEPOIS_DO_PRAZO = new Date('2026-12-06T03:00:00.000Z');
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

function inserirUsuario(banco: DatabaseSync, perfil: 'passageiro' | 'administrador' = 'passageiro', nome = ''): number {
  pessoas += 1;
  const iso = INICIO.toISOString();
  return Number(
    banco
      .prepare(
        "INSERT INTO usuario (nome_completo, cpf, email, data_nascimento, telefone, senha_hash, perfil, criado_em, atualizado_em) VALUES (?, ?, ?, '1991-02-03', '+5511911112222', 'x', ?, ?, ?)",
      )
      .run(nome === '' ? `Joana${pessoas} Passageira Ficticia` : nome, String(30_000_000_000 + pessoas), `joana${pessoas}@exemplo.com`, perfil, iso, iso).lastInsertRowid,
  );
}

function montar(banco: DatabaseSync): void {
  db = banco;
  relogio = INICIO;
  const agora = () => relogio;
  excursoes = new ExcursaoService(db, agora);
  reservas = new ReservaService(db, agora, 15 * MIN, provedorSimulado);
  pagamentos = new PagamentoService(db, reservas, provedorSimulado, agora);
  cancelamentos = new CancelamentoService(db, reservas, provedorSimulado, agora);
  admin = new AdminService(db, agora);
  adminId = inserirUsuario(db, 'administrador');
}

function publicar(extra: Record<string, unknown> = {}): number {
  const e = excursoes.criar(adminId, { ...EXCURSAO, ...extra });
  excursoes.mudarSituacao(adminId, e.id, { situacao: 'publicada' });
  return e.id;
}
interface Criada {
  passageiro: number;
  id: number;
}
function reservar(excursaoId: number, modalidade: 'integral' | 'parcelada' = 'integral', passageiro = inserirUsuario(db)): Criada {
  return { passageiro, id: reservas.solicitar(passageiro, { excursao_id: excursaoId, modalidade }).id };
}
function iniciarPagamento(r: Criada): Criada {
  pagamentos.iniciar(r.passageiro, r.id);
  return r;
}
function simular(r: Criada, resultado: 'aprovado' | 'recusado' = 'aprovado'): Criada {
  pagamentos.simular(r.passageiro, r.id, { resultado });
  return r;
}
function paga(excursaoId: number, modalidade: 'integral' | 'parcelada' = 'integral', passageiro = inserirUsuario(db)): Criada {
  const r = reservar(excursaoId, modalidade, passageiro);
  reservas.iniciarCheckout(r.passageiro, r.id);
  return simular(iniciarPagamento(r));
}
const gerar = (): number => withTransaction(db, () => gerarMensagens(db, relogio));
type Mensagem = Record<string, unknown>;
const mensagensDe = (reservaId: number): Mensagem[] => db.prepare('SELECT * FROM mensagem WHERE reserva_id = ? ORDER BY id').all(reservaId);
const tipos = (reservaId: number): string[] => mensagensDe(reservaId).map((m) => String(m['tipo']));
const corpo = (reservaId: number, tipo: string): string => String(mensagensDe(reservaId).find((m) => m['tipo'] === tipo)?.['corpo']);
const contar = (sql: string): number => Number(db.prepare(sql).get()?.['n']);
const total = () => contar('SELECT COUNT(*) AS n FROM mensagem');
const reembolsoDe = (reservaId: number): number => Number(db.prepare('SELECT id FROM reembolso WHERE reserva_id = ?').get(reservaId)?.['id']);
const retrato = () => JSON.stringify([db.prepare('SELECT * FROM reserva ORDER BY id').all(), db.prepare('SELECT * FROM pagamento ORDER BY id').all(), db.prepare('SELECT * FROM excursao ORDER BY id').all(), db.prepare('SELECT * FROM reembolso ORDER BY id').all()]);

describe('avisos sobre o banco', () => {
  beforeEach(() => {
    const banco = openDatabase(MEMORY_DATABASE);
    runMigrations(banco);
    montar(banco);
  });
  afterEach(() => db.close());

  describe('eventos que avisam (decisao 2.1) e texto (decisao 2.3)', () => {
    it('pagamento integral confirmado: um aviso com primeiro nome, valor, excursao e datas; criar, reter e iniciar nao avisam', () => {
      const e = publicar();
      const r = reservar(e, 'integral', inserirUsuario(db, 'passageiro', 'Joana Souza Ficticia'));
      reservas.iniciarCheckout(r.passageiro, r.id);
      iniciarPagamento(r);
      expect(gerar()).toBe(0);
      relogio = new Date(INICIO.getTime() + MIN);
      simular(r);
      expect(gerar()).toBe(1);
      const [m] = mensagensDe(r.id);
      expect(m?.['tipo']).toBe('pagamento_confirmado');
      expect(m?.['usuario_id']).toBe(r.passageiro);
      expect(m?.['assunto']).toBe(`Reserva nº ${r.id}: pagamento confirmado`);
      expect(String(m?.['corpo']).split('\n')).toEqual([
        'Olá, Joana.',
        'Confirmamos o pagamento de R$ 150,01. Sua reserva está pronta para embarque.',
        `Excursão: Excursao Ficticia Serra (10/12/2026 a 12/12/2026). Reserva nº ${r.id}.`,
        'Os detalhes estão em Minhas reservas.',
      ]);
      expect(m?.['evento_em']).toBe(relogio.toISOString());
      expect(m?.['email_situacao']).toBe('pendente');
    });

    it('duas parcelas: a primeira informa a data limite em Brasilia e a regra de nao reembolso; a segunda informa a quitacao', () => {
      const r = paga(publicar(), 'parcelada');
      gerar();
      expect(corpo(r.id, 'pagamento_confirmado')).toContain('primeira parcela, de R$ 75,00');
      expect(corpo(r.id, 'pagamento_confirmado')).toContain('até as 23:59:59 de 05/12/2026 (horário de Brasília)');
      expect(corpo(r.id, 'pagamento_confirmado')).toContain('a primeira parcela não é reembolsável');
      simular(iniciarPagamento(r));
      expect(gerar()).toBe(1);
      expect(String(mensagensDe(r.id)[1]?.['corpo'])).toContain('segunda parcela, de R$ 75,01. Sua reserva está quitada');
    });

    it('confirmacao sem vaga e segunda parcela depois do prazo ficam "em analise", sem prometer reembolso', () => {
      const cheia = publicar({ capacidade: 1 });
      const semVaga = reservar(cheia);
      reservas.iniciarCheckout(semVaga.passageiro, semVaga.id);
      iniciarPagamento(semVaga);
      relogio = new Date(INICIO.getTime() + 16 * MIN);
      paga(cheia);
      simular(semVaga);
      const outra = publicar({ nome: 'Excursao Ficticia Lago' });
      const tardia = paga(outra, 'parcelada');
      relogio = new Date(DEPOIS_DO_PRAZO.getTime() - MIN);
      iniciarPagamento(tardia);
      relogio = DEPOIS_DO_PRAZO;
      simular(tardia);
      gerar();
      expect(tipos(semVaga.id)).toEqual(['pagamento_em_analise']);
      expect(corpo(semVaga.id, 'pagamento_em_analise')).toContain('não havia vaga disponível');
      expect(tipos(tardia.id)).toEqual(['pagamento_confirmado', 'cancelada_inadimplencia', 'pagamento_em_analise']);
      expect(corpo(tardia.id, 'pagamento_em_analise')).toContain('depois do prazo');
      expect(corpo(semVaga.id, 'pagamento_em_analise')).not.toMatch(/reembols/i);
    });

    it('cancelamento pelo passageiro: valor e percentual calculados, parcelada nao quitada e sem reembolso', () => {
      const e = publicar();
      const cheio = paga(e);
      cancelamentos.cancelarReserva(cheio.passageiro, cheio.id, { percentual_previsto: 100 });
      const parcelada = paga(e, 'parcelada');
      cancelamentos.cancelarReserva(parcelada.passageiro, parcelada.id, { percentual_previsto: 100 });
      const metade = paga(e);
      relogio = new Date('2026-12-01T10:00:00.000Z'); // 9 dias antes da partida: 50%
      cancelamentos.cancelarReserva(metade.passageiro, metade.id, { percentual_previsto: 50 });
      gerar();
      expect(corpo(cheio.id, 'cancelada_passageiro')).toContain('a seu pedido');
      expect(corpo(cheio.id, 'cancelada_passageiro')).toContain('reembolso de R$ 150,01, que aguarda processamento');
      expect(corpo(cheio.id, 'cancelada_passageiro')).not.toContain('%');
      expect(corpo(metade.id, 'cancelada_passageiro')).toContain('R$ 75,00 (50% do valor elegível)');
      expect(corpo(parcelada.id, 'cancelada_passageiro')).toContain('parcelada não quitada não é reembolsável');
    });

    it('cancelamento sem pagamento confirmado diz que nao houve reembolso; com pagamento em analise, nao diz isso', () => {
      const cheia = publicar({ capacidade: 1 });
      const semVaga = reservar(cheia);
      reservas.iniciarCheckout(semVaga.passageiro, semVaga.id);
      iniciarPagamento(semVaga);
      relogio = new Date(INICIO.getTime() + 16 * MIN);
      paga(cheia);
      simular(semVaga);
      cancelamentos.cancelarReserva(semVaga.passageiro, semVaga.id, { percentual_previsto: 100 });
      const semPagamento = reservar(publicar({ nome: 'Excursao Ficticia Lago' }));
      iniciarCheckoutEPendente(semPagamento);
      cancelamentos.cancelarReserva(semPagamento.passageiro, semPagamento.id, { percentual_previsto: 100 });
      gerar();
      expect(corpo(semVaga.id, 'cancelada_passageiro')).toContain('aguarda análise será tratado');
      expect(corpo(semVaga.id, 'cancelada_passageiro')).not.toContain('não gerou reembolso');
      expect(corpo(semPagamento.id, 'cancelada_passageiro')).toContain('não gerou reembolso');
    });

    it('cancelamento da excursao e cancelamento manual avisam sem a justificativa do administrador', () => {
      const e = publicar();
      const a = paga(e);
      const b = reservar(e);
      cancelamentos.cancelarExcursao(adminId, e, { justificativa: 'JUSTIFICATIVA-SECRETA da excursao' });
      const manual = reservar(publicar({ nome: 'Excursao Ficticia Lago' }));
      admin.alterarSituacao(adminId, manual.id, { situacao: 'cancelada', justificativa: 'JUSTIFICATIVA-SECRETA manual' });
      gerar();
      expect(tipos(a.id)).toEqual(['pagamento_confirmado', 'cancelada_organizacao']);
      expect(corpo(a.id, 'cancelada_organizacao')).toContain('reembolso de R$ 150,01');
      expect(tipos(b.id)).toEqual(['cancelada_organizacao']);
      expect(corpo(b.id, 'cancelada_organizacao')).not.toMatch(/reembols/i);
      expect(tipos(manual.id)).toEqual(['cancelada_administracao']);
      expect(JSON.stringify(db.prepare('SELECT * FROM mensagem').all())).not.toContain('SECRETA');
    });

    it('reembolso processado de pendencia avisa o reembolso e o cancelamento; recusado nao avisa', () => {
      const cheia = publicar({ capacidade: 1 });
      const semVaga = reservar(cheia);
      reservas.iniciarCheckout(semVaga.passageiro, semVaga.id);
      iniciarPagamento(semVaga);
      relogio = new Date(INICIO.getTime() + 16 * MIN);
      paga(cheia);
      simular(semVaga);
      const pagamentoId = Number(db.prepare('SELECT id FROM pagamento WHERE reserva_id = ?').get(semVaga.id)?.['id']);
      const reembolso = cancelamentos.reembolsarPendencia(adminId, pagamentoId);
      cancelamentos.processarReembolso(adminId, reembolso.id, { resultado: 'recusado' });
      gerar();
      expect(tipos(semVaga.id)).toEqual(['pagamento_em_analise']);
      cancelamentos.processarReembolso(adminId, reembolso.id, { resultado: 'aprovado' });
      cancelamentos.processarReembolso(adminId, reembolso.id, { resultado: 'aprovado' });
      gerar();
      expect(tipos(semVaga.id)).toEqual(['pagamento_em_analise', 'reembolso_processado', 'cancelada_apos_reembolso']);
      expect(corpo(semVaga.id, 'reembolso_processado')).toContain('O reembolso de R$ 150,01 foi processado.');
    });

    it('vencimento e cancelamento automatico avisam; desistencia, pagamento recusado e conclusoes nao', () => {
      const e = publicar();
      const vencida = paga(e, 'parcelada');
      const automatica = reservar(e);
      const desistencia = reservar(e);
      reservas.desistir(desistencia.passageiro, desistencia.id);
      const recusada = reservar(e);
      reservas.iniciarCheckout(recusada.passageiro, recusada.id);
      simular(iniciarPagamento(recusada), 'recusado');
      const concluida = paga(e);
      const manual = paga(publicar({ nome: 'Excursao Ficticia Lago' }));
      gerar();
      relogio = DEPOIS_DO_FIM;
      admin.alterarSituacao(adminId, manual.id, { situacao: 'concluida', justificativa: 'Viagem realizada.' });
      executarRotina(db, relogio);
      gerar();
      expect(tipos(vencida.id)).toEqual(['pagamento_confirmado', 'cancelada_inadimplencia']);
      expect(corpo(vencida.id, 'cancelada_inadimplencia')).toContain('não é reembolsável');
      expect(tipos(automatica.id)).toEqual(['cancelada_excursao_terminada']);
      expect(tipos(desistencia.id)).toEqual([]);
      expect(tipos(recusada.id)).toEqual(['cancelada_excursao_terminada']); // recusado nao avisa; o cancelamento automatico, sim
      expect(tipos(concluida.id)).toEqual(['pagamento_confirmado']);
      expect(tipos(manual.id)).toEqual(['pagamento_confirmado']);
    });
  });

  describe('um aviso por evento (decisoes 3.1 e 3.3)', () => {
    it('gerar de novo, repetir a operacao e efetivar pela leitura nao duplicam', () => {
      const e = publicar();
      const r = paga(e, 'parcelada');
      relogio = DEPOIS_DO_PRAZO;
      expect(() => iniciarPagamento(r)).toThrow(/prazo_da_segunda_parcela_vencido/); // a gravacao efetiva o vencimento
      expect(() => iniciarPagamento(r)).toThrow();
      expect(gerar()).toBe(2);
      executarRotina(db, relogio);
      expect(gerar()).toBe(0);
      expect(tipos(r.id)).toEqual(['pagamento_confirmado', 'cancelada_inadimplencia']);
    });

    it('o banco recusa um segundo aviso do mesmo registro de auditoria', () => {
      paga(publicar());
      gerar();
      expect(() =>
        db.exec('INSERT INTO mensagem (usuario_id, reserva_id, auditoria_id, tipo, assunto, corpo, evento_em, criado_em) SELECT usuario_id, reserva_id, auditoria_id, tipo, assunto, corpo, evento_em, criado_em FROM mensagem'),
      ).toThrow(/UNIQUE/);
      db.exec('UPDATE comunicacao_marco SET ultima_auditoria_id = 0');
      expect(gerar()).toBe(0);
      expect(total()).toBe(1);
    });

    it('com lote pequeno processa todos, sem pular nem repetir', () => {
      const e = publicar();
      for (let i = 0; i < 5; i += 1) paga(e);
      const criadas = [1, 2, 3, 4].map(() => withTransaction(db, () => gerarMensagens(db, relogio, 2)));
      expect(criadas).toEqual([2, 2, 1, 0]);
      expect(contar('SELECT COUNT(DISTINCT auditoria_id) AS n FROM mensagem')).toBe(5);
      expect(contar('SELECT ultima_auditoria_id AS n FROM comunicacao_marco')).toBe(contar('SELECT MAX(id) AS n FROM auditoria'));
    });

    it('exige transacao aberta', () => {
      expect(() => gerarMensagens(db, relogio)).toThrow(/transacao/);
    });
  });

  describe('falha na geracao', () => {
    it('nao desfaz a operacao, nao avanca o marco e gera na execucao seguinte', () => {
      db.exec("CREATE TRIGGER tg_falha_aviso BEFORE INSERT ON mensagem BEGIN SELECT RAISE(ABORT, 'falha ficticia'); END");
      const r = paga(publicar());
      const antes = retrato();
      const resultado = executarRotina(db, relogio, passosDaRotina(undefined));
      expect(resultado.falhas.map((f) => f.nome)).toEqual(['avisos_gerados']);
      expect(retrato()).toBe(antes);
      expect(contar('SELECT ultima_auditoria_id AS n FROM comunicacao_marco')).toBe(0);
      db.exec('DROP TRIGGER tg_falha_aviso');
      executarRotina(db, relogio, passosDaRotina(undefined));
      expect(tipos(r.id)).toEqual(['pagamento_confirmado']);
    });
  });

  describe('entrega do e-mail simulado (decisoes 1A e 3.2)', () => {
    const enviados: EmailASair[] = [];
    const ok: ProvedorEmail = { nome: 'teste', enviar: (m) => void enviados.push(m) };
    const quebrado: ProvedorEmail = {
      nome: 'teste',
      enviar: (m) => {
        throw new Error(`falha ao enviar para ${m.para}: ${m.corpo}`);
      },
    };
    const estado = () => db.prepare('SELECT email_situacao AS s, email_tentativas AS t, email_enviado_em AS q FROM mensagem ORDER BY id').all().map((m) => [m['s'], m['t'], m['q']]);
    beforeEach(() => enviados.splice(0));

    it('envia uma vez para o e-mail da conta e marca como enviado', () => {
      const r = paga(publicar());
      gerar();
      const email = String(db.prepare('SELECT email FROM usuario WHERE id = ?').get(r.passageiro)?.['email']);
      expect(entregarMensagens(db, ok, relogio)).toEqual({ enviadas: 1, falhas: 0, definitivas: 0 });
      expect(entregarMensagens(db, ok, relogio)).toEqual({ enviadas: 0, falhas: 0, definitivas: 0 });
      expect(enviados).toHaveLength(1);
      expect(enviados[0]?.para).toBe(email);
      expect(estado()).toEqual([['enviado', 1, relogio.toISOString()]]);
    });

    it('sem provedor (producao) o aviso fica na plataforma e o e-mail pendente, sem tentativas', () => {
      paga(publicar());
      gerar();
      expect(entregarMensagens(db, undefined, relogio)).toEqual({ enviadas: 0, falhas: 0, definitivas: 0 });
      expect(estado()).toEqual([['pendente', 0, null]]);
    });

    it('falha: tenta ate 3 vezes, uma por execucao, depois "falhou", auditada sem endereco nem texto e sem afetar a reserva', () => {
      paga(publicar());
      gerar();
      const antes = retrato();
      const passos = passosDaRotina(quebrado);
      const saidas = [1, 2, 3, 4].map(() => linhasDoResultado(executarRotina(db, relogio, passos)).join('\n'));
      expect(estado()).toEqual([['falhou', 3, null]]);
      expect(saidas[0]).toContain('e-mails com falha nesta execução: 1 (definitivas: 0)');
      expect(saidas[2]).toContain('e-mails com falha nesta execução: 1 (definitivas: 1)');
      expect(saidas[3]).not.toContain('com falha');
      expect(saidas.join('\n')).not.toMatch(/@|Olá|falha ao enviar/);
      const eventos = db.prepare("SELECT ator_usuario_id AS a, estado_novo AS n FROM auditoria WHERE acao = 'comunicacao.falha_definitiva'").all();
      expect(eventos).toHaveLength(1);
      expect(eventos[0]?.['a']).toBeNull();
      expect(String(eventos[0]?.['n'])).not.toMatch(/@|Olá/);
      expect(retrato()).toBe(antes);
    });

    it('recupera na segunda tentativa sem repetir', () => {
      paga(publicar());
      gerar();
      entregarMensagens(db, quebrado, relogio);
      expect(estado()).toEqual([['pendente', 1, null]]);
      entregarMensagens(db, ok, relogio);
      entregarMensagens(db, ok, relogio);
      expect(estado()).toEqual([['enviado', 2, relogio.toISOString()]]);
      expect(enviados).toHaveLength(1);
    });

    it('a falha de uma mensagem nao impede as outras, e o lote limita a quantidade', () => {
      const e = publicar();
      for (let i = 0; i < 3; i += 1) paga(e);
      gerar();
      const soAPrimeiraFalha: ProvedorEmail = {
        nome: 'teste',
        enviar: (m, agora) => {
          if (enviados.length === 0 && m.mensagemId === 1) throw new Error('falha');
          ok.enviar(m, agora);
        },
      };
      expect(entregarMensagens(db, soAPrimeiraFalha, relogio, 2)).toEqual({ enviadas: 1, falhas: 1, definitivas: 0 });
      expect(estado().map((x) => x[0])).toEqual(['pendente', 'enviado', 'pendente']);
    });

    it('nunca escreve na rotina o e-mail nem o texto, e o envio entra na mesma execucao que gerou o aviso', () => {
      const r = paga(publicar(), 'parcelada');
      relogio = DEPOIS_DO_PRAZO;
      const linhas = linhasDoResultado(executarRotina(db, relogio, passosDaRotina(ok)));
      expect(linhas).toEqual(['Rotina automática: retenções expiradas: 0; segundas parcelas vencidas: 1; reservas concluídas: 0; reservas sem pagamento canceladas: 0; avisos gerados: 2; e-mails enviados: 2.']);
      expect(tipos(r.id)).toEqual(['pagamento_confirmado', 'cancelada_inadimplencia']);
      expect(enviados).toHaveLength(2);
    });
  });

  describe('dados pessoais e texto de usuario (RNF-005, RN-042)', () => {
    it('mensagem sem CPF, nascimento, telefone ou e-mail; auditoria sem o texto', () => {
      const r = paga(publicar());
      cancelamentos.cancelarReserva(r.passageiro, r.id, { percentual_previsto: 100 });
      cancelamentos.processarReembolso(adminId, reembolsoDe(r.id), { resultado: 'aprovado' });
      executarRotina(db, relogio, passosDaRotina({ nome: 'teste', enviar: () => undefined }));
      expect(total()).toBe(3);
      const textos = JSON.stringify(db.prepare('SELECT assunto, corpo FROM mensagem').all());
      expect(textos).not.toMatch(/@|300000000|1991|03\/02\/1991|911112222|Passageira/);
      expect(JSON.stringify(db.prepare('SELECT * FROM auditoria').all())).not.toMatch(/Olá|Confirmamos|@exemplo/);
    });

    it('nome e excursao com quebras de linha e marcas invisiveis nao mudam a estrutura, o assunto ou o destinatario', () => {
      const passageiro = inserirUsuario(db, 'passageiro', 'Eva\r\nBcc:\u202e outro@exemplo.com');
      const e = publicar({ nome: 'Excursao Ficticia' });
      db.prepare('UPDATE excursao SET nome = ? WHERE id = ?').run('Serra\nAssunto: <img src=x>\u200b\u0007 fim', e);
      const r = paga(e, 'integral', passageiro);
      gerar();
      const [m] = mensagensDe(r.id);
      const linhas = String(m?.['corpo']).split('\n');
      expect(linhas).toHaveLength(4);
      expect(linhas[0]).toBe('Olá, Eva.');
      expect(linhas[2]).toContain('Excursão: Serra Assunto: <img src=x> fim (');
      for (const invisivel of ['\u202e', '\u200b', '\u0007', '\r']) expect(String(m?.['corpo'])).not.toContain(invisivel);
      expect(m?.['assunto']).toBe(`Reserva nº ${r.id}: pagamento confirmado`);
      expect(m?.['usuario_id']).toBe(passageiro);
    });

    it('limpar corta no limite', () => {
      expect(limpar('  a \t b  ', 10)).toBe('a b');
      expect(limpar('abcdef', 3)).toBe('abc');
    });
  });
});

function iniciarCheckoutEPendente(r: Criada): void {
  reservas.iniciarCheckout(r.passageiro, r.id);
  iniciarPagamento(r);
}

describe('migracao 5: so eventos posteriores (decisao 3.3)', () => {
  it('eventos gravados antes da migracao nao geram aviso; os seguintes geram', () => {
    const banco = openDatabase(MEMORY_DATABASE);
    runMigrations(banco, migrations.slice(0, 4));
    montar(banco);
    const e = publicar();
    const antiga = paga(e);
    expect(runMigrations(banco)).toEqual([5]);
    expect(gerar()).toBe(0);
    const nova = paga(e);
    expect(gerar()).toBe(1);
    expect(tipos(antiga.id)).toEqual([]);
    expect(tipos(nova.id)).toEqual(['pagamento_confirmado']);
    banco.close();
  });
});

describe('arquivo, duas conexoes e configuracao', () => {
  let dir: string;
  let outra: DatabaseSync;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'excursoes-aviso-'));
    const caminho = join(dir, 'avisos.sqlite');
    const principal = openDatabase(caminho);
    runMigrations(principal);
    montar(principal);
    outra = openDatabase(caminho);
    outra.exec('PRAGMA busy_timeout = 0');
    db.exec('PRAGMA busy_timeout = 0');
  });
  afterEach(() => {
    outra.close();
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('a segunda conexao nao gera nem envia de novo', () => {
    paga(publicar());
    const enviados: number[] = [];
    const provedor: ProvedorEmail = { nome: 'teste', enviar: (m) => void enviados.push(m.mensagemId) };
    executarRotina(db, relogio, passosDaRotina(provedor));
    executarRotina(outra, relogio, passosDaRotina(provedor));
    expect(total()).toBe(1);
    expect(enviados).toEqual([1]);
  });

  it('durante o envio de uma conexao, a outra nao consegue enviar a mesma mensagem', () => {
    paga(publicar());
    gerar();
    const concorrente: string[] = [];
    const provedor: ProvedorEmail = {
      nome: 'teste',
      enviar: () => {
        expect(() => entregarMensagens(outra, { nome: 'outro', enviar: () => void concorrente.push('enviado') }, relogio)).toThrow(/locked|busy/i);
      },
    };
    expect(entregarMensagens(db, provedor, relogio).enviadas).toBe(1);
    expect(concorrente).toEqual([]);
  });

  it('o provedor simulado grava uma linha por mensagem no arquivo', () => {
    const arquivo = join(dir, 'saida', 'comunicacao.jsonl');
    paga(publicar());
    executarRotina(db, relogio, passosDaRotina(provedorEmailEmArquivo(arquivo)));
    executarRotina(db, relogio, passosDaRotina(provedorEmailEmArquivo(arquivo)));
    const linhas = readFileSync(arquivo, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as Record<string, unknown>);
    expect(linhas).toHaveLength(1);
    expect(Object.keys(linhas[0] ?? {})).toEqual(['mensagem_id', 'para', 'assunto', 'corpo', 'enviado_em']);
    expect(String(linhas[0]?.['para'])).toContain('@exemplo.com');
  });

  it('falha ao gravar o arquivo conta como falha de entrega', () => {
    paga(publicar());
    gerar();
    expect(entregarMensagens(db, provedorEmailEmArquivo(dir), relogio)).toEqual({ enviadas: 0, falhas: 1, definitivas: 0 });
  });

  it('configuracao: simulado fora de producao, desligavel, nunca em producao, e valor invalido recusado', () => {
    expect(emailDoAmbiente({})?.nome).toBe('simulado');
    expect(emailDoAmbiente({ EMAIL_SIMULADO: 'TRUE' })?.nome).toBe('simulado');
    expect(emailDoAmbiente({ EMAIL_SIMULADO: 'false' })).toBeUndefined();
    expect(emailDoAmbiente({ NODE_ENV: 'production' })).toBeUndefined();
    expect(emailDoAmbiente({ NODE_ENV: 'production', EMAIL_SIMULADO: 'true' })).toBeUndefined();
    expect(() => emailDoAmbiente({ EMAIL_SIMULADO: 'sim' })).toThrow(ComunicacaoConfigError);
  });
});

describe('GET /api/avisos (decisao 3.4)', () => {
  let server: Server;
  let base: string;

  async function chamar(caminho: string, cookie?: string, metodo = 'GET', corpoPedido?: unknown) {
    const headers: Record<string, string> = cookie === undefined ? {} : { Cookie: cookie };
    if (corpoPedido !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${base}${caminho}`, { method: metodo, headers, ...(corpoPedido === undefined ? {} : { body: JSON.stringify(corpoPedido) }) });
    const texto = await res.text();
    return { status: res.status, texto, json: (texto === '' ? null : JSON.parse(texto)) as Record<string, unknown> | null, headers: res.headers };
  }
  let ana: { id: number; cookie: string };
  let bia: { id: number; cookie: string };
  let cookieAdmin: string;

  beforeEach(async () => {
    const banco = openDatabase(MEMORY_DATABASE);
    runMigrations(banco);
    montar(banco);
    const auth = new AuthService({ db, config: CONFIG, outbox: () => undefined, now: () => INICIO });
    const dados = { nome_completo: 'Ana Ficticia', data_nascimento: '1990-05-20', telefone: '(11) 98765-4321', senha: SENHA };
    await auth.createAdministrator({ ...dados, cpf: '529.982.247-25', email: 'admin.ficticio@exemplo.com' });
    server = createApp({ auth: { service: auth, config: CONFIG }, avisos: new AvisoService(db) });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const entrar = async (email: string) => {
      const r = await chamar('/api/auth/login', undefined, 'POST', { email, senha: SENHA });
      expect(r.status).toBe(200);
      return (r.headers.get('set-cookie') ?? '').split(';')[0] ?? '';
    };
    const novo = async (cpf: string, email: string) => {
      const id = (await auth.register({ ...dados, cpf, email })).id;
      return { id, cookie: await entrar(email) };
    };
    ana = await novo('123.456.789-09', 'ana.ficticia@exemplo.com');
    bia = await novo('390.533.447-05', 'bia.ficticia@exemplo.com');
    cookieAdmin = await entrar('admin.ficticio@exemplo.com');
  });
  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });

  it('cada passageiro ve so os proprios avisos, do mais recente para o mais antigo, sem dados de outras pessoas', async () => {
    const e = publicar();
    const daAna = paga(e, 'integral', ana.id);
    const daBia = paga(e, 'integral', bia.id);
    cancelamentos.cancelarReserva(ana.id, daAna.id, { percentual_previsto: 100 });
    gerar();
    const r = await chamar('/api/avisos', ana.cookie);
    expect(r.status).toBe(200);
    const avisos = r.json?.['avisos'] as Array<Record<string, unknown>>;
    expect(avisos.map((a) => [a['tipo'], a['reserva_id']])).toEqual([
      ['cancelada_passageiro', daAna.id],
      ['pagamento_confirmado', daAna.id],
    ]);
    expect(Object.keys(avisos[0] ?? {}).sort()).toEqual(['assunto', 'corpo', 'evento_em', 'id', 'reserva_id', 'tipo']);
    expect(r.texto).not.toContain('@');
    const b = await chamar('/api/avisos', bia.cookie);
    expect((b.json?.['avisos'] as Array<Record<string, unknown>>).map((a) => a['reserva_id'])).toEqual([daBia.id]);
    expect(r.headers.get('cache-control')).toBe('no-store');
  });

  it('visitante 401, administrador 403, outro metodo 405', async () => {
    expect((await chamar('/api/avisos')).status).toBe(401);
    expect((await chamar('/api/avisos', cookieAdmin)).status).toBe(403);
    expect((await chamar('/api/avisos', ana.cookie, 'POST', {})).status).toBe(405);
  });

  it('paginacao de 20 e recusa de parametros invalidos', async () => {
    const e = publicar({ capacidade: 50 });
    const r = paga(e, 'integral', ana.id);
    gerar();
    for (let i = 0; i < 24; i += 1) {
      db.prepare("INSERT INTO auditoria (acao, entidade, registro_id, ocorrido_em) VALUES ('teste.ficticio', 'reserva', ?, ?)").run(r.id, INICIO.toISOString());
      db.prepare(
        "INSERT INTO mensagem (usuario_id, reserva_id, auditoria_id, tipo, assunto, corpo, evento_em, criado_em) VALUES (?, ?, (SELECT MAX(id) FROM auditoria), 'reembolso_processado', 'A', 'B', ?, ?)",
      ).run(ana.id, r.id, INICIO.toISOString(), INICIO.toISOString());
    }
    const primeira = await chamar('/api/avisos', ana.cookie);
    expect(primeira.json).toMatchObject({ total: 25, pagina: 1, limite: 20 });
    expect(primeira.json?.['avisos']).toHaveLength(20);
    expect((await chamar('/api/avisos?pagina=2', ana.cookie)).json?.['avisos']).toHaveLength(5);
    for (const ruim of ['pagina=0', 'pagina=-1', 'pagina=x', `passageiro=${bia.id}`]) expect((await chamar(`/api/avisos?${ruim}`, ana.cookie)).status).toBe(400);
  });

  it('sem o servico responde 503', async () => {
    const vazio = createApp({});
    await new Promise<void>((resolve) => vazio.listen(0, '127.0.0.1', resolve));
    const res = await fetch(`http://127.0.0.1:${(vazio.address() as AddressInfo).port}/api/avisos`);
    expect(res.status).toBe(503);
    await new Promise<void>((resolve) => vazio.close(() => resolve()));
  });
});
