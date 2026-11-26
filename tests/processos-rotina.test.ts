import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMORY_DATABASE, openDatabase } from '../server/db/connection.ts';
import { runMigrations } from '../server/db/migrate.ts';
import { withTransaction } from '../server/db/transaction.ts';
import { ExcursaoService } from '../server/excursoes/service.ts';
import { provedorSimulado } from '../server/pagamentos/provedor.ts';
import { PagamentoService } from '../server/pagamentos/service.ts';
import { iniciarAgendador } from '../server/processos/agendador.ts';
import { loadRotinaConfig, RotinaConfigError } from '../server/processos/config.ts';
import { executarRotina, houveNovidade, linhasDoResultado } from '../server/processos/rotina.ts';
import type { ResultadoRotina } from '../server/processos/rotina.ts';
import { ReservaService } from '../server/reservas/service.ts';
import { cancelarSemPagamentoDeExcursaoTerminada } from '../server/vagas/encerramento.ts';

/** Processos automaticos (AGT-014): RF-022, RF-028, RF-036, RN-025, decisoes 1 a 3 do pesquisador. */

const INICIO = new Date('2026-11-13T12:00:00.000Z');
const QUINZE_MIN = 15 * 60_000;
/** 23:59:59 de Brasilia de 05/12/2026, prazo da segunda parcela. */
const PRAZO = new Date('2026-12-06T02:59:59.000Z');
/** A excursao termina em 12/12/2026; um dia depois comeca as 00:00 de Brasilia de 13/12 (03:00 UTC). */
const ANTES_DO_DIA_SEGUINTE = new Date('2026-12-13T02:59:59.999Z');
const DIA_SEGUINTE = new Date('2026-12-13T03:00:00.000Z');
const antes = (d: Date, ms = 1) => new Date(d.getTime() - ms);

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
let adminId: number;
let pessoas = 0;

function inserirUsuario(banco: DatabaseSync, perfil: 'passageiro' | 'administrador' = 'passageiro'): number {
  pessoas += 1;
  const iso = INICIO.toISOString();
  return Number(
    banco
      .prepare(
        "INSERT INTO usuario (nome_completo, cpf, email, data_nascimento, telefone, senha_hash, perfil, criado_em, atualizado_em) VALUES (?, ?, ?, '1990-01-01', '+5511900000000', 'x', ?, ?, ?)",
      )
      .run(`Pessoa Ficticia ${pessoas}`, String(10_000_000_000 + pessoas), `pessoa${pessoas}@exemplo.com`, perfil, iso, iso).lastInsertRowid,
  );
}

function montar(banco: DatabaseSync): void {
  db = banco;
  relogio = INICIO;
  const agora = () => relogio;
  excursoes = new ExcursaoService(db, agora);
  reservas = new ReservaService(db, agora, QUINZE_MIN, provedorSimulado);
  pagamentos = new PagamentoService(db, reservas, provedorSimulado, agora);
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
function comCheckout(excursaoId: number, modalidade: 'integral' | 'parcelada' = 'integral'): Criada {
  const r = reservar(excursaoId, modalidade);
  reservas.iniciarCheckout(r.passageiro, r.id);
  return r;
}
function comPagamento(excursaoId: number, resultado: 'aprovado' | 'recusado' | null, modalidade: 'integral' | 'parcelada' = 'integral'): Criada {
  const r = comCheckout(excursaoId, modalidade);
  pagamentos.iniciar(r.passageiro, r.id);
  if (resultado !== null) pagamentos.simular(r.passageiro, r.id, { resultado });
  return r;
}

const linha = (sql: string, ...p: Array<string | number>) => db.prepare(sql).get(...p);
const situacao = (id: number): string => String(linha('SELECT situacao FROM reserva WHERE id = ?', id)?.['situacao']);
const motivo = (id: number): unknown => linha('SELECT motivo_cancelamento AS m FROM reserva WHERE id = ?', id)?.['m'];
const retencaoDe = (id: number): string => String(linha('SELECT situacao FROM retencao_vaga WHERE reserva_id = ? ORDER BY id DESC', id)?.['situacao']);
const pagamentosDe = (id: number): string[] => db.prepare('SELECT situacao FROM pagamento WHERE reserva_id = ? ORDER BY id').all(id).map((p) => String(p['situacao']));
const ocupadas = (id: number): number => Number(linha('SELECT vagas_ocupadas AS v FROM excursao WHERE id = ?', id)?.['v']);
const eventos = (acao: string): number => Number(linha('SELECT COUNT(*) AS n FROM auditoria WHERE acao = ?', acao)?.['n']);
const totalAuditoria = (): number => Number(linha('SELECT COUNT(*) AS n FROM auditoria')?.['n']);
const contagens = (r: ResultadoRotina) => Object.fromEntries(r.passos.map((p) => [p.nome, p.alterados]));
const NADA = { retencoes_expiradas: 0, segundas_parcelas_vencidas: 0, reservas_concluidas: 0, reservas_sem_pagamento_canceladas: 0 };
const rodar = (instante: Date) => executarRotina(db, instante);

describe('rotina sobre o banco (sem nenhuma consulta de usuario)', () => {
  beforeEach(() => {
    const banco = openDatabase(MEMORY_DATABASE);
    runMigrations(banco);
    montar(banco);
  });
  afterEach(() => db.close());

  describe('expiracao da retencao (RF-022)', () => {
    it('expira exatamente no instante de expiracao, uma vez, sem mudar a reserva abandonada (decisao 2.2)', () => {
      const e = publicar();
      const r = comCheckout(e);
      const expira = new Date(INICIO.getTime() + QUINZE_MIN);
      expect(contagens(rodar(antes(expira)))).toEqual(NADA);
      expect(retencaoDe(r.id)).toBe('ativa');
      expect(contagens(rodar(expira))).toEqual({ ...NADA, retencoes_expiradas: 1 });
      expect(retencaoDe(r.id)).toBe('expirada');
      expect(situacao(r.id)).toBe('aguardando_pagamento');
      expect(contagens(rodar(expira))).toEqual(NADA);
      expect(eventos('retencao.expirada')).toBe(1);
      expect(linha("SELECT ator_usuario_id AS a FROM auditoria WHERE acao = 'retencao.expirada'")?.['a']).toBeNull();
    });

    it('muito depois, a reserva abandonada antes do fim da excursao continua aguardando', () => {
      const r = comCheckout(publicar());
      rodar(ANTES_DO_DIA_SEGUINTE);
      expect(situacao(r.id)).toBe('aguardando_pagamento');
    });
  });

  describe('segunda parcela vencida (RF-028, RN-019, RN-020, RN-032)', () => {
    it('so vence as 23:59:59 de Brasilia, libera a vaga uma unica vez e nao devolve a primeira parcela', () => {
      const e = publicar();
      const r = comPagamento(e, 'aprovado', 'parcelada');
      expect(ocupadas(e)).toBe(1);
      expect(contagens(rodar(antes(PRAZO)))).toEqual(NADA);
      expect(situacao(r.id)).toBe('aguardando_pagamento');
      expect(contagens(rodar(PRAZO))).toEqual({ ...NADA, segundas_parcelas_vencidas: 1 });
      expect(situacao(r.id)).toBe('cancelada');
      expect(motivo(r.id)).toBe('inadimplencia');
      expect(ocupadas(e)).toBe(0);
      expect(pagamentosDe(r.id)).toEqual(['confirmado']);
      expect(Number(linha('SELECT COUNT(*) AS n FROM reembolso')?.['n'])).toBe(0);
      expect(contagens(rodar(PRAZO))).toEqual(NADA);
      expect(ocupadas(e)).toBe(0);
      expect(eventos('reserva.vencimento_segunda_parcela')).toBe(1);
    });

    it('a segunda parcela pendente continua pendente e uma confirmacao tardia ainda e registrada (decisao 2.1, RN-022)', () => {
      const e = publicar();
      const r = comPagamento(e, 'aprovado', 'parcelada');
      relogio = antes(PRAZO, 60_000);
      pagamentos.iniciar(r.passageiro, r.id);
      rodar(DIA_SEGUINTE);
      expect(pagamentosDe(r.id)).toEqual(['confirmado', 'pendente']);
      relogio = DIA_SEGUINTE;
      pagamentos.simular(r.passageiro, r.id, { resultado: 'aprovado' });
      expect(linha("SELECT pendencia_administrativa AS p FROM pagamento WHERE reserva_id = ? AND parcela = 'segunda'", r.id)?.['p']).toBe('confirmacao_sem_vaga');
    });
  });

  describe('conclusao (RF-036, RN-025)', () => {
    it('conclui a partir do dia seguinte a data final, mantem a vaga ocupada e nao toca nas nao elegiveis', () => {
      const e = publicar();
      const pronta = comPagamento(e, 'aprovado');
      const cancelada = reservar(e);
      reservas.desistir(cancelada.passageiro, cancelada.id);
      expect(contagens(rodar(ANTES_DO_DIA_SEGUINTE))).toEqual(NADA);
      expect(situacao(pronta.id)).toBe('pronto_para_embarque');
      expect(contagens(rodar(DIA_SEGUINTE))).toEqual({ ...NADA, reservas_concluidas: 1 });
      expect(situacao(pronta.id)).toBe('concluida');
      expect(situacao(cancelada.id)).toBe('cancelada');
      expect(ocupadas(e)).toBe(1);
      expect(contagens(rodar(DIA_SEGUINTE))).toEqual(NADA);
      expect(eventos('reserva.concluida')).toBe(1);
    });

    it('nao muda a situacao da excursao (decisoes 3.1 e 3.2)', () => {
      const e = publicar();
      comPagamento(e, 'aprovado');
      rodar(DIA_SEGUINTE);
      expect(linha('SELECT situacao FROM excursao WHERE id = ?', e)?.['situacao']).toBe('publicada');
    });
  });

  describe('reserva sem pagamento de excursao terminada (decisao 2.3)', () => {
    it('cancela a partir do dia seguinte, sem motivo na reserva, com auditoria do sistema e sem mexer em vagas', () => {
      const e = publicar();
      const outra = comPagamento(e, 'aprovado'); // ocupa uma vaga, para provar que ela nao muda
      const sem = reservar(e);
      expect(contagens(rodar(ANTES_DO_DIA_SEGUINTE)).reservas_sem_pagamento_canceladas).toBe(0);
      expect(situacao(sem.id)).toBe('aguardando_pagamento');
      expect(contagens(rodar(DIA_SEGUINTE))).toEqual({ ...NADA, reservas_concluidas: 1, reservas_sem_pagamento_canceladas: 1 });
      expect(situacao(sem.id)).toBe('cancelada');
      expect(motivo(sem.id)).toBeNull();
      expect(situacao(outra.id)).toBe('concluida');
      expect(ocupadas(e)).toBe(1);
      const evento = linha("SELECT ator_usuario_id AS a, registro_id AS r, estado_novo AS n FROM auditoria WHERE acao = 'reserva.cancelamento_automatico'");
      expect(evento?.['a']).toBeNull();
      expect(evento?.['r']).toBe(sem.id);
      expect(JSON.parse(String(evento?.['n']))).toEqual({ situacao: 'cancelada', excursao_id: e, motivo: 'excursao_terminada_sem_pagamento' });
      expect(contagens(rodar(DIA_SEGUINTE))).toEqual(NADA);
      expect(eventos('reserva.cancelamento_automatico')).toBe(1);
    });

    it('cancela tambem a que so tem pagamento recusado', () => {
      const r = comPagamento(publicar(), 'recusado');
      rodar(DIA_SEGUINTE);
      expect(situacao(r.id)).toBe('cancelada');
      expect(pagamentosDe(r.id)).toEqual(['falhou']);
    });

    it('nao cancela a que tem pagamento pendente (decisao 2.1) nem a que tem pagamento confirmado sinalizado', () => {
      const e = publicar();
      const pendente = comPagamento(e, null);
      const sinalizada = comPagamento(e, null);
      db.prepare("UPDATE pagamento SET situacao = 'confirmado', confirmado_em = ?, pendencia_administrativa = 'confirmacao_sem_vaga' WHERE reserva_id = ?").run(INICIO.toISOString(), sinalizada.id);
      rodar(new Date('2027-03-01T12:00:00.000Z'));
      expect(situacao(pendente.id)).toBe('aguardando_pagamento');
      expect(pagamentosDe(pendente.id)).toEqual(['pendente']);
      expect(situacao(sinalizada.id)).toBe('aguardando_pagamento');
      expect(pagamentosDe(sinalizada.id)).toEqual(['confirmado']);
      expect(eventos('reserva.cancelamento_automatico')).toBe(0);
    });

    it('cancela junto uma retencao que ainda esteja ativa', () => {
      const r = comCheckout(publicar());
      db.prepare('UPDATE retencao_vaga SET expira_em = ? WHERE reserva_id = ?').run('2027-01-01T00:00:00.000Z', r.id);
      rodar(DIA_SEGUINTE);
      expect(situacao(r.id)).toBe('cancelada');
      expect(retencaoDe(r.id)).toBe('cancelada');
      expect(eventos('retencao.cancelada')).toBe(1);
    });

    it('libera o limite de reservas pendentes do passageiro', () => {
      const passageiro = inserirUsuario(db);
      for (let i = 0; i < 3; i += 1) reservar(publicar({ nome: `Excursao Ficticia ${i}` }), 'integral', passageiro);
      const nova = publicar({ data_inicial: '2027-02-10', data_final: '2027-02-12', partida_utc: '2027-02-10T10:00:00.000Z', parcelamento_habilitado: false, prazo_segunda_parcela: undefined });
      relogio = DIA_SEGUINTE;
      expect(() => reservas.solicitar(passageiro, { excursao_id: nova, modalidade: 'integral' })).toThrow(/limite_de_reservas_pendentes/);
      rodar(DIA_SEGUINTE);
      expect(reservas.solicitar(passageiro, { excursao_id: nova, modalidade: 'integral' }).situacao).toBe('aguardando_pagamento');
    });

    it('exige transacao aberta', () => {
      expect(() => cancelarSemPagamentoDeExcursaoTerminada(db, DIA_SEGUINTE)).toThrow(/transacao/);
    });
  });

  describe('repeticao e convivencia com a leitura', () => {
    it('depois de efetivada pela leitura, a rotina nao repete nem duplica a auditoria', () => {
      const r = comPagamento(publicar(), 'aprovado');
      relogio = DIA_SEGUINTE;
      expect(reservas.consultar(r.passageiro, r.id).situacao).toBe('concluida');
      const total = totalAuditoria();
      expect(contagens(rodar(DIA_SEGUINTE)).reservas_concluidas).toBe(0);
      expect(totalAuditoria()).toBe(total);
      expect(eventos('reserva.concluida')).toBe(1);
    });

    it('executar duas vezes um cenario com os quatro efeitos nao altera nada na segunda', () => {
      const e = publicar();
      comPagamento(e, 'aprovado');
      comPagamento(e, 'aprovado', 'parcelada');
      comCheckout(e);
      expect(contagens(rodar(DIA_SEGUINTE))).toEqual({ retencoes_expiradas: 1, segundas_parcelas_vencidas: 1, reservas_concluidas: 1, reservas_sem_pagamento_canceladas: 1 });
      const total = totalAuditoria();
      const vagas = ocupadas(e);
      expect(contagens(rodar(DIA_SEGUINTE))).toEqual(NADA);
      expect(totalAuditoria()).toBe(total);
      expect(ocupadas(e)).toBe(vagas);
      expect(vagas).toBe(1);
    });
  });

  describe('falha no meio (atomicidade, RNF-009, RNF-010)', () => {
    it('desfaz o passo inteiro, executa os outros, nao vaza dados e tenta de novo na execucao seguinte', () => {
      const e = publicar();
      const pronta = comPagamento(e, 'aprovado');
      const primeira = comPagamento(e, 'aprovado', 'parcelada');
      const segunda = comPagamento(e, 'aprovado', 'parcelada');
      db.exec(`CREATE TRIGGER tg_falha_teste BEFORE UPDATE ON reserva WHEN NEW.id = ${segunda.id} BEGIN SELECT RAISE(ABORT, 'dado pessoa1@exemplo.com'); END`);
      const r = rodar(DIA_SEGUINTE);
      expect(contagens(r)).toEqual({ ...NADA, segundas_parcelas_vencidas: null, reservas_concluidas: 1 });
      expect(r.falhas).toEqual([{ nome: 'segundas_parcelas_vencidas', erro: 'constraint failed' }]);
      expect(linhasDoResultado(r).join('\n')).not.toMatch(/@|pessoa/i);
      expect(situacao(primeira.id)).toBe('aguardando_pagamento'); // a primeira vencida tambem foi desfeita
      expect(ocupadas(e)).toBe(3);
      expect(eventos('reserva.vencimento_segunda_parcela')).toBe(0);
      expect(situacao(pronta.id)).toBe('concluida');
      expect(db.isTransaction).toBe(false);

      db.exec('DROP TRIGGER tg_falha_teste');
      expect(contagens(rodar(DIA_SEGUINTE))).toEqual({ ...NADA, segundas_parcelas_vencidas: 2 });
      expect(ocupadas(e)).toBe(1);
    });

    it('falha na auditoria do cancelamento sem pagamento desfaz a reserva e a retencao', () => {
      const e = publicar();
      const a = reservar(e);
      const b = reservar(e);
      db.exec(`CREATE TRIGGER tg_falha_teste BEFORE INSERT ON auditoria WHEN NEW.acao = 'reserva.cancelamento_automatico' AND NEW.registro_id = ${b.id} BEGIN SELECT RAISE(ABORT, 'falha ficticia'); END`);
      expect(contagens(rodar(DIA_SEGUINTE)).reservas_sem_pagamento_canceladas).toBeNull();
      expect(situacao(a.id)).toBe('aguardando_pagamento');
      expect(situacao(b.id)).toBe('aguardando_pagamento');
      expect(eventos('reserva.cancelamento_automatico')).toBe(0);
    });
  });

  describe('temporizador dentro da API (decisao 1)', () => {
    afterEach(() => vi.useRealTimers());

    it('executa na inicializacao e a cada intervalo, sem consulta de usuario, e para quando pedido', () => {
      vi.useFakeTimers();
      const r = comCheckout(publicar());
      let instante = INICIO;
      const linhas: string[] = [];
      const agendador = iniciarAgendador({ db, intervaloMs: 60_000, relogio: () => instante, registrar: (l) => linhas.push(l) });
      expect(linhas).toHaveLength(1); // a primeira execucao sempre e escrita
      expect(retencaoDe(r.id)).toBe('ativa');
      vi.advanceTimersByTime(60_000);
      expect(linhas).toHaveLength(1); // sem novidade, silencio
      instante = new Date(INICIO.getTime() + QUINZE_MIN);
      vi.advanceTimersByTime(59_999);
      expect(retencaoDe(r.id)).toBe('ativa');
      vi.advanceTimersByTime(1);
      expect(retencaoDe(r.id)).toBe('expirada');
      expect(linhas[1]).toBe('Rotina automática: retenções expiradas: 1; segundas parcelas vencidas: 0; reservas concluídas: 0; reservas sem pagamento canceladas: 0.');
      agendador.parar();
      agendador.parar();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('intervalo 0 desliga: nada e executado nem agendado', () => {
      vi.useFakeTimers();
      const executar = vi.fn<() => ResultadoRotina>();
      const linhas: string[] = [];
      iniciarAgendador({ db, intervaloMs: 0, registrar: (l) => linhas.push(l), executar }).parar();
      vi.advanceTimersByTime(600_000);
      expect(executar).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
      expect(linhas).toEqual(['Rotina automática desligada (ROTINA_INTERVALO_SEGUNDOS=0).']);
    });

    it('uma falha nao interrompe o agendamento e e registrada sem a mensagem', () => {
      vi.useFakeTimers();
      let n = 0;
      const executar = (): ResultadoRotina => {
        n += 1;
        if (n === 2) throw new TypeError('segredo pessoa1@exemplo.com');
        return { passos: [], falhas: n === 3 ? [{ nome: 'reservas_concluidas', erro: 'database is locked' }] : [] };
      };
      const linhas: string[] = [];
      const agendador = iniciarAgendador({ db, intervaloMs: 1000, registrar: (l) => linhas.push(l), executar });
      vi.advanceTimersByTime(3000);
      expect(n).toBe(4);
      expect(linhas).toContain('Rotina automática: falha inesperada (TypeError); será tentada de novo.');
      expect(linhas).toContain('Rotina automática: falha em reservas_concluidas (database is locked); será tentada de novo.');
      expect(linhas.join('\n')).not.toMatch(/segredo|@/);
      agendador.parar();
    });

    it('houveNovidade distingue execucao vazia, com alteracao e com falha', () => {
      const passo = (alterados: number | null) => ({ nome: 'x', rotulo: 'x', alterados });
      expect(houveNovidade({ passos: [passo(0)], falhas: [] })).toBe(false);
      expect(houveNovidade({ passos: [passo(2)], falhas: [] })).toBe(true);
      expect(houveNovidade({ passos: [passo(null)], falhas: [{ nome: 'x', erro: 'y' }] })).toBe(true);
    });
  });
});

describe('duas conexoes no mesmo arquivo (RN-040)', () => {
  let dir: string;
  let outra: DatabaseSync;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'excursoes-rotina-'));
    const caminho = join(dir, 'rotina.sqlite');
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

  it('com o banco bloqueado por outra gravacao nada muda nem lanca; liberado, a execucao seguinte grava', () => {
    const e = publicar();
    const r = comPagamento(e, 'aprovado', 'parcelada');
    const bloqueada = withTransaction(outra, () => rodar(DIA_SEGUINTE));
    expect(bloqueada.falhas.map((f) => f.erro)).toEqual(['database is locked', 'database is locked', 'database is locked', 'database is locked']);
    expect(situacao(r.id)).toBe('aguardando_pagamento');
    expect(ocupadas(e)).toBe(1);
    expect(rodar(DIA_SEGUINTE).falhas).toEqual([]);
    expect(situacao(r.id)).toBe('cancelada');
    expect(ocupadas(e)).toBe(0);
  });

  it('a segunda conexao nao repete o efeito da primeira', () => {
    const e = publicar();
    comPagamento(e, 'aprovado', 'parcelada');
    expect(contagens(executarRotina(db, DIA_SEGUINTE)).segundas_parcelas_vencidas).toBe(1);
    expect(contagens(executarRotina(outra, DIA_SEGUINTE))).toEqual(NADA);
    expect(ocupadas(e)).toBe(0);
    expect(eventos('reserva.vencimento_segunda_parcela')).toBe(1);
  });
});

describe('configuracao (ROTINA_INTERVALO_SEGUNDOS)', () => {
  const ler = (valor?: string) => loadRotinaConfig(valor === undefined ? {} : { ROTINA_INTERVALO_SEGUNDOS: valor });
  it('padrao de 60 segundos; 0 desliga; aceita de 1 a 86400', () => {
    expect(ler().intervaloMs).toBe(60_000);
    expect(ler('').intervaloMs).toBe(60_000);
    expect(ler('0').intervaloMs).toBe(0);
    expect(ler('1').intervaloMs).toBe(1000);
    expect(ler(' 86400 ').intervaloMs).toBe(86_400_000);
  });
  it.each(['86401', '-1', '1.5', '60s', 'abc', '1e3'])('recusa %s', (valor) => {
    expect(() => ler(valor)).toThrow(RotinaConfigError);
  });
});
