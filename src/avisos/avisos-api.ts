import { NetworkError, apiRequest } from '../api.ts';

/** Cliente dos avisos do passageiro (AGT-015). Os textos vem prontos do servidor e sao mostrados como texto simples. */

export interface Aviso {
  id: number;
  reserva_id: number;
  tipo: string;
  assunto: string;
  corpo: string;
  evento_em: string;
}

export interface PaginaDeAvisos {
  avisos: Aviso[];
  total: number;
  pagina: number;
  limite: number;
}

export type ResultadoAvisos = { ok: true; dados: PaginaDeAvisos } | { ok: false; motivo: 'acesso' | 'rede' | 'erro' };

export async function listarAvisos(pagina: number): Promise<ResultadoAvisos> {
  try {
    const r = await apiRequest<Partial<PaginaDeAvisos>>('GET', pagina === 1 ? '/api/avisos' : `/api/avisos?pagina=${pagina}`);
    const d = r.data;
    if (r.status === 200 && d !== null && Array.isArray(d.avisos) && typeof d.total === 'number' && typeof d.limite === 'number') {
      return { ok: true, dados: { avisos: d.avisos, total: d.total, pagina, limite: d.limite } };
    }
    if (r.status === 401 || r.status === 403) return { ok: false, motivo: 'acesso' };
    return { ok: false, motivo: 'erro' };
  } catch (erro) {
    return { ok: false, motivo: erro instanceof NetworkError ? 'rede' : 'erro' };
  }
}
