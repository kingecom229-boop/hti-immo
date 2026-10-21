import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { useId } from 'react';

interface BaseProps {
  label: string;
  error?: string | undefined;
  hint?: string;
  required?: boolean;
  className?: string;
}

function FieldWrapper({
  id,
  label,
  error,
  hint,
  required,
  className = '',
  children,
}: BaseProps & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={id}>
        {label}
        {required ? (
          <span className="ml-1 text-red-700" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-ink-500 mt-1 text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="error-text" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

type TextFieldProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className' | 'required'>;

export function TextField({ label, error, hint, required, className, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <FieldWrapper
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <input
        id={id}
        className="input"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...rest}
      />
    </FieldWrapper>
  );
}

type TextAreaProps = BaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className' | 'required'>;

export function TextAreaField({ label, error, hint, required, className, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <FieldWrapper
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <textarea
        id={id}
        className="input min-h-28 resize-y"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...rest}
      />
    </FieldWrapper>
  );
}

type SelectProps = BaseProps & {
  children: ReactNode;
  value?: string;
  onChange?: SelectHTMLAttributes<HTMLSelectElement>['onChange'];
  name?: string;
  disabled?: boolean;
};

export function SelectField({
  label,
  error,
  hint,
  required,
  className,
  children,
  ...rest
}: SelectProps) {
  const id = useId();
  return (
    <FieldWrapper
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <select
        id={id}
        className="input bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%233d7689%22><path d=%22M5.5 7.5 10 12l4.5-4.5%22 stroke=%22%233d7689%22 stroke-width=%221.5%22 fill=%22none%22 stroke-linecap=%22round%22/></svg>')] appearance-none bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...rest}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}

interface CheckboxFieldProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function CheckboxField({
  label,
  checked,
  onChange,
  error,
  hint,
  disabled,
  className = '',
}: CheckboxFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className="border-ink-300 text-ink-900 accent-ink-900 mt-0.5 h-4 w-4 shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        <label htmlFor={id} className="text-ink-700 text-sm leading-relaxed">
          {label}
        </label>
      </div>
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-ink-500 mt-1 pl-6.5 text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="error-text pl-6.5" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
