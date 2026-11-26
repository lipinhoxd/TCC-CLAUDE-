import type { DatabaseSync } from 'node:sqlite';
import { HttpError } from '../auth/support.ts';

/** Avisos do proprio passageiro (AGT-015, decisao 3.4 do pesquisador): so ele os le; nao ha consulta administrativa. */

export const AVISOS_POR_PAGINA = 20;

export interface AvisoDto {
  id: number;
  reserva_id: number;
  tipo: string;
  assunto: string;
  corpo: string;
  evento_em: string;
}

export class AvisoService {
  private readonly db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  /** Do mais recente para o mais antigo. O passageiro vem sempre da sessao. */
  listar(passageiroId: number, consulta: Record<string, string | undefined>): { avisos: AvisoDto[]; total: number; pagina: number; limite: number } {
    for (const chave of Object.keys(consulta)) if (chave !== 'pagina') throw new HttpError(400, 'validacao', { fields: { [chave]: 'campo_nao_permitido' } });
    const bruto = consulta['pagina'];
    const pagina = bruto === undefined || bruto === '' ? 1 : /^[0-9]{1,6}$/.test(bruto) ? Number(bruto) : 0;
    if (pagina < 1) throw new HttpError(400, 'validacao', { fields: { pagina: 'invalido' } });
    const total = Number(this.db.prepare('SELECT COUNT(*) AS n FROM mensagem WHERE usuario_id = ?').get(passageiroId)?.['n']);
    const avisos = this.db
      .prepare('SELECT id, reserva_id, tipo, assunto, corpo, evento_em FROM mensagem WHERE usuario_id = ? ORDER BY id DESC LIMIT ? OFFSET ?')
      .all(passageiroId, AVISOS_POR_PAGINA, (pagina - 1) * AVISOS_POR_PAGINA)
      .map((m) => ({
        id: Number(m['id']),
        reserva_id: Number(m['reserva_id']),
        tipo: String(m['tipo']),
        assunto: String(m['assunto']),
        corpo: String(m['corpo']),
        evento_em: String(m['evento_em']),
      }));
    return { avisos, total, pagina, limite: AVISOS_POR_PAGINA };
  }
}
