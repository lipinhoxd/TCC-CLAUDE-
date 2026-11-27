import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DIA, DIA_SEGUINTE_AO_FIM, INICIO, MIN, PARTIDA, PRAZO, criarPlataforma } from './helpers/plataforma.ts';
import type { Pessoa, Plataforma } from './helpers/plataforma.ts';

/**
 * Testes integrados (AGT-017): os fluxos de docs/especificacao/05-FLUXOS-E-ESTADOS.md encadeados sobre a aplicacao completa e a rotina
 * automatica, com relogio controlado e dados ficticios. Ao fim de cada cenario sao conferidos os invariantes do banco.
 */

let p: Plataforma;
beforeEach(async () => {
  p = await criarPlataforma();
});
afterEach(async () => {
  p.invariantes();
  await p.fechar();
});

type Linha = Record<string, unknown>;
const lista = (corpo: Record<string, unknown>, chave: string) => corpo[chave] as Linha[];

async function disponiveis(excursaoId: number): Promise<number> {
  const publica = (await p.chamar('GET', `/api/excursoes/${excursaoId}`)).json['excursao'] as Linha;
  return Number(publica['vagas_disponiveis']);
}
const painel = async () => (await p.admin.chamar('GET', '/api/admin/painel')).json['painel'] as { reservas: Linha; valores: Record<string, number>; pendencias: number; emails_com_falha: number };
const avisos = async (quem: Pessoa) => lista((await quem.chamar('GET', '/api/avisos')).json, 'avisos').map((a) => String(a['tipo']));
const minhas = async (quem: Pessoa) => (await quem.chamar('GET', '/api/reservas')).json as { em_andamento: Linha[]; historico: Linha[] };
async function processarTodos(resultado: 'aprovado' | 'recusado' = 'aprovado'): Promise<number> {
  const pendentes = lista((await p.admin.chamar('GET', '/api/admin/reembolsos?situacao=pendente&limite=50')).json, 'reembolsos');
  for (const r of pendentes) expect((await p.admin.chamar('POST', `/api/admin/reembolsos/${Number(r['id'])}/processar`, { resultado })).status).toBe(200);
  return pendentes.length;
}

describe('fluxos 1 a 7 e 9: da conta a conclusao, com cancelamento e inadimplencia', () => {
  it('um ciclo completo da excursao mantem reservas, vagas, valores, avisos, painel e historico coerentes', async () => {
    // Fluxo 9: o administrador configura e publica.
    const e = await p.publicar({ capacidade: 3 });

    // Fluxo 2: o visitante consulta.
    const publicas = lista((await p.chamar('GET', '/api/excursoes')).json, 'excursoes');
    expect(publicas.map((x) => x['id'])).toEqual([e]);
    expect(await disponiveis(e)).toBe(3);

    // Fluxo 1: tres visitantes criam conta e entram; a quarta pessoa chega depois.
    const [ana, bia, caio] = [await p.passageiro(), await p.passageiro(), await p.passageiro()];

    // Fluxos 3 e 4: reserva integral com retencao e pagamento.
    const rAna = await p.reservar(ana, e, 'integral');
    expect((await p.checkout(ana, rAna)).status).toBe(200);
    expect(await disponiveis(e)).toBe(2);
    await p.pagar(ana, rAna);
    expect(p.situacao(rAna)).toBe('pronto_para_embarque');

    // Fluxo 5: duas reservas parceladas; uma quita, a outra fica so na primeira.
    const rBia = await p.reservaPaga(bia, e, 'parcelada');
    const rCaio = await p.reservaPaga(caio, e, 'parcelada');
    expect(await disponiveis(e)).toBe(0);
    p.relogio.agora = new Date(INICIO.getTime() + 2 * DIA);
    await p.pagar(bia, rBia);
    expect(p.situacao(rBia)).toBe('pronto_para_embarque');

    // Sem vaga: a quarta pessoa nao consegue.
    const davi = await p.passageiro();
    const cheia = await davi.chamar('POST', '/api/reservas', { excursao_id: e });
    expect(cheia.status).toBe(409);

    p.rotina();
    expect((await painel()).valores).toMatchObject({ recebido_centavos: 15001 + 15001 + 7500, devolvido_centavos: 0, a_receber_centavos: 7501 });

    // Fluxo 9: campos protegidos e consultas administrativas.
    const atual = p.excursaoDe(await p.admin.chamar('GET', `/api/admin/excursoes/${e}`));
    expect((await p.admin.chamar('PATCH', `/api/admin/excursoes/${e}`, { preco_centavos: 1, versao: atual['versao'] })).status).toBe(409);
    expect((await p.admin.chamar('GET', '/api/admin/reservas')).json['total']).toBe(3);
    expect((await p.admin.chamar('GET', `/api/admin/passageiros/${caio.id}`)).status).toBe(200);

    // Fluxo 5: vencido o prazo, quem nao quitou perde a reserva, a vaga volta e outra pessoa pode ocupa-la.
    p.relogio.agora = PRAZO;
    p.rotina();
    expect(p.situacao(rCaio)).toBe('cancelada');
    expect(await disponiveis(e)).toBe(1);
    const rDavi = await p.reservaPaga(davi, e);
    expect(await disponiveis(e)).toBe(0);

    // Fluxo 7: faltando 4 dias para a partida, Bia cancela sem reembolso e a vaga volta.
    p.relogio.agora = new Date(PARTIDA.getTime() - 4 * DIA);
    expect((await p.cancelar(bia, rBia)).status).toBe(200);
    expect(await disponiveis(e)).toBe(1);
    expect(p.numero('SELECT COUNT(*) AS n FROM reembolso')).toBe(0);

    // Fluxo 6: depois do fim, a rotina conclui as prontas.
    p.relogio.agora = DIA_SEGUINTE_AO_FIM;
    p.rotina();
    p.rotina(); // repetir nao muda nada
    expect([rAna, rBia, rCaio, rDavi].map((id) => p.situacao(id))).toEqual(['concluida', 'cancelada', 'cancelada', 'concluida']);
    expect((await p.chamar('GET', '/api/excursoes')).json['excursoes']).toEqual([]);
    expect((await minhas(ana)).historico.map((r) => r['id'])).toEqual([rAna]);

    // Avisos: um por acontecimento, so para o proprio passageiro.
    expect(await avisos(ana)).toEqual(['pagamento_confirmado']);
    expect(await avisos(bia)).toEqual(['cancelada_passageiro', 'pagamento_confirmado', 'pagamento_confirmado']);
    expect(await avisos(caio)).toEqual(['cancelada_inadimplencia', 'pagamento_confirmado']);
    expect(await avisos(davi)).toEqual(['pagamento_confirmado']);
    expect(p.emails).toHaveLength(7);
    expect(p.numero('SELECT COUNT(*) AS n FROM mensagem')).toBe(7);

    // Painel e historico ao fim.
    const fim = await painel();
    expect(fim.reservas).toMatchObject({ concluida: 2, cancelada: 2, total: 4 });
    expect(fim.valores).toEqual({ recebido_centavos: 15001 * 3 + 7500, devolvido_centavos: 0, liquido_centavos: 15001 * 3 + 7500, a_devolver_centavos: 0, a_receber_centavos: 0 });
    expect(fim.pendencias).toBe(0);
    expect(fim.emails_com_falha).toBe(0);
    const doSistema = lista((await p.admin.chamar('GET', '/api/admin/historico?origem=sistema&entidade=reserva')).json, 'eventos');
    expect(doSistema.map((x) => x['acao'])).toEqual(expect.arrayContaining(['reserva.concluida', 'reserva.vencimento_segunda_parcela']));
  });

  it('o reembolso pelo cancelamento percorre fila, recusa, nova tentativa e estorno', async () => {
    const e = await p.publicar();
    const ana = await p.passageiro();
    const id = await p.reservaPaga(ana, e);
    p.relogio.agora = new Date(PARTIDA.getTime() - 10 * DIA);
    expect((await p.cancelar(ana, id)).status).toBe(200);
    expect((await painel()).valores['a_devolver_centavos']).toBe(7500);
    expect(await processarTodos('recusado')).toBe(1);
    expect((await painel()).valores).toMatchObject({ a_devolver_centavos: 7500, devolvido_centavos: 0 });
    const reembolso = Number(p.linha('SELECT id FROM reembolso')?.['id']);
    for (let i = 0; i < 2; i += 1) expect((await p.admin.chamar('POST', `/api/admin/reembolsos/${reembolso}/processar`, { resultado: 'aprovado' })).status).toBe(200);
    expect((await painel()).valores).toMatchObject({ a_devolver_centavos: 0, devolvido_centavos: 7500, liquido_centavos: 7501 });
    // metade devolvida: o pagamento continua confirmado (so vira estornado com a devolucao inteira)
    expect(p.linha('SELECT situacao FROM pagamento')?.['situacao']).toBe('confirmado');
    p.rotina();
    expect((await avisos(ana)).sort()).toEqual(['cancelada_passageiro', 'pagamento_confirmado', 'reembolso_processado']);
    // a vaga liberada permite uma nova reserva da mesma pessoa
    expect((await ana.chamar('POST', '/api/reservas', { excursao_id: e })).status).toBe(201);
  });
});

describe('fluxo 8: cancelamento pela organizacao com reservas em todos os estagios', () => {
  it('devolve tudo o que foi pago, encerra o que estava aberto e avisa cada um', async () => {
    const e = await p.publicar({ capacidade: 4 });
    const [integral, parcial, semPagar, pendente] = [await p.passageiro(), await p.passageiro(), await p.passageiro(), await p.passageiro()];
    const a = await p.reservaPaga(integral, e);
    const b = await p.reservaPaga(parcial, e, 'parcelada');
    const c = await p.reservar(semPagar, e);
    const d = await p.reservar(pendente, e);
    await p.checkout(pendente, d);
    await p.iniciarPagamento(pendente, d);

    const previa = (await p.admin.chamar('GET', `/api/admin/excursoes/${e}/cancelamento`)).json['previa'] as Linha;
    expect(previa['valor_total_centavos']).toBe(15001 + 7500);
    expect((await p.admin.chamar('POST', `/api/admin/excursoes/${e}/cancelamento`, { justificativa: 'Motivo ficticio.' })).status).toBe(200);
    expect([a, b, c, d].map((id) => p.situacao(id))).toEqual(['cancelada', 'cancelada', 'cancelada', 'cancelada']);
    expect(p.ocupadas(e)).toBe(0);
    expect((await p.chamar('GET', `/api/excursoes/${e}`)).status).toBe(404);

    // A confirmacao que estava a caminho chega depois: o pagamento ja foi recusado e nada muda.
    expect((await p.simular(pendente, d)).status).toBe(409);
    expect(p.situacao(d)).toBe('cancelada');

    expect(await processarTodos()).toBe(2);
    expect(p.db.prepare('SELECT situacao FROM pagamento ORDER BY id').all().map((x) => x['situacao'])).toEqual(['estornado', 'estornado', 'falhou']);
    p.relogio.agora = DIA_SEGUINTE_AO_FIM;
    p.rotina();
    expect([a, b, c, d].map((id) => p.situacao(id))).toEqual(['cancelada', 'cancelada', 'cancelada', 'cancelada']);
    expect((await painel()).valores).toMatchObject({ recebido_centavos: 22501, devolvido_centavos: 22501, liquido_centavos: 0, a_devolver_centavos: 0 });
    expect((await avisos(integral)).sort()).toEqual(['cancelada_organizacao', 'pagamento_confirmado', 'reembolso_processado']);
    expect(await avisos(semPagar)).toEqual(['cancelada_organizacao']);
  });
});

describe('ultima vaga, retencao vencida e confirmacao tardia', () => {
  it('a disputa pela ultima vaga termina com uma ocupacao e o dinheiro do outro devolvido', async () => {
    const e = await p.publicar({ capacidade: 1 });
    const [ana, bia] = [await p.passageiro(), await p.passageiro()];
    const rAna = await p.reservar(ana, e);
    const rBia = await p.reservar(bia, e);

    // As duas tentam ao mesmo tempo: so uma retem.
    const [x, y] = await Promise.all([p.checkout(ana, rAna), p.checkout(bia, rBia)]);
    expect([x.status, y.status].sort()).toEqual([200, 409]);
    const [vencedora, outra, rVencedora, rOutra] = x.status === 200 ? [ana, bia, rAna, rBia] : [bia, ana, rBia, rAna];
    await p.iniciarPagamento(vencedora, rVencedora);

    // A retencao vence antes da confirmacao; a outra pessoa retem, paga e ocupa.
    p.relogio.agora = new Date(INICIO.getTime() + 20 * MIN);
    p.rotina();
    expect((await p.checkout(outra, rOutra)).status).toBe(200);
    await p.pagar(outra, rOutra);

    // A confirmacao atrasada nao cria vaga (RN-022) e vira pendencia, tratada pelo administrador.
    expect((await p.simular(vencedora, rVencedora)).status).toBe(200);
    expect(p.ocupadas(e)).toBe(1);
    expect((await painel()).pendencias).toBe(1);
    const pendencias = lista((await p.admin.chamar('GET', '/api/admin/pendencias')).json, 'pendencias');
    const pagamento = pendencias[0]!['pagamento'] as Linha;
    expect((await p.admin.chamar('POST', `/api/admin/pendencias/${Number(pagamento['id'])}/reembolso`)).status).toBe(200);
    expect(await processarTodos()).toBe(1);
    expect(p.situacao(rVencedora)).toBe('cancelada');
    expect(p.situacao(rOutra)).toBe('pronto_para_embarque');
    expect(p.ocupadas(e)).toBe(1);
    expect((await painel()).pendencias).toBe(0);
    p.rotina();
    expect((await avisos(vencedora)).sort()).toEqual(['cancelada_apos_reembolso', 'pagamento_em_analise', 'reembolso_processado']);
  });
});

describe('depois da partida', () => {
  it('confirmacao tardia vira pendencia, quem nao pagou e cancelado e nada fica concluido sem pagamento', async () => {
    const e = await p.publicar();
    const [pagou, atrasou, naoPagou] = [await p.passageiro(), await p.passageiro(), await p.passageiro()];
    const a = await p.reservaPaga(pagou, e);
    const b = await p.reservar(atrasou, e);
    await p.checkout(atrasou, b);
    await p.iniciarPagamento(atrasou, b);
    const c = await p.reservar(naoPagou, e);

    p.relogio.agora = new Date(PARTIDA.getTime() + DIA);
    expect((await p.simular(atrasou, b)).status).toBe(200);
    expect((await pagou.chamar('POST', `/api/reservas/${a}/cancelamento`, { percentual_previsto: 0 })).status).toBe(409);

    p.relogio.agora = DIA_SEGUINTE_AO_FIM;
    p.rotina();
    expect([a, b, c].map((id) => p.situacao(id))).toEqual(['concluida', 'aguardando_pagamento', 'cancelada']);
    expect(p.ocupadas(e)).toBe(1);

    const pendencias = lista((await p.admin.chamar('GET', '/api/admin/pendencias')).json, 'pendencias');
    expect(pendencias).toHaveLength(1);
    const pagamento = pendencias[0]!['pagamento'] as Linha;
    expect((await p.admin.chamar('POST', `/api/admin/pendencias/${Number(pagamento['id'])}/reembolso`)).status).toBe(200);
    expect(await processarTodos()).toBe(1);
    expect(p.situacao(b)).toBe('cancelada');
    p.rotina();
    expect((await painel()).valores).toMatchObject({ recebido_centavos: 30002, devolvido_centavos: 15001, liquido_centavos: 15001, a_devolver_centavos: 0 });
    expect(await avisos(naoPagou)).toEqual(['cancelada_excursao_terminada']);
    expect((await avisos(atrasou)).sort()).toEqual(['cancelada_apos_reembolso', 'pagamento_em_analise', 'reembolso_processado']);
  });
});

describe('rotina parada por muito tempo', () => {
  it('uma unica passagem poe tudo em dia, na ordem certa e sem repetir', async () => {
    const e = await p.publicar();
    const [a, b, c] = [await p.passageiro(), await p.passageiro(), await p.passageiro()];
    const quitada = await p.reservaPaga(a, e);
    const inadimplente = await p.reservaPaga(b, e, 'parcelada');
    const abandonada = await p.reservar(c, e);
    await p.checkout(c, abandonada);

    p.relogio.agora = new Date(DIA_SEGUINTE_AO_FIM.getTime() + 30 * DIA);
    p.rotina();
    expect([quitada, inadimplente, abandonada].map((id) => p.situacao(id))).toEqual(['concluida', 'cancelada', 'cancelada']);
    expect(p.ocupadas(e)).toBe(1);
    const registros = p.numero('SELECT COUNT(*) AS n FROM auditoria');
    const mensagens = p.numero('SELECT COUNT(*) AS n FROM mensagem');
    const enviados = p.emails.length;
    p.rotina();
    expect(p.numero('SELECT COUNT(*) AS n FROM auditoria')).toBe(registros);
    expect(p.numero('SELECT COUNT(*) AS n FROM mensagem')).toBe(mensagens);
    expect(p.emails).toHaveLength(enviados);
  });
});
