import type { DatabaseSync } from 'node:sqlite';

export type TransactionMode = 'DEFERRED' | 'IMMEDIATE' | 'EXCLUSIVE';

/**
 * Executa `fn` dentro de uma transacao: confirma se retornar e desfaz tudo se lancar (RNF-009).
 * Use 'IMMEDIATE' em operacoes que leem e depois gravam (ex.: reservar vaga), para que o bloqueio
 * de escrita seja obtido no inicio; ver docs/banco-de-dados.md (RN-040, AGT-008).
 * Nao aceita transacao aninhada. A funcao e sincrona, como o `node:sqlite`.
 */
export function withTransaction<T>(
  db: DatabaseSync,
  fn: () => T,
  mode: TransactionMode = 'IMMEDIATE',
): T {
  if (db.isTransaction) {
    throw new Error('Transacao ja em andamento; transacoes aninhadas nao sao suportadas.');
  }
  db.exec(`BEGIN ${mode}`);
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    if (db.isTransaction) {
      db.exec('ROLLBACK');
    }
    throw error;
  }
}
