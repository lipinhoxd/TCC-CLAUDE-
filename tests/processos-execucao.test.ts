import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../server/db/connection.ts';
import { runMigrations } from '../server/db/migrate.ts';

/**
 * Processos reais (AGT-014): o comando `npm run rotina`, duas execucoes simultaneas e a rotina ligada pela inicializacao da API.
 * Os processos usam o relogio real, entao os dados ficticios tem datas no passado, gravados direto no banco.
 */

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const CLI = join(RAIZ, 'server', 'processos', 'rotina-cli.ts');
const VENCIDAS = 120;
const ISO = '2019-11-01T12:00:00.000Z';

let dir: string;
let caminho: string;
let db: DatabaseSync;

function semear(): void {
  const excursao = Number(
    db
      .prepare(
        `INSERT INTO excursao (nome, local, ponto_embarque, data_inicial, data_final, partida_utc, capacidade, vagas_ocupadas, preco_centavos, parcelamento_habilitado, prazo_segunda_parcela_utc, situacao, criado_em, atualizado_em)
         VALUES ('Excursao Ficticia', 'Local', 'Ponto', '2020-01-10', '2020-01-12', '2020-01-10T08:00:00.000Z', 200, ?, 100, 1, '2020-01-06T02:59:59.000Z', 'publicada', ?, ?)`,
      )
      .run(VENCIDAS, ISO, ISO).lastInsertRowid,
  );
  db.exec('BEGIN');
  for (let n = 1; n <= VENCIDAS; n += 1) {
    const usuario = Number(
      db
        .prepare(
          "INSERT INTO usuario (nome_completo, cpf, email, data_nascimento, telefone, senha_hash, perfil, criado_em, atualizado_em) VALUES (?, ?, ?, '1990-01-01', '+5511900000000', 'x', 'passageiro', ?, ?)",
        )
        .run(`Pessoa Ficticia ${n}`, String(10_000_000_000 + n), `pessoa${n}@exemplo.com`, ISO, ISO).lastInsertRowid,
    );
    const reserva = Number(
      db
        .prepare("INSERT INTO reserva (usuario_id, excursao_id, modalidade, situacao, criado_em, atualizado_em) VALUES (?, ?, 'parcelada', 'aguardando_pagamento', ?, ?)")
        .run(usuario, excursao, ISO, ISO).lastInsertRowid,
    );
    db.prepare("INSERT INTO pagamento (reserva_id, parcela, valor_centavos, situacao, confirmado_em, criado_em, atualizado_em) VALUES (?, 'primeira', 50, 'confirmado', ?, ?, ?)").run(reserva, ISO, ISO, ISO);
  }
  db.exec('COMMIT');
}

interface Saida {
  codigo: number | null;
  texto: string;
}
function executar(argumentos: string[], env: Record<string, string>): Promise<Saida> {
  return new Promise((resolve, reject) => {
    const filho = spawn(process.execPath, argumentos, { cwd: RAIZ, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
    let texto = '';
    filho.stdout.on('data', (d: Buffer) => (texto += d.toString('utf8')));
    filho.stderr.on('data', (d: Buffer) => (texto += d.toString('utf8')));
    filho.on('error', reject);
    filho.on('close', (codigo) => resolve({ codigo, texto }));
  });
}
const numero = (sql: string): number => Number(db.prepare(sql).get()?.['n']);
const vencidasNaSaida = (s: Saida): number => Number(/segundas parcelas vencidas: ([0-9]+)/.exec(s.texto)?.[1]);

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'excursoes-cli-'));
  caminho = join(dir, 'rotina.sqlite');
  db = openDatabase(caminho);
  runMigrations(db);
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('comando de execucao avulsa e processos simultaneos', () => {
  it('dois comandos ao mesmo tempo liberam cada vaga uma unica vez', async () => {
    semear();
    // O teste segura o bloqueio de escrita ate os dois processos estarem esperando por ele: assim eles disputam de fato a gravacao.
    db.exec('BEGIN IMMEDIATE');
    let terminados = 0;
    const processos = [1, 2].map(() => executar([CLI], { DATABASE_PATH: caminho }).finally(() => (terminados += 1)));
    await new Promise((resolve) => setTimeout(resolve, 2000));
    expect(terminados).toBe(0);
    db.exec('COMMIT');
    const saidas = await Promise.all(processos);
    expect(saidas.map((s) => s.codigo)).toEqual([0, 0]);
    expect(saidas.map(vencidasNaSaida).sort((a, b) => a - b)).toEqual([0, VENCIDAS]);
    expect(numero('SELECT vagas_ocupadas AS n FROM excursao')).toBe(0);
    expect(numero("SELECT COUNT(*) AS n FROM reserva WHERE situacao = 'cancelada' AND motivo_cancelamento = 'inadimplencia'")).toBe(VENCIDAS);
    expect(numero("SELECT COUNT(*) AS n FROM auditoria WHERE acao = 'reserva.vencimento_segunda_parcela'")).toBe(VENCIDAS);
    expect(saidas.map((s) => s.texto).join('')).not.toMatch(/@|Pessoa/);
  }, 30_000);

  it('sai com codigo 1 e mensagem sem caminho quando nao consegue abrir o banco', async () => {
    const saida = await executar([CLI], { DATABASE_PATH: dir });
    expect(saida.codigo).toBe(1);
    expect(saida.texto).toContain('Nao foi possivel executar a rotina automatica');
    expect(saida.texto).not.toContain('excursoes-cli-');
  }, 30_000);
});

describe('rotina ligada pela inicializacao da API', () => {
  const principal = pathToFileURL(join(RAIZ, 'server', 'main.ts')).href;
  /** Sobe a API real, espera e emite o sinal de encerramento dentro do proprio processo (no Windows nao ha como envia-lo de fora). */
  const subir = (env: Record<string, string>) =>
    executar(['--input-type=module', '-e', `await import(${JSON.stringify(principal)}); setTimeout(() => process.emit('SIGINT'), 1500);`], {
      DATABASE_PATH: caminho,
      PORT: '0',
      ...env,
    });

  it('grava sem nenhuma requisicao e encerra de forma controlada', async () => {
    semear();
    const saida = await subir({ ROTINA_INTERVALO_SEGUNDOS: '1' });
    expect(saida.codigo).toBe(0);
    expect(saida.texto).toContain(`segundas parcelas vencidas: ${VENCIDAS}`);
    expect(saida.texto).not.toMatch(/falha/);
    expect(numero('SELECT vagas_ocupadas AS n FROM excursao')).toBe(0);
  }, 30_000);

  it('com intervalo 0 a API sobe sem executar a rotina', async () => {
    semear();
    const saida = await subir({ ROTINA_INTERVALO_SEGUNDOS: '0' });
    expect(saida.codigo).toBe(0);
    expect(saida.texto).toContain('desligada');
    expect(numero('SELECT vagas_ocupadas AS n FROM excursao')).toBe(VENCIDAS);
  }, 30_000);

  it('configuracao invalida impede a subida', async () => {
    const saida = await subir({ ROTINA_INTERVALO_SEGUNDOS: 'x' });
    expect(saida.codigo).not.toBe(0);
    expect(saida.texto).toContain('ROTINA_INTERVALO_SEGUNDOS invalida');
  }, 30_000);
});
