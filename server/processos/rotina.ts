import type { DatabaseSync } from 'node:sqlite';
import { withTransaction } from '../db/transaction.ts';
import { concluirReservas } from '../vagas/conclusao.ts';
import { expirarVencidas } from '../vagas/disponibilidade.ts';
import { cancelarSemPagamentoDeExcursaoTerminada } from '../vagas/encerramento.ts';
import { vencerSegundasParcelas } from '../vagas/vencimento.ts';

/**
 * Processos automaticos (AGT-014, RF-022, RF-028, RF-036, RN-025). Decisoes do pesquisador (26/11/2026, "recomendadas"): a rotina
 * chama as mesmas funcoes usadas na leitura e na gravacao (nenhuma regra e reescrita), cada efeito em sua propria transacao
 * BEGIN IMMEDIATE (a falha de um nao desfaz nem impede os outros) e cada alteracao auditada como acao do sistema. Repetir nao tem
 * efeito: o registro alterado deixa de atender a condicao.
 */

export interface PassoRotina {
  nome: string;
  /** Texto usado no console, sempre acompanhado apenas da quantidade. */
  rotulo: string;
  executar: (db: DatabaseSync, agora: Date) => number;
}

/** A ordem importa: o cancelamento sem pagamento vem por ultimo, depois de expirar retencoes e vencer segundas parcelas. */
export const PASSOS: readonly PassoRotina[] = [
  { nome: 'retencoes_expiradas', rotulo: 'retenções expiradas', executar: (db, agora) => expirarVencidas(db, agora) },
  { nome: 'segundas_parcelas_vencidas', rotulo: 'segundas parcelas vencidas', executar: (db, agora) => vencerSegundasParcelas(db, agora) },
  { nome: 'reservas_concluidas', rotulo: 'reservas concluídas', executar: (db, agora) => concluirReservas(db, agora) },
  { nome: 'reservas_sem_pagamento_canceladas', rotulo: 'reservas sem pagamento canceladas', executar: cancelarSemPagamentoDeExcursaoTerminada },
];

export interface ResultadoRotina {
  /** Quantidade alterada por passo; null se o passo falhou (e nada dele foi gravado). */
  passos: Array<{ nome: string; rotulo: string; alterados: number | null }>;
  falhas: Array<{ nome: string; erro: string }>;
}

/**
 * Descricao de um erro sem dados do banco (RNF-027): o texto generico do SQLite (ex.: "database is locked") ou so o nome do erro.
 * A mensagem completa nao e usada.
 */
export function descreverErro(erro: unknown): string {
  if (erro !== null && typeof erro === 'object' && 'errstr' in erro && typeof erro.errstr === 'string') return erro.errstr;
  return erro instanceof Error ? erro.name : 'erro desconhecido';
}

/** Executa uma vez todos os passos. Nao lanca por falha de um passo: ela vai para `falhas` e a execucao seguinte tenta de novo. */
export function executarRotina(db: DatabaseSync, agora: Date, passos: readonly PassoRotina[] = PASSOS): ResultadoRotina {
  const resultado: ResultadoRotina = { passos: [], falhas: [] };
  for (const passo of passos) {
    try {
      const alterados = withTransaction(db, () => passo.executar(db, agora));
      resultado.passos.push({ nome: passo.nome, rotulo: passo.rotulo, alterados });
    } catch (erro) {
      resultado.passos.push({ nome: passo.nome, rotulo: passo.rotulo, alterados: null });
      resultado.falhas.push({ nome: passo.nome, erro: descreverErro(erro) });
    }
  }
  return resultado;
}

/** Houve alguma alteracao ou falha? */
export function houveNovidade(resultado: ResultadoRotina): boolean {
  return resultado.falhas.length > 0 || resultado.passos.some((p) => (p.alterados ?? 0) > 0);
}

/** Linhas para o console: so contagens e nomes dos passos, sem identificadores nem dados pessoais. */
export function linhasDoResultado(resultado: ResultadoRotina): string[] {
  const contagens = resultado.passos.map((p) => `${p.rotulo}: ${p.alterados === null ? 'falhou' : p.alterados}`).join('; ');
  return [`Rotina automática: ${contagens}.`, ...resultado.falhas.map((f) => `Rotina automática: falha em ${f.nome} (${f.erro}); será tentada de novo.`)];
}
