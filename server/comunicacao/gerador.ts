import type { DatabaseSync } from 'node:sqlite';
import { TIPO_POR_ACAO, montarMensagem } from './textos.ts';

/**
 * Gera os avisos a partir da auditoria (AGT-015, RF-040, decisao 3.1 do pesquisador): o codigo de pagamento, reserva e cancelamento nao
 * muda, e uma falha aqui nunca desfaz uma operacao de negocio. O marco (comunicacao_marco) avanca na mesma transacao, e o indice unico
 * por registro de auditoria garante um aviso por evento. So entram eventos posteriores a migracao 5 (decisao 3.3).
 */

export const LOTE_GERACAO = 500;

const ACOES = Object.keys(TIPO_POR_ACAO);

/** Exige transacao aberta. Devolve quantos avisos foram criados. */
export function gerarMensagens(db: DatabaseSync, agora: Date, lote: number = LOTE_GERACAO): number {
  if (!db.isTransaction) throw new Error('A geracao de avisos exige transacao aberta (withTransaction).');
  const marco = db.prepare('SELECT ultima_auditoria_id AS m FROM comunicacao_marco WHERE id = 1').get();
  if (marco === undefined) throw new Error('Marco da comunicacao ausente.');
  const eventos = db
    .prepare(`SELECT id, acao, entidade, registro_id, estado_novo, ocorrido_em FROM auditoria WHERE id > ? AND acao IN (${ACOES.map(() => '?').join(', ')}) ORDER BY id LIMIT ?`)
    .all(Number(marco['m']), ...ACOES, lote);

  const daReserva = db.prepare(
    `SELECT r.usuario_id, u.nome_completo, e.nome AS excursao, e.data_inicial, e.data_final, e.prazo_segunda_parcela_utc,
            EXISTS (SELECT 1 FROM pagamento p WHERE p.reserva_id = r.id AND p.situacao = 'confirmado' AND p.pendencia_administrativa IS NOT NULL) AS em_analise
     FROM reserva r JOIN usuario u ON u.id = r.usuario_id JOIN excursao e ON e.id = r.excursao_id WHERE r.id = ?`,
  );
  const inserir = db.prepare(
    `INSERT INTO mensagem (usuario_id, reserva_id, auditoria_id, tipo, assunto, corpo, evento_em, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (auditoria_id) DO NOTHING`,
  );

  let criadas = 0;
  for (const e of eventos) {
    const tipo = TIPO_POR_ACAO[String(e['acao']) as keyof typeof TIPO_POR_ACAO];
    const estado = (e['estado_novo'] === null ? {} : JSON.parse(String(e['estado_novo']))) as Record<string, unknown>;
    // Evento de reserva aponta a propria reserva; os de pagamento e reembolso a trazem no estado novo.
    const reservaId = Number(e['entidade'] === 'reserva' ? e['registro_id'] : estado['reserva_id']);
    const r = Number.isSafeInteger(reservaId) ? daReserva.get(reservaId) : undefined;
    if (r === undefined) continue;
    const { assunto, corpo } = montarMensagem({
      tipo,
      reservaId,
      nomeCompleto: String(r['nome_completo']),
      excursao: String(r['excursao']),
      dataInicial: String(r['data_inicial']),
      dataFinal: String(r['data_final']),
      prazoSegundaParcela: r['prazo_segunda_parcela_utc'] === null ? null : String(r['prazo_segunda_parcela_utc']),
      evento: estado,
      temPagamentoEmAnalise: Number(r['em_analise']) === 1,
    });
    criadas += Number(inserir.run(Number(r['usuario_id']), reservaId, Number(e['id']), tipo, assunto, corpo, String(e['ocorrido_em']), agora.toISOString()).changes);
  }

  // Lote cheio: continua do ultimo evento lido; senao, avanca ate o fim da auditoria para nao reler os demais registros.
  const ultimo = eventos.length === lote ? Number(eventos[eventos.length - 1]?.['id']) : Number(db.prepare('SELECT COALESCE(MAX(id), 0) AS m FROM auditoria').get()?.['m']);
  db.prepare('UPDATE comunicacao_marco SET ultima_auditoria_id = ? WHERE id = 1 AND ultima_auditoria_id < ?').run(ultimo, ultimo);
  return criadas;
}
