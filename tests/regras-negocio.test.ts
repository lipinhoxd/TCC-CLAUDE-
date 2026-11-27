import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openDatabase } from '../server/db/connection.ts';
import { withTransaction } from '../server/db/transaction.ts';
import { ocuparVaga } from '../server/vagas/disponibilidade.ts';
import { DIA, DIA_SEGUINTE_AO_FIM, EXCURSAO, INICIO, MIN, PARTIDA, PRAZO, SENHA, criarPlataforma } from './helpers/plataforma.ts';
import type { Pessoa, Plataforma, Resposta } from './helpers/plataforma.ts';

/**
 * Validacao das regras de negocio (AGT-017): um bloco por regra, pela API da aplicacao completa. O nome do bloco comeca pelo numero da
 * regra, para a matriz de validacao (docs/validacao-das-regras.md) e para rodar uma regra isolada com -t. RN-043 e RN-044 sao de
 * governanca e nao sao verificaveis por teste.
 */

let p: Plataforma;
beforeEach(async () => {
  p = await criarPlataforma();
});
afterEach(async () => {
  p.invariantes();
  await p.fechar();
});

const antes = (d: Date, ms = 1) => new Date(d.getTime() - ms);
const depois = (d: Date, ms = 1) => new Date(d.getTime() + ms);
const campos = (r: Resposta) => (r.json['fields'] ?? {}) as Record<string, string>;
const codigo = (r: Resposta) => r.json['error'];
const cadastrar = (extra: Record<string, unknown>) => p.chamar('POST', '/api/auth/register', p.dadosDeCadastro(extra));
const detalhe = async (quem: Pessoa, id: number) => p.reservaDe(await quem.chamar('GET', `/api/reservas/${id}`));
const reembolsos = (reservaId: number) => p.db.prepare('SELECT valor_centavos AS v, percentual_aplicado AS pc, situacao AS s FROM reembolso WHERE reserva_id = ? ORDER BY id').all(reservaId).map((r) => [r['v'], r['pc'], r['s']]);
const pagamentos = (reservaId: number) => p.db.prepare('SELECT parcela, situacao, valor_centavos AS v, pendencia_administrativa AS pe FROM pagamento WHERE reserva_id = ? ORDER BY id').all(reservaId).map((r) => [r['parcela'], r['situacao'], r['v'], r['pe']]);
const disponiveis = async (excursaoId: number) => Number(((await p.chamar('GET', `/api/excursoes/${excursaoId}`)).json['excursao'] as Record<string, unknown>)['vagas_disponiveis']);

describe('RN-001 maioridade', () => {
  it('aceita quem completa 18 anos hoje e recusa quem completa amanha', async () => {
    expect((await cadastrar({ data_nascimento: '2008-11-13' })).status).toBe(201);
    const menor = await cadastrar({ data_nascimento: '2008-11-14' });
    expect(menor.status).toBe(400);
    expect(campos(menor)['data_nascimento']).toBe('menor_de_idade');
  });

  it('o "hoje" e o de Brasilia: as 22h da vespera ainda nao completou 18 anos (RN-039)', async () => {
    p.relogio.sessao = new Date('2026-11-14T01:00:00.000Z'); // 13/11 as 22:00 em Brasilia
    const vespera = await cadastrar({ data_nascimento: '2008-11-14' });
    expect(vespera.status).toBe(400);
    expect(campos(vespera)['data_nascimento']).toBe('menor_de_idade');
    expect((await cadastrar({ data_nascimento: '2008-11-13' })).status).toBe(201);
    p.relogio.sessao = new Date('2026-11-14T03:00:00.000Z'); // 14/11 00:00 em Brasilia
    expect((await cadastrar({ data_nascimento: '2008-11-14' })).status).toBe(201);
  });
});

describe('RN-002 CPF unico', () => {
  it('recusa o segundo cadastro com o mesmo CPF, mesmo formatado de outro jeito', async () => {
    const primeiro = p.dadosDeCadastro();
    expect((await p.chamar('POST', '/api/auth/register', primeiro)).status).toBe(201);
    const c = primeiro.cpf;
    const formatado = `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
    expect((await cadastrar({ cpf: formatado })).status).toBe(409);
    expect(p.numero('SELECT COUNT(*) AS n FROM usuario WHERE cpf = ?', c)).toBe(1);
  });
});

describe('RN-003 e-mail unico', () => {
  it('recusa o mesmo e-mail, inclusive com maiusculas e espacos', async () => {
    expect((await cadastrar({ email: 'repetido@exemplo.com' })).status).toBe(201);
    expect((await cadastrar({ email: '  Repetido@Exemplo.com ' })).status).toBe(409);
    expect(p.numero("SELECT COUNT(*) AS n FROM usuario WHERE email = 'repetido@exemplo.com'")).toBe(1);
  });
});

describe('RN-004 campos obrigatorios', () => {
  it.each(['nome_completo', 'cpf', 'data_nascimento', 'telefone', 'email', 'senha'])('sem %s o cadastro e recusado', async (campo) => {
    const r = await cadastrar({ [campo]: undefined });
    expect(r.status).toBe(400);
    expect(campos(r)[campo]).toBe('obrigatorio');
    expect(p.numero("SELECT COUNT(*) AS n FROM usuario WHERE perfil = 'passageiro'")).toBe(0);
  });
});

describe('RN-005 validacao do telefone (mecanismo definido: so o formato)', () => {
  it('recusa formato invalido e grava o numero normalizado; a posse nao e comprovada', async () => {
    for (const telefone of ['12345', '(20) 98765-4321', '(11) 18765-4321', 'telefone']) {
      const r = await cadastrar({ telefone });
      expect(campos(r)['telefone'], telefone).toBe('invalido');
    }
    const ok = p.dadosDeCadastro({ telefone: '(11) 98765-4321' });
    expect((await p.chamar('POST', '/api/auth/register', ok)).status).toBe(201);
    expect(p.linha('SELECT telefone FROM usuario WHERE email = ?', ok.email)?.['telefone']).toBe('+5511987654321');
  });
});

describe('RN-006 login por e-mail e senha', () => {
  it('entra com e-mail e senha; recusa senha errada, e-mail inexistente e CPF no lugar do e-mail', async () => {
    const dados = p.dadosDeCadastro();
    await p.chamar('POST', '/api/auth/register', dados);
    expect((await p.entrar(dados.email)).status).toBe(200);
    expect((await p.entrar(dados.email, 'Outra-senha-2026')).status).toBe(401);
    expect((await p.entrar('ninguem@exemplo.com')).status).toBe(401);
    expect((await p.chamar('POST', '/api/auth/login', { cpf: dados.cpf, senha: SENHA })).status).toBe(401);
    expect((await p.entrar(dados.cpf)).status).toBe(401);
  });
});

describe('RN-007 recuperacao com token de uso unico e validade limitada', () => {
  const pedir = async (email: string) => {
    expect((await p.chamar('POST', '/api/auth/recovery/request', { email })).status).toBe(202);
    return String(p.recuperacoes.at(-1)?.token);
  };
  const confirmar = (token: string, senha = 'Nova-senha-2026') => p.chamar('POST', '/api/auth/recovery/confirm', { token, nova_senha: senha });

  it('o token serve uma unica vez', async () => {
    const a = await p.passageiro();
    const token = await pedir(a.email);
    expect((await confirmar(token)).status).toBe(204);
    expect((await confirmar(token, 'Terceira-senha-2026')).status).toBe(400);
    expect((await p.entrar(a.email, 'Nova-senha-2026')).status).toBe(200);
  });

  it('vale 30 minutos', async () => {
    const a = await p.passageiro();
    const vencido = await pedir(a.email);
    p.relogio.sessao = depois(INICIO, 30 * MIN);
    expect((await confirmar(vencido)).status).toBe(400);
    const novo = await pedir(a.email);
    p.relogio.sessao = depois(p.relogio.sessao, 30 * MIN - 1);
    expect((await confirmar(novo)).status).toBe(204);
  });
});

describe('RN-008 sessao expira, pode ser revogada e e revalidada no servidor', () => {
  it('sair revoga a sessao', async () => {
    const a = await p.passageiro();
    expect((await a.chamar('GET', '/api/me')).status).toBe(200);
    expect((await a.chamar('POST', '/api/auth/logout')).status).toBe(204);
    expect((await a.chamar('GET', '/api/me')).status).toBe(401);
    expect((await a.chamar('GET', '/api/reservas')).status).toBe(401);
  });

  it('a sessao vence no prazo', async () => {
    const a = await p.passageiro();
    p.relogio.sessao = depois(INICIO, 8 * 60 * MIN - 1);
    expect((await a.chamar('GET', '/api/me')).status).toBe(200);
    p.relogio.sessao = depois(INICIO, 8 * 60 * MIN);
    expect((await a.chamar('GET', '/api/me')).status).toBe(401);
  });

  it('o perfil e conferido no servidor a cada pedido', async () => {
    const a = await p.passageiro();
    expect((await a.chamar('GET', '/api/admin/reservas')).status).toBe(403);
    expect((await p.admin.chamar('GET', '/api/admin/reservas')).status).toBe(200);
    p.db.prepare("UPDATE usuario SET perfil = 'passageiro' WHERE id = ?").run(p.admin.id);
    expect((await p.admin.chamar('GET', '/api/admin/reservas')).status).toBe(403);
  });
});

describe('RN-009 reserva individual de um passageiro autenticado', () => {
  it('exige passageiro autenticado, usa a sessao e nao deixa escolher outra pessoa', async () => {
    const e = await p.publicar();
    const a = await p.passageiro();
    const b = await p.passageiro();
    expect((await p.chamar('POST', '/api/reservas', { excursao_id: e })).status).toBe(401);
    expect((await p.admin.chamar('POST', '/api/reservas', { excursao_id: e })).status).toBe(403);
    expect(campos(await a.chamar('POST', '/api/reservas', { excursao_id: e, usuario_id: b.id }))['usuario_id']).toBe('campo_nao_permitido');
    const id = await p.reservar(a, e);
    expect(p.linha('SELECT usuario_id AS u FROM reserva WHERE id = ?', id)?.['u']).toBe(a.id);
    expect((await b.chamar('GET', `/api/reservas/${id}`)).status).toBe(404);
  });

  it('uma reserva ativa por passageiro e excursao', async () => {
    const e = await p.publicar();
    const a = await p.passageiro();
    await p.reservar(a, e);
    const segunda = await a.chamar('POST', '/api/reservas', { excursao_id: e });
    expect(segunda.status).toBe(409);
    expect(codigo(segunda)).toBe('reserva_ativa_existente');
  });
});

describe('RN-010 checkout obrigatorio', () => {
  it('sem checkout nao ha pagamento nem vaga', async () => {
    const e = await p.publicar();
    const a = await p.passageiro();
    const id = await p.reservar(a, e);
    const sem = await p.iniciarPagamento(a, id);
    expect(sem.status).toBe(409);
    expect(codigo(sem)).toBe('retencao_inativa');
    expect(pagamentos(id)).toEqual([]);
    expect(p.ocupadas(e)).toBe(0);
    await p.checkout(a, id);
    expect((await p.iniciarPagamento(a, id)).status).toBe(200);
  });
});

describe('RN-011 pagamento integral como padrao', () => {
  it('sem informar a modalidade, a reserva e integral', async () => {
    const e = await p.publicar();
    const a = await p.passageiro();
    const id = await p.reservar(a, e);
    expect((await detalhe(a, id))['modalidade']).toBe('integral');
    await p.checkout(a, id);
    await p.pagar(a, id);
    expect(pagamentos(id)).toEqual([['unica', 'confirmado', 15001, null]]);
  });
});

describe('RN-012 duas parcelas de 50% habilitadas por excursao', () => {
  it('so a excursao habilitada aceita; as parcelas somam o preco', async () => {
    const sem = await p.publicar({ nome: 'Sem Parcelas Ficticia', parcelamento_habilitado: false, prazo_segunda_parcela: undefined });
    const com = await p.publicar();
    const a = await p.passageiro();
    const recusada = await a.chamar('POST', '/api/reservas', { excursao_id: sem, modalidade: 'parcelada' });
    expect(campos(recusada)['modalidade']).toBe('parcelamento_indisponivel');
    const id = await p.reservaPaga(a, com, 'parcelada');
    await p.pagar(a, id);
    expect(pagamentos(id).map((x) => [x[0], x[2]])).toEqual([
      ['primeira', 7500],
      ['segunda', 7501],
    ]);
  });
});

describe('RN-013 data limite da segunda parcela', () => {
  it('e por excursao, anterior a partida, e vale ate 23:59:59 de Brasilia', async () => {
    for (const data of ['2026-12-10', '2026-12-11']) {
      const r = await p.admin.chamar('POST', '/api/admin/excursoes', { ...EXCURSAO, prazo_segunda_parcela: data });
      expect(campos(r)['prazo_segunda_parcela'], data).toBe('nao_anterior_a_partida');
    }
    expect(campos(await p.admin.chamar('POST', '/api/admin/excursoes', { ...EXCURSAO, prazo_segunda_parcela: undefined }))['prazo_segunda_parcela']).toBe('obrigatorio');
    const a = await p.publicar();
    const b = await p.publicar({ nome: 'Outra Ficticia', prazo_segunda_parcela: '2026-12-09' });
    const prazo = (id: number) => p.linha('SELECT prazo_segunda_parcela_utc AS v FROM excursao WHERE id = ?', id)?.['v'];
    expect(prazo(a)).toBe('2026-12-06T02:59:59.000Z');
    expect(prazo(b)).toBe('2026-12-10T02:59:59.000Z');
  });
});

describe('RN-014 retencao temporaria no checkout', () => {
  it('o checkout cria uma retencao com prazo de 15 minutos', async () => {
    const e = await p.publicar();
    const a = await p.passageiro();
    const id = await p.reservar(a, e);
    expect(p.numero('SELECT COUNT(*) AS n FROM retencao_vaga')).toBe(0);
    const r = await p.checkout(a, id);
    expect(p.reservaDe(r)['retencao']).toMatchObject({ situacao: 'ativa', expira_em: depois(INICIO, 15 * MIN).toISOString() });
  });
});

describe('RN-015 a retencao nao e ocupacao definitiva', () => {
  it('reduz a disponibilidade sem ocupar, e a vaga volta quando vence', async () => {
    const e = await p.publicar({ capacidade: 2 });
    const a = await p.passageiro();
    const id = await p.reservar(a, e);
    await p.checkout(a, id);
    expect(p.ocupadas(e)).toBe(0);
    expect(await disponiveis(e)).toBe(1);
    p.relogio.agora = depois(INICIO, 15 * MIN);
    expect(await disponiveis(e)).toBe(2);
    p.rotina();
    expect(p.linha('SELECT situacao FROM retencao_vaga')?.['situacao']).toBe('expirada');
    expect(p.situacao(id)).toBe('aguardando_pagamento');
  });
});

describe('RN-016 pagamento integral confirmado', () => {
  it('converte a retencao em ocupacao e deixa a reserva Pronta para embarque', async () => {
    const e = await p.publicar();
    const a = await p.passageiro();
    const id = await p.reservaPaga(a, e);
    expect(p.ocupadas(e)).toBe(1);
    expect(p.linha('SELECT situacao FROM retencao_vaga')?.['situacao']).toBe('confirmada');
    expect(p.situacao(id)).toBe('pronto_para_embarque');
  });
});

describe('RN-017 primeira parcela', () => {
  it('ocupa a vaga e mantem a obrigacao pendente', async () => {
    const e = await p.publicar();
    const a = await p.passageiro();
    const id = await p.reservaPaga(a, e, 'parcelada');
    expect(p.ocupadas(e)).toBe(1);
    expect(p.situacao(id)).toBe('aguardando_pagamento');
    expect((await detalhe(a, id))['proxima_parcela']).toBe('segunda');
  });
});

describe('RN-018 segunda parcela', () => {
  it('conclui a quitacao sem ocupar outra vaga', async () => {
    const e = await p.publicar();
    const a = await p.passageiro();
    const id = await p.reservaPaga(a, e, 'parcelada');
    await p.pagar(a, id);
    expect(pagamentos(id).map((x) => x[1])).toEqual(['confirmado', 'confirmado']);
    expect((await detalhe(a, id))['proxima_parcela']).toBeNull();
    expect(p.situacao(id)).toBe('pronto_para_embarque');
    expect(p.ocupadas(e)).toBe(1);
  });
});

describe('RN-019 segunda parcela fora do prazo libera a vaga', () => {
  it('a vaga continua ocupada ate o ultimo instante e e liberada no prazo', async () => {
    const e = await p.publicar({ capacidade: 1 });
    const a = await p.passageiro();
    const id = await p.reservaPaga(a, e, 'parcelada');
    p.relogio.agora = antes(PRAZO);
    p.rotina();
    expect(p.ocupadas(e)).toBe(1);
    p.relogio.agora = PRAZO;
    p.rotina();
    expect(p.ocupadas(e)).toBe(0);
    expect(p.situacao(id)).toBe('cancelada');
    const b = await p.passageiro();
    await p.reservaPaga(b, e);
    expect(p.ocupadas(e)).toBe(1);
  });
});

describe('RN-020 primeira parcela nao reembolsavel na inadimplencia', () => {
  it('fica paga, sem reembolso e sem caminho para cancelar com devolucao', async () => {
    const e = await p.publicar();
    const a = await p.passageiro();
    const id = await p.reservaPaga(a, e, 'parcelada');
    p.relogio.agora = PRAZO;
    p.rotina();
    expect(pagamentos(id)).toEqual([['primeira', 'confirmado', 7500, null]]);
    expect(reembolsos(id)).toEqual([]);
    await a.chamar('POST', `/api/reservas/${id}/cancelamento`, { percentual_previsto: 100 });
    expect((await p.admin.chamar('GET', '/api/admin/pendencias')).json['total']).toBe(0);
    await p.admin.chamar('POST', `/api/admin/excursoes/${e}/cancelamento`, { justificativa: 'Teste ficticio.' });
    expect(reembolsos(id)).toEqual([]);
  });
});

describe('RN-021 nunca acima da capacidade', () => {
  it('pedidos simultaneos pela ultima vaga: so um consegue reter e pagar', async () => {
    const e = await p.publicar({ capacidade: 2 });
    const pessoas = [];
    for (let i = 0; i < 5; i += 1) {
      const quem = await p.passageiro();
      pessoas.push({ quem, id: await p.reservar(quem, e) });
    }
    const respostas = await Promise.all(pessoas.map((x) => p.checkout(x.quem, x.id)));
    expect(respostas.filter((r) => r.status === 200)).toHaveLength(2);
    expect(respostas.filter((r) => codigo(r) === 'sem_vagas')).toHaveLength(3);
    for (const [i, r] of respostas.entries()) if (r.status === 200) await p.pagar(pessoas[i]!.quem, pessoas[i]!.id);
    expect(p.ocupadas(e)).toBe(2);
  });

  it('o administrador nao reduz a capacidade abaixo do ocupado e o banco recusa o excedente', async () => {
    const e = await p.publicar({ capacidade: 2 });
    await p.reservaPaga(await p.passageiro(), e);
    await p.reservaPaga(await p.passageiro(), e);
    // Concluidas as reservas, os campos deixam de estar bloqueados (RN-036), mas as vagas continuam ocupadas.
    p.relogio.agora = DIA_SEGUINTE_AO_FIM;
    p.rotina();
    const excursao = p.excursaoDe(await p.admin.chamar('GET', `/api/admin/excursoes/${e}`));
    const r = await p.admin.chamar('PATCH', `/api/admin/excursoes/${e}`, { capacidade: 1, versao: excursao['versao'] });
    expect(campos(r)['capacidade']).toBe('menor_que_vagas_ocupadas');
    expect(() => p.db.prepare('UPDATE excursao SET vagas_ocupadas = 3 WHERE id = ?').run(e)).toThrow(/constraint/i);
  });
});

describe('RN-022 confirmacao apos a retencao expirar, sem vaga', () => {
  it('fica registrada para a administracao e nao cria vaga', async () => {
    const e = await p.publicar({ capacidade: 1 });
    const a = await p.passageiro();
    const id = await p.reservar(a, e);
    await p.checkout(a, id);
    await p.iniciarPagamento(a, id);
    p.relogio.agora = depois(INICIO, 16 * MIN);
    await p.reservaPaga(await p.passageiro(), e);
    expect((await p.simular(a, id)).status).toBe(200);
    expect(p.ocupadas(e)).toBe(1);
    expect(p.situacao(id)).toBe('aguardando_pagamento');
    expect(pagamentos(id)).toEqual([['unica', 'confirmado', 15001, 'confirmacao_sem_vaga']]);
    expect((await p.admin.chamar('GET', '/api/admin/pendencias')).json['total']).toBe(1);
  });
});

describe('RN-023 quatro situacoes da reserva', () => {
  it('o banco so aceita as quatro', async () => {
    const e = await p.publicar();
    const id = await p.reservar(await p.passageiro(), e);
    for (const situacao of ['aguardando_pagamento', 'pronto_para_embarque', 'concluida', 'cancelada']) {
      p.db.prepare('UPDATE reserva SET situacao = ? WHERE id = ?').run(situacao, id);
    }
    expect(() => p.db.prepare("UPDATE reserva SET situacao = 'em_analise' WHERE id = ?").run(id)).toThrow(/constraint/i);
    expect((await p.admin.chamar('GET', '/api/admin/reservas?situacao=em_analise')).status).toBe(400);
  });
});

describe('RN-024 quitadas ficam Prontas para embarque', () => {
  it('integral paga e parcelada quitada ficam prontas; so com a primeira, nao', async () => {
    const e = await p.publicar();
    const a = await p.passageiro();
    const b = await p.passageiro();
    const integral = await p.reservaPaga(a, e);
    const parcelada = await p.reservaPaga(b, e, 'parcelada');
    expect(p.situacao(integral)).toBe('pronto_para_embarque');
    expect(p.situacao(parcelada)).toBe('aguardando_pagamento');
    await p.pagar(b, parcelada);
    expect(p.situacao(parcelada)).toBe('pronto_para_embarque');
  });
});

describe('RN-025 conclusao um dia apos a data final', () => {
  it('muda a partir de 00:00 de Brasilia do dia seguinte, sem ninguem consultar, e so as elegiveis', async () => {
    const e = await p.publicar();
    const pronta = await p.reservaPaga(await p.passageiro(), e);
    const parcial = await p.reservaPaga(await p.passageiro(), e, 'parcelada');
    // Ajuste artificial no banco: prazo depois do fim, para existir uma parcelada nao quitada na data da conclusao. O esquema exige
    // prazo anterior a partida, por isso os dois mudam.
    p.db.prepare("UPDATE excursao SET prazo_segunda_parcela_utc = '2027-01-01T02:59:59.000Z', partida_utc = '2027-01-02T10:00:00.000Z' WHERE id = ?").run(e);
    p.relogio.agora = antes(DIA_SEGUINTE_AO_FIM);
    p.rotina();
    expect(p.situacao(pronta)).toBe('pronto_para_embarque');
    p.relogio.agora = DIA_SEGUINTE_AO_FIM;
    p.rotina();
    expect(p.situacao(pronta)).toBe('concluida');
    expect(p.situacao(parcial)).toBe('aguardando_pagamento');
  });
});

describe('RN-026 concluidas permanecem no historico', () => {
  it('continuam no historico do passageiro muito depois', async () => {
    const e = await p.publicar();
    const a = await p.passageiro();
    const id = await p.reservaPaga(a, e);
    p.relogio.agora = new Date('2029-01-01T12:00:00.000Z');
    p.rotina();
    const lista = (await a.chamar('GET', '/api/reservas')).json;
    expect((lista['historico'] as Array<Record<string, unknown>>).map((r) => [r['id'], r['situacao']])).toEqual([[id, 'concluida']]);
    expect(lista['em_andamento']).toEqual([]);
    expect((await a.chamar('POST', `/api/reservas/${id}/desistir`)).status).toBe(409);
  });
});

async function cancelarEm(instante: Date, modalidade: 'integral' | 'parcelada' = 'integral', quitar = false) {
  const e = await p.publicar({ nome: `Excursao Ficticia ${instante.getTime()}` });
  const a = await p.passageiro();
  const id = await p.reservaPaga(a, e, modalidade);
  if (quitar) await p.pagar(a, id);
  p.relogio.agora = instante;
  expect((await p.cancelar(a, id)).status).toBe(200);
  return { id, e, a };
}

describe('RN-027 duas semanas ou mais: 100%', () => {
  it('exatamente 14 dias antes ainda devolve tudo', async () => {
    const { id } = await cancelarEm(new Date(PARTIDA.getTime() - 14 * DIA));
    expect(reembolsos(id)).toEqual([[15001, 100, 'pendente']]);
  });
});

describe('RN-028 entre uma e duas semanas: 50%', () => {
  it('logo depois de 14 dias e exatamente 7 dias antes devolvem metade', async () => {
    const primeira = await cancelarEm(new Date(PARTIDA.getTime() - 14 * DIA + 1));
    expect(reembolsos(primeira.id)).toEqual([[7500, 50, 'pendente']]);
    const segunda = await cancelarEm(new Date(PARTIDA.getTime() - 7 * DIA));
    expect(reembolsos(segunda.id)).toEqual([[7500, 50, 'pendente']]);
  });
});

describe('RN-029 menos de uma semana: sem reembolso', () => {
  it('logo depois de 7 dias nada e devolvido, e a vaga e liberada', async () => {
    const { id, e } = await cancelarEm(new Date(PARTIDA.getTime() - 7 * DIA + 1));
    expect(reembolsos(id)).toEqual([]);
    expect(p.situacao(id)).toBe('cancelada');
    expect(p.ocupadas(e)).toBe(0);
  });
});

describe('RN-030 reembolso sobre o valor pago e elegivel', () => {
  it('a parcelada quitada considera as duas parcelas', async () => {
    const { id } = await cancelarEm(depois(INICIO, MIN), 'parcelada', true);
    expect(reembolsos(id)).toEqual([[15001, 100, 'pendente']]);
  });

  it('pagamento pendente nao entra no calculo', async () => {
    const e = await p.publicar();
    const a = await p.passageiro();
    const id = await p.reservar(a, e);
    await p.checkout(a, id);
    await p.iniciarPagamento(a, id);
    await p.cancelar(a, id);
    expect(reembolsos(id)).toEqual([]);
    expect(pagamentos(id)).toEqual([['unica', 'falhou', 15001, null]]);
  });
});

describe('RN-031 cancelamento pela organizacao devolve tudo', () => {
  it('100% do pago a cada afetado, mesmo perto da partida e na parcelada so com a primeira', async () => {
    const e = await p.publicar();
    const integral = await p.reservaPaga(await p.passageiro(), e);
    const parcial = await p.reservaPaga(await p.passageiro(), e, 'parcelada');
    // Ajuste artificial no banco: prazo mais proximo da partida, para ainda existir uma parcelada nao quitada tres dias antes.
    p.relogio.agora = new Date(PARTIDA.getTime() - 3 * DIA);
    p.db.prepare("UPDATE excursao SET prazo_segunda_parcela_utc = '2026-12-09T02:59:59.000Z' WHERE id = ?").run(e);
    expect((await p.admin.chamar('POST', `/api/admin/excursoes/${e}/cancelamento`, { justificativa: 'Teste ficticio.' })).status).toBe(200);
    expect(reembolsos(integral)).toEqual([[15001, 100, 'pendente']]);
    expect(reembolsos(parcial)).toEqual([[7500, 100, 'pendente']]);
    expect(p.ocupadas(e)).toBe(0);
  });
});

describe('RN-032 primeira parcela de reserva nao quitada', () => {
  it('no cancelamento pelo passageiro nao e reembolsada, mesmo com muita antecedencia', async () => {
    const { id, e } = await cancelarEm(depois(INICIO, MIN), 'parcelada');
    expect(reembolsos(id)).toEqual([]);
    expect(p.ocupadas(e)).toBe(0);
    expect(pagamentos(id)).toEqual([['primeira', 'confirmado', 7500, null]]);
  });
});

describe('RN-033 o administrador configura a excursao', () => {
  it('capacidade, preco, parcelamento e prazo, so pelo administrador', async () => {
    const a = await p.passageiro();
    expect((await p.chamar('POST', '/api/admin/excursoes', EXCURSAO)).status).toBe(401);
    expect((await a.chamar('POST', '/api/admin/excursoes', EXCURSAO)).status).toBe(403);
    const e = await p.publicar({ capacidade: 7, preco_centavos: 20000 });
    const atual = p.excursaoDe(await p.admin.chamar('GET', `/api/admin/excursoes/${e}`));
    const mudanca = { capacidade: 9, preco_centavos: 30000, parcelamento_habilitado: true, prazo_segunda_parcela: '2026-12-01', versao: atual['versao'] };
    expect((await a.chamar('PATCH', `/api/admin/excursoes/${e}`, mudanca)).status).toBe(403);
    expect((await p.admin.chamar('PATCH', `/api/admin/excursoes/${e}`, mudanca)).status).toBe(200);
    expect(p.linha('SELECT capacidade, preco_centavos, parcelamento_habilitado, prazo_segunda_parcela_utc FROM excursao WHERE id = ?', e)).toMatchObject({
      capacidade: 9,
      preco_centavos: 30000,
      parcelamento_habilitado: 1,
      prazo_segunda_parcela_utc: '2026-12-02T02:59:59.000Z',
    });
  });
});

describe('RN-034 o administrador consulta passageiros e reservas', () => {
  it('lista e detalhe, so para o administrador', async () => {
    const e = await p.publicar();
    const a = await p.passageiro();
    const id = await p.reservar(a, e);
    for (const caminho of ['/api/admin/reservas', `/api/admin/reservas/${id}`, '/api/admin/passageiros', `/api/admin/passageiros/${a.id}`]) {
      expect((await p.admin.chamar('GET', caminho)).status, caminho).toBe(200);
      expect((await a.chamar('GET', caminho)).status, caminho).toBe(403);
      expect((await p.chamar('GET', caminho)).status, caminho).toBe(401);
    }
  });
});

describe('RN-035 alteracao manual so quando autorizada e auditada', () => {
  const alterar = (id: number, situacao: string, justificativa?: string) => p.admin.chamar('POST', `/api/admin/reservas/${id}/situacao`, { situacao, ...(justificativa === undefined ? {} : { justificativa }) });

  it('recusa o que nao e autorizado e registra o que e', async () => {
    const e = await p.publicar();
    const paga = await p.reservaPaga(await p.passageiro(), e);
    const aberta = await p.reservar(await p.passageiro(), e);
    expect((await alterar(paga, 'cancelada', 'Pedido ficticio.')).status).toBe(409);
    expect((await alterar(aberta, 'pronto_para_embarque', 'Pedido ficticio.')).status).toBe(409);
    expect((await alterar(paga, 'concluida', 'Pedido ficticio.')).status).toBe(409);
    expect((await alterar(aberta, 'cancelada')).status).toBe(400);
    expect(p.situacao(aberta)).toBe('aguardando_pagamento');
    expect((await alterar(aberta, 'cancelada', 'Pedido ficticio.')).status).toBe(200);
    const evento = p.linha("SELECT ator_usuario_id AS a, estado_novo AS n FROM auditoria WHERE acao = 'reserva.cancelamento_manual'");
    expect(evento?.['a']).toBe(p.admin.id);
    expect(String(evento?.['n'])).toContain('Pedido ficticio.');
  });
});

describe('RN-036 campos protegidos com reserva ativa', () => {
  const editar = async (e: number, mudanca: Record<string, unknown>) => {
    const atual = p.excursaoDe(await p.admin.chamar('GET', `/api/admin/excursoes/${e}`));
    return p.admin.chamar('PATCH', `/api/admin/excursoes/${e}`, { ...mudanca, versao: atual['versao'] });
  };

  it.each([
    { preco_centavos: 20000 },
    { capacidade: 30 },
    { parcelamento_habilitado: false },
    { prazo_segunda_parcela: '2026-12-01' },
    { data_inicial: '2026-12-09' },
    { data_final: '2026-12-13' },
    { partida_utc: '2026-12-10T11:00:00.000Z' },
  ])('bloqueia %o', async (mudanca) => {
    const e = await p.publicar();
    await p.reservar(await p.passageiro(), e);
    const r = await editar(e, mudanca);
    expect(r.status).toBe(409);
    expect(codigo(r)).toBe('edicao_bloqueada');
  });

  it('nome, imagem e descricao continuam editaveis; sem reserva ativa tudo volta a ser editavel', async () => {
    const e = await p.publicar();
    const a = await p.passageiro();
    const id = await p.reservar(a, e);
    expect((await editar(e, { nome: 'Nome Novo Ficticio', descricao: 'Nova', imagem_ref: 'imagens/nova.png' })).status).toBe(200);
    await a.chamar('POST', `/api/reservas/${id}/desistir`);
    expect((await editar(e, { preco_centavos: 20000 })).status).toBe(200);
  });
});

describe('RN-037 nasce em rascunho; publicar e outra acao', () => {
  it('nao aparece ao publico nem aceita reserva antes de publicada', async () => {
    const r = await p.admin.chamar('POST', '/api/admin/excursoes', { ...EXCURSAO, situacao: 'publicada' });
    expect(campos(r)['situacao']).toBe('campo_nao_permitido');
    const nova = p.excursaoDe(await p.admin.chamar('POST', '/api/admin/excursoes', EXCURSAO));
    expect(nova['situacao']).toBe('rascunho');
    const id = Number(nova['id']);
    expect((await p.chamar('GET', `/api/excursoes/${id}`)).status).toBe(404);
    expect((await (await p.passageiro()).chamar('POST', '/api/reservas', { excursao_id: id })).status).toBe(404);
    await p.admin.chamar('POST', `/api/admin/excursoes/${id}/situacao`, { situacao: 'publicada' });
    expect((await p.chamar('GET', `/api/excursoes/${id}`)).status).toBe(200);
  });
});

describe('RN-038 dinheiro em centavos inteiros', () => {
  it('recusa preco com fracao ou texto, e o banco so guarda inteiros', async () => {
    for (const preco_centavos of [150.5, '15000', null]) {
      const r = await p.admin.chamar('POST', '/api/admin/excursoes', { ...EXCURSAO, preco_centavos });
      expect(r.status, String(preco_centavos)).toBe(400);
    }
    const e = await p.publicar();
    const a = await p.passageiro();
    const id = await p.reservaPaga(a, e, 'parcelada');
    await p.pagar(a, id);
    p.relogio.agora = new Date(PARTIDA.getTime() - 10 * DIA);
    await p.cancelar(a, id);
    const valores = [...pagamentos(id).map((x) => x[2]), ...reembolsos(id).map((x) => x[0])];
    expect(valores).toEqual([7500, 7501, 7500]);
    expect(() => p.db.prepare('UPDATE excursao SET preco_centavos = 100.5 WHERE id = ?').run(e)).toThrow(/cannot store|datatype/i);
  });
});

describe('RN-039 instantes em UTC, interpretados em Brasilia', () => {
  it('recusa instante sem fuso e grava tudo em UTC', async () => {
    const r = await p.admin.chamar('POST', '/api/admin/excursoes', { ...EXCURSAO, partida_utc: '2026-12-10T07:00:00' });
    expect(campos(r)['partida_utc']).toBeDefined();
    const e = await p.publicar();
    await p.reservaPaga(await p.passageiro(), e);
    for (const [tabela, coluna] of [['excursao', 'partida_utc'], ['reserva', 'criado_em'], ['pagamento', 'confirmado_em'], ['retencao_vaga', 'expira_em'], ['auditoria', 'ocorrido_em']] as const) {
      expect(p.numero(`SELECT COUNT(*) AS n FROM ${tabela} WHERE ${coluna} NOT GLOB '????-??-??T??:??:??*Z'`), tabela).toBe(0);
    }
  });

  it('o dia de "hoje" nas reservas e o de Brasilia', async () => {
    const e = await p.publicar({ data_inicial: '2026-11-20', data_final: '2026-11-20', partida_utc: '2026-11-20T23:00:00.000Z', prazo_segunda_parcela: '2026-11-18' });
    p.relogio.agora = new Date('2026-11-21T02:59:00.000Z'); // 20/11 23:59 em Brasilia: ainda e o dia final
    expect((await p.chamar('GET', `/api/excursoes/${e}`)).status).toBe(200);
    p.relogio.agora = new Date('2026-11-21T03:00:00.000Z');
    expect((await p.chamar('GET', `/api/excursoes/${e}`)).status).toBe(404);
  });
});

describe('RN-040 capacidade preservada sob concorrencia', () => {
  it('duas conexoes ao mesmo arquivo nunca ocupam a mesma ultima vaga', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'excursoes-rn040-'));
    const caminho = join(dir, 'rn040.sqlite');
    const principal = await criarPlataforma(openDatabase(caminho));
    const outra = openDatabase(caminho);
    try {
      outra.exec('PRAGMA busy_timeout = 0');
      const e = await principal.publicar({ capacidade: 1 });
      withTransaction(principal.db, () => {
        // antes mesmo de gravar, a primeira ja detem o bloqueio de escrita: a segunda nao comeca uma transacao que leria dado velho
        expect(() => withTransaction(outra, () => 'nao deveria comecar')).toThrow(/locked|busy/i);
        expect(ocuparVaga(principal.db, e, principal.relogio.agora)).toBe(true);
        // enquanto a primeira grava, a segunda nao consegue nem comecar
        expect(() => withTransaction(outra, () => ocuparVaga(outra, e, principal.relogio.agora))).toThrow(/locked|busy/i);
      });
      expect(withTransaction(outra, () => ocuparVaga(outra, e, principal.relogio.agora))).toBe(false);
      expect(principal.ocupadas(e)).toBe(1);
      principal.db.prepare('UPDATE excursao SET vagas_ocupadas = 0 WHERE id = ?').run(e);
    } finally {
      outra.close();
      await principal.fechar();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a confirmacao financeira reavalia a vaga na gravacao', async () => {
    const e = await p.publicar({ capacidade: 1 });
    const a = await p.passageiro();
    const b = await p.passageiro();
    const ra = await p.reservar(a, e);
    await p.checkout(a, ra);
    await p.iniciarPagamento(a, ra);
    p.relogio.agora = depois(INICIO, 16 * MIN);
    const rb = await p.reservar(b, e);
    await p.checkout(b, rb);
    await p.iniciarPagamento(b, rb);
    await Promise.all([p.simular(a, ra), p.simular(b, rb)]);
    expect(p.ocupadas(e)).toBe(1);
    expect([p.situacao(ra), p.situacao(rb)].filter((s) => s === 'pronto_para_embarque')).toHaveLength(1);
  });
});

describe('RN-041 auditoria das operacoes administrativas e automaticas', () => {
  it('cada operacao relevante deixa um registro com o autor certo', async () => {
    const e = await p.publicar();
    const atual = p.excursaoDe(await p.admin.chamar('GET', `/api/admin/excursoes/${e}`));
    await p.admin.chamar('PATCH', `/api/admin/excursoes/${e}`, { nome: 'Editada Ficticia', versao: atual['versao'] });
    const manual = await p.reservar(await p.passageiro(), e);
    await p.admin.chamar('POST', `/api/admin/reservas/${manual}/situacao`, { situacao: 'cancelada', justificativa: 'Teste ficticio.' });
    const a = await p.passageiro();
    await p.admin.chamar('GET', `/api/admin/passageiros/${a.id}`);
    const cancelada = await p.reservaPaga(a, e);
    await p.cancelar(a, cancelada);
    const reembolso = Number(p.linha('SELECT id FROM reembolso')?.['id']);
    await p.admin.chamar('POST', `/api/admin/reembolsos/${reembolso}/processar`, { resultado: 'aprovado' });
    const outra = await p.publicar({ nome: 'Cancelada Ficticia' });
    await p.admin.chamar('POST', `/api/admin/excursoes/${outra}/cancelamento`, { justificativa: 'Teste ficticio.' });
    await p.reservaPaga(await p.passageiro(), e);
    await p.reservaPaga(await p.passageiro(), e, 'parcelada');
    const abandonada = await p.reservar(await p.passageiro(), e);
    const pessoa = await p.passageiro();
    await p.checkout(pessoa, await p.reservar(pessoa, e));
    expect(p.situacao(abandonada)).toBe('aguardando_pagamento');
    p.relogio.agora = DIA_SEGUINTE_AO_FIM;
    p.rotina();
    const doAdmin = ['excursao.criada', 'excursao.situacao_alterada', 'excursao.editada', 'excursao.cancelamento', 'reserva.cancelamento_manual', 'passageiro.consultado', 'reembolso.processado'];
    const doSistema = ['retencao.expirada', 'reserva.vencimento_segunda_parcela', 'reserva.concluida', 'reserva.cancelamento_automatico'];
    for (const acao of doAdmin) {
      expect(p.numero('SELECT COUNT(*) AS n FROM auditoria WHERE acao = ? AND ator_usuario_id = ?', acao, p.admin.id), acao).toBeGreaterThan(0);
    }
    for (const acao of doSistema) {
      expect(p.numero('SELECT COUNT(*) AS n FROM auditoria WHERE acao = ? AND ator_usuario_id IS NULL', acao), acao).toBeGreaterThan(0);
    }
  });
});

describe('RN-042 logs e auditoria sem senhas, tokens ou dados desnecessarios', () => {
  it('nem a auditoria nem o console guardam segredo ou dado cadastral ao longo dos fluxos', async () => {
    const saidas: string[] = [];
    const guardar = (...partes: unknown[]) => void saidas.push(partes.map(String).join(' '));
    const espioes = [vi.spyOn(console, 'log').mockImplementation(guardar), vi.spyOn(console, 'error').mockImplementation(guardar), vi.spyOn(console, 'warn').mockImplementation(guardar)];
    try {
      const e = await p.publicar();
      const a = await p.passageiro();
      await p.chamar('POST', '/api/auth/recovery/request', { email: a.email });
      const token = String(p.recuperacoes.at(-1)?.token);
      await p.chamar('POST', '/api/auth/recovery/confirm', { token, nova_senha: 'Nova-senha-2026' });
      const login = await p.entrar(a.email, 'Nova-senha-2026');
      await p.entrar(a.email, 'Senha-errada-2026');
      const quem = { ...a, chamar: (m: string, c: string, corpo?: unknown) => p.chamar(m, c, corpo, login.cookie) };
      await p.reservaPaga(quem, e);
      await p.admin.chamar('GET', `/api/admin/passageiros/${a.id}`);
      await p.chamar('POST', '/api/reservas', '{quebrado', login.cookie);
      p.relogio.agora = DIA_SEGUINTE_AO_FIM;
      p.rotina();
      const tudo = JSON.stringify(p.db.prepare('SELECT * FROM auditoria').all()) + saidas.join('\n');
      for (const sensivel of [SENHA, 'Nova-senha-2026', 'Senha-errada-2026', token, login.cookie.split('=')[1] ?? 'x', a.email, a.cpf, '98765-4321', '5511987654321', '1990-05-20', 'Joana', 'scrypt$']) {
        expect(tudo, sensivel).not.toContain(sensivel);
      }
    } finally {
      for (const espiao of espioes) espiao.mockRestore();
    }
  });
});

describe('RN-045 reserva sem pagamento de excursao terminada e cancelada', () => {
  it('cancela a partir do dia seguinte ao fim; com pagamento pendente ou antes do fim, nao', async () => {
    const e = await p.publicar();
    const semPagamento = await p.reservar(await p.passageiro(), e);
    const b = await p.passageiro();
    const pendente = await p.reservar(b, e);
    await p.checkout(b, pendente);
    await p.iniciarPagamento(b, pendente);
    p.relogio.agora = antes(DIA_SEGUINTE_AO_FIM);
    p.rotina();
    expect(p.situacao(semPagamento)).toBe('aguardando_pagamento');
    p.relogio.agora = DIA_SEGUINTE_AO_FIM;
    p.rotina();
    expect(p.situacao(semPagamento)).toBe('cancelada');
    expect(p.situacao(pendente)).toBe('aguardando_pagamento');
  });
});

describe('RN-046 confirmacao depois da partida nao ocupa vaga', () => {
  async function pendente(modalidade: 'integral' | 'parcelada' = 'integral') {
    const e = await p.publicar({ nome: `Excursao Ficticia ${modalidade}` });
    const a = await p.passageiro();
    const id = await p.reservar(a, e, modalidade);
    await p.checkout(a, id);
    await p.iniciarPagamento(a, id);
    return { e, a, id };
  }

  it('um instante antes da partida ainda ocupa', async () => {
    const x = await pendente();
    p.relogio.agora = antes(PARTIDA);
    expect((await p.simular(x.a, x.id)).status).toBe(200);
    expect(p.ocupadas(x.e)).toBe(1);
    expect(p.situacao(x.id)).toBe('pronto_para_embarque');
  });

  it.each([
    ['na partida', PARTIDA],
    ['durante a viagem', new Date('2026-12-11T12:00:00.000Z')],
    ['depois do fim', new Date('2026-12-20T12:00:00.000Z')],
  ])('confirmada %s: fica registrada para a administracao, sem vaga e sem ficar pronta ou concluida', async (_nome, instante) => {
    const x = await pendente();
    p.relogio.agora = instante;
    expect((await p.simular(x.a, x.id)).status).toBe(200);
    expect((await p.simular(x.a, x.id)).status).toBe(200); // repetir nao muda
    p.rotina();
    expect(p.ocupadas(x.e)).toBe(0);
    expect(p.situacao(x.id)).toBe('aguardando_pagamento');
    expect((await detalhe(x.a, x.id))['situacao']).toBe('aguardando_pagamento');
    expect(pagamentos(x.id)).toEqual([['unica', 'confirmado', 15001, 'confirmacao_sem_vaga']]);
    expect(p.linha('SELECT situacao FROM retencao_vaga')?.['situacao']).not.toBe('ativa');
    expect(p.eventos('pagamento.confirmado_sem_vaga')).toBe(1);
    expect(p.eventos('pagamento.confirmado')).toBe(0);
    const aviso = p.linha("SELECT corpo FROM mensagem WHERE reserva_id = ? AND tipo = 'pagamento_em_analise'", x.id);
    expect(String(aviso?.['corpo'])).toContain('depois da partida da excursão');
    expect(String(aviso?.['corpo'])).not.toContain('não havia vaga');
  });

  it('a primeira parcela tambem; o administrador reembolsa e a reserva e cancelada', async () => {
    const x = await pendente('parcelada');
    p.relogio.agora = PARTIDA;
    // o prazo da segunda parcela e anterior a partida, mas sem a primeira confirmada nada vence
    expect((await p.simular(x.a, x.id)).status).toBe(200);
    expect(p.ocupadas(x.e)).toBe(0);
    expect(pagamentos(x.id)).toEqual([['primeira', 'confirmado', 7500, 'confirmacao_sem_vaga']]);
    const pendencia = (await p.admin.chamar('GET', '/api/admin/pendencias')).json['pendencias'] as Array<{ pagamento: { id: number } }>;
    const reembolso = (await p.admin.chamar('POST', `/api/admin/pendencias/${pendencia[0]!.pagamento.id}/reembolso`)).json['reembolso'] as { id: number };
    expect((await p.admin.chamar('POST', `/api/admin/reembolsos/${reembolso.id}/processar`, { resultado: 'aprovado' })).status).toBe(200);
    expect(p.situacao(x.id)).toBe('cancelada');
    expect(reembolsos(x.id)).toEqual([[7500, 100, 'processado']]);
  });
});
