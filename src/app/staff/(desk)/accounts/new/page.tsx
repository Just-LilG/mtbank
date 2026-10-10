"use client";

import Link from "next/link";
import { useState } from "react";
import { useBank } from "@/components/bank-provider";
import { Field } from "@/components/field";
import {
  CopyButton,
  MoneyInput,
  Notice,
  PageHeader,
  Segmented,
  Spinner,
  StaffPage,
  ghostBtn,
  primaryBtn,
} from "@/components/staff/ui";

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
      <StaffPage>
        <div className="max-w-xl">
          <span className="done-pop grid h-16 w-16 place-items-center rounded-full bg-moss/15 text-moss ring-8 ring-moss/10">
            <svg viewBox="0 0 24 24" className="check-draw h-8 w-8" fill="none" aria-hidden>
              <path d="M5 12.500l4.500 4.500L19 7" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h1 className="font-display mt-5 text-3xl tracking-tight">{opened.name}&rsquo;s account is open</h1>
          <p className="mt-2 text-muted">
            Hand these to the customer. They sign in with the account number, not an email.
          </p>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-line bg-card">
            <div className="bg-panel px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-white/50">Account number</p>
                <CopyButton value={opened.accountNumber.replace(/\s/g, "")} />
              </div>
              <p className="font-display tabular mt-2 text-3xl tracking-[0.04em]">{opened.accountNumber}</p>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Password</p>
                <CopyButton value={opened.password} />
              </div>
              <p className="mono mt-2 text-2xl tracking-wide">{opened.password}</p>
            </div>
            <p className="border-t border-line bg-amber-50 px-6 py-3 text-sm text-amber-900">
              This password is shown only now. Write it down before you leave this page.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={`/staff/customers/${opened.id}`} className={primaryBtn}>
              Open their file
            </Link>
            <button type="button" onClick={() => { setOpened(null); setForm({ name: "", email: "", phone: "", nationalId: "", address: "", opening: "", pot: "everyday" }); }} className={ghostBtn}>
              Open another
            </button>
          </div>
        </div>
      </StaffPage>
    );
  }

  return (
    <StaffPage>
      <PageHeader
        title="Open an account"
        subtitle="The desk creates the account number and password. Email is only a way to reach them."
      />
      <form
        className="mt-6 max-w-3xl space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
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
        <fieldset className="rounded-[24px] border border-line bg-card p-5">
          <legend className="sr-only">Who they are</legend>
          <h2 className="font-display text-lg">Who they are</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              required
              autoComplete="off"
              placeholder="As on their ID"
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              className="sm:col-span-2"
            />
            <Field
              label="Email (optional)"
              type="email"
              autoComplete="off"
              placeholder="name@example.com"
              value={form.email}
              onChange={(event) => set("email", event.target.value)}
            />
            <Field
              label="Phone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="055 000 0000"
              value={form.phone}
              onChange={(event) => set("phone", event.target.value)}
            />
            <Field
              label="ID number"
              autoComplete="off"
              placeholder="Card or passport number"
              value={form.nationalId}
              onChange={(event) => set("nationalId", event.target.value)}
            />
            <Field
              label="Address"
              autoComplete="off"
              placeholder="Where they live"
              value={form.address}
              onChange={(event) => set("address", event.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="rounded-[24px] border border-line bg-card p-5">
          <legend className="sr-only">Opening the account</legend>
          <h2 className="font-display text-lg">Opening cash</h2>
          <p className="mt-1 text-sm text-muted">Optional. Leave it empty to open with nothing in it.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:items-end">
            <MoneyInput label="Amount" value={form.opening} onChange={(value) => set("opening", value)} />
            <div>
              <p className="text-sm text-muted">Goes into</p>
              <div className="mt-1.5">
                <Segmented
                  label="Which pot"
                  value={form.pot}
                  onChange={(value) => set("pot", value)}
                  options={[
                    { value: "everyday", label: "Everyday" },
                    { value: "savings", label: "Savings" },
                  ]}
                />
              </div>
            </div>
          </div>
        </fieldset>

        {error && <Notice tone="error">{error}</Notice>}

        <button type="submit" disabled={busy || !form.name.trim()} className={primaryBtn}>
          {busy && <Spinner />}
          {busy ? "Opening…" : "Open the account"}
        </button>
      </form>
    </StaffPage>
  );
}
