import type { DatabaseSync } from 'node:sqlite';
import { utcParaBrasilia } from '../../shared/fuso.ts';
import { HttpError } from '../auth/support.ts';
import { registrarAuditoria } from '../db/audit.ts';
import { withTransaction } from '../db/transaction.ts';
import type { ReservaDto, ReservaService } from '../reservas/service.ts';
import { expirarVencidas } from '../vagas/disponibilidade.ts';
import { confirmarPagamento, recusarPagamento } from './confirmacao.ts';
import type { ProvedorPagamento } from './provedor.ts';

/**
 * Pagamento integral do passageiro (AGT-009, RF-023). Decisoes do pesquisador (20/11/2026, "recomendadas"): provedor simulado
 * interno fora de producao; a linha de pagamento nasce ao clicar em Pagar; o pagamento exige retencao ativa; o recusado vira
 * "falhou" e pode ser tentado de novo, reaproveitando a mesma linha (uq_pagamento_parcela) enquanto a retencao estiver ativa;
 * o pendente nunca confirmado continua pendente (a rotina que o fecha e da AGT-014). O valor vem do servidor (preco da
 * excursao em centavos) e nada de dado de cartao ou de conta e guardado.
 */

type Row = Record<string, unknown>;
const t = (valor: unknown): string => (typeof valor === 'string' ? valor : '');

export class PagamentoService {
  private readonly db: DatabaseSync;
  private readonly reservas: ReservaService;
  private readonly provedor: ProvedorPagamento | undefined;
  private readonly relogio: () => Date;

  constructor(db: DatabaseSync, reservas: ReservaService, provedor?: ProvedorPagamento, now?: () => Date) {
    this.db = db;
    this.reservas = reservas;
    this.provedor = provedor;
    this.relogio = now ?? (() => new Date());
  }

  /** As rotas de simulacao so existem com o provedor simulado (nunca em producao). */
  get simulacaoAtiva(): boolean {
    return this.provedor?.simulado === true;
  }

  private reservaDoPassageiro(passageiroId: number, reservaId: number): Row {
    const reserva = this.db.prepare('SELECT * FROM reserva WHERE id = ? AND usuario_id = ?').get(reservaId, passageiroId);
    if (reserva === undefined) throw new HttpError(404, 'nao_encontrada');
    return reserva;
  }

  private pagamentoDaReserva(reservaId: number): Row | undefined {
    return this.db.prepare("SELECT * FROM pagamento WHERE reserva_id = ? AND parcela = 'unica'").get(reservaId);
  }

  /**
   * Inicia (ou retoma) o pagamento integral. Repetir com o pagamento pendente devolve o mesmo; com o recusado, reabre a mesma
   * linha. Nao cria vaga nem ocupa vaga: isso so acontece na confirmacao.
   */
  iniciar(passageiroId: number, reservaId: number): ReservaDto {
    const agora = this.relogio();
    const hoje = utcParaBrasilia(agora).data;
    return withTransaction(this.db, () => {
      const reserva = this.reservaDoPassageiro(passageiroId, reservaId);
      const existente = this.pagamentoDaReserva(reservaId);
      if (existente !== undefined && t(existente['situacao']) === 'confirmado') throw new HttpError(409, 'pagamento_ja_confirmado');
      if (this.provedor === undefined) throw new HttpError(503, 'pagamento_indisponivel');
      if (t(reserva['situacao']) !== 'aguardando_pagamento') throw new HttpError(409, 'reserva_nao_pendente');
      if (reserva['modalidade'] !== 'integral') throw new HttpError(409, 'pagamento_parcelado_indisponivel');
      const excursaoId = Number(reserva['excursao_id']);
      const excursao = this.db
        .prepare("SELECT preco_centavos, partida_utc FROM excursao WHERE id = ? AND situacao = 'publicada' AND data_final >= ?")
        .get(excursaoId, hoje);
      if (excursao === undefined || new Date(t(excursao['partida_utc'])).getTime() <= agora.getTime()) {
        throw new HttpError(409, 'reservas_encerradas');
      }
      // O pagamento exige retencao ativa: retencoes vencidas sao marcadas aqui, e a que sobrar esta no prazo.
      expirarVencidas(this.db, agora, { excursaoId });
      if (this.db.prepare("SELECT 1 AS x FROM retencao_vaga WHERE reserva_id = ? AND situacao = 'ativa'").get(reservaId) === undefined) {
        throw new HttpError(409, 'retencao_inativa');
      }

      const iso = agora.toISOString();
      if (existente === undefined) {
        const id = Number(
          this.db
            .prepare("INSERT INTO pagamento (reserva_id, parcela, valor_centavos, situacao, criado_em, atualizado_em) VALUES (?, 'unica', ?, 'pendente', ?, ?)")
            .run(reservaId, Number(excursao['preco_centavos']), iso, iso).lastInsertRowid,
        );
        registrarAuditoria(this.db, {
          atorUsuarioId: passageiroId,
          acao: 'pagamento.criado',
          entidade: 'pagamento',
          registroId: id,
          estadoNovo: { situacao: 'pendente', reserva_id: reservaId, valor_centavos: Number(excursao['preco_centavos']) },
          ocorridoEm: agora,
        });
      } else if (t(existente['situacao']) === 'falhou') {
        this.db.prepare("UPDATE pagamento SET situacao = 'pendente', atualizado_em = ? WHERE id = ?").run(iso, Number(existente['id']));
        registrarAuditoria(this.db, {
          atorUsuarioId: passageiroId,
          acao: 'pagamento.reiniciado',
          entidade: 'pagamento',
          registroId: Number(existente['id']),
          estadoAnterior: { situacao: 'falhou' },
          estadoNovo: { situacao: 'pendente', reserva_id: reservaId },
          ocorridoEm: agora,
        });
      }
      return this.reservas.obter(passageiroId, reservaId);
    });
  }

  /**
   * Simula o resultado do provedor (so com o provedor simulado, fora de producao): "aprovado" confirma o pagamento e "recusado"
   * o marca como falhou. A confirmacao nao exige retencao ativa: se ela expirou, vale a decisao 3 (vaga livre ocupa; sem vaga,
   * registra para a administracao).
   */
  simular(passageiroId: number, reservaId: number, entrada: unknown): ReservaDto {
    if (!this.simulacaoAtiva) throw new HttpError(404, 'nao_encontrada');
    if (entrada === null || typeof entrada !== 'object' || Array.isArray(entrada)) throw new HttpError(400, 'requisicao_invalida');
    const corpo = entrada as Row;
    const erros: Record<string, string> = {};
    for (const chave of Object.keys(corpo)) if (chave !== 'resultado') erros[chave] = 'campo_nao_permitido';
    const resultado = corpo['resultado'];
    if (resultado !== 'aprovado' && resultado !== 'recusado') erros['resultado'] = resultado === undefined ? 'obrigatorio' : 'invalido';
    if (Object.keys(erros).length > 0) throw new HttpError(400, 'validacao', { fields: erros });

    const agora = this.relogio();
    return withTransaction(this.db, () => {
      this.reservaDoPassageiro(passageiroId, reservaId);
      const pagamento = this.pagamentoDaReserva(reservaId);
      if (pagamento === undefined) throw new HttpError(409, 'pagamento_nao_iniciado');
      const id = Number(pagamento['id']);
      if (resultado === 'aprovado') confirmarPagamento(this.db, id, agora, passageiroId);
      else recusarPagamento(this.db, id, agora, passageiroId);
      return this.reservas.obter(passageiroId, reservaId);
    });
  }
}
