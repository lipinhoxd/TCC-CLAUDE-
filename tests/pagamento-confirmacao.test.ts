import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HttpError } from '../server/auth/support.ts';
import { openDatabase } from '../server/db/connection.ts';
import { migrations } from '../server/db/migrations.ts';
import { runMigrations } from '../server/db/migrate.ts';
import { withTransaction } from '../server/db/transaction.ts';
import { confirmarPagamento, recusarPagamento } from '../server/pagamentos/confirmacao.ts';

/** Confirmacao financeira sob concorrencia e atomicidade, com duas conexoes ao mesmo arquivo (RN-016, RN-021, RN-022, RN-040, AGT-009). */

const AGORA = new Date('2026-12-01T12:00:00.000Z');
const ISO = AGORA.toISOString();
let dir: string;
let a: DatabaseSync;
let b: DatabaseSync;
let excursaoId: number;
let reservas: number[];
let pagamentos: number[];
let retencoes: number[];

const ocupadas = (db: DatabaseSync = a): number => Number(db.prepare('SELECT vagas_ocupadas AS v FROM excursao WHERE id = ?').get(excursaoId)?.['v']);
const situacao = (tabela: string, id: number): unknown => a.prepare(`SELECT situacao FROM ${tabela} WHERE id = ?`).get(id)?.['situacao'];
const confirmar = (db: DatabaseSync, i: number, agora = AGORA) => withTransaction(db, () => confirmarPagamento(db, pagamentos[i] as number, agora, null));

function preparar(capacidade: number, comRetencao: boolean[]): void {
  a.prepare('UPDATE excursao SET capacidade = ?').run(capacidade);
  comRetencao.forEach((tem, i) => {
    if (tem) {
      retencoes[i] = Number(
        a
          .prepare("INSERT INTO retencao_vaga (reserva_id, criado_em, expira_em, situacao) VALUES (?, ?, ?, 'ativa')")
          .run(reservas[i] as number, ISO, new Date(AGORA.getTime() + 15 * 60_000).toISOString()).lastInsertRowid,
      );
    }
  });
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'excursoes-pag-'));
  const caminho = join(dir, 'pag.sqlite');
  a = openDatabase(caminho);
  runMigrations(a);
  b = openDatabase(caminho);
  b.exec('PRAGMA busy_timeout = 0');
  excursaoId = Number(
    a
      .prepare(
        `INSERT INTO excursao (nome, local, ponto_embarque, data_inicial, data_final, partida_utc, capacidade, preco_centavos, situacao, criado_em, atualizado_em)
         VALUES ('Excursao Ficticia', 'Local', 'Ponto', '2027-01-10', '2027-01-12', '2027-01-10T08:00:00.000Z', 1, 15000, 'publicada', ?, ?)`,
      )
      .run(ISO, ISO).lastInsertRowid,
  );
  reservas = [];
  pagamentos = [];
  retencoes = [];
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
        .prepare("INSERT INTO reserva (usuario_id, excursao_id, modalidade, situacao, criado_em, atualizado_em) VALUES (?, ?, 'integral', 'aguardando_pagamento', ?, ?)")
        .run(usuario, excursaoId, ISO, ISO).lastInsertRowid,
    );
    reservas.push(reserva);
    pagamentos.push(
      Number(
        a
          .prepare("INSERT INTO pagamento (reserva_id, parcela, valor_centavos, situacao, criado_em, atualizado_em) VALUES (?, 'unica', 15000, 'pendente', ?, ?)")
          .run(reserva, ISO, ISO).lastInsertRowid,
      ),
    );
  });
});

afterEach(() => {
  a.close();
  b.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('confirmacao com retencao ativa (RN-016)', () => {
  it('converte a retencao, ocupa uma vaga e deixa a reserva pronta para embarque', () => {
    preparar(1, [true, false]);
    expect(confirmar(a, 0)).toBe('confirmado');
    expect(ocupadas()).toBe(1);
    expect(situacao('retencao_vaga', retencoes[0] as number)).toBe('confirmada');
    expect(situacao('pagamento', pagamentos[0] as number)).toBe('confirmado');
    expect(situacao('reserva', reservas[0] as number)).toBe('pronto_para_embarque');
    expect(a.prepare('SELECT confirmado_em AS c FROM pagamento WHERE id = ?').get(pagamentos[0] as number)?.['c']).toBe(ISO);
  });

  it('e idempotente entre conexoes: a segunda confirmacao nao ocupa outra vaga', () => {
    preparar(2, [true, false]);
    expect(confirmar(a, 0)).toBe('confirmado');
    expect(confirmar(b, 0)).toBe('ja_confirmado');
    expect(ocupadas(b)).toBe(1);
    expect(Number(a.prepare("SELECT COUNT(*) AS n FROM auditoria WHERE acao = 'pagamento.confirmado'").get()?.['n'])).toBe(1);
  });

  it('com a ultima vaga e duas reservas, so uma ocupa; a outra fica sinalizada, sem vaga adicional (RN-021, RN-022)', () => {
    preparar(1, [true, false]); // a reserva 0 tem a retencao; a 1 pagou sem retencao
    expect(confirmar(b, 1)).toBe('confirmado_sem_vaga'); // a vaga esta retida pela reserva 0
    expect(ocupadas()).toBe(0);
    expect(confirmar(a, 0)).toBe('confirmado'); // a dona da retencao ainda ocupa a vaga
    expect(ocupadas()).toBe(1);
    expect(a.prepare('SELECT pendencia_administrativa AS p FROM pagamento WHERE id = ?').get(pagamentos[1] as number)?.['p']).toBe('confirmacao_sem_vaga');
    expect(situacao('reserva', reservas[1] as number)).toBe('aguardando_pagamento');
    expect(situacao('pagamento', pagamentos[1] as number)).toBe('confirmado');
  });

  it('na ordem inversa o resultado e o mesmo: quem ocupa primeiro fica com a vaga', () => {
    preparar(1, [false, false]);
    expect(confirmar(a, 0)).toBe('confirmado');
    expect(confirmar(b, 1)).toBe('confirmado_sem_vaga');
    expect(ocupadas()).toBe(1);
    expect(Number(a.prepare('SELECT COUNT(*) AS n FROM pagamento WHERE pendencia_administrativa IS NOT NULL').get()?.['n'])).toBe(1);
  });
});

describe('confirmacao depois da expiracao (RN-022, RF-026)', () => {
  it('retencao vencida com vaga livre: ocupa normalmente e marca a retencao como expirada', () => {
    preparar(1, [true, false]);
    const depois = new Date(AGORA.getTime() + 16 * 60_000);
    expect(confirmar(a, 0, depois)).toBe('confirmado');
    expect(ocupadas()).toBe(1);
    expect(situacao('retencao_vaga', retencoes[0] as number)).toBe('expirada');
    expect(situacao('reserva', reservas[0] as number)).toBe('pronto_para_embarque');
  });

  it('retencao vencida sem vaga livre: pagamento sinalizado, reserva aguardando, ocupacao inalterada', () => {
    preparar(1, [true, false]);
    a.prepare('UPDATE excursao SET vagas_ocupadas = 1').run(); // outra pessoa ocupou a vaga
    const depois = new Date(AGORA.getTime() + 16 * 60_000);
    expect(confirmar(b, 0, depois)).toBe('confirmado_sem_vaga');
    expect(ocupadas()).toBe(1);
    expect(situacao('reserva', reservas[0] as number)).toBe('aguardando_pagamento');
    expect(Number(a.prepare("SELECT COUNT(*) AS n FROM auditoria WHERE acao = 'pagamento.confirmado_sem_vaga'").get()?.['n'])).toBe(1);
  });
});

describe('atomicidade (RNF-009)', () => {
  it('uma falha no meio da confirmacao desfaz tudo: pagamento, retencao, vaga e reserva ficam como estavam', () => {
    preparar(1, [true, false]);
    // falha injetada no ultimo passo: ao marcar a reserva como pronta
    a.exec("CREATE TRIGGER tg_falha_injetada BEFORE UPDATE ON reserva WHEN NEW.situacao = 'pronto_para_embarque' BEGIN SELECT RAISE(ABORT, 'falha injetada'); END;");
    expect(() => confirmar(a, 0)).toThrow(/falha injetada/);
    expect(ocupadas()).toBe(0);
    expect(situacao('pagamento', pagamentos[0] as number)).toBe('pendente');
    expect(situacao('retencao_vaga', retencoes[0] as number)).toBe('ativa');
    expect(situacao('reserva', reservas[0] as number)).toBe('aguardando_pagamento');
    expect(Number(a.prepare("SELECT COUNT(*) AS n FROM auditoria WHERE acao LIKE 'pagamento.%' OR acao LIKE 'retencao.%'").get()?.['n'])).toBe(0);
    // sem a falha, a mesma confirmacao passa
    a.exec('DROP TRIGGER tg_falha_injetada');
    expect(confirmar(a, 0)).toBe('confirmado');
    expect(ocupadas()).toBe(1);
  });

  it('enquanto outra transacao de escrita esta aberta, a confirmacao da segunda conexao nao grava nada', () => {
    preparar(1, [true, false]);
    withTransaction(a, () => {
      expect(() => confirmar(b, 0)).toThrow(/locked|busy/i);
    });
    expect(situacao('pagamento', pagamentos[0] as number)).toBe('pendente');
    expect(ocupadas()).toBe(0);
    expect(confirmar(b, 0)).toBe('confirmado');
  });

  it('as funcoes exigem transacao aberta', () => {
    expect(() => confirmarPagamento(a, pagamentos[0] as number, AGORA, null)).toThrow(/transacao/i);
    expect(() => recusarPagamento(a, pagamentos[0] as number, AGORA, null)).toThrow(/transacao/i);
  });
});

describe('estados inesperados', () => {
  it('pagamento inexistente, ja recusado ou de reserva que nao aguarda sao recusados sem mudar nada', () => {
    preparar(1, [true, false]);
    expect(confirmar(a, 0)).toBe('confirmado'); // a reserva 0 ocupa a vaga normalmente
    expect(() => withTransaction(a, () => confirmarPagamento(a, 9999, AGORA, null))).toThrow(HttpError); // pagamento inexistente
    // o pagamento 1 e recusado e depois nao pode ser confirmado
    expect(withTransaction(a, () => recusarPagamento(a, pagamentos[1] as number, AGORA, null))).toBe('recusado');
    expect(() => confirmar(a, 1)).toThrow(expect.objectContaining({ status: 409, code: 'pagamento_nao_pendente' }));
    a.prepare("UPDATE reserva SET situacao = 'cancelada' WHERE id = ?").run(reservas[1] as number);
    a.prepare("UPDATE pagamento SET situacao = 'pendente' WHERE id = ?").run(pagamentos[1] as number);
    expect(() => confirmar(a, 1)).toThrow(expect.objectContaining({ status: 409, code: 'reserva_nao_pendente' }));
    expect(situacao('pagamento', pagamentos[1] as number)).toBe('pendente');
    expect(ocupadas()).toBe(1);
  });

  it('recusar um pagamento confirmado e conflito', () => {
    preparar(1, [true, false]);
    confirmar(a, 0);
    expect(() => withTransaction(a, () => recusarPagamento(a, pagamentos[0] as number, AGORA, null))).toThrow(expect.objectContaining({ status: 409, code: 'pagamento_ja_confirmado' }));
    expect(situacao('pagamento', pagamentos[0] as number)).toBe('confirmado');
  });
});

describe('migracao 2 (coluna da pendencia administrativa)', () => {
  it('existe, aceita so o valor previsto, tem indice e nao altera pagamentos antigos', () => {
    expect(migrations.map((m) => m.version)).toEqual([1, 2]);
    const colunas = a.prepare('PRAGMA table_info(pagamento)').all().map((c) => c['name']);
    expect(colunas).toContain('pendencia_administrativa');
    expect(a.prepare('SELECT pendencia_administrativa AS p FROM pagamento WHERE id = ?').get(pagamentos[0] as number)?.['p']).toBeNull();
    expect(() => a.prepare("UPDATE pagamento SET pendencia_administrativa = 'qualquer' WHERE id = ?").run(pagamentos[0] as number)).toThrow(/CHECK|constraint/i);
    expect(() => a.prepare("UPDATE pagamento SET pendencia_administrativa = 'confirmacao_sem_vaga' WHERE id = ?").run(pagamentos[0] as number)).not.toThrow();
    const indices = a.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'pagamento'").all().map((i) => i['name']);
    expect(indices).toContain('ix_pagamento_pendencia');
  });

  it('a migracao 1 nao foi editada e as duas se aplicam em ordem sobre um banco novo e sobre um banco ja na versao 1', () => {
    const novo = openDatabase(':memory:');
    expect(runMigrations(novo)).toEqual([1, 2]);
    expect(runMigrations(novo)).toEqual([]);
    const antigo = openDatabase(':memory:');
    expect(runMigrations(antigo, migrations.slice(0, 1))).toEqual([1]);
    antigo
      .prepare("INSERT INTO usuario (nome_completo, cpf, email, data_nascimento, telefone, senha_hash, perfil, criado_em, atualizado_em) VALUES ('P', '11144477735', 'p@exemplo.com', '1990-01-01', '+5511900000000', 'x', 'passageiro', ?, ?)")
      .run(ISO, ISO);
    expect(runMigrations(antigo)).toEqual([2]);
    expect(Number(antigo.prepare('SELECT COUNT(*) AS n FROM usuario').get()?.['n'])).toBe(1);
    novo.close();
    antigo.close();
  });
});
