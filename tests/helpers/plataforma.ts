import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { DatabaseSync } from 'node:sqlite';
import { expect } from 'vitest';
import { AdminService } from '../../server/admin/service.ts';
import { createApp } from '../../server/app.ts';
import type { AuthConfig } from '../../server/auth/config.ts';
import { AuthService } from '../../server/auth/service.ts';
import type { RecoveryMessage } from '../../server/auth/support.ts';
import { CancelamentoService } from '../../server/cancelamentos/service.ts';
import { passosDaRotina } from '../../server/comunicacao/passos.ts';
import type { EmailASair } from '../../server/comunicacao/provedor.ts';
import { AvisoService } from '../../server/comunicacao/service.ts';
import { MEMORY_DATABASE, openDatabase } from '../../server/db/connection.ts';
import { runMigrations } from '../../server/db/migrate.ts';
import { ExcursaoService } from '../../server/excursoes/service.ts';
import { provedorSimulado } from '../../server/pagamentos/provedor.ts';
import { PagamentoService } from '../../server/pagamentos/service.ts';
import { executarRotina } from '../../server/processos/rotina.ts';
import { ReservaService } from '../../server/reservas/service.ts';

/**
 * Plataforma completa para os testes integrados (AGT-017): a aplicacao com todos os servicos, atendendo por HTTP, mais a rotina
 * automatica, com relogio controlado e dados ficticios.
 */

export const INICIO = new Date('2026-11-13T12:00:00.000Z');
export const MIN = 60_000;
export const DIA = 86_400_000;
/** Excursao padrao: partida em 10/12/2026 07:00 (Brasilia), fim em 12/12, prazo da segunda parcela em 05/12. */
export const PARTIDA = new Date('2026-12-10T10:00:00.000Z');
export const PRAZO = new Date('2026-12-06T02:59:59.000Z');
export const DIA_SEGUINTE_AO_FIM = new Date('2026-12-13T03:00:00.000Z');
export const SENHA = 'Boa-senha-2026';

export const EXCURSAO = {
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

const CONFIG: AuthConfig = {
  sessionTtlMs: 8 * 3_600_000,
  recoveryTtlMs: 30 * MIN,
  loginMaxAttempts: 500,
  loginWindowMs: 15 * MIN,
  cookieSecure: false,
  scrypt: { N: 1024, r: 8, p: 1 },
  recoveryOutboxPath: null,
};

export interface Resposta {
  status: number;
  json: Record<string, unknown>;
  texto: string;
  cookie: string;
}

export interface Pessoa {
  id: number;
  email: string;
  cpf: string;
  cookie: string;
  chamar: (metodo: string, caminho: string, corpo?: unknown) => Promise<Resposta>;
}

/** CPF ficticio com digitos verificadores validos, a partir de um numero sequencial. */
export function cpfFicticio(n: number): string {
  const digitos = [...String(100_000_000 + n)].map(Number);
  for (const tamanho of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i += 1) soma += (digitos[i] ?? 0) * (tamanho + 1 - i);
    digitos.push(((soma * 10) % 11) % 10);
  }
  return digitos.join('');
}

export async function criarPlataforma(banco?: DatabaseSync) {
  const db = banco ?? openDatabase(MEMORY_DATABASE);
  runMigrations(db);
  /** Relogio do negocio (reservas, pagamentos, rotina...). O da sessao e separado, para o login nao vencer quando o teste avanca semanas. */
  const relogio = { agora: INICIO, sessao: INICIO };
  const agora = () => relogio.agora;
  const recuperacoes: RecoveryMessage[] = [];
  const emails: EmailASair[] = [];
  const auth = new AuthService({ db, config: CONFIG, outbox: (m) => void recuperacoes.push(m), now: () => relogio.sessao });
  const reservas = new ReservaService(db, agora, 15 * MIN, provedorSimulado);
  const server: Server = createApp({
    auth: { service: auth, config: CONFIG },
    excursoes: new ExcursaoService(db, agora),
    reservas,
    pagamentos: new PagamentoService(db, reservas, provedorSimulado, agora),
    admin: new AdminService(db, agora),
    cancelamentos: new CancelamentoService(db, reservas, provedorSimulado, agora),
    avisos: new AvisoService(db),
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  async function chamar(metodo: string, caminho: string, corpo?: unknown, cookie?: string): Promise<Resposta> {
    const headers: Record<string, string> = {};
    if (corpo !== undefined) headers['Content-Type'] = 'application/json';
    if (cookie !== undefined) headers['Cookie'] = cookie;
    const res = await fetch(`${base}${caminho}`, { method: metodo, headers, ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }) });
    const texto = await res.text();
    return {
      status: res.status,
      texto,
      json: (texto === '' ? {} : JSON.parse(texto)) as Record<string, unknown>,
      cookie: (res.headers.get('set-cookie') ?? '').split(';')[0] ?? '',
    };
  }

  const pessoa = (id: number, email: string, cpf: string, cookie: string): Pessoa => ({ id, email, cpf, cookie, chamar: (m, c, corpo) => chamar(m, c, corpo, cookie) });

  let sequencia = 0;
  const dadosDeCadastro = (extra: Record<string, unknown> = {}) => {
    sequencia += 1;
    return {
      nome_completo: 'Joana Passageira Ficticia',
      cpf: cpfFicticio(sequencia),
      data_nascimento: '1990-05-20',
      telefone: '(11) 98765-4321',
      email: `pessoa${sequencia}@exemplo.com`,
      senha: SENHA,
      ...extra,
    };
  };

  async function entrar(email: string, senha = SENHA): Promise<Resposta> {
    return chamar('POST', '/api/auth/login', { email, senha });
  }

  /** Visitante que se cadastra e entra, tudo pela API. */
  async function passageiro(): Promise<Pessoa> {
    const dados = dadosDeCadastro();
    const r = await chamar('POST', '/api/auth/register', dados);
    expect(r.status).toBe(201);
    const login = await entrar(dados.email);
    expect(login.status).toBe(200);
    return pessoa(Number((r.json['usuario'] as Record<string, unknown>)['id']), dados.email, dados.cpf, login.cookie);
  }

  const dadosAdmin = dadosDeCadastro({ nome_completo: 'Adriana Admin Ficticia', email: 'admin.ficticio@exemplo.com' });
  const criado = await auth.createAdministrator(dadosAdmin);
  const admin = pessoa(criado.id, dadosAdmin.email, dadosAdmin.cpf, (await entrar(dadosAdmin.email)).cookie);

  const excursaoDe = (r: Resposta) => r.json['excursao'] as Record<string, unknown>;
  const reservaDe = (r: Resposta) => r.json['reserva'] as Record<string, unknown>;

  /** O administrador cadastra e publica. */
  async function publicar(extra: Record<string, unknown> = {}): Promise<number> {
    const nova = await admin.chamar('POST', '/api/admin/excursoes', { ...EXCURSAO, ...extra });
    expect(nova.status, nova.texto).toBe(201);
    const id = Number(excursaoDe(nova)['id']);
    expect((await admin.chamar('POST', `/api/admin/excursoes/${id}/situacao`, { situacao: 'publicada' })).status).toBe(200);
    return id;
  }

  async function reservar(quem: Pessoa, excursaoId: number, modalidade?: 'integral' | 'parcelada'): Promise<number> {
    const r = await quem.chamar('POST', '/api/reservas', { excursao_id: excursaoId, ...(modalidade === undefined ? {} : { modalidade }) });
    expect(r.status, r.texto).toBe(201);
    return Number(reservaDe(r)['id']);
  }
  const checkout = (quem: Pessoa, id: number) => quem.chamar('POST', `/api/reservas/${id}/checkout`);
  const iniciarPagamento = (quem: Pessoa, id: number) => quem.chamar('POST', `/api/reservas/${id}/pagamento`);
  const simular = (quem: Pessoa, id: number, resultado: 'aprovado' | 'recusado' = 'aprovado') => quem.chamar('POST', `/api/reservas/${id}/pagamento/simulacao`, { resultado });
  async function pagar(quem: Pessoa, id: number): Promise<void> {
    expect((await iniciarPagamento(quem, id)).status).toBe(200);
    expect((await simular(quem, id)).status).toBe(200);
  }
  /** Reserva, checkout e pagamento aprovado (integral) ou primeira parcela (parcelada). */
  async function reservaPaga(quem: Pessoa, excursaoId: number, modalidade: 'integral' | 'parcelada' = 'integral'): Promise<number> {
    const id = await reservar(quem, excursaoId, modalidade);
    expect((await checkout(quem, id)).status).toBe(200);
    await pagar(quem, id);
    return id;
  }
  const cancelar = async (quem: Pessoa, id: number): Promise<Resposta> => {
    const previa = await quem.chamar('GET', `/api/reservas/${id}/cancelamento`);
    const percentual = (previa.json['previa'] as Record<string, unknown> | undefined)?.['percentual'];
    return quem.chamar('POST', `/api/reservas/${id}/cancelamento`, { percentual_previsto: percentual });
  };

  const rotina = () => {
    const resultado = executarRotina(
      db,
      relogio.agora,
      passosDaRotina({ nome: 'teste', enviar: (m) => void emails.push(m) }),
    );
    expect(resultado.falhas).toEqual([]);
    return resultado;
  };

  const linha = (sql: string, ...p: Array<string | number>) => db.prepare(sql).get(...p);
  const numero = (sql: string, ...p: Array<string | number>): number => Number(linha(sql, ...p)?.['n']);
  const situacao = (reservaId: number): string => String(linha('SELECT situacao FROM reserva WHERE id = ?', reservaId)?.['situacao']);
  const ocupadas = (excursaoId: number): number => numero('SELECT vagas_ocupadas AS n FROM excursao WHERE id = ?', excursaoId);
  const eventos = (acao: string): number => numero('SELECT COUNT(*) AS n FROM auditoria WHERE acao = ?', acao);

  /** Invariantes que valem ao fim de qualquer cenario (AGT-017). */
  function invariantes(): void {
    // Ocupacao entre zero e a capacidade e igual as reservas que de fato ocupam vaga.
    const excursoes = db
      .prepare(
        `SELECT e.id, e.capacidade, e.vagas_ocupadas,
                (SELECT COUNT(*) FROM reserva r WHERE r.excursao_id = e.id AND r.situacao <> 'cancelada' AND EXISTS
                  (SELECT 1 FROM pagamento p WHERE p.reserva_id = r.id AND p.parcela IN ('unica', 'primeira') AND p.situacao = 'confirmado' AND p.pendencia_administrativa IS NULL)) AS ocupantes
         FROM excursao e`,
      )
      .all();
    for (const e of excursoes) {
      expect(Number(e['vagas_ocupadas']), `excursao ${String(e['id'])}`).toBeGreaterThanOrEqual(0);
      expect(Number(e['vagas_ocupadas']), `excursao ${String(e['id'])}`).toBeLessThanOrEqual(Number(e['capacidade']));
      expect(Number(e['vagas_ocupadas']), `excursao ${String(e['id'])}`).toBe(Number(e['ocupantes']));
    }
    // Uma reserva nao cancelada por passageiro e excursao.
    expect(numero("SELECT COUNT(*) AS n FROM (SELECT 1 FROM reserva WHERE situacao <> 'cancelada' GROUP BY usuario_id, excursao_id HAVING COUNT(*) > 1)")).toBe(0);
    // Nenhum reembolso acima do pago.
    expect(
      numero(
        `SELECT COUNT(*) AS n FROM reserva r WHERE
           (SELECT COALESCE(SUM(valor_centavos), 0) FROM reembolso x WHERE x.reserva_id = r.id) >
           (SELECT COALESCE(SUM(valor_centavos), 0) FROM pagamento p WHERE p.reserva_id = r.id AND p.situacao IN ('confirmado', 'estornado'))`,
      ),
    ).toBe(0);
    // Auditoria somente de inclusao e sem dados sensiveis.
    expect(() => db.exec('DELETE FROM auditoria')).toThrow();
    const auditoria = JSON.stringify(db.prepare('SELECT * FROM auditoria').all());
    expect(auditoria).not.toMatch(/@exemplo|Boa-senha|scrypt\$|Passageira|1990-05-20|98765-?4321/);
    for (const u of db.prepare('SELECT cpf FROM usuario').all()) expect(auditoria).not.toContain(String(u['cpf']));
  }

  return {
    db,
    relogio,
    recuperacoes,
    emails,
    auth,
    admin,
    chamar,
    entrar,
    passageiro,
    dadosDeCadastro,
    publicar,
    reservar,
    checkout,
    iniciarPagamento,
    simular,
    pagar,
    reservaPaga,
    cancelar,
    rotina,
    linha,
    numero,
    situacao,
    ocupadas,
    eventos,
    invariantes,
    excursaoDe,
    reservaDe,
    fechar: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      db.close();
    },
  };
}

export type Plataforma = Awaited<ReturnType<typeof criarPlataforma>>;
