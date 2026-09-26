"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBank } from "@/components/bank-provider";
import { Field } from "@/components/field";
import { Mark } from "@/components/mark";

export default function StaffLoginPage() {
  const bank = useBank();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const firstTime = bank.ready && !bank.hasStaff;

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="flex flex-col justify-between bg-ink px-6 py-8 text-white sm:px-10">
        <Mark tone="light" />
        <div className="py-12">
          <p className="text-xs uppercase tracking-[0.24em] text-white/50">Staff door</p>
          <h1 className="font-display mt-4 max-w-md text-5xl leading-none tracking-tight sm:text-6xl">
            The branch, on one desk.
          </h1>
        </div>
        <p className="text-sm text-white/55">
          Open accounts, move cash, issue cards, freeze when you must.
        </p>
      </section>
      <section className="flex items-center bg-paper px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <h2 className="font-display text-4xl">
            {firstTime ? "Create the desk login" : "Staff sign in"}
          </h2>
          <p className="mt-2 text-muted">
            {firstTime
              ? "The books are empty. The first person here chooses the email and password for the branch desk."
              : "Open the branch desk."}
          </p>
          <form
            className="mt-8 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              const problem = firstTime
                ? await bank.createStaff(email, password)
                : await bank.signInStaff(email, password);
              setBusy(false);
              setError(problem);
              if (!problem) router.push("/staff");
            }}
          >
            <Field
              label="Staff email"
              type="email"
              required
              value={email}
              placeholder="teller@branch.test"
              onChange={(event) => setEmail(event.target.value)}
            />
            <Field
              label="Password"
              type="password"
              required
              value={password}
              placeholder={firstTime ? "At least 6 characters" : "Your password"}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error && <p className="text-sm text-red">{error}</p>}
            <button
              type="submit"
              disabled={busy || !bank.ready}
              className="w-full rounded-full bg-ink py-3.5 font-medium text-white disabled:opacity-60"
            >
              {busy ? "Opening…" : firstTime ? "Create the desk login" : "Open the desk"}
            </button>
          </form>
          <Link
            href="/"
            className="mt-6 block text-sm text-muted underline-offset-4 hover:underline"
          >
            Back to customer sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
