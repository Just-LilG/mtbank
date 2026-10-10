"use client";

import Link from "next/link";
import { useState } from "react";
import { changePassword } from "@/app/actions";
import { useBank } from "@/components/bank-provider";
import { AutoSignOut } from "@/components/customer/auto-sign-out";
import { BiometricSettings } from "@/components/customer/biometric";
import { SecurityActivity } from "@/components/customer/security-activity";
import { PasswordField } from "@/components/field";
import { IconChevronLeft } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/components/toast";
import { Spinner } from "@/components/staff/ui";

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function ChangePassword() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const mismatch = again.length > 0 && next !== again;
  const ready = current.length > 0 && next.length >= 8 && next === again;

  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-card">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-red/10 text-red">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="5" y="11" width="14" height="9" rx="2.500" />
              <path d="M8.500 11V8a3.500 3.500 0 0 1 7 0v3" />
            </svg>
          </span>
          Change password
        </span>
        <svg viewBox="0 0 24 24" className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <form
          className="space-y-4 border-t border-line px-4 pb-5 pt-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            const problem = await changePassword(current, next);
            setBusy(false);
            if (problem) {
              setError(problem);
              return;
            }
            setCurrent("");
            setNext("");
            setAgain("");
            setOpen(false);
            toast("Password changed");
          }}
        >
          <PasswordField label="Current password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <PasswordField
            label="New password"
            autoComplete="new-password"
            hint="At least 8 characters. A short phrase works well."
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <PasswordField
            label="New password again"
            autoComplete="new-password"
            error={mismatch ? "These do not match yet." : undefined}
            value={again}
            onChange={(e) => setAgain(e.target.value)}
          />
          {error && (
            <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={!ready || busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-solid py-3.5 font-medium text-white transition-opacity disabled:opacity-40"
          >
            {busy && <Spinner />}
            Save new password
          </button>
        </form>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { me } = useBank();
  if (!me) return null;

  const links = [
    { href: "/support", label: "Support" },
    { href: "/about", label: "About" },
  ];

  return (
    <div className="px-5 pb-8 pt-7 md:max-w-xl">
      <div className="flex items-center gap-3">
        <Link
          href="/customer/profile"
          aria-label="Back to profile"
          className="grid h-11 w-11 place-items-center rounded-full border border-line bg-card text-ink shadow-sm"
        >
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-2xl tracking-tight">Settings</h1>
      </div>

      <h2 className="mb-2 mt-6 px-1 text-xs font-medium uppercase tracking-[0.14em] text-muted">Security</h2>
      <div className="space-y-3">
        <BiometricSettings />
        <ChangePassword />
        <AutoSignOut />
      </div>

      <h2 className="mb-2 mt-6 px-1 text-xs font-medium uppercase tracking-[0.14em] text-muted">Recent activity</h2>
      <SecurityActivity />

      <h2 className="mb-2 mt-6 px-1 text-xs font-medium uppercase tracking-[0.14em] text-muted">Display</h2>
      <section className="rounded-[24px] border border-line bg-card px-4 py-4">
        <p className="text-sm text-muted">Appearance</p>
        <div className="mt-2.5">
          <ThemeToggle />
        </div>
      </section>

      <h2 className="mb-2 mt-6 px-1 text-xs font-medium uppercase tracking-[0.14em] text-muted">Help</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-card">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center justify-between px-4 py-3.5 text-sm transition-colors active:bg-line/60"
            >
              {link.label}
              <Chevron />
            </Link>
          </li>
        ))}
      </ul>

    </div>
  );
}
