export function Field({
  label,
  className,
  ...props
}: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-sm text-muted">{label}</span>
      <input
        {...props}
        className="mt-1.5 w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none ring-red/30 transition-shadow focus:ring-2"
      />
    </label>
  );
}

export function SelectField({
  label,
  children,
  className,
  ...props
}: { label: string; className?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-sm text-muted">{label}</span>
      <select
        {...props}
        className="mt-1.5 w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none ring-red/30 transition-shadow focus:ring-2"
      >
        {children}
      </select>
    </label>
  );
}
