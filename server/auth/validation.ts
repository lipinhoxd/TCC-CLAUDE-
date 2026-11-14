export type FieldErrors = Record<string, string>;

const EMAIL_FORMAT =
  /^[a-z0-9.!#$%&*+/=?^_{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

/** Normaliza o e-mail (RN-003): remove espacos e converte para minusculas. Retorna null se invalido. */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && EMAIL_FORMAT.test(email) ? email : null;
}

/** Valida e normaliza o CPF (RN-002): 11 digitos, digitos verificadores corretos, sem sequencia repetida. */
export function normalizeCpf(raw: unknown): string | null {
  if (typeof raw !== 'string' || !/^[\d.\-\s]+$/.test(raw)) {
    return null;
  }
  const cpf = raw.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return null;
  }
  const digits = [...cpf].map(Number);
  for (const size of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < size; i += 1) {
      sum += (digits[i] ?? 0) * (size + 1 - i);
    }
    const check = ((sum * 10) % 11) % 10;
    if (check !== digits[size]) {
      return null;
    }
  }
  return cpf;
}

const VALID_DDD = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46,
  47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85,
  86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/**
 * Valida o formato do telefone ou WhatsApp brasileiro (RN-005, decisao 3 da AGT-003: so formato e
 * normalizacao) e devolve o numero em E.164 (+55DDNNNNNNNNN). Nao comprova a posse do numero.
 */
export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== 'string' || !/^[\d\s().+-]+$/.test(raw)) {
    return null;
  }
  let digits = raw.replace(/\D/g, '');
  if (raw.trim().startsWith('+') || digits.length > 11) {
    if (!digits.startsWith('55')) {
      return null;
    }
    digits = digits.slice(2);
  }
  if (digits.length !== 10 && digits.length !== 11) {
    return null;
  }
  const ddd = Number(digits.slice(0, 2));
  const local = digits.slice(2);
  const mobile = local.length === 9 && local.startsWith('9');
  const landline = local.length === 8 && /^[2-5]/.test(local);
  return VALID_DDD.has(ddd) && (mobile || landline) ? `+55${digits}` : null;
}

export type BirthDateResult = 'ok' | 'invalida' | 'menor_de_idade';

/** Valida a data (AAAA-MM-DD, existente, nao futura) e a maioridade de 18 anos (RN-001). */
export function checkBirthDate(raw: unknown, now: Date): BirthDateResult {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return 'invalida';
  }
  const [y, m, d] = raw.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d || y < 1900) {
    return 'invalida';
  }
  const ny = now.getUTCFullYear();
  const nm = now.getUTCMonth() + 1;
  const nd = now.getUTCDate();
  if (y > ny || (y === ny && (m > nm || (m === nm && d > nd)))) {
    return 'invalida';
  }
  let age = ny - y;
  if (nm < m || (nm === m && nd < d)) {
    age -= 1;
  }
  return age >= 18 ? 'ok' : 'menor_de_idade';
}

/** Normaliza o nome: exige ao menos duas palavras (nome completo) e rejeita caracteres de controle. */
export function normalizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(raw)) {
    return null;
  }
  const name = raw.trim().replace(/\s+/g, ' ');
  return name.length >= 5 && name.length <= 120 && name.includes(' ') ? name : null;
}

const COMMON_PASSWORDS = new Set([
  'senha12345',
  '1234567890',
  'password123',
  'qwerty12345',
  'abc1234567',
  'senha123456',
  'brasil12345',
  '12345678910',
  'excursao123',
  'mudar12345',
]);

/** Regra minima de senha (RNF-001): 10 a 128 caracteres, com letra e numero, fora da lista de senhas comuns. */
export function checkPassword(raw: unknown, email: string | null): string | null {
  if (typeof raw !== 'string') {
    return 'invalida';
  }
  if (raw.length < 10) {
    return 'curta';
  }
  if (raw.length > 128) {
    return 'longa';
  }
  if (!/\p{L}/u.test(raw) || !/\d/.test(raw)) {
    return 'fraca';
  }
  if (COMMON_PASSWORDS.has(raw.toLowerCase()) || (email !== null && raw.toLowerCase() === email)) {
    return 'comum';
  }
  return null;
}
