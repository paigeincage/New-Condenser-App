import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <div className="text-sm font-semibold text-[var(--text)]">{children}</div>
      {hint && <div className="text-xs text-[var(--text-3)] mt-0.5">{hint}</div>}
    </div>
  );
}

const INPUT_CLASS =
  'w-full px-3 py-2.5 rounded-lg border-2 border-[var(--border)] bg-[var(--card-2)] text-[var(--text)] placeholder:text-[var(--text-3)] focus:border-[var(--accent)] focus:outline-none transition-colors';

export function TextField(
  props: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }
) {
  const { label, hint, className, ...rest } = props;
  return (
    <label className="block">
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <input {...rest} className={`${INPUT_CLASS} ${className ?? ''}`} />
    </label>
  );
}

export function TextAreaField(
  props: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }
) {
  const { label, hint, className, ...rest } = props;
  return (
    <label className="block">
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <textarea {...rest} className={`${INPUT_CLASS} resize-none ${className ?? ''}`} />
    </label>
  );
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between py-3 text-left group"
    >
      <div className="flex-1 pr-4">
        <div className="text-sm font-semibold text-[var(--text)]">{label}</div>
        {hint && <div className="text-xs text-[var(--text-3)] mt-0.5">{hint}</div>}
      </div>
      <span
        className={`inline-flex items-center h-6 w-11 rounded-full transition-colors border-2 ${
          checked ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-[var(--card-2)] border-[var(--border)]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 bg-white rounded-full shadow transform transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}

export function SelectField({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={INPUT_CLASS}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-3)]">
          {title}
        </h2>
        {description && <p className="text-xs text-[var(--text-3)] mt-1">{description}</p>}
      </div>
      <div className="app-card space-y-4">{children}</div>
    </section>
  );
}
