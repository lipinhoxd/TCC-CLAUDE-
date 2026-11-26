import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../server/db/connection.ts';
import { migrations } from '../server/db/migrations.ts';
import { runMigrations } from '../server/db/migrate.ts';
import { withTransaction } from '../server/db/transaction.ts';
import { listarPublicas } from '../server/excursoes/publico.ts';
import { confirmarPagamento } from '../server/pagamentos/confirmacao.ts';
import { proximaParcela } from '../server/pagamentos/parcelas.ts';
import { reservaVencida, vencerSegundasParcelas } from '../server/vagas/vencimento.ts';

/** Parcelamento sob concorrencia e atomicidade, com duas conexoes ao mesmo arquivo (RN-017 a RN-021, RN-040, AGT-010). */

const AGORA = new Date('2026-12-01T12:00:00.000Z');
const ISO = AGORA.toISOString();
// prazo: 05/12/2026 23:59:59 em Brasilia
const PRAZO_ISO = '2026-12-06T02:59:59.000Z';
const ANTES = new Date('2026-12-05T12:00:00.000Z');
const DEPOIS = new Date('2026-12-06T03:00:00.000Z');
let dir: string;
let a: DatabaseSync;
let b: DatabaseSync;
let excursaoId: number;
let reservas: number[];
let primeiras: number[];
let segundas: number[];

const ocupadas = (db: DatabaseSync = a): number => Number(db.prepare('SELECT vagas_ocupadas AS v FROM excursao WHERE id = ?').get(excursaoId)?.['v']);
const situacao = (tabela: string, id: number): unknown => a.prepare(`SELECT situacao FROM ${tabela} WHERE id = ?`).get(id)?.['situacao'];
const confirmar = (db: DatabaseSync, pagamentoId: number, agora = AGORA) => withTransaction(db, () => confirmarPagamento(db, pagamentoId, agora, null));
const vencer = (db: DatabaseSync, agora: Date, escopo: { excursaoId?: number; reservaId?: number } = {}) => withTransaction(db, () => vencerSegundasParcelas(db, agora, escopo));

function inserirPagamento(reservaId: number, parcela: string, valor: number, situacaoPagamento = 'pendente'): number {
  const confirmado = situacaoPagamento === 'confirmado' ? ISO : null;
  return Number(
    a
      .prepare('INSERT INTO pagamento (reserva_id, parcela, valor_centavos, situacao, confirmado_em, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(reservaId, parcela, valor, situacaoPagamento, confirmado, ISO, ISO).lastInsertRowid,
  );
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'excursoes-parc-'));
  const caminho = join(dir, 'parc.sqlite');
  a = openDatabase(caminho);
  runMigrations(a);
  b = openDatabase(caminho);
  b.exec('PRAGMA busy_timeout = 0');
  excursaoId = Number(
    a
      .prepare(
        `INSERT INTO excursao (nome, local, ponto_embarque, data_inicial, data_final, partida_utc, capacidade, preco_centavos, parcelamento_habilitado, prazo_segunda_parcela_utc, situacao, criado_em, atualizado_em)
         VALUES ('Excursao Ficticia', 'Local', 'Ponto', '2026-12-10', '2026-12-12', '2026-12-10T10:00:00.000Z', 2, 15001, 1, ?, 'publicada', ?, ?)`,
      )
      .run(PRAZO_ISO, ISO, ISO).lastInsertRowid,
  );
  reservas = [];
  primeiras = [];
  segundas = [];
  [1, 2].forEach((n) => {
    const usuario = Number(
      a
        .prepare(
          "INSERT INTO usuario (nome_completo, cpf, email, data_nascimento, telefone, senha_hash, perfil, criado_em, atualizado_em) VALUES (?, ?, ?, '1990-01-01', '+5511900000000', 'x', 'passageiro', ?, ?)",
        )
        .run(`Pessoa Ficticia ${n}`, `1114447773${n}`.slice(0, 11), `pessoa${n}@exemplo.com`, ISO, ISO).lastInsertRowid,
    );
    const reserva = Number(
      a
        .prepare("INSERT INTO reserva (usuario_id, excursao_id, modalidade, situacao, criado_em, atualizado_em) VALUES (?, ?, 'parcelada', 'aguardando_pagamento', ?, ?)")
        .run(usuario, excursaoId, ISO, ISO).lastInsertRowid,
    );
    reservas.push(reserva);
    primeiras.push(inserirPagamento(reserva, 'primeira', 7500));
    segundas.push(0);
  });
});

afterEach(() => {
  a.close();
  b.close();
  rmSync(dir, { recursive: true, force: true });
});

const reter = (reservaId: number): number =>
  Number(
    a
      .prepare("INSERT INTO retencao_vaga (reserva_id, criado_em, expira_em, situacao) VALUES (?, ?, ?, 'ativa')")
      .run(reservaId, ISO, new Date(AGORA.getTime() + 15 * 60_000).toISOString()).lastInsertRowid,
  );

describe('a ordem das parcelas e decidida pelo servidor', () => {
  it('integral: unica ate confirmar; parcelada: primeira, depois segunda, e nada com a primeira sinalizada', () => {
    const linha = (parcela: string, situacaoP: string, pendencia: unknown = null) => ({ parcela, situacao: situacaoP, pendencia_administrativa: pendencia });
    expect(proximaParcela('integral', [])).toBe('unica');
    expect(proximaParcela('integral', [linha('unica', 'falhou')])).toBe('unica');
    expect(proximaParcela('integral', [linha('unica', 'confirmado')])).toBeNull();
    expect(proximaParcela('parcelada', [])).toBe('primeira');
    expect(proximaParcela('parcelada', [linha('primeira', 'pendente')])).toBe('primeira');
    expect(proximaParcela('parcelada', [linha('primeira', 'falhou')])).toBe('primeira');
    expect(proximaParcela('parcelada', [linha('primeira', 'confirmado')])).toBe('segunda');
    expect(proximaParcela('parcelada', [linha('primeira', 'confirmado'), linha('segunda', 'falhou')])).toBe('segunda');
    expect(proximaParcela('parcelada', [linha('primeira', 'confirmado'), linha('segunda', 'confirmado')])).toBeNull();
    expect(proximaParcela('parcelada', [linha('primeira', 'confirmado', 'confirmacao_sem_vaga')])).toBeNull();
  });
});

describe('confirmacao da primeira parcela (RN-017)', () => {
  it('ocupa uma vaga, converte a retencao e a reserva continua aguardando a segunda parcela', () => {
    const retencao = reter(reservas[0] as number);
    expect(confirmar(a, primeiras[0] as number)).toBe('confirmado');
    expect(ocupadas()).toBe(1);
    expect(situacao('retencao_vaga', retencao)).toBe('confirmada');
    expect(situacao('pagamento', primeiras[0] as number)).toBe('confirmado');
    expect(situacao('reserva', reservas[0] as number)).toBe('aguardando_pagamento');
  });

  it('e idempotente entre conexoes e a disputa pela ultima vaga deixa uma unica ocupada', () => {
    a.prepare('UPDATE excursao SET capacidade = 1').run();
    reter(reservas[0] as number);
    expect(confirmar(a, primeiras[0] as number)).toBe('confirmado');
    expect(confirmar(b, primeiras[0] as number)).toBe('ja_confirmado');
    expect(confirmar(b, primeiras[1] as number)).toBe('confirmado_sem_vaga'); // a outra reserva nao encontra vaga
    expect(ocupadas(b)).toBe(1);
    expect(a.prepare('SELECT pendencia_administrativa AS p FROM pagamento WHERE id = ?').get(primeiras[1] as number)?.['p']).toBe('confirmacao_sem_vaga');
  });

  it('uma falha no meio desfaz tudo: pagamento, retencao e vaga ficam como estavam', () => {
    const retencao = reter(reservas[0] as number);
    a.exec("CREATE TRIGGER tg_falha BEFORE UPDATE ON retencao_vaga WHEN NEW.situacao = 'confirmada' BEGIN SELECT RAISE(ABORT, 'falha injetada'); END;");
    expect(() => confirmar(a, primeiras[0] as number)).toThrow(/falha injetada/);
    expect(ocupadas()).toBe(0);
    expect(situacao('pagamento', primeiras[0] as number)).toBe('pendente');
    expect(situacao('retencao_vaga', retencao)).toBe('ativa');
  });
});

describe('segunda parcela e quitacao (RN-018, RN-024)', () => {
  beforeEach(() => {
    reter(reservas[0] as number);
    confirmar(a, primeiras[0] as number);
    segundas[0] = inserirPagamento(reservas[0] as number, 'segunda', 7501);
  });

  it('quita no prazo: reserva pronta, sem nova vaga, idempotente entre conexoes', () => {
    expect(confirmar(a, segundas[0] as number, ANTES)).toBe('confirmado');
    expect(confirmar(b, segundas[0] as number, ANTES)).toBe('ja_confirmado');
    expect(situacao('reserva', reservas[0] as number)).toBe('pronto_para_embarque');
    expect(ocupadas()).toBe(1);
    expect(Number(a.prepare("SELECT COUNT(*) AS n FROM auditoria WHERE acao = 'reserva.pronta_para_embarque'").get()?.['n'])).toBe(1);
  });

  it('uma falha no meio da quitacao desfaz tudo', () => {
    a.exec("CREATE TRIGGER tg_falha BEFORE UPDATE ON reserva WHEN NEW.situacao = 'pronto_para_embarque' BEGIN SELECT RAISE(ABORT, 'falha injetada'); END;");
    expect(() => confirmar(a, segundas[0] as number, ANTES)).toThrow(/falha injetada/);
    expect(situacao('pagamento', segundas[0] as number)).toBe('pendente');
    expect(situacao('reserva', reservas[0] as number)).toBe('aguardando_pagamento');
    expect(ocupadas()).toBe(1);
  });

  it('sem a primeira parcela confirmada, a segunda e recusada', () => {
    const outra = inserirPagamento(reservas[1] as number, 'segunda', 7501);
    expect(() => confirmar(a, outra, ANTES)).toThrow(expect.objectContaining({ status: 409, code: 'primeira_parcela_nao_confirmada' }));
    expect(situacao('pagamento', outra)).toBe('pendente');
  });

  it('depois do prazo: o vencimento vale antes da confirmacao, que fica registrada sem vaga e a reserva continua cancelada', () => {
    expect(confirmar(b, segundas[0] as number, DEPOIS)).toBe('confirmado_sem_vaga');
    expect(ocupadas()).toBe(0);
    expect(a.prepare('SELECT situacao, motivo_cancelamento AS m FROM reserva WHERE id = ?').get(reservas[0] as number)).toEqual({ situacao: 'cancelada', m: 'inadimplencia' });
    expect(a.prepare('SELECT pendencia_administrativa AS p FROM pagamento WHERE id = ?').get(segundas[0] as number)?.['p']).toBe('confirmacao_sem_vaga');
    expect(confirmar(a, segundas[0] as number, DEPOIS)).toBe('confirmado_sem_vaga');
  });

  it('a segunda de uma reserva cancelada por outro motivo (desistencia) e recusada, sem mudar nada', () => {
    a.prepare("UPDATE reserva SET situacao = 'cancelada' WHERE id = ?").run(reservas[0] as number);
    expect(() => confirmar(a, segundas[0] as number, ANTES)).toThrow(expect.objectContaining({ status: 409, code: 'reserva_nao_pendente' }));
    expect(situacao('pagamento', segundas[0] as number)).toBe('pendente');
  });
});

describe('vencimento da segunda parcela (RN-019, RN-020)', () => {
  beforeEach(() => {
    reter(reservas[0] as number);
    confirmar(a, primeiras[0] as number);
  });

  it('libera a vaga uma unica vez, mesmo com duas conexoes tentando, e nunca deixa a ocupacao negativa', () => {
    expect(vencer(a, ANTES)).toBe(0); // antes do prazo nada vence
    expect(ocupadas()).toBe(1);
    expect(vencer(a, DEPOIS)).toBe(1);
    expect(vencer(b, DEPOIS)).toBe(0);
    expect(vencer(a, DEPOIS)).toBe(0);
    expect(ocupadas()).toBe(0);
    expect(situacao('reserva', reservas[0] as number)).toBe('cancelada');
    expect(situacao('pagamento', primeiras[0] as number)).toBe('confirmado'); // a primeira parcela continua confirmada (RN-020)
    expect(Number(a.prepare("SELECT COUNT(*) AS n FROM auditoria WHERE acao = 'reserva.vencimento_segunda_parcela'").get()?.['n'])).toBe(1);
  });

  it('o instante do prazo ja vence (mesmo criterio da AGT-007) e o anterior nao', () => {
    expect(reservaVencida(a, reservas[0] as number, new Date(new Date(PRAZO_ISO).getTime() - 1))).toBe(false);
    expect(reservaVencida(a, reservas[0] as number, new Date(PRAZO_ISO))).toBe(true);
  });

  it('nao vence reserva sem a primeira confirmada, nem a quitada, nem a integral', () => {
    expect(reservaVencida(a, reservas[1] as number, DEPOIS)).toBe(false); // a primeira dela ainda esta pendente
    const segunda = inserirPagamento(reservas[0] as number, 'segunda', 7501);
    confirmar(a, segunda, ANTES);
    expect(reservaVencida(a, reservas[0] as number, DEPOIS)).toBe(false);
    expect(vencer(a, DEPOIS)).toBe(0);
    a.prepare("UPDATE reserva SET modalidade = 'integral' WHERE id = ?").run(reservas[1] as number);
    expect(reservaVencida(a, reservas[1] as number, DEPOIS)).toBe(false);
  });

  it('o escopo por reserva ou excursao limita o vencimento e a leitura publica ja conta a vaga como livre', () => {
    reter(reservas[1] as number);
    confirmar(a, primeiras[1] as number);
    expect(ocupadas()).toBe(2);
    expect(listarPublicas(a, DEPOIS)[0]?.vagas_disponiveis).toBe(2); // as duas vagas ja contam como liberadas, nada foi gravado
    expect(ocupadas()).toBe(2);
    expect(vencer(a, DEPOIS, { reservaId: reservas[0] as number })).toBe(1);
    expect(vencer(a, DEPOIS, { excursaoId: 9999 })).toBe(0);
    expect(ocupadas()).toBe(1);
    expect(vencer(a, DEPOIS, { excursaoId })).toBe(1);
    expect(ocupadas()).toBe(0);
    expect(listarPublicas(a, DEPOIS)[0]?.vagas_disponiveis).toBe(2);
  });

  it('exige transacao aberta', () => {
    expect(() => vencerSegundasParcelas(a, DEPOIS)).toThrow(/transacao/i);
  });
});

describe('migracao 3 (motivo do cancelamento)', () => {
  it('existe, aceita so inadimplencia, nao altera reservas antigas e se aplica sobre um banco ja na versao 2', () => {
    expect(migrations.map((m) => m.version)).toEqual([1, 2, 3, 4, 5]);
    expect(a.prepare('PRAGMA table_info(reserva)').all().map((c) => c['name'])).toContain('motivo_cancelamento');
    expect(a.prepare('SELECT motivo_cancelamento AS m FROM reserva WHERE id = ?').get(reservas[0] as number)?.['m']).toBeNull();
    expect(() => a.prepare("UPDATE reserva SET motivo_cancelamento = 'qualquer' WHERE id = ?").run(reservas[0] as number)).toThrow(/CHECK|constraint/i);
    expect(() => a.prepare("UPDATE reserva SET motivo_cancelamento = 'inadimplencia' WHERE id = ?").run(reservas[0] as number)).not.toThrow();
    const antigo = openDatabase(':memory:');
    expect(runMigrations(antigo, migrations.slice(0, 2))).toEqual([1, 2]);
    expect(runMigrations(antigo)).toEqual([3, 4, 5]);
    expect(runMigrations(antigo)).toEqual([]);
    antigo.close();
  });
});
