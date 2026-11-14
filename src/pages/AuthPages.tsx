import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useRouter } from '../router.tsx';
import type { RegisterInput } from '../session.tsx';
import { useSession } from '../session.tsx';
import { Field, Notice, usePageTitle } from '../ui.tsx';

/** Telas de cadastro e login (RF-008). Senhas ficam so em estado de componente e nunca sao gravadas. */

const FIELD_ORDER = ['nome_completo', 'cpf', 'data_nascimento', 'telefone', 'email', 'senha'] as const;

const MESSAGES: Record<string, Record<string, string>> = {
  nome_completo: { invalido: 'Informe nome e sobrenome.' },
  cpf: { invalido: 'CPF inválido. Confira os 11 números.' },
  data_nascimento: { invalida: 'Data de nascimento inválida.', menor_de_idade: 'É preciso ter 18 anos ou mais.' },
  telefone: { invalido: 'Telefone inválido. Use DDD e número, por exemplo (11) 90000-0000.' },
  email: { invalido: 'E-mail inválido.' },
  senha: {
    curta: 'A senha precisa ter pelo menos 10 caracteres.',
    longa: 'A senha pode ter no máximo 128 caracteres.',
    fraca: 'Use letras e números na senha.',
    comum: 'Essa senha é muito comum. Escolha outra.',
  },
};

function fieldMessage(field: string, code: string): string {
  if (code === 'obrigatorio') return 'Preencha este campo.';
  return MESSAGES[field]?.[code] ?? 'Valor inválido. Confira e tente de novo.';
}

const EMPTY: RegisterInput = { nome_completo: '', cpf: '', data_nascimento: '', telefone: '', email: '', senha: '' };

function AlreadySignedIn() {
  return (
    <>
      <h1>Você já está conectado</h1>
      <p>
        <Link to="/" className="btn btn-primary">
          Ir para a Home
        </Link>
      </p>
    </>
  );
}

export function Cadastro() {
  usePageTitle('Cadastro');
  const { user, register } = useSession();
  const { navigate } = useRouter();
  const [values, setValues] = useState<RegisterInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [focusTarget, setFocusTarget] = useState<string | null>(null);

  useEffect(() => {
    if (focusTarget !== null) {
      document.getElementById(focusTarget)?.focus();
      setFocusTarget(null);
    }
  }, [focusTarget]);

  if (user !== null) return <AlreadySignedIn />;

  const set = (field: keyof RegisterInput) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  const failWith = (found: Record<string, string>, message: string | null) => {
    setErrors(found);
    setFormError(message);
    setFocusTarget(FIELD_ORDER.find((field) => found[field] !== undefined) ?? null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const missing: Record<string, string> = {};
    for (const field of FIELD_ORDER) {
      if (values[field].trim() === '') missing[field] = fieldMessage(field, 'obrigatorio');
    }
    if (Object.keys(missing).length > 0) {
      failWith(missing, 'Corrija os campos destacados.');
      return;
    }
    setBusy(true);
    const result = await register(values);
    setBusy(false);
    if (result.ok) {
      setValues(EMPTY);
      navigate(result.loggedIn ? '/' : '/login', {
        flash: result.loggedIn ? 'Conta criada. Você já está conectado.' : 'Conta criada. Entre para continuar.',
      });
      return;
    }
    if (result.reason === 'validacao') {
      const mapped: Record<string, string> = {};
      for (const [field, code] of Object.entries(result.fields)) mapped[field] = fieldMessage(field, code);
      failWith(mapped, 'Corrija os campos destacados.');
    } else if (result.reason === 'duplicado') {
      failWith({}, 'Não foi possível concluir o cadastro com esses dados. Se você já tem conta, entre pelo Login.');
    } else if (result.reason === 'rede') {
      failWith({}, 'Sem conexão com o servidor. Verifique sua internet e tente novamente.');
    } else {
      failWith({}, 'Algo deu errado. Tente novamente em instantes.');
    }
  };

  return (
    <>
      <h1>Cadastro</h1>
      <p>Todos os campos são obrigatórios. É preciso ter 18 anos ou mais.</p>
      {formError ? <Notice kind="error">{formError}</Notice> : null}
      <form className="form" onSubmit={(event) => void submit(event)} noValidate>
        <Field name="nome_completo" label="Nome completo" autoComplete="name" value={values.nome_completo} onChange={set('nome_completo')} error={errors['nome_completo']} />
        <Field name="cpf" label="CPF" inputMode="numeric" autoComplete="off" hint="Somente números ou com pontos e traço." value={values.cpf} onChange={set('cpf')} error={errors['cpf']} />
        <Field name="data_nascimento" label="Data de nascimento" type="date" autoComplete="bday" value={values.data_nascimento} onChange={set('data_nascimento')} error={errors['data_nascimento']} />
        <Field name="telefone" label="Telefone ou WhatsApp" type="tel" autoComplete="tel" hint="Com DDD, por exemplo (11) 90000-0000." value={values.telefone} onChange={set('telefone')} error={errors['telefone']} />
        <Field name="email" label="E-mail" type="email" autoComplete="email" value={values.email} onChange={set('email')} error={errors['email']} />
        <Field name="senha" label="Senha" type="password" autoComplete="new-password" hint="De 10 a 128 caracteres, com letras e números." value={values.senha} onChange={set('senha')} error={errors['senha']} />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Enviando…' : 'Criar conta'}
        </button>
      </form>
      <p>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </>
  );
}

export function Login() {
  usePageTitle('Login');
  const { user, login } = useSession();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user !== null) return <AlreadySignedIn />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (email.trim() === '' || senha === '') {
      setMessage('Informe e-mail e senha.');
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await login(email, senha);
    setBusy(false);
    if (result.ok) {
      setSenha('');
      navigate('/', { flash: 'Você entrou na sua conta.' });
    } else if (result.reason === 'credenciais') {
      setMessage('E-mail ou senha incorretos.');
    } else if (result.reason === 'bloqueado') {
      const minutes = result.retryAfter === null ? null : Math.max(1, Math.ceil(result.retryAfter / 60));
      setMessage(
        minutes === null
          ? 'Muitas tentativas. Aguarde um pouco e tente novamente.'
          : `Muitas tentativas. Tente novamente em cerca de ${minutes} min.`,
      );
    } else if (result.reason === 'rede') {
      setMessage('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
    } else {
      setMessage('Algo deu errado. Tente novamente em instantes.');
    }
  };

  return (
    <>
      <h1>Login</h1>
      {message ? <Notice kind="error">{message}</Notice> : null}
      <form className="form" onSubmit={(event) => void submit(event)} noValidate>
        <Field name="email" label="E-mail" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Field name="senha" label="Senha" type="password" autoComplete="current-password" value={senha} onChange={(event) => setSenha(event.target.value)} />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p>
        Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
      </p>
    </>
  );
}
