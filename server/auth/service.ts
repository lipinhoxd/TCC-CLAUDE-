import type { DatabaseSync } from 'node:sqlite';
import { registrarAuditoria } from '../db/audit.ts';
import { withTransaction } from '../db/transaction.ts';
import type { AuthConfig } from './config.ts';
import { hashPassword, verifyPassword } from './password.ts';
import type { RecoveryOutbox } from './support.ts';
import { AttemptLimiter, HttpError } from './support.ts';
import { TOKEN_FORMAT, generateToken, hashToken } from './tokens.ts';
import type { FieldErrors } from './validation.ts';
import {
  checkBirthDate,
  checkPassword,
  normalizeCpf,
  normalizeEmail,
  normalizeName,
  normalizePhone,
} from './validation.ts';

export type Perfil = 'passageiro' | 'administrador';

/** Dados do proprio usuario; o CPF e devolvido mascarado e o hash da senha nunca sai do servico. */
export interface PublicUser {
  id: number;
  nome_completo: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  cpf_mascarado: string;
  perfil: Perfil;
}

export interface AuthContext {
  sessaoId: number;
  user: PublicUser;
}

export interface AuthDeps {
  db: DatabaseSync;
  config: AuthConfig;
  outbox: RecoveryOutbox;
  now?: () => Date;
}

type Row = Record<string, unknown>;

function asObject(input: unknown): Row {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'requisicao_invalida');
  }
  return input as Row;
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function maskCpf(cpf: string): string {
  return `***.***.***-${cpf.slice(9)}`;
}

function toPublicUser(row: Row): PublicUser {
  return {
    id: Number(row['id']),
    nome_completo: String(row['nome_completo']),
    email: String(row['email']),
    telefone: String(row['telefone']),
    data_nascimento: String(row['data_nascimento']),
    cpf_mascarado: maskCpf(String(row['cpf'])),
    perfil: row['perfil'] === 'administrador' ? 'administrador' : 'passageiro',
  };
}

export class AuthService {
  private readonly db: DatabaseSync;
  private readonly config: AuthConfig;
  private readonly outbox: RecoveryOutbox;
  private readonly clock: () => Date;
  private readonly loginByAccount: AttemptLimiter;
  private readonly loginByAddress: AttemptLimiter;
  private readonly recoveryByAccount: AttemptLimiter;
  private dummyHash: Promise<string> | null = null;

  constructor(deps: AuthDeps) {
    this.db = deps.db;
    this.config = deps.config;
    this.outbox = deps.outbox;
    this.clock = deps.now ?? (() => new Date());
    const { loginMaxAttempts: max, loginWindowMs: window } = deps.config;
    this.loginByAccount = new AttemptLimiter(max, window);
    this.loginByAddress = new AttemptLimiter(max * 4, window);
    this.recoveryByAccount = new AttemptLimiter(max, window);
  }

  /** Cadastro publico de passageiro (RF-001, RF-002). Sempre cria o perfil passageiro. */
  register(input: unknown): Promise<PublicUser> {
    return this.createUser(asObject(input), 'passageiro', 'usuario.cadastro');
  }

  /** Cria um administrador. Nao e exposto por nenhuma rota HTTP; usado so pelo comando local. */
  createAdministrator(input: unknown): Promise<PublicUser> {
    return this.createUser(asObject(input), 'administrador', 'usuario.administrador_criado');
  }

  private async createUser(body: Row, perfil: Perfil, action: string): Promise<PublicUser> {
    const now = this.clock();
    const fields: FieldErrors = {};

    const nome = normalizeName(body['nome_completo']);
    if (nome === null) {
      fields['nome_completo'] = isBlank(body['nome_completo']) ? 'obrigatorio' : 'invalido';
    }
    const cpf = normalizeCpf(body['cpf']);
    if (cpf === null) {
      fields['cpf'] = isBlank(body['cpf']) ? 'obrigatorio' : 'invalido';
    }
    const nascimento = body['data_nascimento'];
    const birth = checkBirthDate(nascimento, now);
    if (birth !== 'ok') {
      fields['data_nascimento'] = isBlank(nascimento) ? 'obrigatorio' : birth;
    }
    const telefone = normalizePhone(body['telefone']);
    if (telefone === null) {
      fields['telefone'] = isBlank(body['telefone']) ? 'obrigatorio' : 'invalido';
    }
    const email = normalizeEmail(body['email']);
    if (email === null) {
      fields['email'] = isBlank(body['email']) ? 'obrigatorio' : 'invalido';
    }
    const senhaProblem = checkPassword(body['senha'], email);
    if (senhaProblem !== null) {
      fields['senha'] = isBlank(body['senha']) ? 'obrigatorio' : senhaProblem;
    }
    if (Object.keys(fields).length > 0 || nome === null || cpf === null || telefone === null || email === null) {
      throw new HttpError(400, 'validacao', { fields });
    }

    const senhaHash = await hashPassword(body['senha'] as string, this.config.scrypt);
    const iso = now.toISOString();

    return withTransaction(this.db, () => {
      const duplicate = this.db
        .prepare('SELECT id FROM usuario WHERE cpf = ? OR email = ?')
        .get(cpf, email);
      if (duplicate !== undefined) {
        throw new HttpError(409, 'cadastro_duplicado');
      }
      const result = this.db
        .prepare(
          `INSERT INTO usuario (nome_completo, cpf, email, data_nascimento, telefone, senha_hash, perfil, criado_em, atualizado_em)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(nome, cpf, email, body['data_nascimento'] as string, telefone, senhaHash, perfil, iso, iso);
      const id = Number(result.lastInsertRowid);
      registrarAuditoria(this.db, {
        atorUsuarioId: id,
        acao: action,
        entidade: 'usuario',
        registroId: id,
        estadoNovo: { perfil },
        ocorridoEm: now,
      });
      return this.loadUser(id);
    });
  }

  private loadUser(id: number): PublicUser {
    const row = this.db.prepare('SELECT * FROM usuario WHERE id = ?').get(id);
    if (row === undefined) {
      throw new HttpError(404, 'nao_encontrado');
    }
    return toPublicUser(row);
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= hashPassword('senha-ficticia-de-comparacao-1', this.config.scrypt);
    return this.dummyHash;
  }

  /** Login por e-mail e senha (RF-003, RN-006). Mensagem unica para credenciais invalidas. */
  async login(input: unknown, address: string): Promise<{ token: string; expiraEm: string; user: PublicUser }> {
    const body = asObject(input);
    const nowMs = this.clock().getTime();
    const email = normalizeEmail(body['email']);
    const senha = body['senha'];
    const accountKey = `${email ?? '-'}|${address}`;

    const wait = Math.max(
      this.loginByAccount.blockedFor(accountKey, nowMs),
      this.loginByAddress.blockedFor(address, nowMs),
    );
    if (wait > 0) {
      throw new HttpError(429, 'muitas_tentativas', { retryAfterSeconds: wait });
    }

    const row =
      email === null ? undefined : this.db.prepare('SELECT * FROM usuario WHERE email = ?').get(email);
    const plausible = typeof senha === 'string' && senha.length > 0 && senha.length <= 128;
    // Compara sempre contra algum hash, para nao distinguir e-mail inexistente pelo tempo de resposta.
    const stored = row === undefined ? await this.getDummyHash() : String(row['senha_hash']);
    const matches = plausible ? await verifyPassword(senha, stored) : false;

    if (row === undefined || !matches) {
      this.loginByAccount.recordFailure(accountKey, nowMs);
      this.loginByAddress.recordFailure(address, nowMs);
      registrarAuditoria(this.db, {
        atorUsuarioId: null,
        acao: 'auth.login_falha',
        entidade: 'sessao',
        registroId: null,
        estadoNovo: { motivo: 'credenciais_invalidas' },
        ocorridoEm: this.clock(),
      });
      throw new HttpError(401, 'credenciais_invalidas');
    }

    this.loginByAccount.reset(accountKey);
    const user = toPublicUser(row);
    const token = generateToken();
    const now = this.clock();
    const expiraEm = new Date(now.getTime() + this.config.sessionTtlMs).toISOString();
    withTransaction(this.db, () => {
      const result = this.db
        .prepare('INSERT INTO sessao (usuario_id, token_hash, criado_em, expira_em) VALUES (?, ?, ?, ?)')
        .run(user.id, hashToken(token), now.toISOString(), expiraEm);
      registrarAuditoria(this.db, {
        atorUsuarioId: user.id,
        acao: 'auth.login',
        entidade: 'sessao',
        registroId: Number(result.lastInsertRowid),
        ocorridoEm: now,
      });
    });
    return { token, expiraEm, user };
  }

  /** Resolve a sessao a partir do token do cookie; null se ausente, invalida, expirada ou revogada. */
  authenticate(token: string | undefined): AuthContext | null {
    if (token === undefined || !TOKEN_FORMAT.test(token)) {
      return null;
    }
    const row = this.db
      .prepare(
        `SELECT s.id AS sessao_id, u.*
           FROM sessao s JOIN usuario u ON u.id = s.usuario_id
          WHERE s.token_hash = ? AND s.revogada_em IS NULL AND s.expira_em > ?`,
      )
      .get(hashToken(token), this.clock().toISOString());
    return row === undefined ? null : { sessaoId: Number(row['sessao_id']), user: toPublicUser(row) };
  }

  /** Revoga a sessao atual (saida). */
  logout(context: AuthContext): void {
    const now = this.clock();
    withTransaction(this.db, () => {
      this.db
        .prepare('UPDATE sessao SET revogada_em = ? WHERE id = ? AND revogada_em IS NULL')
        .run(now.toISOString(), context.sessaoId);
      registrarAuditoria(this.db, {
        atorUsuarioId: context.user.id,
        acao: 'auth.logout',
        entidade: 'sessao',
        registroId: context.sessaoId,
        ocorridoEm: now,
      });
    });
  }

  /** Atualiza so o proprio nome e telefone (RF-005); CPF, e-mail, nascimento e perfil nao mudam. */
  updateProfile(context: AuthContext, input: unknown): PublicUser {
    const body = asObject(input);
    const allowed = new Set(['nome_completo', 'telefone']);
    const fields: FieldErrors = {};
    for (const key of Object.keys(body)) {
      if (!allowed.has(key)) {
        fields[key] = 'campo_nao_permitido';
      }
    }
    const changes: { nome?: string; telefone?: string } = {};
    if ('nome_completo' in body) {
      const nome = normalizeName(body['nome_completo']);
      if (nome === null) {
        fields['nome_completo'] = 'invalido';
      } else {
        changes.nome = nome;
      }
    }
    if ('telefone' in body) {
      const telefone = normalizePhone(body['telefone']);
      if (telefone === null) {
        fields['telefone'] = 'invalido';
      } else {
        changes.telefone = telefone;
      }
    }
    if (Object.keys(fields).length === 0 && changes.nome === undefined && changes.telefone === undefined) {
      fields['corpo'] = 'obrigatorio';
    }
    if (Object.keys(fields).length > 0) {
      throw new HttpError(400, 'validacao', { fields });
    }
    const now = this.clock();
    return withTransaction(this.db, () => {
      this.db
        .prepare(
          'UPDATE usuario SET nome_completo = COALESCE(?, nome_completo), telefone = COALESCE(?, telefone), atualizado_em = ? WHERE id = ?',
        )
        .run(changes.nome ?? null, changes.telefone ?? null, now.toISOString(), context.user.id);
      registrarAuditoria(this.db, {
        atorUsuarioId: context.user.id,
        acao: 'usuario.perfil_alterado',
        entidade: 'usuario',
        registroId: context.user.id,
        estadoNovo: { campos_alterados: Object.keys(changes).map((k) => (k === 'nome' ? 'nome_completo' : k)) },
        ocorridoEm: now,
      });
      return this.loadUser(context.user.id);
    });
  }

  /** Solicita a recuperacao (RF-006). Responde igual exista ou nao a conta (RN-007). */
  requestRecovery(input: unknown, address: string): void {
    const body = asObject(input);
    const email = normalizeEmail(body['email']);
    if (email === null) {
      throw new HttpError(400, 'validacao', { fields: { email: isBlank(body['email']) ? 'obrigatorio' : 'invalido' } });
    }
    const now = this.clock();
    const key = `${email}|${address}`;
    if (this.recoveryByAccount.blockedFor(key, now.getTime()) > 0) {
      return; // limite excedido: responde como se tivesse aceitado, sem emitir novo token
    }
    this.recoveryByAccount.recordFailure(key, now.getTime());

    const row = this.db.prepare('SELECT id FROM usuario WHERE email = ?').get(email);
    if (row === undefined) {
      return;
    }
    const usuarioId = Number(row['id']);
    const token = generateToken();
    const expiraEm = new Date(now.getTime() + this.config.recoveryTtlMs).toISOString();
    withTransaction(this.db, () => {
      this.db
        .prepare(
          "UPDATE token_acesso SET usado_em = ? WHERE usuario_id = ? AND finalidade = 'recuperacao_acesso' AND usado_em IS NULL",
        )
        .run(now.toISOString(), usuarioId);
      const result = this.db
        .prepare(
          "INSERT INTO token_acesso (usuario_id, finalidade, token_hash, criado_em, expira_em) VALUES (?, 'recuperacao_acesso', ?, ?, ?)",
        )
        .run(usuarioId, hashToken(token), now.toISOString(), expiraEm);
      registrarAuditoria(this.db, {
        atorUsuarioId: usuarioId,
        acao: 'auth.recuperacao_solicitada',
        entidade: 'token_acesso',
        registroId: Number(result.lastInsertRowid),
        ocorridoEm: now,
      });
    });
    try {
      this.outbox({ usuarioId, token, expiraEm });
    } catch (error) {
      // A falha de entrega nao pode revelar a existencia da conta; registra so o tipo do erro.
      console.error(`Falha ao entregar token de recuperacao: ${error instanceof Error ? error.name : 'erro'}`);
    }
  }

  /** Conclui a recuperacao com token de uso unico e validade limitada (RN-007). Revoga todas as sessoes. */
  async confirmRecovery(input: unknown): Promise<void> {
    const body = asObject(input);
    const token = body['token'];
    if (typeof token !== 'string' || !TOKEN_FORMAT.test(token)) {
      throw new HttpError(400, 'token_invalido');
    }
    const problem = checkPassword(body['nova_senha'], null);
    if (problem !== null) {
      throw new HttpError(400, 'validacao', {
        fields: { nova_senha: isBlank(body['nova_senha']) ? 'obrigatorio' : problem },
      });
    }
    const novaHash = await hashPassword(body['nova_senha'] as string, this.config.scrypt);
    const now = this.clock();
    withTransaction(this.db, () => {
      const row = this.db
        .prepare(
          `SELECT t.id AS token_id, u.id AS usuario_id, u.email AS email
             FROM token_acesso t JOIN usuario u ON u.id = t.usuario_id
            WHERE t.token_hash = ? AND t.finalidade = 'recuperacao_acesso'
              AND t.usado_em IS NULL AND t.expira_em > ?`,
        )
        .get(hashToken(token), now.toISOString());
      if (row === undefined) {
        throw new HttpError(400, 'token_invalido');
      }
      if (checkPassword(body['nova_senha'], String(row['email'])) !== null) {
        throw new HttpError(400, 'validacao', { fields: { nova_senha: 'comum' } });
      }
      const used = this.db
        .prepare('UPDATE token_acesso SET usado_em = ? WHERE id = ? AND usado_em IS NULL')
        .run(now.toISOString(), Number(row['token_id']));
      if (Number(used.changes) !== 1) {
        throw new HttpError(400, 'token_invalido');
      }
      const usuarioId = Number(row['usuario_id']);
      this.db
        .prepare('UPDATE usuario SET senha_hash = ?, atualizado_em = ? WHERE id = ?')
        .run(novaHash, now.toISOString(), usuarioId);
      this.db
        .prepare('UPDATE sessao SET revogada_em = ? WHERE usuario_id = ? AND revogada_em IS NULL')
        .run(now.toISOString(), usuarioId);
      registrarAuditoria(this.db, {
        atorUsuarioId: usuarioId,
        acao: 'auth.recuperacao_concluida',
        entidade: 'token_acesso',
        registroId: Number(row['token_id']),
        ocorridoEm: now,
      });
    });
  }
}
