import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { FieldErrors } from './validation.ts';

/** Erro de negocio com status HTTP e codigo estavel; nunca carrega dados pessoais. */
export class HttpError extends Error {
  status: number;
  code: string;
  fields: FieldErrors | undefined;
  retryAfterSeconds: number | undefined;

  constructor(status: number, code: string, extra: { fields?: FieldErrors; retryAfterSeconds?: number } = {}) {
    super(code);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.fields = extra.fields;
    this.retryAfterSeconds = extra.retryAfterSeconds;
  }
}

/**
 * Limitador de tentativas em memoria (janela fixa por chave). Reinicia com o processo e vale por
 * instancia; ver limitacoes em docs/autenticacao.md.
 */
export class AttemptLimiter {
  private readonly entries = new Map<string, { count: number; windowEnd: number }>();
  private readonly max: number;
  private readonly windowMs: number;
  private readonly capacity = 10_000;

  constructor(max: number, windowMs: number) {
    this.max = max;
    this.windowMs = windowMs;
  }

  /** Segundos restantes de bloqueio, ou 0 se a chave pode tentar. */
  blockedFor(key: string, nowMs: number): number {
    const entry = this.entries.get(key);
    if (entry === undefined || entry.windowEnd <= nowMs || entry.count < this.max) {
      return 0;
    }
    return Math.max(1, Math.ceil((entry.windowEnd - nowMs) / 1000));
  }

  recordFailure(key: string, nowMs: number): void {
    const entry = this.entries.get(key);
    if (entry === undefined || entry.windowEnd <= nowMs) {
      if (this.entries.size >= this.capacity) {
        this.evict(nowMs);
      }
      this.entries.set(key, { count: 1, windowEnd: nowMs + this.windowMs });
    } else {
      entry.count += 1;
    }
  }

  reset(key: string): void {
    this.entries.delete(key);
  }

  /** Desfaz uma tentativa contada (a que deu certo), sem zerar as falhas anteriores da chave. */
  release(key: string): void {
    const entry = this.entries.get(key);
    if (entry === undefined) {
      return;
    }
    entry.count -= 1;
    if (entry.count <= 0) {
      this.entries.delete(key);
    }
  }

  private evict(nowMs: number): void {
    for (const [key, entry] of this.entries) {
      if (entry.windowEnd <= nowMs) {
        this.entries.delete(key);
      }
    }
    if (this.entries.size >= this.capacity) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) {
        this.entries.delete(oldest);
      }
    }
  }
}

export interface RecoveryMessage {
  usuarioId: number;
  token: string;
  expiraEm: string;
}

/** "Entrega" do token de recuperacao (decisao 4 da AGT-003). Nao ha envio real de e-mail. */
export type RecoveryOutbox = (message: RecoveryMessage) => void;

/** Entrega em arquivo local (JSON por linha), so em desenvolvimento. O token nunca vai ao log nem a API. */
export function fileOutbox(path: string): RecoveryOutbox {
  return (message) => {
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, `${JSON.stringify(message)}\n`, { encoding: 'utf8', mode: 0o600 });
  };
}

/** Sem canal de entrega (producao enquanto nao houver provedor de e-mail). */
export const noOutbox: RecoveryOutbox = () => undefined;
