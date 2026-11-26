import type { DatabaseSync } from 'node:sqlite';
import { HttpError } from '../auth/support.ts';
import { registrarAuditoria } from '../db/audit.ts';
import { withTransaction } from '../db/transaction.ts';
import type { ProvedorPagamento } from '../pagamentos/provedor.ts';
import type { ReservaDto, ReservaService } from '../reservas/service.ts';
import { concluirReservas } from '../vagas/conclusao.ts';
import { expirarVencidas, liberarVaga } from '../vagas/disponibilidade.ts';
import { vencerSegundasParcelas } from '../vagas/vencimento.ts';
import { calcularReembolso, percentualPorAntecedencia } from './regra.ts';
import type { Calculo, PagamentoPago } from './regra.ts';

/**
 * Cancelamentos e reembolsos (AGT-013, RF-032 a RF-035, RF-026, RN-027 a RN-032). Decisoes do pesquisador (26/11/2026,
 * "recomendadas"):
 * 1. Passageiro: cancela em Aguardando pagamento ou Pronto para embarque, so antes da partida; percentual pela antecedencia exata
 *    (regra.ts); parcelada so com a primeira paga libera a vaga sem reembolso; pagamento pendente vira recusado.
 * 2. O reembolso nasce "pendente" e o administrador o confirma no provedor simulado; o pagamento vira "estornado" so quando o valor
 *    inteiro e devolvido; reembolso recusado pode ser tentado de novo, sem criar outro; pendencias (sem vaga, segunda tardia) geram,
 *    a pedido do administrador, um reembolso de 100% do pagamento na mesma fila.
 * 3. Cancelamento da excursao: uma unica transacao, com justificativa, so antes da partida; reservas Aguardando e Pronto sao
 *    canceladas com 100% do pago (inclusive a parcelada so com a primeira, RN-031); pendencias da excursao tambem 100%; concluidas e
 *    ja canceladas nao sao afetadas.
 * Nenhum dinheiro e movimentado: o provedor e simulado. Nada de dados de cartao ou bancarios.
 */

type Row = Record<string, unknown>;
const t = (valor: unknown): string => (typeof valor === 'string' ? valor : '');
const n = (valor: unknown): number => Number(valor);

const JUSTIFICATIVA_MAX = 300;
const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 50;
export const SITUACOES_REEMBOLSO = ['pendente', 'processado', 'recusado'] as const;
export type MotivoReembolso = 'cancelamento_passageiro' | 'cancelamento_organizacao' | 'pendencia';

export interface PreviaCancelamento extends Calculo {
  permitido: boolean;
  motivo_impedimento: 'reserva_nao_cancelavel' | 'excursao_ja_partiu' | null;
  /** Pagamento confirmado sem vaga (ou segunda tardia): tratado pela organizacao, fora deste calculo. */
  tem_pagamento_a_tratar: boolean;
  partida_utc: string;
}

export interface ReembolsoDto {
  id: number;
  reserva_id: number;
  pagamento_id: number | null;
  valor_centavos: number;
  percentual_aplicado: number;
  motivo: MotivoReembolso;
  situacao: 'pendente' | 'processado' | 'recusado';
  criado_em: string;
  atualizado_em: string;
}

const paraReembolso = (r: Row): ReembolsoDto => ({
  id: n(r['id']),
  reserva_id: n(r['reserva_id']),
  pagamento_id: r['pagamento_id'] === null ? null : n(r['pagamento_id']),
  valor_centavos: n(r['valor_centavos']),
  percentual_aplicado: n(r['percentual_aplicado']),
  motivo: t(r['motivo']) as MotivoReembolso,
  situacao: t(r['situacao']) as ReembolsoDto['situacao'],
  criado_em: t(r['criado_em']),
  atualizado_em: t(r['atualizado_em']),
});

function objetoDe(entrada: unknown): Record<string, unknown> {
  if (entrada === null || typeof entrada !== 'object' || Array.isArray(entrada)) throw new HttpError(400, 'validacao', { fields: { corpo: 'invalido' } });
  return entrada as Record<string, unknown>;
}

export class CancelamentoService {
  private readonly db: DatabaseSync;
  private readonly reservas: ReservaService;
  private readonly relogio: () => Date;
  private readonly provedor: ProvedorPagamento | undefined;

  constructor(db: DatabaseSync, reservas: ReservaService, provedor?: ProvedorPagamento, now?: () => Date) {
    this.db = db;
    this.reservas = reservas;
    this.provedor = provedor;
    this.relogio = now ?? (() => new Date());
  }

  /** Efetiva vencimento e conclusao pendentes em transacao propria, antes de decidir (AGT-010, AGT-011). */
  private efetivar(escopoReserva?: number): void {
    const agora = this.relogio();
    withTransaction(this.db, () => {
      vencerSegundasParcelas(this.db, agora, escopoReserva === undefined ? {} : { reservaId: escopoReserva });
      concluirReservas(this.db, agora, escopoReserva === undefined ? {} : { reservaId: escopoReserva });
    });
  }

  private pagosDe(reservaId: number): Array<PagamentoPago & { id: number }> {
    return this.db
      .prepare("SELECT id, parcela, valor_centavos FROM pagamento WHERE reserva_id = ? AND situacao = 'confirmado' AND pendencia_administrativa IS NULL ORDER BY id")
      .all(reservaId)
      .map((p) => ({ id: n(p['id']), parcela: t(p['parcela']), valor_centavos: n(p['valor_centavos']) }));
  }

  private reservaDoPassageiro(passageiroId: number, reservaId: number): Row {
    const reserva = this.db.prepare('SELECT * FROM reserva WHERE id = ? AND usuario_id = ?').get(reservaId, passageiroId);
    if (reserva === undefined) throw new HttpError(404, 'nao_encontrada');
    return reserva;
  }

  private excursaoDe(excursaoId: number): Row {
    const excursao = this.db.prepare('SELECT * FROM excursao WHERE id = ?').get(excursaoId);
    if (excursao === undefined) throw new HttpError(404, 'nao_encontrada');
    return excursao;
  }

  private calcular(reserva: Row, excursao: Row, agora: Date): PreviaCancelamento {
    const reservaId = n(reserva['id']);
    const partida = new Date(t(excursao['partida_utc']));
    const situacao = t(reserva['situacao']);
    let impedimento: PreviaCancelamento['motivo_impedimento'] = null;
    if (situacao !== 'aguardando_pagamento' && situacao !== 'pronto_para_embarque') impedimento = 'reserva_nao_cancelavel';
    else if (agora.getTime() >= partida.getTime()) impedimento = 'excursao_ja_partiu';
    const calculo = calcularReembolso(reserva['modalidade'] === 'parcelada' ? 'parcelada' : 'integral', this.pagosDe(reservaId), percentualPorAntecedencia(partida, agora));
    const aTratar = this.db.prepare("SELECT 1 AS x FROM pagamento WHERE reserva_id = ? AND situacao = 'confirmado' AND pendencia_administrativa IS NOT NULL LIMIT 1").get(reservaId);
    return {
      ...calculo,
      permitido: impedimento === null,
      motivo_impedimento: impedimento,
      tem_pagamento_a_tratar: aTratar !== undefined,
      partida_utc: t(excursao['partida_utc']),
    };
  }

  /** Previa do cancelamento da propria reserva (404 igual para alheia e inexistente). */
  previa(passageiroId: number, reservaId: number): PreviaCancelamento {
    this.reservaDoPassageiro(passageiroId, reservaId);
    this.efetivar(reservaId);
    const reserva = this.reservaDoPassageiro(passageiroId, reservaId);
    return this.calcular(reserva, this.excursaoDe(n(reserva['excursao_id'])), this.relogio());
  }

  /**
   * Aplica o cancelamento de uma reserva ativa (dentro de uma transacao aberta): retencao, pagamentos pendentes, vaga (liberada uma
   * unica vez, porque a reserva deixa de ser ativa), situacao e reembolso.
   */
  private aplicarCancelamento(
    reserva: Row,
    atorId: number,
    agora: Date,
    reembolso: { valor: number; percentual: number; motivo: MotivoReembolso },
    acao: string,
    extra: Record<string, unknown> = {},
  ): void {
    const reservaId = n(reserva['id']);
    const excursaoId = n(reserva['excursao_id']);
    const situacaoAnterior = t(reserva['situacao']);
    const iso = agora.toISOString();
    expirarVencidas(this.db, agora, { reservaId });
    const retencao = this.db.prepare("SELECT id FROM retencao_vaga WHERE reserva_id = ? AND situacao = 'ativa'").get(reservaId);
    if (retencao !== undefined) {
      this.db.prepare("UPDATE retencao_vaga SET situacao = 'cancelada' WHERE id = ?").run(n(retencao['id']));
      registrarAuditoria(this.db, {
        atorUsuarioId: atorId,
        acao: 'retencao.cancelada',
        entidade: 'retencao_vaga',
        registroId: n(retencao['id']),
        estadoAnterior: { situacao: 'ativa' },
        estadoNovo: { situacao: 'cancelada', reserva_id: reservaId },
        ocorridoEm: agora,
      });
    }
    for (const p of this.db.prepare("SELECT id, parcela FROM pagamento WHERE reserva_id = ? AND situacao = 'pendente'").all(reservaId)) {
      this.db.prepare("UPDATE pagamento SET situacao = 'falhou', atualizado_em = ? WHERE id = ?").run(iso, n(p['id']));
      registrarAuditoria(this.db, {
        atorUsuarioId: atorId,
        acao: 'pagamento.recusado',
        entidade: 'pagamento',
        registroId: n(p['id']),
        estadoAnterior: { situacao: 'pendente' },
        estadoNovo: { situacao: 'falhou', reserva_id: reservaId, parcela: t(p['parcela']), por_cancelamento: true },
        ocorridoEm: agora,
      });
    }
    // A vaga esta ocupada quando a parcela unica ou a primeira foi confirmada com vaga.
    const ocupava = this.pagosDe(reservaId).some((p) => p.parcela === 'unica' || p.parcela === 'primeira');
    const liberada = ocupava ? liberarVaga(this.db, excursaoId) : false;
    this.db
      .prepare("UPDATE reserva SET situacao = 'cancelada', atualizado_em = ? WHERE id = ? AND situacao IN ('aguardando_pagamento', 'pronto_para_embarque')")
      .run(iso, reservaId);
    if (reembolso.valor > 0) this.criarReembolso(reservaId, null, reembolso.valor, reembolso.percentual, reembolso.motivo, atorId, agora);
    registrarAuditoria(this.db, {
      atorUsuarioId: atorId,
      acao,
      entidade: 'reserva',
      registroId: reservaId,
      estadoAnterior: { situacao: situacaoAnterior },
      estadoNovo: { situacao: 'cancelada', excursao_id: excursaoId, vaga_liberada: liberada, percentual: reembolso.percentual, valor_reembolso_centavos: reembolso.valor, ...extra },
      ocorridoEm: agora,
    });
  }

  private criarReembolso(reservaId: number, pagamentoId: number | null, valor: number, percentual: number, motivo: MotivoReembolso, atorId: number, agora: Date): number {
    const iso = agora.toISOString();
    const id = Number(
      this.db
        .prepare("INSERT INTO reembolso (reserva_id, pagamento_id, valor_centavos, percentual_aplicado, motivo, situacao, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, 'pendente', ?, ?)")
        .run(reservaId, pagamentoId, valor, percentual, motivo, iso, iso).lastInsertRowid,
    );
    registrarAuditoria(this.db, {
      atorUsuarioId: atorId,
      acao: 'reembolso.criado',
      entidade: 'reembolso',
      registroId: id,
      estadoAnterior: null,
      estadoNovo: { situacao: 'pendente', reserva_id: reservaId, pagamento_id: pagamentoId, valor_centavos: valor, percentual, motivo },
      ocorridoEm: agora,
    });
    return id;
  }

  /**
   * Cancelamento pedido pelo passageiro (RF-032). Corpo: { percentual_previsto }, o percentual que a previa mostrou; se a antecedencia
   * mudou de faixa desde a previa, responde 409 reembolso_mudou sem cancelar. O valor e sempre calculado no servidor. Idempotente:
   * repetir numa reserva ja cancelada devolve a reserva, sem novo efeito.
   */
  cancelarReserva(passageiroId: number, reservaId: number, entrada: unknown): ReservaDto {
    const corpo = objetoDe(entrada);
    const erros: Record<string, string> = {};
    for (const chave of Object.keys(corpo)) if (chave !== 'percentual_previsto') erros[chave] = 'campo_nao_permitido';
    const previsto = corpo['percentual_previsto'];
    if (previsto !== 0 && previsto !== 50 && previsto !== 100) erros['percentual_previsto'] = previsto === undefined ? 'obrigatorio' : 'invalido';
    if (Object.keys(erros).length > 0) throw new HttpError(400, 'validacao', { fields: erros });
    this.reservaDoPassageiro(passageiroId, reservaId);
    this.efetivar(reservaId);
    const agora = this.relogio();
    withTransaction(this.db, () => {
      const reserva = this.reservaDoPassageiro(passageiroId, reservaId);
      if (t(reserva['situacao']) === 'cancelada') return; // idempotente
      const previa = this.calcular(reserva, this.excursaoDe(n(reserva['excursao_id'])), agora);
      if (!previa.permitido) throw new HttpError(409, previa.motivo_impedimento ?? 'reserva_nao_cancelavel');
      if (previa.percentual !== previsto) throw new HttpError(409, 'reembolso_mudou');
      this.aplicarCancelamento(
        reserva,
        passageiroId,
        agora,
        { valor: previa.valor_reembolso_centavos, percentual: previa.percentual, motivo: 'cancelamento_passageiro' },
        'reserva.cancelamento_passageiro',
        { parcelada_nao_quitada: previa.parcelada_nao_quitada },
      );
    });
    return this.reservas.obter(passageiroId, reservaId);
  }

  /* ----------------------------------------------------------- excursao */

  private reservasAfetadas(excursaoId: number): Row[] {
    return this.db
      .prepare(
        `SELECT r.*, u.nome_completo AS passageiro_nome FROM reserva r JOIN usuario u ON u.id = r.usuario_id
         WHERE r.excursao_id = ? AND r.situacao IN ('aguardando_pagamento', 'pronto_para_embarque') ORDER BY r.id`,
      )
      .all(excursaoId);
  }

  /** Pagamentos confirmados e sinalizados da excursao que ainda nao tem reembolso. */
  private pendenciasSemReembolso(excursaoId: number): Row[] {
    return this.db
      .prepare(
        `SELECT p.id, p.reserva_id, p.valor_centavos FROM pagamento p JOIN reserva r ON r.id = p.reserva_id
         WHERE r.excursao_id = ? AND p.situacao = 'confirmado' AND p.pendencia_administrativa IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM reembolso x WHERE x.pagamento_id = p.id) ORDER BY p.id`,
      )
      .all(excursaoId);
  }

  previaExcursao(excursaoId: number) {
    this.excursaoDe(excursaoId);
    this.efetivar();
    const excursao = this.excursaoDe(excursaoId);
    const situacao = t(excursao['situacao']);
    const partiu = this.relogio().getTime() >= new Date(t(excursao['partida_utc'])).getTime();
    const impedimento = situacao === 'cancelada' ? 'excursao_ja_cancelada' : partiu ? 'excursao_ja_partiu' : null;
    const reservas = this.reservasAfetadas(excursaoId).map((r) => ({
      id: n(r['id']),
      passageiro: t(r['passageiro_nome']),
      situacao: t(r['situacao']),
      valor_reembolso_centavos: this.pagosDe(n(r['id'])).reduce((soma, p) => soma + p.valor_centavos, 0),
    }));
    const pendencias = this.pendenciasSemReembolso(excursaoId).map((p) => ({ pagamento_id: n(p['id']), reserva_id: n(p['reserva_id']), valor_centavos: n(p['valor_centavos']) }));
    const total = reservas.reduce((s, r) => s + r.valor_reembolso_centavos, 0) + pendencias.reduce((s, p) => s + p.valor_centavos, 0);
    return {
      excursao: { id: excursaoId, nome: t(excursao['nome']), situacao, partida_utc: t(excursao['partida_utc']) },
      permitido: impedimento === null,
      motivo_impedimento: impedimento,
      reservas,
      pendencias,
      valor_total_centavos: total,
    };
  }

  /**
   * Cancelamento da excursao pela organizacao (RF-034, RF-035, RN-031), em uma unica transacao. Corpo: { justificativa }.
   * Idempotente: numa excursao ja cancelada nao faz nada.
   */
  cancelarExcursao(adminId: number, excursaoId: number, entrada: unknown) {
    const corpo = objetoDe(entrada);
    const erros: Record<string, string> = {};
    for (const chave of Object.keys(corpo)) if (chave !== 'justificativa') erros[chave] = 'campo_nao_permitido';
    const justificativa = typeof corpo['justificativa'] === 'string' ? corpo['justificativa'].trim() : '';
    if (corpo['justificativa'] === undefined || justificativa === '') erros['justificativa'] = 'obrigatorio';
    else if (typeof corpo['justificativa'] !== 'string' || justificativa.length > JUSTIFICATIVA_MAX) erros['justificativa'] = 'invalido';
    if (Object.keys(erros).length > 0) throw new HttpError(400, 'validacao', { fields: erros });
    this.excursaoDe(excursaoId);
    this.efetivar();
    const agora = this.relogio();
    return withTransaction(this.db, () => {
      const excursao = this.excursaoDe(excursaoId);
      const origem = t(excursao['situacao']);
      if (origem === 'cancelada') {
        return { excursao_id: excursaoId, situacao: 'cancelada', ja_cancelada: true, reservas_canceladas: 0, reembolsos_criados: 0, valor_total_centavos: 0 };
      }
      if (agora.getTime() >= new Date(t(excursao['partida_utc'])).getTime()) throw new HttpError(409, 'excursao_ja_partiu');
      const afetadas = this.reservasAfetadas(excursaoId);
      let reembolsos = 0;
      let total = 0;
      for (const reserva of afetadas) {
        const valor = this.pagosDe(n(reserva['id'])).reduce((soma, p) => soma + p.valor_centavos, 0);
        this.aplicarCancelamento(reserva, adminId, agora, { valor, percentual: valor > 0 ? 100 : 0, motivo: 'cancelamento_organizacao' }, 'reserva.cancelamento_organizacao');
        if (valor > 0) {
          reembolsos += 1;
          total += valor;
        }
      }
      for (const p of this.pendenciasSemReembolso(excursaoId)) {
        this.criarReembolso(n(p['reserva_id']), n(p['id']), n(p['valor_centavos']), 100, 'pendencia', adminId, agora);
        reembolsos += 1;
        total += n(p['valor_centavos']);
      }
      const novaVersao = new Date(Math.max(agora.getTime(), Date.parse(t(excursao['atualizado_em'])) + 1)).toISOString();
      this.db.prepare("UPDATE excursao SET situacao = 'cancelada', atualizado_em = ? WHERE id = ?").run(novaVersao, excursaoId);
      registrarAuditoria(this.db, {
        atorUsuarioId: adminId,
        acao: 'excursao.cancelamento',
        entidade: 'excursao',
        registroId: excursaoId,
        estadoAnterior: { situacao: origem },
        estadoNovo: { situacao: 'cancelada', reservas_canceladas: afetadas.length, reembolsos_criados: reembolsos, valor_total_centavos: total, justificativa },
        ocorridoEm: agora,
      });
      return { excursao_id: excursaoId, situacao: 'cancelada', ja_cancelada: false, reservas_canceladas: afetadas.length, reembolsos_criados: reembolsos, valor_total_centavos: total };
    });
  }

  /* ---------------------------------------------------------- reembolsos */

  listarReembolsos(consulta: Record<string, string | undefined>) {
    const erros: Record<string, string> = {};
    const numero = (campo: 'pagina' | 'limite', padrao: number, maximo: number): number => {
      const valor = consulta[campo];
      if (valor === undefined || valor === '') return padrao;
      const v = /^[0-9]{1,9}$/.test(valor) ? Number(valor) : 0;
      if (v < 1 || v > maximo) {
        erros[campo] = 'invalido';
        return padrao;
      }
      return v;
    };
    const pagina = numero('pagina', 1, 1_000_000);
    const limite = numero('limite', LIMITE_PADRAO, LIMITE_MAXIMO);
    const situacao = consulta['situacao'];
    if (situacao !== undefined && situacao !== '' && !(SITUACOES_REEMBOLSO as readonly string[]).includes(situacao)) erros['situacao'] = 'invalido';
    if (Object.keys(erros).length > 0) throw new HttpError(400, 'validacao', { fields: erros });
    const filtrar = situacao !== undefined && situacao !== '';
    const onde = filtrar ? 'WHERE x.situacao = ?' : '';
    const parametros = filtrar ? [situacao] : [];
    const total = n(this.db.prepare(`SELECT COUNT(*) AS n FROM reembolso x ${onde}`).get(...parametros)?.['n']);
    const linhas = this.db
      .prepare(
        `SELECT x.*, u.nome_completo AS passageiro_nome, e.nome AS excursao_nome FROM reembolso x
         JOIN reserva r ON r.id = x.reserva_id JOIN usuario u ON u.id = r.usuario_id JOIN excursao e ON e.id = r.excursao_id
         ${onde} ORDER BY x.id DESC LIMIT ? OFFSET ?`,
      )
      .all(...parametros, limite, (pagina - 1) * limite);
    return {
      reembolsos: linhas.map((l) => ({ ...paraReembolso(l), passageiro: t(l['passageiro_nome']), excursao: t(l['excursao_nome']) })),
      total,
      pagina,
      limite,
      processamento_disponivel: this.provedor?.simulado === true,
    };
  }

  /**
   * Processa um reembolso no provedor simulado (decisao 2). Corpo: { resultado: 'aprovado' | 'recusado' }. Aprovado: o reembolso fica
   * processado e, se devolve o valor inteiro, o pagamento vira estornado. Recusado pode ser tentado de novo. Idempotente.
   */
  processarReembolso(adminId: number, reembolsoId: number, entrada: unknown): ReembolsoDto {
    if (this.provedor?.simulado !== true) throw new HttpError(503, 'pagamento_indisponivel');
    const corpo = objetoDe(entrada);
    const erros: Record<string, string> = {};
    for (const chave of Object.keys(corpo)) if (chave !== 'resultado') erros[chave] = 'campo_nao_permitido';
    const resultado = corpo['resultado'];
    if (resultado !== 'aprovado' && resultado !== 'recusado') erros['resultado'] = resultado === undefined ? 'obrigatorio' : 'invalido';
    if (Object.keys(erros).length > 0) throw new HttpError(400, 'validacao', { fields: erros });
    const agora = this.relogio();
    return withTransaction(this.db, () => {
      const linha = this.db.prepare('SELECT * FROM reembolso WHERE id = ?').get(reembolsoId);
      if (linha === undefined) throw new HttpError(404, 'nao_encontrada');
      const reembolso = paraReembolso(linha);
      const destino = resultado === 'aprovado' ? 'processado' : 'recusado';
      if (reembolso.situacao === destino) return reembolso; // idempotente
      if (reembolso.situacao === 'processado') throw new HttpError(409, 'reembolso_ja_processado');
      const iso = agora.toISOString();
      if (destino === 'processado') {
        // Nunca devolver mais do que foi pago na reserva (soma dos ja processados mais este).
        const pago = n(this.db.prepare("SELECT COALESCE(SUM(valor_centavos), 0) AS s FROM pagamento WHERE reserva_id = ? AND situacao IN ('confirmado', 'estornado')").get(reembolso.reserva_id)?.['s']);
        const jaDevolvido = n(this.db.prepare("SELECT COALESCE(SUM(valor_centavos), 0) AS s FROM reembolso WHERE reserva_id = ? AND situacao = 'processado'").get(reembolso.reserva_id)?.['s']);
        if (jaDevolvido + reembolso.valor_centavos > pago) throw new HttpError(409, 'reembolso_excede_pago');
      }
      this.db.prepare('UPDATE reembolso SET situacao = ?, atualizado_em = ? WHERE id = ?').run(destino, iso, reembolsoId);
      registrarAuditoria(this.db, {
        atorUsuarioId: adminId,
        acao: destino === 'processado' ? 'reembolso.processado' : 'reembolso.recusado',
        entidade: 'reembolso',
        registroId: reembolsoId,
        estadoAnterior: { situacao: reembolso.situacao },
        estadoNovo: { situacao: destino, reserva_id: reembolso.reserva_id, valor_centavos: reembolso.valor_centavos },
        ocorridoEm: agora,
      });
      if (destino === 'processado' && reembolso.percentual_aplicado === 100) {
        const alvos =
          reembolso.pagamento_id !== null
            ? this.db.prepare("SELECT id FROM pagamento WHERE id = ? AND situacao = 'confirmado'").all(reembolso.pagamento_id)
            : this.db.prepare("SELECT id FROM pagamento WHERE reserva_id = ? AND situacao = 'confirmado' AND pendencia_administrativa IS NULL").all(reembolso.reserva_id);
        for (const p of alvos) {
          this.db.prepare("UPDATE pagamento SET situacao = 'estornado', atualizado_em = ? WHERE id = ?").run(iso, n(p['id']));
          registrarAuditoria(this.db, {
            atorUsuarioId: adminId,
            acao: 'pagamento.estornado',
            entidade: 'pagamento',
            registroId: n(p['id']),
            estadoAnterior: { situacao: 'confirmado' },
            estadoNovo: { situacao: 'estornado', reserva_id: reembolso.reserva_id, reembolso_id: reembolsoId },
            ocorridoEm: agora,
          });
        }
      }
      return paraReembolso(this.db.prepare('SELECT * FROM reembolso WHERE id = ?').get(reembolsoId) as Row);
    });
  }

  /** Cria (ou devolve) o reembolso de 100% de um pagamento confirmado e sinalizado como pendencia (decisao 2). */
  reembolsarPendencia(adminId: number, pagamentoId: number): ReembolsoDto {
    this.efetivar();
    const agora = this.relogio();
    return withTransaction(this.db, () => {
      const existente = this.db.prepare('SELECT * FROM reembolso WHERE pagamento_id = ?').get(pagamentoId);
      if (existente !== undefined) return paraReembolso(existente);
      const pagamento = this.db.prepare('SELECT * FROM pagamento WHERE id = ?').get(pagamentoId);
      if (pagamento === undefined) throw new HttpError(404, 'nao_encontrada');
      if (pagamento['situacao'] !== 'confirmado' || pagamento['pendencia_administrativa'] === null) throw new HttpError(409, 'pagamento_sem_pendencia');
      const id = this.criarReembolso(n(pagamento['reserva_id']), pagamentoId, n(pagamento['valor_centavos']), 100, 'pendencia', adminId, agora);
      return paraReembolso(this.db.prepare('SELECT * FROM reembolso WHERE id = ?').get(id) as Row);
    });
  }
}
