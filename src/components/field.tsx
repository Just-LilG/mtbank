"use client";

import { useId, useState } from "react";

const control =
  "mt-1.5 w-full rounded-2xl border bg-card px-4 py-3 outline-none transition-[box-shadow,border-color] focus:border-red focus:ring-2 focus:ring-red/25 disabled:bg-line/30 disabled:text-muted";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Field({ label, hint, error, className, id, ...props }: FieldProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const noteId = `${inputId}-note`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="text-sm text-muted">
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? noteId : undefined}
        className={`${control} ${error ? "border-danger" : "border-line"}`}
      />
      {(error || hint) && (
        <p id={noteId} className={`mt-1.5 text-xs ${error ? "text-danger" : "text-muted"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function PasswordField({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: Omit<FieldProps, "type">) {
  const auto = useId();
  const inputId = id ?? auto;
  const [shown, setShown] = useState(false);
  return (
    <div className={className}>
      <label htmlFor={inputId} className="text-sm text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={inputId}
          type={shown ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          className={`${control} pr-16 ${error ? "border-danger" : "border-line"}`}
        />
        <button
          type="button"
          onClick={() => setShown((value) => !value)}
          aria-pressed={shown}
          className="absolute right-2 top-1/2 mt-[3px] -translate-y-1/2 rounded-full px-3 py-1.5 text-sm text-muted hover:text-ink"
        >
          {shown ? "Hide" : "Show"}
        </button>
      </div>
      {(error || hint) && (
        <p className={`mt-1.5 text-xs ${error ? "text-danger" : "text-muted"}`}>{error || hint}</p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  children,
  className,
  id,
  ...props
}: { label: string; className?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <div className={className}>
      <label htmlFor={selectId} className="text-sm text-muted">
        {label}
      </label>
      <select {...props} id={selectId} className={`${control} border-line`}>
        {children}
      </select>
    </div>
  );
}
