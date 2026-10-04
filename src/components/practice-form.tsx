"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Field = {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
};

export function PracticeForm({
  fields,
  actionLabel,
  nextHref,
  note,
}: {
  fields: Field[];
  actionLabel: string;
  nextHref: string;
  note: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(nextHref);
      }}
    >
      {fields.map((field) => (
        <label key={field.name} className="block">
          <span className="text-sm text-muted">{field.label}</span>
          <input
            required
            name={field.name}
            type={field.type ?? "text"}
            placeholder={field.placeholder}
            value={values[field.name] ?? ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                [field.name]: event.target.value,
              }))
            }
            className="mt-1.5 w-full rounded-2xl border border-line bg-paper px-4 py-3.5 text-base outline-none ring-red/30 focus:ring-2"
          />
        </label>
      ))}
      <button
        type="submit"
        className="mt-2 w-full rounded-full bg-red py-3.5 text-base font-medium text-white"
      >
        {actionLabel}
      </button>
      {note ? (
        <p className="text-center text-xs leading-relaxed text-muted">{note}</p>
      ) : null}
    </form>
  );
}
