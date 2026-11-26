import type { DatabaseSync } from 'node:sqlite';
import { registrarAuditoria } from '../db/audit.ts';
import { withTransaction } from '../db/transaction.ts';
import type { ProvedorEmail } from './provedor.ts';

/**
 * Entrega dos e-mails pendentes (AGT-015, decisao 3.2 do pesquisador): uma tentativa por execucao da rotina, ate 3; depois a mensagem
 * fica "falhou" e a falha definitiva e auditada sem o conteudo. Cada mensagem tem a propria transacao IMMEDIATE, com o envio dentro
 * dela: dois processos nao enviam a mesma mensagem ao mesmo tempo. Se o processo cair entre o envio e a gravacao, o e-mail pode ser
 * enviado de novo (limitacao registrada). A falha de entrega nunca toca em reserva, pagamento ou reembolso. O erro do provedor nao e
 * escrito, porque pode conter o endereco ou o texto.
 */

export const MAXIMO_TENTATIVAS = 3;
export const LOTE_ENTREGA = 100;

export interface ResultadoEntrega {
  enviadas: number;
  /** Tentativas que falharam nesta execucao, inclusive as definitivas. */
  falhas: number;
  definitivas: number;
}

export function entregarMensagens(db: DatabaseSync, provedor: ProvedorEmail | undefined, agora: Date, lote: number = LOTE_ENTREGA): ResultadoEntrega {
  const resultado: ResultadoEntrega = { enviadas: 0, falhas: 0, definitivas: 0 };
  if (provedor === undefined) return resultado;
  const pendentes = db.prepare("SELECT id FROM mensagem WHERE email_situacao = 'pendente' ORDER BY id LIMIT ?").all(lote);
  for (const p of pendentes) {
    const id = Number(p['id']);
    const desfecho = withTransaction(db, (): 'enviada' | 'falha' | 'definitiva' | 'ignorada' => {
      // Reavaliada dentro da transacao: outro processo pode ter enviado.
      const m = db
        .prepare(
          `SELECT m.reserva_id, m.assunto, m.corpo, m.email_tentativas, u.email FROM mensagem m JOIN usuario u ON u.id = m.usuario_id
           WHERE m.id = ? AND m.email_situacao = 'pendente'`,
        )
        .get(id);
      if (m === undefined) return 'ignorada';
      const tentativas = Number(m['email_tentativas']) + 1;
      try {
        provedor.enviar({ mensagemId: id, para: String(m['email']), assunto: String(m['assunto']), corpo: String(m['corpo']) }, agora);
      } catch {
        const definitiva = tentativas >= MAXIMO_TENTATIVAS;
        db.prepare('UPDATE mensagem SET email_tentativas = ?, email_situacao = ? WHERE id = ?').run(tentativas, definitiva ? 'falhou' : 'pendente', id);
        if (!definitiva) return 'falha';
        registrarAuditoria(db, {
          atorUsuarioId: null,
          acao: 'comunicacao.falha_definitiva',
          entidade: 'mensagem',
          registroId: id,
          estadoAnterior: { situacao: 'pendente' },
          estadoNovo: { situacao: 'falhou', tentativas, reserva_id: Number(m['reserva_id']) },
          ocorridoEm: agora,
        });
        return 'definitiva';
      }
      db.prepare("UPDATE mensagem SET email_tentativas = ?, email_situacao = 'enviado', email_enviado_em = ? WHERE id = ?").run(tentativas, agora.toISOString(), id);
      return 'enviada';
    });
    if (desfecho === 'enviada') resultado.enviadas += 1;
    if (desfecho === 'falha' || desfecho === 'definitiva') resultado.falhas += 1;
    if (desfecho === 'definitiva') resultado.definitivas += 1;
  }
  return resultado;
}
