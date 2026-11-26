import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AdminService } from '../server/admin/service.ts';
import { createApp } from '../server/app.ts';
import type { AuthConfig } from '../server/auth/config.ts';
import { AuthService } from '../server/auth/service.ts';
import { calcularReembolso, percentualPorAntecedencia } from '../server/cancelamentos/regra.ts';
import { CancelamentoService } from '../server/cancelamentos/service.ts';
import { MEMORY_DATABASE, openDatabase } from '../server/db/connection.ts';
import { migrations } from '../server/db/migrations.ts';
import { runMigrations } from '../server/db/migrate.ts';
import { ExcursaoService } from '../server/excursoes/service.ts';
import { provedorSimulado } from '../server/pagamentos/provedor.ts';
import { PagamentoService } from '../server/pagamentos/service.ts';
import { ReservaService } from '../server/reservas/service.ts';

/** Cancelamentos e reembolsos (AGT-013): RF-032 a RF-035, RF-026, RN-027 a RN-032. */

const SENHA = 'Boa-senha-2026';
const CONFIG: AuthConfig = {
  sessionTtlMs: 8 * 3_600_000,
  recoveryTtlMs: 30 * 60_000,
  loginMaxAttempts: 50,
  loginWindowMs: 15 * 60_000,
  cookieSecure: false,
  scrypt: { N: 1024, r: 8, p: 1 },
  recoveryOutboxPath: null,
};
const PESSOA = { nome_completo: 'Maria da Silva Ficticia', data_nascimento: '1990-05-20', telefone: '(11) 98765-4321', senha: SENHA };
const VALIDA = {
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
const QUINZE_MIN = 15 * 60_000;
const PARTIDA = new Date('2026-12-10T10:00:00.000Z');
const menos = (dias: number, segundos = 0) => new Date(PARTIDA.getTime() - dias * 86_400_000 + segundos * 1000);
const INICIO = new Date('2026-11-13T12:00:00.000Z');
const JUST = 'Excursao cancelada por falta de transporte (teste).';

let db: DatabaseSync;
let server: Server;
let baseUrl: string;
let relogio: Date;
let excursoes: ExcursaoService;
let adminId: number;
let adminCookie: string;
let anaCookie: string;
let beatrizCookie: string;
let carlaCookie: string;

async function chamar(metodo: string, caminho: string, corpo?: unknown, cookie?: string) {
  const headers: Record<string, string> = {};
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie !== undefined) headers['Cookie'] = cookie;
  const res = await fetch(`${baseUrl}${caminho}`, { method: metodo, headers, ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }) });
  const texto = await res.text();
  return { status: res.status, json: texto === '' ? null : (JSON.parse(texto) as Record<string, unknown>), headers: res.headers, texto };
}
const cookieDe = (h: Headers): string => (h.get('set-cookie') ?? '').split(';')[0] ?? '';
async function entrar(email: string): Promise<string> {
  const res = await chamar('POST', '/api/auth/login', { email, senha: SENHA });
  expect(res.status).toBe(200);
  return cookieDe(res.headers);
}
function publicar(extra: Record<string, unknown> = {}): number {
  const e = excursoes.criar(adminId, { ...VALIDA, ...extra });
  excursoes.mudarSituacao(adminId, e.id, { situacao: 'publicada' });
  return e.id;
}
const adm = (m: string, c: string, corpo?: unknown) => chamar(m, c, corpo, adminCookie);
const ana = (m: string, c: string, corpo?: unknown) => chamar(m, c, corpo, anaCookie);
const beatriz = (m: string, c: string, corpo?: unknown) => chamar(m, c, corpo, beatrizCookie);
const carla = (m: string, c: string, corpo?: unknown) => chamar(m, c, corpo, carlaCookie);
type Quem = typeof ana;
const reservaDe = (res: { json: Record<string, unknown> | null }) => res.json?.['reserva'] as Record<string, unknown>;
const previaDe = (res: { json: Record<string, unknown> | null }) => res.json?.['previa'] as Record<string, unknown>;
const reservar = async (quem: Quem, excursaoId: number, modalidade = 'integral'): Promise<number> => {
  const r = await quem('POST', '/api/reservas', { excursao_id: excursaoId, modalidade });
  expect(r.status).toBe(201);
  return Number(reservaDe(r)['id']);
};
const pagarEAprovar = async (quem: Quem, id: number) => {
  expect((await quem('POST', `/api/reservas/${id}/pagamento`)).status).toBe(200);
  expect((await quem('POST', `/api/reservas/${id}/pagamento/simulacao`, { resultado: 'aprovado' })).status).toBe(200);
};
const paga = async (quem: Quem, excursaoId: number, modalidade = 'integral'): Promise<number> => {
  const id = await reservar(quem, excursaoId, modalidade);
  expect((await quem('POST', `/api/reservas/${id}/checkout`)).status).toBe(200);
  await pagarEAprovar(quem, id);
  return id;
};
const quitada = async (quem: Quem, excursaoId: number): Promise<number> => {
  const id = await paga(quem, excursaoId, 'parcelada');
  await pagarEAprovar(quem, id);
  return id;
};
const cancelar = (quem: Quem, id: number, percentual: number) => quem('POST', `/api/reservas/${id}/cancelamento`, { percentual_previsto: percentual });
const contar = (tabela: string, onde = '1 = 1'): number => Number(db.prepare(`SELECT COUNT(*) AS n FROM ${tabela} WHERE ${onde}`).get()?.['n']);
const ocupadas = (id: number): number => Number(db.prepare('SELECT vagas_ocupadas AS v FROM excursao WHERE id = ?').get(id)?.['v']);
const situacaoDe = (tabela: string, id: number): string => String(db.prepare(`SELECT situacao FROM ${tabela} WHERE id = ?`).get(id)?.['situacao']);
const reembolsos = () => db.prepare('SELECT * FROM reembolso ORDER BY id').all();
const pagamentosDe = (reservaId: number) => db.prepare('SELECT parcela, situacao FROM pagamento WHERE reserva_id = ? ORDER BY id').all(reservaId).map((p) => `${String(p['parcela'])}:${String(p['situacao'])}`);
const irPara = (instante: Date) => {
  relogio = instante;
};
const sinalizar = (reservaId: number, parcela = 'unica', valor = 15001): number =>
  Number(
    db
      .prepare("INSERT INTO pagamento (reserva_id, parcela, valor_centavos, situacao, confirmado_em, criado_em, atualizado_em, pendencia_administrativa) VALUES (?, ?, ?, 'confirmado', ?, ?, ?, 'confirmacao_sem_vaga')")
      .run(reservaId, parcela, valor, relogio.toISOString(), relogio.toISOString(), relogio.toISOString()).lastInsertRowid,
  );

async function montar(comProvedor = true): Promise<void> {
  db = openDatabase(MEMORY_DATABASE);
  runMigrations(db);
  relogio = INICIO;
  const auth = new AuthService({ db, config: CONFIG, outbox: () => undefined, now: () => INICIO });
  adminId = (await auth.createAdministrator({ ...PESSOA, nome_completo: 'Adriana Administradora Ficticia', cpf: '529.982.247-25', email: 'admin.ficticio@exemplo.com' })).id;
  await auth.register({ ...PESSOA, nome_completo: 'Ana Passageira Ficticia', cpf: '111.444.777-35', email: 'ana.passageira@exemplo.com' });
  await auth.register({ ...PESSOA, nome_completo: 'Beatriz Souza Ficticia', cpf: '123.456.789-09', email: 'beatriz.passageira@exemplo.com' });
  await auth.register({ ...PESSOA, nome_completo: 'Carla Lima Ficticia', cpf: '390.533.447-05', email: 'carla.passageira@exemplo.com' });
  excursoes = new ExcursaoService(db, () => relogio);
  const reservas = new ReservaService(db, () => relogio, QUINZE_MIN, provedorSimulado);
  server = createApp({
    auth: { service: auth, config: CONFIG },
    excursoes,
    reservas,
    pagamentos: new PagamentoService(db, reservas, provedorSimulado, () => relogio),
    admin: new AdminService(db, () => relogio),
    cancelamentos: new CancelamentoService(db, reservas, comProvedor ? provedorSimulado : undefined, () => relogio),
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  adminCookie = await entrar('admin.ficticio@exemplo.com');
  anaCookie = await entrar('ana.passageira@exemplo.com');
  beatrizCookie = await entrar('beatriz.passageira@exemplo.com');
  carlaCookie = await entrar('carla.passageira@exemplo.com');
}
const desmontar = async () => {
  await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  db.close();
};

describe('regra de calculo (RF-033, RN-027 a RN-030, RN-032)', () => {
  it('antecedencia em periodos exatos ate a partida, nas fronteiras de 14 e 7 dias', () => {
    expect(percentualPorAntecedencia(PARTIDA, menos(30))).toBe(100);
    expect(percentualPorAntecedencia(PARTIDA, menos(14))).toBe(100);
    expect(percentualPorAntecedencia(PARTIDA, menos(14, 1))).toBe(50);
    expect(percentualPorAntecedencia(PARTIDA, menos(7))).toBe(50);
    expect(percentualPorAntecedencia(PARTIDA, menos(7, 1))).toBe(0);
    expect(percentualPorAntecedencia(PARTIDA, menos(0, -1))).toBe(0);
  });

  it('incide sobre o pago: integral, quitada, parcelada so com a primeira (nada) e metade para baixo', () => {
    expect(calcularReembolso('integral', [{ parcela: 'unica', valor_centavos: 15001 }], 100).valor_reembolso_centavos).toBe(15001);
    expect(calcularReembolso('integral', [{ parcela: 'unica', valor_centavos: 15001 }], 50).valor_reembolso_centavos).toBe(7500);
    const quit = [{ parcela: 'primeira', valor_centavos: 7500 }, { parcela: 'segunda', valor_centavos: 7501 }];
    expect(calcularReembolso('parcelada', quit, 50)).toMatchObject({ valor_pago_centavos: 15001, valor_elegivel_centavos: 15001, valor_reembolso_centavos: 7500, parcelada_nao_quitada: false });
    expect(calcularReembolso('parcelada', [quit[0] as { parcela: string; valor_centavos: number }], 100)).toMatchObject({ valor_pago_centavos: 7500, valor_elegivel_centavos: 0, valor_reembolso_centavos: 0, parcelada_nao_quitada: true });
    expect(calcularReembolso('integral', [], 100).valor_reembolso_centavos).toBe(0);
  });
});

describe('com a API', () => {
  beforeEach(() => montar());
  afterEach(desmontar);

  describe('autorizacao e isolamento (RN-044)', () => {
    it('visitante 401 e administrador 403 no cancelamento do passageiro; passageiro 403 nas rotas de administracao', async () => {
      for (const [m, c, b] of [['GET', '/api/reservas/1/cancelamento'], ['POST', '/api/reservas/1/cancelamento', { percentual_previsto: 100 }]] as Array<[string, string, unknown?]>) {
        expect((await chamar(m, c, b)).status).toBe(401);
        expect((await adm(m, c, b)).status).toBe(403);
      }
      for (const [m, c, b] of [['GET', '/api/admin/excursoes/1/cancelamento'], ['POST', '/api/admin/excursoes/1/cancelamento', { justificativa: 'x' }], ['GET', '/api/admin/reembolsos'], ['POST', '/api/admin/reembolsos/1/processar', { resultado: 'aprovado' }], ['POST', '/api/admin/pendencias/1/reembolso']] as Array<[string, string, unknown?]>) {
        expect((await chamar(m, c, b)).status, c).toBe(401);
        expect((await ana(m, c, b)).status, c).toBe(403);
      }
    });

    it('reserva alheia e inexistente respondem o mesmo 404, na previa e no cancelamento', async () => {
      const id = await paga(ana, publicar());
      for (const [m, c, b] of [['GET', `/api/reservas/${id}/cancelamento`], ['POST', `/api/reservas/${id}/cancelamento`, { percentual_previsto: 100 }]] as Array<[string, string, unknown?]>) {
        const alheia = await beatriz(m, c, b);
        const inexistente = await beatriz(m, c.replace(`/${id}/`, '/99999/'), b);
        expect([alheia.status, alheia.json]).toEqual([404, { error: 'nao_encontrada' }]);
        expect(inexistente.json).toEqual(alheia.json);
      }
      expect(situacaoDe('reserva', id)).toBe('pronto_para_embarque');
    });

    it('o corpo nao escolhe valores: campos extras e percentual invalido sao recusados sem efeito', async () => {
      const id = await paga(ana, publicar());
      const caminho = `/api/reservas/${id}/cancelamento`;
      expect((await ana('POST', caminho, { percentual_previsto: 100, valor_centavos: 1 })).json).toEqual({ error: 'validacao', fields: { valor_centavos: 'campo_nao_permitido' } });
      expect((await ana('POST', caminho, {})).json).toEqual({ error: 'validacao', fields: { percentual_previsto: 'obrigatorio' } });
      expect((await ana('POST', caminho, { percentual_previsto: 75 })).json).toEqual({ error: 'validacao', fields: { percentual_previsto: 'invalido' } });
      expect(contar('reembolso')).toBe(0);
      expect(situacaoDe('reserva', id)).toBe('pronto_para_embarque');
    });
  });

  describe('cancelamento pelo passageiro (RF-032)', () => {
    it('a previa mostra o percentual e o valor antes de confirmar, sem gravar nada', async () => {
      const id = await paga(ana, publicar());
      const antes = contar('auditoria');
      const r = await ana('GET', `/api/reservas/${id}/cancelamento`);
      expect(r.status).toBe(200);
      expect(previaDe(r)).toEqual({
        permitido: true,
        motivo_impedimento: null,
        percentual: 100,
        valor_pago_centavos: 15001,
        valor_elegivel_centavos: 15001,
        valor_reembolso_centavos: 15001,
        parcelada_nao_quitada: false,
        tem_pagamento_a_tratar: false,
        partida_utc: '2026-12-10T10:00:00.000Z',
      });
      expect(contar('auditoria')).toBe(antes);
      expect(situacaoDe('reserva', id)).toBe('pronto_para_embarque');
    });

    it('com 14 dias ou mais: cancela, libera a vaga uma vez e registra o reembolso integral pendente', async () => {
      const exc = publicar();
      const id = await paga(ana, exc);
      expect(ocupadas(exc)).toBe(1);
      irPara(menos(14));
      const r = await cancelar(ana, id, 100);
      expect(r.status).toBe(200);
      expect(reservaDe(r)).toMatchObject({ situacao: 'cancelada', pode_cancelar: false, reembolsos: [{ valor_centavos: 15001, percentual_aplicado: 100, motivo: 'cancelamento_passageiro', situacao: 'pendente' }] });
      expect(ocupadas(exc)).toBe(0);
      expect(pagamentosDe(id)).toEqual(['unica:confirmado']); // so vira estornado quando o reembolso for processado
      expect(reembolsos()).toHaveLength(1);
      const ev = db.prepare("SELECT ator_usuario_id AS a, estado_novo AS n FROM auditoria WHERE acao = 'reserva.cancelamento_passageiro'").get();
      expect(JSON.parse(String(ev?.['n']))).toMatchObject({ situacao: 'cancelada', vaga_liberada: true, percentual: 100, valor_reembolso_centavos: 15001 });
      expect(Number(ev?.['a'])).toBeGreaterThan(1);
    });

    it('um segundo dentro dos 14 dias: 50% arredondado para baixo; e dentro dos 7 dias: sem reembolso', async () => {
      const exc = publicar();
      const a = await paga(ana, exc);
      const b = await paga(beatriz, exc);
      irPara(menos(14, 1));
      expect(previaDe(await ana('GET', `/api/reservas/${a}/cancelamento`))['percentual']).toBe(50);
      expect((await cancelar(ana, a, 50)).status).toBe(200);
      expect(reembolsos().map((x) => [x['valor_centavos'], x['percentual_aplicado']])).toEqual([[7500, 50]]);
      irPara(menos(7, 1));
      const r = await cancelar(beatriz, b, 0);
      expect(r.status).toBe(200);
      expect(reservaDe(r)).toMatchObject({ situacao: 'cancelada', reembolsos: [] });
      expect(reembolsos()).toHaveLength(1);
      expect(ocupadas(exc)).toBe(0);
    });

    it('se a faixa mudou entre a previa e a confirmacao, responde 409 reembolso_mudou e nao cancela', async () => {
      const id = await paga(ana, publicar());
      irPara(menos(14));
      expect(previaDe(await ana('GET', `/api/reservas/${id}/cancelamento`))['percentual']).toBe(100);
      irPara(menos(14, 1));
      const r = await cancelar(ana, id, 100);
      expect([r.status, r.json]).toEqual([409, { error: 'reembolso_mudou' }]);
      expect(situacaoDe('reserva', id)).toBe('pronto_para_embarque');
      expect(contar('reembolso')).toBe(0);
    });

    it('depois da partida nao e possivel cancelar', async () => {
      const id = await paga(ana, publicar());
      irPara(PARTIDA);
      expect(previaDe(await ana('GET', `/api/reservas/${id}/cancelamento`))).toMatchObject({ permitido: false, motivo_impedimento: 'excursao_ja_partiu' });
      expect((await cancelar(ana, id, 0)).json).toEqual({ error: 'excursao_ja_partiu' });
      expect(situacaoDe('reserva', id)).toBe('pronto_para_embarque');
    });

    it('reserva concluida nao pode ser cancelada', async () => {
      const id = await paga(ana, publicar());
      irPara(new Date('2026-12-13T03:00:00.000Z'));
      expect((await cancelar(ana, id, 0)).json).toEqual({ error: 'reserva_nao_cancelavel' });
      expect(situacaoDe('reserva', id)).toBe('concluida');
    });

    it('parcelada so com a primeira paga: libera a vaga e nao reembolsa (RN-032)', async () => {
      const exc = publicar();
      const id = await paga(ana, exc, 'parcelada');
      expect(previaDe(await ana('GET', `/api/reservas/${id}/cancelamento`))).toMatchObject({ percentual: 100, valor_pago_centavos: 7500, valor_elegivel_centavos: 0, valor_reembolso_centavos: 0, parcelada_nao_quitada: true });
      expect((await cancelar(ana, id, 100)).status).toBe(200);
      expect(situacaoDe('reserva', id)).toBe('cancelada');
      expect(ocupadas(exc)).toBe(0);
      expect(contar('reembolso')).toBe(0);
      expect(pagamentosDe(id)).toEqual(['primeira:confirmado']);
    });

    it('parcelada quitada: percentual sobre o total pago', async () => {
      const id = await quitada(ana, publicar());
      irPara(menos(10));
      expect((await cancelar(ana, id, 50)).status).toBe(200);
      expect(reembolsos().map((x) => [x['valor_centavos'], x['percentual_aplicado']])).toEqual([[7500, 50]]);
    });

    it('sem pagamento confirmado: cancela, cancela a retencao, sem reembolso', async () => {
      const exc = publicar();
      const id = await reservar(ana, exc);
      await ana('POST', `/api/reservas/${id}/checkout`);
      expect((await cancelar(ana, id, 100)).status).toBe(200);
      expect(db.prepare('SELECT situacao FROM retencao_vaga WHERE reserva_id = ?').get(id)?.['situacao']).toBe('cancelada');
      expect(contar('reembolso')).toBe(0);
      expect(ocupadas(exc)).toBe(0);
    });

    it('pagamento pendente vira recusado e nao pode ser confirmado depois', async () => {
      const id = await reservar(ana, publicar());
      await ana('POST', `/api/reservas/${id}/checkout`);
      await ana('POST', `/api/reservas/${id}/pagamento`);
      expect((await cancelar(ana, id, 100)).status).toBe(200);
      expect(pagamentosDe(id)).toEqual(['unica:falhou']);
      const r = await ana('POST', `/api/reservas/${id}/pagamento/simulacao`, { resultado: 'aprovado' });
      expect(r.status).toBe(409);
      expect(pagamentosDe(id)).toEqual(['unica:falhou']);
    });

    it('reserva ja cancelada por inadimplencia: o pedido nao muda nada nem cria reembolso', async () => {
      const exc = publicar();
      const id = await paga(ana, exc, 'parcelada');
      irPara(new Date('2026-12-06T03:00:00.000Z'));
      const r = await cancelar(ana, id, 0);
      expect(r.status).toBe(200);
      expect(reservaDe(r)).toMatchObject({ situacao: 'cancelada', motivo_cancelamento: 'inadimplencia' });
      expect(contar('reembolso')).toBe(0);
      expect(contar('auditoria', "acao = 'reserva.cancelamento_passageiro'")).toBe(0);
      expect(ocupadas(exc)).toBe(0);
    });

    it('repetir e pedidos simultaneos: um unico cancelamento, um reembolso e uma liberacao de vaga', async () => {
      const exc = publicar();
      const outra = await paga(beatriz, exc);
      const id = await paga(ana, exc);
      const respostas = await Promise.all([cancelar(ana, id, 100), cancelar(ana, id, 100), cancelar(ana, id, 100)]);
      expect(respostas.map((r) => r.status)).toEqual([200, 200, 200]);
      expect((await cancelar(ana, id, 100)).status).toBe(200);
      expect(contar('reembolso')).toBe(1);
      expect(contar('auditoria', "acao = 'reserva.cancelamento_passageiro'")).toBe(1);
      expect(ocupadas(exc)).toBe(1); // a vaga da outra passageira continua ocupada
      expect(situacaoDe('reserva', outra)).toBe('pronto_para_embarque');
    });

    it('atomicidade: uma falha no meio desfaz tudo', async () => {
      const exc = publicar();
      const id = await paga(ana, exc);
      db.exec("CREATE TRIGGER tg_falha BEFORE INSERT ON auditoria WHEN NEW.acao = 'reserva.cancelamento_passageiro' BEGIN SELECT RAISE(ABORT, 'falha injetada'); END;");
      const antes = contar('auditoria');
      const r = await cancelar(ana, id, 100);
      expect(r.status).toBe(500);
      expect(r.texto).not.toContain('injetada');
      expect(situacaoDe('reserva', id)).toBe('pronto_para_embarque');
      expect(ocupadas(exc)).toBe(1);
      expect(contar('reembolso')).toBe(0);
      expect(contar('auditoria')).toBe(antes);
    });

    it('depois de cancelar, o passageiro pode reservar a mesma excursao de novo', async () => {
      const exc = publicar();
      const id = await paga(ana, exc);
      await cancelar(ana, id, 100);
      expect(await reservar(ana, exc)).toBeGreaterThan(id);
    });
  });

  describe('cancelamento da excursao pela organizacao (RF-034, RF-035, RN-031)', () => {
    async function cenario() {
      const exc = publicar();
      const a = await paga(ana, exc);
      const b = await paga(beatriz, exc, 'parcelada');
      const c = await reservar(carla, exc);
      await carla('POST', `/api/reservas/${c}/checkout`);
      return { exc, a, b, c };
    }

    it('a rota comum de situacao continua bloqueando o cancelamento com reservas ativas (AGT-005)', async () => {
      const { exc } = await cenario();
      expect((await adm('POST', `/api/admin/excursoes/${exc}/situacao`, { situacao: 'cancelada' })).json).toEqual({ error: 'excursao_com_reservas_ativas' });
    });

    it('a previa lista os afetados e o total, sem gravar o cancelamento', async () => {
      const { exc, a, b, c } = await cenario();
      const r = await adm('GET', `/api/admin/excursoes/${exc}/cancelamento`);
      expect(r.status).toBe(200);
      expect(previaDe(r)).toMatchObject({
        permitido: true,
        motivo_impedimento: null,
        reservas: [
          { id: a, passageiro: 'Ana Passageira Ficticia', situacao: 'pronto_para_embarque', valor_reembolso_centavos: 15001 },
          { id: b, passageiro: 'Beatriz Souza Ficticia', situacao: 'aguardando_pagamento', valor_reembolso_centavos: 7500 },
          { id: c, passageiro: 'Carla Lima Ficticia', situacao: 'aguardando_pagamento', valor_reembolso_centavos: 0 },
        ],
        pendencias: [],
        valor_total_centavos: 22501,
      });
      expect(situacaoDe('excursao', exc)).toBe('publicada');
      for (const proibido of ['11144477735', 'ana.passageira', '98765']) expect(r.texto).not.toContain(proibido);
    });

    it('cancela tudo em uma operacao: reservas, retencoes, vagas, reembolsos integrais (inclusive a primeira parcela) e excursao', async () => {
      const { exc, a, b, c } = await cenario();
      expect(ocupadas(exc)).toBe(2);
      const r = await adm('POST', `/api/admin/excursoes/${exc}/cancelamento`, { justificativa: JUST });
      expect(r.status).toBe(200);
      expect(r.json?.['cancelamento']).toEqual({ excursao_id: exc, situacao: 'cancelada', ja_cancelada: false, reservas_canceladas: 3, reembolsos_criados: 2, valor_total_centavos: 22501 });
      expect([a, b, c].map((id) => situacaoDe('reserva', id))).toEqual(['cancelada', 'cancelada', 'cancelada']);
      expect(situacaoDe('excursao', exc)).toBe('cancelada');
      expect(ocupadas(exc)).toBe(0);
      expect(contar('retencao_vaga', "situacao = 'ativa'")).toBe(0);
      expect(reembolsos().map((x) => [x['reserva_id'], x['valor_centavos'], x['percentual_aplicado'], x['motivo'], x['situacao']])).toEqual([
        [a, 15001, 100, 'cancelamento_organizacao', 'pendente'],
        [b, 7500, 100, 'cancelamento_organizacao', 'pendente'],
      ]);
      const ev = db.prepare("SELECT ator_usuario_id AS a, estado_novo AS n FROM auditoria WHERE acao = 'excursao.cancelamento'").get();
      expect(ev?.['a']).toBe(adminId);
      expect(JSON.parse(String(ev?.['n']))).toEqual({ situacao: 'cancelada', reservas_canceladas: 3, reembolsos_criados: 2, valor_total_centavos: 22501, justificativa: JUST });
      expect((await chamar('GET', `/api/excursoes/${exc}`)).status).toBe(404);
    });

    it('nao afeta concluidas nem ja canceladas (inclusive por inadimplencia), mas reembolsa as pendencias da excursao', async () => {
      const exc = publicar();
      const desistida = await reservar(ana, exc);
      await ana('POST', `/api/reservas/${desistida}/desistir`);
      const inadimplente = await paga(beatriz, exc, 'parcelada');
      const outra = publicar({ nome: 'Outra' });
      const foraDela = await paga(carla, outra);
      irPara(new Date('2026-12-06T03:00:00.000Z'));
      await adm('GET', `/api/admin/excursoes/${exc}/cancelamento`); // efetiva o vencimento antes, como a confirmacao tardia faria
      const tardia = sinalizar(inadimplente, 'segunda', 7501);
      const r = await adm('POST', `/api/admin/excursoes/${exc}/cancelamento`, { justificativa: JUST });
      expect(r.json?.['cancelamento']).toMatchObject({ reservas_canceladas: 0, reembolsos_criados: 1, valor_total_centavos: 7501 });
      expect(reembolsos().map((x) => [x['reserva_id'], x['pagamento_id'], x['valor_centavos'], x['motivo']])).toEqual([[inadimplente, tardia, 7501, 'pendencia']]);
      expect(db.prepare('SELECT motivo_cancelamento AS m FROM reserva WHERE id = ?').get(inadimplente)?.['m']).toBe('inadimplencia');
      expect(situacaoDe('reserva', foraDela)).toBe('pronto_para_embarque');
      expect(ocupadas(outra)).toBe(1);
    });

    it('exige justificativa, recusa campos extras e depois da partida; repetir nao faz nada', async () => {
      const { exc } = await cenario();
      const caminho = `/api/admin/excursoes/${exc}/cancelamento`;
      expect((await adm('POST', caminho, {})).json).toEqual({ error: 'validacao', fields: { justificativa: 'obrigatorio' } });
      expect((await adm('POST', caminho, { justificativa: ' ' })).status).toBe(400);
      expect((await adm('POST', caminho, { justificativa: 'x'.repeat(301) })).json).toEqual({ error: 'validacao', fields: { justificativa: 'invalido' } });
      expect((await adm('POST', caminho, { justificativa: JUST, valor: 0 })).json).toEqual({ error: 'validacao', fields: { valor: 'campo_nao_permitido' } });
      expect((await adm('POST', '/api/admin/excursoes/999/cancelamento', { justificativa: JUST })).status).toBe(404);
      expect((await adm('POST', caminho, { justificativa: JUST })).status).toBe(200);
      const antes = contar('auditoria');
      const r = await adm('POST', caminho, { justificativa: 'de novo' });
      expect(r.json?.['cancelamento']).toMatchObject({ ja_cancelada: true, reservas_canceladas: 0, reembolsos_criados: 0 });
      expect(contar('auditoria')).toBe(antes);
      expect(contar('reembolso')).toBe(2);
    });

    it('depois da partida a excursao nao pode ser cancelada por aqui', async () => {
      const { exc } = await cenario();
      irPara(PARTIDA);
      expect((await adm('GET', `/api/admin/excursoes/${exc}/cancelamento`)).json?.['previa']).toMatchObject({ permitido: false, motivo_impedimento: 'excursao_ja_partiu' });
      expect((await adm('POST', `/api/admin/excursoes/${exc}/cancelamento`, { justificativa: JUST })).json).toEqual({ error: 'excursao_ja_partiu' });
      expect(situacaoDe('excursao', exc)).toBe('publicada');
    });

    it('atomicidade: uma falha no fim desfaz o cancelamento de todas as reservas', async () => {
      const { exc, a, b, c } = await cenario();
      db.exec("CREATE TRIGGER tg_falha BEFORE INSERT ON auditoria WHEN NEW.acao = 'excursao.cancelamento' BEGIN SELECT RAISE(ABORT, 'falha injetada'); END;");
      const r = await adm('POST', `/api/admin/excursoes/${exc}/cancelamento`, { justificativa: JUST });
      expect(r.status).toBe(500);
      expect([a, b, c].map((id) => situacaoDe('reserva', id))).toEqual(['pronto_para_embarque', 'aguardando_pagamento', 'aguardando_pagamento']);
      expect(situacaoDe('excursao', exc)).toBe('publicada');
      expect(ocupadas(exc)).toBe(2);
      expect(contar('reembolso')).toBe(0);
    });
  });

  describe('processamento do reembolso e pendencias (decisao 2, RF-026)', () => {
    const processar = (id: number, resultado: unknown) => adm('POST', `/api/admin/reembolsos/${id}/processar`, { resultado });
    const idDoReembolso = () => Number(reembolsos()[0]?.['id']);

    it('lista com filtro e paginacao, com passageiro e excursao, sem dados pessoais', async () => {
      const exc = publicar();
      const a = await paga(ana, exc);
      await cancelar(ana, a, 100);
      const r = await adm('GET', '/api/admin/reembolsos');
      expect(r.status).toBe(200);
      expect(r.json).toMatchObject({ total: 1, pagina: 1, limite: 20, processamento_disponivel: true });
      expect((r.json?.['reembolsos'] as Array<Record<string, unknown>>)[0]).toMatchObject({ reserva_id: a, passageiro: 'Ana Passageira Ficticia', excursao: 'Excursao Ficticia Serra', valor_centavos: 15001, situacao: 'pendente', motivo: 'cancelamento_passageiro' });
      for (const proibido of ['11144477735', 'ana.passageira', '98765']) expect(r.texto).not.toContain(proibido);
      expect((await adm('GET', '/api/admin/reembolsos?situacao=processado')).json).toMatchObject({ total: 0, reembolsos: [] });
      expect((await adm('GET', '/api/admin/reembolsos?situacao=x&limite=999')).json).toEqual({ error: 'validacao', fields: { situacao: 'invalido', limite: 'invalido' } });
    });

    it('aprovado a 100%: reembolso processado, pagamento estornado e auditoria', async () => {
      const id = await paga(ana, publicar());
      await cancelar(ana, id, 100);
      const r = await processar(idDoReembolso(), 'aprovado');
      expect(r.status).toBe(200);
      expect(r.json?.['reembolso']).toMatchObject({ situacao: 'processado', valor_centavos: 15001 });
      expect(pagamentosDe(id)).toEqual(['unica:estornado']);
      expect(contar('auditoria', "acao = 'reembolso.processado' AND ator_usuario_id = " + adminId)).toBe(1);
      expect(contar('auditoria', "acao = 'pagamento.estornado'")).toBe(1);
    });

    it('aprovado a 50%: o pagamento continua pago', async () => {
      const id = await paga(ana, publicar());
      irPara(menos(10));
      await cancelar(ana, id, 50);
      expect((await processar(idDoReembolso(), 'aprovado')).status).toBe(200);
      expect(pagamentosDe(id)).toEqual(['unica:confirmado']);
    });

    it('cancelamento da excursao processado: as duas parcelas quitadas viram estornadas', async () => {
      const exc = publicar();
      const id = await quitada(ana, exc);
      await adm('POST', `/api/admin/excursoes/${exc}/cancelamento`, { justificativa: JUST });
      await processar(idDoReembolso(), 'aprovado');
      expect(pagamentosDe(id)).toEqual(['primeira:estornado', 'segunda:estornado']);
    });

    it('recusado pode ser tentado de novo, sem criar outro; repetir e idempotente; processado nao volta', async () => {
      const id = await paga(ana, publicar());
      await cancelar(ana, id, 100);
      const rid = idDoReembolso();
      expect((await processar(rid, 'recusado')).json?.['reembolso']).toMatchObject({ situacao: 'recusado' });
      expect((await processar(rid, 'recusado')).status).toBe(200);
      expect(pagamentosDe(id)).toEqual(['unica:confirmado']);
      expect((await processar(rid, 'aprovado')).json?.['reembolso']).toMatchObject({ situacao: 'processado' });
      expect((await processar(rid, 'aprovado')).status).toBe(200);
      expect((await processar(rid, 'recusado')).json).toEqual({ error: 'reembolso_ja_processado' });
      expect(contar('reembolso')).toBe(1);
      expect(contar('auditoria', "acao = 'reembolso.processado'")).toBe(1);
      expect(contar('auditoria', "acao = 'reembolso.recusado'")).toBe(1);
    });

    it('valida o corpo, o id e nunca devolve mais do que foi pago', async () => {
      const id = await paga(ana, publicar());
      await cancelar(ana, id, 100);
      const rid = idDoReembolso();
      expect((await processar(rid, 'talvez')).json).toEqual({ error: 'validacao', fields: { resultado: 'invalido' } });
      expect((await adm('POST', `/api/admin/reembolsos/${rid}/processar`, { resultado: 'aprovado', valor: 1 })).status).toBe(400);
      expect((await processar(99999, 'aprovado')).status).toBe(404);
      db.prepare('UPDATE reembolso SET valor_centavos = 99999 WHERE id = ?').run(rid);
      expect((await processar(rid, 'aprovado')).json).toEqual({ error: 'reembolso_excede_pago' });
      expect(situacaoDe('reembolso', rid)).toBe('pendente');
    });

    it('pendencia: cria um unico reembolso integral, que processado estorna o pagamento e some da lista', async () => {
      const id = await reservar(ana, publicar());
      const pid = sinalizar(id);
      expect((await adm('GET', '/api/admin/pendencias')).json?.['total']).toBe(1);
      const r1 = await adm('POST', `/api/admin/pendencias/${pid}/reembolso`);
      const r2 = await adm('POST', `/api/admin/pendencias/${pid}/reembolso`);
      expect(r1.status).toBe(200);
      expect(r2.json).toEqual(r1.json);
      expect(r1.json?.['reembolso']).toMatchObject({ pagamento_id: pid, valor_centavos: 15001, percentual_aplicado: 100, motivo: 'pendencia', situacao: 'pendente' });
      expect(contar('reembolso')).toBe(1);
      expect(((await adm('GET', '/api/admin/pendencias')).json?.['pendencias'] as Array<Record<string, unknown>>)[0]?.['reembolso']).toMatchObject({ situacao: 'pendente' });
      await processar(idDoReembolso(), 'aprovado');
      expect(pagamentosDe(id)).toEqual(['unica:estornado']);
      expect((await adm('GET', '/api/admin/pendencias')).json?.['total']).toBe(0);
    });

    it('processado o reembolso da pendencia, a reserva aguardando pagamento e cancelada, com auditoria e sem mexer em vagas', async () => {
      const exc = publicar();
      const outra = await paga(beatriz, exc);
      const id = await reservar(ana, exc);
      await ana('POST', `/api/reservas/${id}/checkout`);
      const pid = sinalizar(id);
      await adm('POST', `/api/admin/pendencias/${pid}/reembolso`);
      expect(situacaoDe('reserva', id)).toBe('aguardando_pagamento'); // so o processamento cancela
      const rid = Number(db.prepare('SELECT id FROM reembolso WHERE pagamento_id = ?').get(pid)?.['id']);
      expect((await processar(rid, 'aprovado')).status).toBe(200);
      expect(situacaoDe('reserva', id)).toBe('cancelada');
      expect(contar('retencao_vaga', "reserva_id = " + id + " AND situacao = 'ativa'")).toBe(0);
      expect(ocupadas(exc)).toBe(1);
      expect(situacaoDe('reserva', outra)).toBe('pronto_para_embarque');
      expect(contar('reembolso')).toBe(1);
      const ev = db.prepare("SELECT ator_usuario_id AS a, estado_novo AS n FROM auditoria WHERE acao = 'reserva.cancelamento_reembolso'").get();
      expect(ev?.['a']).toBe(adminId);
      expect(JSON.parse(String(ev?.['n']))).toMatchObject({ situacao: 'cancelada', vaga_liberada: false, reembolso_id: rid });
      expect((await ana('POST', `/api/reservas/${id}/pagamento`)).status).toBe(409);
      expect((await processar(rid, 'aprovado')).status).toBe(200);
      expect(contar('auditoria', "acao = 'reserva.cancelamento_reembolso'")).toBe(1);
      expect(await reservar(ana, exc)).toBeGreaterThan(id);
    });

    it('reembolso de pendencia recusado nao cancela a reserva', async () => {
      const id = await reservar(ana, publicar());
      const pid = sinalizar(id);
      await adm('POST', `/api/admin/pendencias/${pid}/reembolso`);
      await processar(idDoReembolso(), 'recusado');
      expect(situacaoDe('reserva', id)).toBe('aguardando_pagamento');
      expect(contar('auditoria', "acao = 'reserva.cancelamento_reembolso'")).toBe(0);
    });

    it('atomicidade: falha ao cancelar desfaz tambem o processamento do reembolso', async () => {
      const id = await reservar(ana, publicar());
      const pid = sinalizar(id);
      await adm('POST', `/api/admin/pendencias/${pid}/reembolso`);
      db.exec("CREATE TRIGGER tg_falha BEFORE INSERT ON auditoria WHEN NEW.acao = 'reserva.cancelamento_reembolso' BEGIN SELECT RAISE(ABORT, 'falha injetada'); END;");
      expect((await processar(idDoReembolso(), 'aprovado')).status).toBe(500);
      expect(situacaoDe('reembolso', idDoReembolso())).toBe('pendente');
      expect(situacaoDe('pagamento', pid)).toBe('confirmado');
      expect(situacaoDe('reserva', id)).toBe('aguardando_pagamento');
    });

    it('pagamento sem pendencia nao gera reembolso por essa rota', async () => {
      const id = await paga(ana, publicar());
      const pid = Number(db.prepare('SELECT id FROM pagamento WHERE reserva_id = ?').get(id)?.['id']);
      expect((await adm('POST', `/api/admin/pendencias/${pid}/reembolso`)).json).toEqual({ error: 'pagamento_sem_pendencia' });
      expect((await adm('POST', '/api/admin/pendencias/99999/reembolso')).status).toBe(404);
      expect(contar('reembolso')).toBe(0);
    });

    it('cancelar a reserva com pendencia nao cria o reembolso dela (a pendencia e tratada a parte)', async () => {
      const id = await reservar(ana, publicar());
      sinalizar(id);
      expect(previaDe(await ana('GET', `/api/reservas/${id}/cancelamento`))).toMatchObject({ valor_pago_centavos: 0, tem_pagamento_a_tratar: true });
      await cancelar(ana, id, 100);
      expect(contar('reembolso')).toBe(0);
    });

    it('auditoria sem dados pessoais nem de cartao', async () => {
      const id = await paga(ana, publicar());
      await cancelar(ana, id, 100);
      await processar(idDoReembolso(), 'aprovado');
      const dump = JSON.stringify(db.prepare("SELECT * FROM auditoria WHERE acao LIKE 'reembolso.%' OR acao LIKE 'reserva.%' OR acao LIKE 'pagamento.%'").all()) + JSON.stringify(reembolsos());
      for (const proibido of ['11144477735', 'ana.passageira', '98765', 'cartao', 'Ana Passageira', SENHA]) expect(dump).not.toContain(proibido);
    });
  });
});

describe('sem provedor (producao)', () => {
  beforeEach(() => montar(false));
  afterEach(desmontar);

  it('o processamento responde 503, mas o cancelamento registra o reembolso pendente', async () => {
    const id = await paga(ana, publicar());
    expect((await cancelar(ana, id, 100)).status).toBe(200);
    const rid = Number(reembolsos()[0]?.['id']);
    expect((await adm('POST', `/api/admin/reembolsos/${rid}/processar`, { resultado: 'aprovado' })).status).toBe(503);
    expect((await adm('GET', '/api/admin/reembolsos')).json?.['processamento_disponivel']).toBe(false);
    expect(situacaoDe('reembolso', rid)).toBe('pendente');
  });
});

describe('migracao 4 e duas conexoes', () => {
  it('a migracao 4 aplica sobre um banco na versao 3 e o banco garante um reembolso por cancelamento e por pagamento', () => {
    const d = openDatabase(':memory:');
    expect(runMigrations(d, migrations.slice(0, 3))).toEqual([1, 2, 3]);
    expect(runMigrations(d)).toEqual([4, 5]);
    expect(d.prepare('PRAGMA table_info(reembolso)').all().map((c) => c['name'])).toContain('pagamento_id');
    expect(d.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'reembolso' ORDER BY name").all().map((c) => c['name'])).toEqual(['uq_reembolso_cancelamento', 'uq_reembolso_pagamento']);
    d.close();
  });

  it('o mesmo cancelamento por duas conexoes: um reembolso e uma liberacao de vaga', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agt013-'));
    const a = openDatabase(join(dir, 'db.sqlite'));
    runMigrations(a);
    const b = openDatabase(join(dir, 'db.sqlite'));
    const agora = INICIO.toISOString();
    a.prepare("INSERT INTO usuario (nome_completo, cpf, email, data_nascimento, telefone, senha_hash, perfil, criado_em, atualizado_em) VALUES ('Ana Ficticia', '11144477735', 'p@exemplo.com', '1990-01-01', '1', 'x', 'passageiro', ?, ?)").run(agora, agora);
    a.prepare(
      "INSERT INTO excursao (nome, descricao, local, ponto_embarque, data_inicial, data_final, partida_utc, capacidade, vagas_ocupadas, preco_centavos, situacao, criado_em, atualizado_em) VALUES ('E', 'd', 'l', 'p', '2026-12-10', '2026-12-12', '2026-12-10T10:00:00.000Z', 5, 2, 10000, 'publicada', ?, ?)",
    ).run(agora, agora);
    a.prepare("INSERT INTO reserva (usuario_id, excursao_id, modalidade, situacao, criado_em, atualizado_em) VALUES (1, 1, 'integral', 'pronto_para_embarque', ?, ?)").run(agora, agora);
    a.prepare("INSERT INTO pagamento (reserva_id, parcela, valor_centavos, situacao, confirmado_em, criado_em, atualizado_em) VALUES (1, 'unica', 10000, 'confirmado', ?, ?, ?)").run(agora, agora, agora);
    for (const conexao of [a, b]) {
      const reservas = new ReservaService(conexao, () => INICIO, QUINZE_MIN, provedorSimulado);
      new CancelamentoService(conexao, reservas, provedorSimulado, () => INICIO).cancelarReserva(1, 1, { percentual_previsto: 100 });
    }
    expect(a.prepare('SELECT COUNT(*) AS n FROM reembolso').get()?.['n']).toBe(1);
    expect(a.prepare('SELECT vagas_ocupadas AS v FROM excursao WHERE id = 1').get()?.['v']).toBe(1);
    a.close();
    b.close();
    rmSync(dir, { recursive: true, force: true });
  });
});
