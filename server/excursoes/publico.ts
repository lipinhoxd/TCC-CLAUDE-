import type { DatabaseSync } from 'node:sqlite';
import { utcParaBrasilia } from '../../shared/fuso.ts';
import { sqlRetidas, vagasDisponiveis } from '../vagas/disponibilidade.ts';
import { sqlVencidas } from '../vagas/vencimento.ts';
import { IMAGEM_FORMATO } from './validation.ts';

export { vagasDisponiveis };

/**
 * Consulta publica de excursoes (AGT-006, RF-015 a RF-017). So leitura. Decisoes do pesquisador:
 * so excursoes publicadas e ainda nao terminadas (data final nao anterior a hoje, em Brasilia);
 * da data inicial mais proxima para a mais distante; ate 100 por resposta; vagas livres exatas.
 * AGT-008: as vagas livres descontam as retencoes ativas e nao expiradas (RF-017), pela mesma funcao das reservas.
 * AGT-010: a vaga de uma reserva parcelada com a segunda parcela vencida ja conta como livre na leitura.
 */

export const LIMITE_LISTA_PUBLICA = 100;

/** Campos que a resposta publica pode ter (RNF-028). Nada de ocupacao, capacidade, versao ou auditoria. */
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
  /** Data (Brasilia) limite da segunda parcela, ou null sem parcelamento. */
  prazo_segunda_parcela: string | null;
  vagas_disponiveis: number;
}

type Row = Record<string, unknown>;
const t = (valor: unknown): string => (typeof valor === 'string' ? valor : '');

function paraPublica(row: Row): ExcursaoPublica {
  const imagem = row['imagem_ref'] === null ? null : t(row['imagem_ref']);
  const prazo = row['prazo_segunda_parcela_utc'];
  const parcelado = Number(row['parcelamento_habilitado']) === 1;
  const partida = t(row['partida_utc']);
  const local = utcParaBrasilia(partida);
  return {
    id: Number(row['id']),
    nome: t(row['nome']),
    descricao: t(row['descricao']),
    // Defesa: so devolve a referencia se ela ainda seguir o formato validado na criacao (AGT-005).
    imagem_ref: imagem !== null && IMAGEM_FORMATO.test(imagem) ? imagem : null,
    local: t(row['local']),
    ponto_embarque: t(row['ponto_embarque']),
    data_inicial: t(row['data_inicial']),
    data_final: t(row['data_final']),
    partida_utc: partida,
    partida_brasilia: { data: local.data, hora: local.hora.slice(0, 5) },
    preco_centavos: Number(row['preco_centavos']),
    parcelamento_habilitado: parcelado,
    prazo_segunda_parcela: parcelado && prazo !== null ? utcParaBrasilia(t(prazo)).data : null,
    vagas_disponiveis: vagasDisponiveis(Number(row['capacidade']), Number(row['vagas_ocupadas']), Number(row['retidas']), Number(row['vencidas'])),
  };
}

/** Colunas lidas; a ultima, `retidas`, so alimenta o calculo de vagas e nunca sai na resposta. O "?" e o instante atual. */
const COLUNAS = `id, nome, descricao, imagem_ref, local, ponto_embarque, data_inicial, data_final, partida_utc, capacidade, vagas_ocupadas, preco_centavos, parcelamento_habilitado, prazo_segunda_parcela_utc, ${sqlRetidas('excursao.id')} AS retidas, ${sqlVencidas('excursao.id')} AS vencidas`;

export function listarPublicas(db: DatabaseSync, agora: Date): ExcursaoPublica[] {
  const hoje = utcParaBrasilia(agora).data;
  return db
    .prepare(
      `SELECT ${COLUNAS} FROM excursao WHERE situacao = 'publicada' AND data_final >= ? ORDER BY data_inicial ASC, id ASC LIMIT ?`,
    )
    .all(agora.toISOString(), agora.toISOString(), hoje, LIMITE_LISTA_PUBLICA)
    .map(paraPublica);
}

/** Detalhe; null se a excursao nao existir ou nao estiver visivel (nao distingue os dois casos). */
export function obterPublica(db: DatabaseSync, id: number, agora: Date): ExcursaoPublica | null {
  const hoje = utcParaBrasilia(agora).data;
  const row = db
    .prepare(`SELECT ${COLUNAS} FROM excursao WHERE id = ? AND situacao = 'publicada' AND data_final >= ?`)
    .get(agora.toISOString(), agora.toISOString(), id, hoje);
  return row === undefined ? null : paraPublica(row);
}
