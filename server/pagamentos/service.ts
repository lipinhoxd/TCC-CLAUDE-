import type { DatabaseSync } from 'node:sqlite';
import { dividirEmDuas } from '../../shared/dinheiro.ts';
import { utcParaBrasilia } from '../../shared/fuso.ts';
import { HttpError } from '../auth/support.ts';
import { registrarAuditoria } from '../db/audit.ts';
import { withTransaction } from '../db/transaction.ts';
import type { ReservaDto, ReservaService } from '../reservas/service.ts';
import { expirarVencidas } from '../vagas/disponibilidade.ts';
import { vencerSegundasParcelas } from '../vagas/vencimento.ts';
import { confirmarPagamento, recusarPagamento } from './confirmacao.ts';
import { proximaParcela } from './parcelas.ts';
import type { ParcelaPagamento } from './parcelas.ts';
import type { ProvedorPagamento } from './provedor.ts';

/**
 * Pagamento do passageiro (AGT-009: integral; AGT-010: duas parcelas de 50%). Decisoes do pesquisador (20 e 21/11/2026, "recomendadas"):
 * provedor simulado interno fora de producao; a linha de pagamento nasce ao clicar em Pagar; a parcela unica e a primeira exigem
 * retencao ativa; a segunda parcela vai da confirmacao da primeira ate as 23:59:59 da data limite (Brasilia), sem retencao, porque a vaga
 * ja esta ocupada; o recusado vira "falhou" e pode ser tentado de novo, reaproveitando a mesma linha (uq_pagamento_parcela); o pendente
 * nunca confirmado continua pendente (decisao 2.1 da AGT-014: a rotina nao o fecha). O servidor decide a parcela e o valor (preco da excursao em
 * centavos; parcelas por dividirEmDuas); nada de dado de cartao ou de conta e guardado.
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

  private pagamentosDa(reservaId: number): Row[] {
    return this.db.prepare('SELECT * FROM pagamento WHERE reserva_id = ? ORDER BY id').all(reservaId);
  }

  /**
   * Inicia (ou retoma) o pagamento da proxima parcela. Repetir com o pagamento pendente devolve o mesmo; com o recusado, reabre a
   * mesma linha. Nao ocupa vaga: isso so acontece na confirmacao.
   */
  iniciar(passageiroId: number, reservaId: number): ReservaDto {
    const agora = this.relogio();
    const hoje = utcParaBrasilia(agora).data;
    this.reservaDoPassageiro(passageiroId, reservaId); // 404 antes de qualquer efeito
    // O vencimento da segunda parcela e efetivado antes e em transacao propria: se o prazo passou, a vaga e liberada mesmo que o
    // pedido de pagamento seja recusado logo em seguida.
    withTransaction(this.db, () => vencerSegundasParcelas(this.db, agora, { reservaId }));
    return withTransaction(this.db, () => {
      const reserva = this.reservaDoPassageiro(passageiroId, reservaId);
      const modalidade = reserva['modalidade'] === 'parcelada' ? 'parcelada' : 'integral';
      const linhas = this.pagamentosDa(reservaId);
      const parcela = proximaParcela(modalidade, linhas as Array<{ parcela: string; situacao: string; pendencia_administrativa: unknown }>);
      if (t(reserva['situacao']) === 'cancelada' && reserva['motivo_cancelamento'] === 'inadimplencia') {
        throw new HttpError(409, 'prazo_da_segunda_parcela_vencido');
      }
      if (parcela === null) throw new HttpError(409, 'pagamento_ja_confirmado');
      if (this.provedor === undefined) throw new HttpError(503, 'pagamento_indisponivel');
      if (t(reserva['situacao']) !== 'aguardando_pagamento') throw new HttpError(409, 'reserva_nao_pendente');

      const excursaoId = Number(reserva['excursao_id']);
      // Primeira parcela e parcela unica: excursao publicada e partida no futuro. A segunda: a vaga ja e do passageiro, entao a
      // excursao pode estar encerrada para novas reservas (nao cancelada) e vale o prazo.
      const situacoesAceitas = parcela === 'segunda' ? "('publicada', 'encerrada')" : "('publicada')";
      const excursao = this.db
        .prepare(`SELECT preco_centavos, partida_utc FROM excursao WHERE id = ? AND situacao IN ${situacoesAceitas} AND data_final >= ?`)
        .get(excursaoId, hoje);
      if (excursao === undefined || new Date(t(excursao['partida_utc'])).getTime() <= agora.getTime()) {
        throw new HttpError(409, 'reservas_encerradas');
      }
      if (parcela !== 'segunda') {
        // Retencoes vencidas sao marcadas aqui, e a que sobrar esta no prazo.
        expirarVencidas(this.db, agora, { excursaoId });
        if (this.db.prepare("SELECT 1 AS x FROM retencao_vaga WHERE reserva_id = ? AND situacao = 'ativa'").get(reservaId) === undefined) {
          throw new HttpError(409, 'retencao_inativa');
        }
      }

      const preco = Number(excursao['preco_centavos']);
      const valor = this.valorDa(parcela, preco);
      const existente = linhas.find((l) => l['parcela'] === parcela);
      const iso = agora.toISOString();
      if (existente === undefined) {
        const id = Number(
          this.db
            .prepare('INSERT INTO pagamento (reserva_id, parcela, valor_centavos, situacao, criado_em, atualizado_em) VALUES (?, ?, ?, \'pendente\', ?, ?)')
            .run(reservaId, parcela, valor, iso, iso).lastInsertRowid,
        );
        registrarAuditoria(this.db, {
          atorUsuarioId: passageiroId,
          acao: 'pagamento.criado',
          entidade: 'pagamento',
          registroId: id,
          estadoNovo: { situacao: 'pendente', reserva_id: reservaId, parcela, valor_centavos: valor },
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
          estadoNovo: { situacao: 'pendente', reserva_id: reservaId, parcela },
          ocorridoEm: agora,
        });
      }
      return this.reservas.obter(passageiroId, reservaId);
    });
  }

  /** Valor em centavos da parcela, sempre calculado no servidor (a soma das duas parcelas e igual ao total, RN-038). */
  private valorDa(parcela: ParcelaPagamento, preco: number): number {
    if (parcela === 'unica') return preco;
    const { primeira, segunda } = dividirEmDuas(preco);
    return parcela === 'primeira' ? primeira : segunda;
  }

  /**
   * Simula o resultado do provedor (so com o provedor simulado, fora de producao) para o pagamento em andamento: "aprovado" confirma e
   * "recusado" marca como falhou. A confirmacao nao exige retencao ativa: se ela expirou, vale a decisao da AGT-009 (vaga livre ocupa;
   * sem vaga, registra para a administracao); a segunda parcela depois do prazo tambem e registrada para a administracao.
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
      const linhas = this.pagamentosDa(reservaId);
      // O pagamento em andamento: o pendente; sem pendente, o mais recente (a confirmacao e a recusa repetidas sao idempotentes).
      const alvo = linhas.find((l) => t(l['situacao']) === 'pendente') ?? linhas[linhas.length - 1];
      if (alvo === undefined) throw new HttpError(409, 'pagamento_nao_iniciado');
      const id = Number(alvo['id']);
      if (resultado === 'aprovado') confirmarPagamento(this.db, id, agora, passageiroId);
      else recusarPagamento(this.db, id, agora, passageiroId);
      return this.reservas.obter(passageiroId, reservaId);
    });
  }
}
