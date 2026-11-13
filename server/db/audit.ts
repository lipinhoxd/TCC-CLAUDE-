import type { DatabaseSync } from 'node:sqlite';

export interface AuditEntry {
  atorUsuarioId: number | null;
  acao: string;
  entidade: string;
  registroId: number | null;
  estadoAnterior?: Record<string, unknown> | null;
  estadoNovo?: Record<string, unknown> | null;
  ocorridoEm?: Date;
}

/** Campos que nunca podem entrar na auditoria (RN-042). */
const FORBIDDEN_KEYS = /senha|password|token|segredo|secret|hash|cpf|email|telefone|nascimento/i;

export class AuditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuditError';
  }
}

function assertSafe(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertSafe(item, `${path}[${i}]`));
  } else if (value !== null && typeof value === 'object') {
    for (const [key, inner] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.test(key)) {
        throw new AuditError(`Campo nao permitido na auditoria: ${path}.${key}`);
      }
      assertSafe(inner, `${path}.${key}`);
    }
  }
}

function serialize(state: Record<string, unknown> | null | undefined, path: string): string | null {
  if (state === null || state === undefined) {
    return null;
  }
  assertSafe(state, path);
  return JSON.stringify(state);
}

/** Registra um evento de auditoria; rejeita campos sensiveis (RN-041 e RN-042). */
export function registrarAuditoria(db: DatabaseSync, entry: AuditEntry): number {
  const anterior = serialize(entry.estadoAnterior, 'estadoAnterior');
  const novo = serialize(entry.estadoNovo, 'estadoNovo');
  const result = db
    .prepare(
      `INSERT INTO auditoria (ator_usuario_id, acao, entidade, registro_id, estado_anterior, estado_novo, ocorrido_em)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      entry.atorUsuarioId,
      entry.acao,
      entry.entidade,
      entry.registroId,
      anterior,
      novo,
      (entry.ocorridoEm ?? new Date()).toISOString(),
    );
  return Number(result.lastInsertRowid);
}
