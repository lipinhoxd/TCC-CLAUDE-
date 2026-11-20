import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AuthConfig } from '../server/auth/config.ts';
import { AuthService } from '../server/auth/service.ts';
import { MEMORY_DATABASE, openDatabase } from '../server/db/connection.ts';
import { runMigrations } from '../server/db/migrate.ts';
import { DemoError, PREFIXO_DEMO, semearDemonstracao } from '../server/excursoes/demo.ts';
import { listarPublicas } from '../server/excursoes/publico.ts';

const CONFIG: AuthConfig = {
  sessionTtlMs: 3_600_000,
  recoveryTtlMs: 600_000,
  loginMaxAttempts: 5,
  loginWindowMs: 900_000,
  cookieSecure: false,
  scrypt: { N: 1024, r: 8, p: 1 },
  recoveryOutboxPath: null,
};

const AGORA = new Date('2026-11-19T15:00:00.000Z');
let db: DatabaseSync;

beforeEach(() => {
  db = openDatabase(MEMORY_DATABASE);
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

async function criarAdmin(): Promise<void> {
  const auth = new AuthService({ db, config: CONFIG, outbox: () => undefined, now: () => AGORA });
  await auth.createAdministrator({
    nome_completo: 'Ana Admin Ficticia',
    cpf: '529.982.247-25',
    data_nascimento: '1990-05-20',
    telefone: '(11) 98765-4321',
    email: 'ana.admin@exemplo.com',
    senha: 'Boa-senha-2026',
  });
}

describe('dados de demonstracao (AGT-006)', () => {
  it('exige o administrador antes', () => {
    expect(() => semearDemonstracao(db, AGORA)).toThrow(DemoError);
    expect(Number(db.prepare('SELECT COUNT(*) AS n FROM excursao').get()?.['n'])).toBe(0);
  });

  it('cria seis excursoes ficticias, identificadas, das quais quatro aparecem ao publico', async () => {
    await criarAdmin();
    expect(semearDemonstracao(db, AGORA)).toEqual({ criadas: 6, jaExistia: false });
    const nomes = db.prepare('SELECT nome FROM excursao').all().map((r) => String(r['nome']));
    expect(nomes).toHaveLength(6);
    expect(nomes.every((n) => n.startsWith(PREFIXO_DEMO))).toBe(true);
    const publicas = listarPublicas(db, AGORA);
    expect(publicas).toHaveLength(4);
    const esgotada = publicas.find((e) => e.nome.includes('Cidade Historica'));
    expect(esgotada?.vagas_disponiveis).toBe(0);
    expect(publicas.find((e) => e.nome.includes('Cachoeira'))?.vagas_disponiveis).toBe(2);
    expect(publicas.find((e) => e.nome.includes('Praia'))?.imagem_ref).toBeNull();
    expect(publicas.find((e) => e.nome.includes('Serra'))?.parcelamento_habilitado).toBe(true);
  });

  it('as datas ficam no futuro, em ordem, e os rascunhos e encerradas nao aparecem', async () => {
    await criarAdmin();
    semearDemonstracao(db, AGORA);
    const publicas = listarPublicas(db, AGORA);
    const inicios = publicas.map((e) => e.data_inicial);
    expect(inicios).toEqual([...inicios].sort());
    expect(inicios.every((d) => d > '2026-11-19')).toBe(true);
    const situacoes = db.prepare('SELECT situacao FROM excursao ORDER BY id').all().map((r) => String(r['situacao']));
    expect(situacoes).toEqual(['publicada', 'publicada', 'publicada', 'publicada', 'rascunho', 'encerrada']);
  });

  it('pode rodar de novo sem duplicar nem alterar nada', async () => {
    await criarAdmin();
    semearDemonstracao(db, AGORA);
    const antes = JSON.stringify(db.prepare('SELECT * FROM excursao ORDER BY id').all());
    expect(semearDemonstracao(db, AGORA)).toEqual({ criadas: 0, jaExistia: true });
    expect(JSON.stringify(db.prepare('SELECT * FROM excursao ORDER BY id').all())).toBe(antes);
  });

  it('nao toca em usuarios, reservas nem pagamentos, e a auditoria so recebe eventos de excursao', async () => {
    await criarAdmin();
    const usuarios = JSON.stringify(db.prepare('SELECT id, perfil FROM usuario').all());
    semearDemonstracao(db, AGORA);
    expect(JSON.stringify(db.prepare('SELECT id, perfil FROM usuario').all())).toBe(usuarios);
    for (const tabela of ['reserva', 'pagamento', 'retencao_vaga', 'reembolso']) {
      expect(Number(db.prepare(`SELECT COUNT(*) AS n FROM ${tabela}`).get()?.['n']), tabela).toBe(0);
    }
    const entidades = db.prepare("SELECT DISTINCT entidade FROM auditoria WHERE acao LIKE 'excursao.%'").all().map((r) => String(r['entidade']));
    expect(entidades).toEqual(['excursao']);
  });
});
