import { describe, expect, it } from 'vitest';
import { loadAuthConfig, AuthConfigError } from '../server/auth/config.ts';
import { hashPassword, verifyPassword } from '../server/auth/password.ts';
import { generateToken, hashToken, TOKEN_FORMAT } from '../server/auth/tokens.ts';
import {
  checkBirthDate,
  checkPassword,
  normalizeCpf,
  normalizeEmail,
  normalizeName,
  normalizePhone,
} from '../server/auth/validation.ts';

const FAST = { N: 1024, r: 8, p: 1 };

describe('CPF (RN-002)', () => {
  it('aceita CPF valido com ou sem mascara', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
    expect(normalizeCpf('52998224725')).toBe('52998224725');
  });
  it('recusa digito verificador errado, sequencia repetida, tamanho e texto', () => {
    expect(normalizeCpf('52998224726')).toBeNull();
    expect(normalizeCpf('11111111111')).toBeNull();
    expect(normalizeCpf('1234')).toBeNull();
    expect(normalizeCpf('abc.def.ghi-jk')).toBeNull();
    expect(normalizeCpf(52998224725)).toBeNull();
  });
});

describe('e-mail (RN-003)', () => {
  it('normaliza para minusculas e remove espacos', () => {
    expect(normalizeEmail('  Maria.Teste@Exemplo.COM ')).toBe('maria.teste@exemplo.com');
  });
  it('recusa formatos invalidos', () => {
    for (const bad of ['', 'sem-arroba', 'a@b', 'a@@b.com', 'a b@c.com', 'a@.com', 42, null]) {
      expect(normalizeEmail(bad)).toBeNull();
    }
  });
});

describe('telefone (RN-005, so formato)', () => {
  it('normaliza celular e fixo para E.164', () => {
    expect(normalizePhone('(11) 98765-4321')).toBe('+5511987654321');
    expect(normalizePhone('+55 11 98765-4321')).toBe('+5511987654321');
    expect(normalizePhone('5511987654321')).toBe('+5511987654321');
    expect(normalizePhone('(31) 3456-7890')).toBe('+553134567890');
  });
  it('recusa DDD inexistente, tamanho, prefixo de pais e caracteres', () => {
    expect(normalizePhone('(10) 98765-4321')).toBeNull();
    expect(normalizePhone('11 8765-4321x')).toBeNull();
    expect(normalizePhone('11 88765-4321')).toBeNull();
    expect(normalizePhone('+1 11 98765-4321')).toBeNull();
    expect(normalizePhone('123')).toBeNull();
    expect(normalizePhone(null)).toBeNull();
  });
});

describe('data de nascimento e maioridade (RN-001)', () => {
  const now = new Date('2026-11-13T12:00:00.000Z');
  it('aceita quem completa 18 anos hoje e recusa quem completa amanha', () => {
    expect(checkBirthDate('2008-11-13', now)).toBe('ok');
    expect(checkBirthDate('2008-11-14', now)).toBe('menor_de_idade');
    expect(checkBirthDate('2000-02-29', now)).toBe('ok');
  });
  it('recusa data inexistente, futura, formato errado e anterior a 1900', () => {
    expect(checkBirthDate('2001-02-29', now)).toBe('invalida');
    expect(checkBirthDate('2030-01-01', now)).toBe('invalida');
    expect(checkBirthDate('13/11/1990', now)).toBe('invalida');
    expect(checkBirthDate('1800-01-01', now)).toBe('invalida');
    expect(checkBirthDate(undefined, now)).toBe('invalida');
  });
});

describe('nome e senha', () => {
  it('nome exige duas palavras e normaliza espacos', () => {
    expect(normalizeName('  Maria   da Silva ')).toBe('Maria da Silva');
    expect(normalizeName('Maria')).toBeNull();
    expect(normalizeName('Ma\u0000ria Silva')).toBeNull();
  });
  it('senha: minimo de 10, letra e numero, fora da lista de comuns', () => {
    expect(checkPassword('curta1', null)).toBe('curta');
    expect(checkPassword('somenteletras', null)).toBe('fraca');
    expect(checkPassword('1234567890123', null)).toBe('fraca');
    expect(checkPassword('Senha12345', null)).toBe('comum');
    expect(checkPassword('a'.repeat(129) + '1', null)).toBe('longa');
    expect(checkPassword('maria@exemplo.com', 'maria@exemplo.com')).toBe('fraca');
    expect(checkPassword('Boa-senha-2026', null)).toBeNull();
  });
});

describe('hash de senha (scrypt)', () => {
  it('verifica a senha certa e recusa a errada; sal diferente a cada hash', async () => {
    const a = await hashPassword('Boa-senha-2026', FAST);
    const b = await hashPassword('Boa-senha-2026', FAST);
    expect(a).not.toBe(b);
    expect(a.startsWith('scrypt$1024$8$1$')).toBe(true);
    expect(a).not.toContain('Boa-senha-2026');
    expect(await verifyPassword('Boa-senha-2026', a)).toBe(true);
    expect(await verifyPassword('boa-senha-2026', a)).toBe(false);
  });
  it('hash malformado ou com parametros absurdos nao verifica', async () => {
    expect(await verifyPassword('x', 'lixo')).toBe(false);
    expect(await verifyPassword('x', 'scrypt$3$8$1$YQ==$YQ==')).toBe(false);
    expect(await verifyPassword('x', 'scrypt$1024$8$1$YQ==$YQ==')).toBe(false);
  });
});

describe('tokens e configuracao', () => {
  it('token tem 43 caracteres base64url, e unico e o hash e deterministico', () => {
    const t = generateToken();
    expect(TOKEN_FORMAT.test(t)).toBe(true);
    expect(generateToken()).not.toBe(t);
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toContain(t);
    expect(hashToken(t)).toHaveLength(64);
  });
  it('padroes: 8 h de sessao, 30 min de token, cookie seguro so em producao', () => {
    const dev = loadAuthConfig({});
    expect(dev.sessionTtlMs).toBe(8 * 3_600_000);
    expect(dev.recoveryTtlMs).toBe(30 * 60_000);
    expect(dev.cookieSecure).toBe(false);
    expect(dev.recoveryOutboxPath).not.toBeNull();
    const prod = loadAuthConfig({ NODE_ENV: 'production' });
    expect(prod.cookieSecure).toBe(true);
    expect(prod.recoveryOutboxPath).toBeNull();
  });
  it('recusa valores invalidos', () => {
    expect(() => loadAuthConfig({ SESSION_TTL_HOURS: '0' })).toThrow(AuthConfigError);
    expect(() => loadAuthConfig({ LOGIN_MAX_ATTEMPTS: 'x' })).toThrow(AuthConfigError);
    expect(() => loadAuthConfig({ COOKIE_SECURE: 'talvez' })).toThrow(AuthConfigError);
  });
});
