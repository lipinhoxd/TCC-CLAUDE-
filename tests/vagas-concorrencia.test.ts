import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HttpError } from '../server/auth/support.ts';
import { openDatabase } from '../server/db/connection.ts';
import { runMigrations } from '../server/db/migrate.ts';
import { withTransaction } from '../server/db/transaction.ts';
import { ReservaService } from '../server/reservas/service.ts';
import { disponibilidade, expirarVencidas, liberarVaga, ocuparVaga, vagasDisponiveis } from '../server/vagas/disponibilidade.ts';

/** Mecanismo de ocupar, liberar e reter vagas sob concorrencia, com duas conexoes ao mesmo arquivo (RN-021, RN-040, AGT-008). */

const AGORA = new Date('2026-12-01T12:00:00.000Z');
const ISO = AGORA.toISOString();
let dir: string;
let a: DatabaseSync;
let b: DatabaseSync;
let excursaoId: number;
let reservas: number[];

function inserirUsuario(db: DatabaseSync, n: number): number {
  return Number(
    db
      .prepare(
        "INSERT INTO usuario (nome_completo, cpf, email, data_nascimento, telefone, senha_hash, perfil, criado_em, atualizado_em) VALUES (?, ?, ?, '1990-01-01', '+5511900000000', 'x', 'passageiro', ?, ?)",
      )
      .run(`Pessoa Ficticia ${n}`, `1114447773${n}`.slice(0, 11), `pessoa${n}@exemplo.com`, ISO, ISO).lastInsertRowid,
  );
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'excursoes-vagas-'));
  const caminho = join(dir, 'vagas.sqlite');
  a = openDatabase(caminho);
  runMigrations(a);
  b = openDatabase(caminho);
  b.exec('PRAGMA busy_timeout = 0');
  excursaoId = Number(
    a
      .prepare(
        `INSERT INTO excursao (nome, local, ponto_embarque, data_inicial, data_final, partida_utc, capacidade, preco_centavos, situacao, criado_em, atualizado_em)
         VALUES ('Excursao Ficticia', 'Local', 'Ponto', '2027-01-10', '2027-01-12', '2027-01-10T08:00:00.000Z', 1, 100, 'publicada', ?, ?)`,
      )
      .run(ISO, ISO).lastInsertRowid,
  );
  reservas = [1, 2, 3].map((n) => {
    const usuario = inserirUsuario(a, n);
    return Number(
      a
        .prepare("INSERT INTO reserva (usuario_id, excursao_id, modalidade, situacao, criado_em, atualizado_em) VALUES (?, ?, 'integral', 'aguardando_pagamento', ?, ?)")
        .run(usuario, excursaoId, ISO, ISO).lastInsertRowid,
    );
  });
});

afterEach(() => {
  a.close();
  b.close();
  rmSync(dir, { recursive: true, force: true });
});

const ocupadas = (): number => Number(a.prepare('SELECT vagas_ocupadas AS v FROM excursao WHERE id = ?').get(excursaoId)?.['v']);
const reter = (db: DatabaseSync, reservaId: number, minutos = 15): number =>
  Number(
    db
      .prepare("INSERT INTO retencao_vaga (reserva_id, criado_em, expira_em, situacao) VALUES (?, ?, ?, 'ativa')")
      .run(reservaId, ISO, new Date(AGORA.getTime() + minutos * 60_000).toISOString()).lastInsertRowid,
  );

describe('funcao de disponibilidade (RF-017, RF-019)', () => {
  it('capacidade menos ocupadas menos retidas, nunca negativa', () => {
    expect(vagasDisponiveis(10, 3)).toBe(7);
    expect(vagasDisponiveis(10, 3, 4)).toBe(3);
    expect(vagasDisponiveis(10, 8, 5)).toBe(0);
    expect(vagasDisponiveis(10, 10, 0)).toBe(0);
  });

  it('conta so retencoes ativas e dentro do prazo, e permite ignorar a que esta sendo convertida', () => {
    expect(disponibilidade(a, excursaoId, AGORA)).toEqual({ capacidade: 1, ocupadas: 0, retidas: 0, livres: 1 });
    const id = reter(a, reservas[0] as number);
    expect(disponibilidade(a, excursaoId, AGORA)).toMatchObject({ retidas: 1, livres: 0 });
    expect(disponibilidade(a, excursaoId, AGORA, id)).toMatchObject({ retidas: 0, livres: 1 });
    expect(disponibilidade(a, excursaoId, new Date(AGORA.getTime() + 15 * 60_000))).toMatchObject({ retidas: 0, livres: 1 }); // expira_em == agora
    a.prepare("UPDATE retencao_vaga SET situacao = 'cancelada' WHERE id = ?").run(id);
    expect(disponibilidade(a, excursaoId, AGORA)?.retidas).toBe(0);
    expect(disponibilidade(a, 9999, AGORA)).toBeNull();
  });
});

describe('ocupar e liberar vaga (RN-021, RN-040)', () => {
  it('com a ultima vaga, so uma das conexoes consegue ocupa-la', () => {
    const resultados = [withTransaction(a, () => ocuparVaga(a, excursaoId, AGORA)), withTransaction(b, () => ocuparVaga(b, excursaoId, AGORA))];
    expect(resultados.sort()).toEqual([false, true]);
    expect(ocupadas()).toBe(1);
  });

  it('o banco continua impedindo excedente mesmo contornando o mecanismo (RNF-008)', () => {
    withTransaction(a, () => ocuparVaga(a, excursaoId, AGORA));
    expect(() => a.prepare('UPDATE excursao SET vagas_ocupadas = 2 WHERE id = ?').run(excursaoId)).toThrow(/CHECK|constraint/i);
    expect(ocupadas()).toBe(1);
  });

  it('nao ocupa a vaga retida por outra pessoa, mas ocupa a propria retencao que esta sendo convertida', () => {
    const outra = reter(a, reservas[0] as number);
    expect(withTransaction(b, () => ocuparVaga(b, excursaoId, AGORA))).toBe(false);
    expect(ocupadas()).toBe(0);
    expect(withTransaction(b, () => ocuparVaga(b, excursaoId, AGORA, outra))).toBe(true);
    expect(ocupadas()).toBe(1);
  });

  it('retencao vencida nao impede ocupar', () => {
    reter(a, reservas[0] as number, 5);
    const depois = new Date(AGORA.getTime() + 6 * 60_000);
    expect(withTransaction(a, () => ocuparVaga(a, excursaoId, depois))).toBe(true);
  });

  it('liberar nunca deixa a ocupacao abaixo de zero', () => {
    expect(withTransaction(a, () => liberarVaga(a, excursaoId))).toBe(false);
    withTransaction(a, () => ocuparVaga(a, excursaoId, AGORA));
    expect(withTransaction(a, () => liberarVaga(a, excursaoId))).toBe(true);
    expect(withTransaction(a, () => liberarVaga(a, excursaoId))).toBe(false);
    expect(ocupadas()).toBe(0);
  });

  it('as operacoes que gravam exigem transacao aberta', () => {
    expect(() => ocuparVaga(a, excursaoId, AGORA)).toThrow(/transacao/i);
    expect(() => liberarVaga(a, excursaoId)).toThrow(/transacao/i);
    expect(() => expirarVencidas(a, AGORA)).toThrow(/transacao/i);
  });

  it('uma leitura feita antes da escrita nao e atropelada: o UPDATE condicional reavalia', () => {
    const antes = disponibilidade(b, excursaoId, AGORA)?.livres;
    withTransaction(a, () => ocuparVaga(a, excursaoId, AGORA));
    expect(antes).toBe(1); // b ainda acha que ha vaga
    // a gravacao de b reavalia a condicao no banco e falha, sem excedente
    expect(withTransaction(b, () => ocuparVaga(b, excursaoId, AGORA))).toBe(false);
    expect(ocupadas()).toBe(1);
  });
});

describe('retencao entre conexoes (RN-040)', () => {
  it('com duas conexoes, o checkout da segunda enxerga a retencao gravada pela primeira', () => {
    const relogio = () => AGORA;
    const primeira = new ReservaService(a, relogio);
    const segunda = new ReservaService(b, relogio);
    const usuarios = a.prepare('SELECT usuario_id AS u FROM reserva ORDER BY id').all().map((r) => Number(r['u']));
    expect(primeira.iniciarCheckout(usuarios[0] as number, reservas[0] as number).retencao?.situacao).toBe('ativa');
    expect(() => segunda.iniciarCheckout(usuarios[1] as number, reservas[1] as number)).toThrow(HttpError);
    try {
      segunda.iniciarCheckout(usuarios[1] as number, reservas[1] as number);
    } catch (erro) {
      expect(erro).toMatchObject({ status: 409, code: 'sem_vagas' });
    }
    expect(Number(a.prepare("SELECT COUNT(*) AS n FROM retencao_vaga WHERE situacao = 'ativa'").get()?.['n'])).toBe(1);
  });

  it('enquanto uma transacao de escrita esta aberta, a outra conexao nao consegue criar retencao (503 na API)', () => {
    const segunda = new ReservaService(b, () => AGORA);
    const usuario = Number(a.prepare('SELECT usuario_id AS u FROM reserva WHERE id = ?').get(reservas[1] as number)?.['u']);
    withTransaction(a, () => {
      expect(() => segunda.iniciarCheckout(usuario, reservas[1] as number)).toThrow(/locked|busy/i);
    });
    // liberado o bloqueio, a mesma chamada passa
    expect(segunda.iniciarCheckout(usuario, reservas[1] as number).retencao?.situacao).toBe('ativa');
  });

  it('expirar vencidas e idempotente e nao mexe nas ainda validas', () => {
    reter(a, reservas[0] as number, 5);
    reter(a, reservas[1] as number, 30);
    const depois = new Date(AGORA.getTime() + 10 * 60_000);
    expect(withTransaction(a, () => expirarVencidas(a, depois))).toBe(1);
    expect(withTransaction(a, () => expirarVencidas(a, depois))).toBe(0);
    expect(a.prepare('SELECT situacao FROM retencao_vaga ORDER BY id').all().map((r) => r['situacao'])).toEqual(['expirada', 'ativa']);
    expect(Number(a.prepare("SELECT COUNT(*) AS n FROM auditoria WHERE acao = 'retencao.expirada'").get()?.['n'])).toBe(1);
  });

  it('o escopo por excursao ou reserva limita o que expira', () => {
    reter(a, reservas[0] as number, 5);
    reter(a, reservas[1] as number, 5);
    const depois = new Date(AGORA.getTime() + 10 * 60_000);
    expect(withTransaction(a, () => expirarVencidas(a, depois, { reservaId: reservas[0] as number }))).toBe(1);
    expect(withTransaction(a, () => expirarVencidas(a, depois, { excursaoId: 9999 }))).toBe(0);
    expect(withTransaction(a, () => expirarVencidas(a, depois, { excursaoId }))).toBe(1);
  });
});
