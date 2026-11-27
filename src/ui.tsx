import { createContext, useContext, useLayoutEffect } from 'react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

const AppNameContext = createContext('BPM Trip');
export const AppNameProvider = AppNameContext.Provider;
export const useAppName = (): string => useContext(AppNameContext);

/**
 * Define o titulo da aba para a pagina atual (acessibilidade e historico do navegador). Antes de a tela ser desenhada
 * (useLayoutEffect, AGT-017): o titulo muda junto com o conteudo.
 */
export function usePageTitle(title: string): void {
  const appName = useAppName();
  useLayoutEffect(() => {
    document.title = title === appName ? appName : `${title} · ${appName}`;
  }, [title, appName]);
}

/** Aviso de conteudo provisorio, exibido nas paginas institucionais (decisao 4 da AGT-004). */
export function ProvisionalNotice() {
  return (
    <p className="notice notice-provisional">
      Conteúdo provisório, de demonstração. Os textos finais ainda serão definidos pelo responsável do projeto.
    </p>
  );
}

type NoticeKind = 'info' | 'success' | 'error';

export function Notice({ kind, children }: { kind: NoticeKind; children: ReactNode }) {
  return (
    <p className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'name'> {
  name: string;
  label: string;
  hint?: string;
  error?: string | undefined;
}

/** Campo de formulario com rotulo, dica e erro ligados ao controle por aria. */
export function Field({ name, label, hint, error, ...input }: FieldProps) {
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {hint ? (
        <span className="hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      <input
        {...input}
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {error ? (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'name'> {
  name: string;
  label: string;
  hint?: string;
  error?: string | undefined;
}

/** Area de texto com rotulo, dica e erro ligados ao controle por aria. */
export function TextAreaField({ name, label, hint, error, ...area }: TextAreaProps) {
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {hint ? (
        <span className="hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      <textarea
        {...area}
        id={name}
        name={name}
        rows={area.rows ?? 4}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {error ? (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'name' | 'type'> {
  name: string;
  label: string;
  hint?: string;
  error?: string | undefined;
}

/** Caixa de selecao com rotulo ao lado, dica e erro ligados por aria. */
export function CheckboxField({ name, label, hint, error, ...input }: CheckboxProps) {
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');
  return (
    <div className="field field-check">
      <div className="check-row">
        <input
          {...input}
          type="checkbox"
          id={name}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
        />
        <label htmlFor={name}>{label}</label>
      </div>
      {hint ? (
        <span className="hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
