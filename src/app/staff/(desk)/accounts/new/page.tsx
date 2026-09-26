"use client";

import Link from "next/link";
import { useState } from "react";
import { useBank } from "@/components/bank-provider";
import { Field, SelectField } from "@/components/field";

export default function NewAccountPage() {
  const bank = useBank();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState<{
    id: string;
    accountNumber: string;
    password: string;
    name: string;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    nationalId: "",
    address: "",
    opening: "",
    pot: "everyday" as "everyday" | "savings",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  if (opened) {
    return (
      <div className="px-5 py-7 sm:px-8">
        <p className="text-sm text-moss">Account is open</p>
        <h1 className="font-display text-5xl tracking-tight">{opened.name}</h1>
        <p className="mt-3 max-w-xl text-muted">
          Write these down and hand them to the customer. This password is shown only now. They sign in with the account number, not an email.
        </p>
        <dl className="mt-6 max-w-xl divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-card">
          <div className="px-5 py-4">
            <dt className="text-sm text-muted">Account number</dt>
            <dd className="font-display mt-1 text-3xl tracking-tight">{opened.accountNumber}</dd>
          </div>
          <div className="px-5 py-4">
            <dt className="text-sm text-muted">Password</dt>
            <dd className="mt-1 font-mono text-2xl tracking-wide">{opened.password}</dd>
          </div>
        </dl>
        <Link
          href={`/staff/customers/${opened.id}`}
          className="mt-6 inline-block rounded-full bg-ink px-5 py-3 text-white"
        >
          Open their file
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 py-7 sm:px-8">
      <p className="text-sm text-muted">Only the branch can do this</p>
      <h1 className="font-display text-5xl tracking-tight">Open an account</h1>
      <p className="mt-3 max-w-xl text-muted">
        The desk creates the account number and password. Hand both to the customer. Email is only a way to reach them, not how they sign in.
      </p>
      <form
        className="mt-6 max-w-3xl space-y-8"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          const result = await bank.openAccount({
            ...form,
            opening: Number(form.opening || 0),
          });
          setBusy(false);
          if ("error" in result) {
            setError(result.error);
            return;
          }
          setOpened({ ...result, name: form.name.trim() });
        }}
      >
        <fieldset>
          <legend className="text-xs uppercase tracking-[0.18em] text-muted">Who they are</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required value={form.name} onChange={(event) => set("name", event.target.value)} />
            <Field
              label="Email (optional)"
              type="email"
              value={form.email}
              onChange={(event) => set("email", event.target.value)}
            />
            <Field label="Phone" value={form.phone} onChange={(event) => set("phone", event.target.value)} />
            <Field label="ID number" value={form.nationalId} onChange={(event) => set("nationalId", event.target.value)} />
            <Field
              label="Address"
              value={form.address}
              onChange={(event) => set("address", event.target.value)}
              className="sm:col-span-2"
            />
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs uppercase tracking-[0.18em] text-muted">Opening the account</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Opening cash goes to"
              value={form.pot}
              onChange={(event) => set("pot", event.target.value as "everyday" | "savings")}
            >
              <option value="everyday">Everyday account</option>
              <option value="savings">Savings</option>
            </SelectField>
            <Field
              label="Opening cash"
              inputMode="decimal"
              value={form.opening}
              placeholder="0"
              onChange={(event) => set("opening", event.target.value)}
            />
          </div>
        </fieldset>

        <div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-red px-5 py-3 text-white transition-opacity disabled:opacity-60"
          >
            {busy && (
              <span
                aria-hidden
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            )}
            {busy ? "Opening…" : "Open the account"}
          </button>
          {error && <p className="mt-3 text-sm text-red">{error}</p>}
        </div>
      </form>
    </div>
  );
}
