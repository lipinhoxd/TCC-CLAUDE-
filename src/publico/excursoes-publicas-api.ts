import { NetworkError, apiRequest } from '../api.ts';

/** Cliente da consulta publica de excursoes (AGT-006). Leitura apenas; nao depende de sessao. */

export interface ExcursaoPublica {
  id: number;
  nome: string;
  descricao: string;
  imagem_ref: string | null;
  local: string;
  ponto_embarque: string;
  data_inicial: string;
  data_final: string;
  partida_utc: string;
  partida_brasilia: { data: string; hora: string };
  preco_centavos: number;
  parcelamento_habilitado: boolean;
  prazo_segunda_parcela: string | null;
  vagas_disponiveis: number;
}

export type ResultadoPublico<T> =
  | { ok: true; dados: T }
  | { ok: false; motivo: 'nao_encontrada' | 'rede' | 'erro' };

async function consultar<T>(caminho: string, extrair: (corpo: Record<string, unknown>) => T): Promise<ResultadoPublico<T>> {
  try {
    const r = await apiRequest<Record<string, unknown>>('GET', caminho);
    if (r.status === 200 && r.data !== null) return { ok: true, dados: extrair(r.data) };
    if (r.status === 404) return { ok: false, motivo: 'nao_encontrada' };
    return { ok: false, motivo: 'erro' };
  } catch (erro) {
    return { ok: false, motivo: erro instanceof NetworkError ? 'rede' : 'erro' };
  }
}

export const consultaPublica = {
  listar: () => consultar('/api/excursoes', (c) => c['excursoes'] as ExcursaoPublica[]),
  obter: (id: number) => consultar(`/api/excursoes/${id}`, (c) => c['excursao'] as ExcursaoPublica),
};

/** Mesmo formato que o servidor valida: so caminhos da pasta de imagens do projeto. */
export const IMAGEM_VALIDA = /^imagens\/[a-z0-9][a-z0-9._-]{0,80}\.(jpg|jpeg|png|webp)$/;
