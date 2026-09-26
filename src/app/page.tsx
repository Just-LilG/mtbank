"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBank } from "@/components/bank-provider";
import { Field } from "@/components/field";
import { Mark } from "@/components/mark";
import { MenuDrawer } from "@/components/menu-drawer";

export default function Home() {
  const bank = useBank();
  const router = useRouter();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <main className="min-h-dvh bg-[#e7e1d4] md:flex md:items-center md:justify-center md:p-8">
      <div className="mx-auto flex w-full max-w-[430px] flex-col bg-paper md:min-h-0 md:max-w-4xl md:flex-row md:overflow-hidden md:rounded-[32px] md:shadow-[0_30px_80px_-30px_rgba(22,19,15,0.35)]">
        <section className="bg-red px-6 pb-16 pt-8 text-white md:flex md:w-1/2 md:flex-col md:justify-center md:px-12 md:py-16">
          <div className="flex items-center justify-between">
            <Mark tone="light" />
            <MenuDrawer tone="light" />
          </div>
          <h1 className="font-display mt-12 text-5xl leading-none tracking-tight md:mt-8 md:text-6xl">
            Welcome back.
          </h1>
          <p className="mt-4 max-w-xs text-white/80">
            Sign in with the account number and password the branch gave you.
          </p>
        </section>
        <section className="-mt-8 flex-1 rounded-t-[28px] bg-card px-6 py-8 md:mt-0 md:w-1/2 md:flex md:flex-col md:justify-center md:rounded-t-none md:px-12 md:py-16">
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!account.trim() || !password.trim()) {
                setError("Enter your account number and password.");
                return;
              }
              setBusy(true);
              const problem = await bank.signIn(account, password);
              setBusy(false);
              setError(problem);
              if (!problem) router.push("/customer");
            }}
          >
            <Field
              label="Account number"
              required
              value={account}
              placeholder="4821 0093 2218"
              inputMode="numeric"
              onChange={(event) => setAccount(event.target.value)}
            />
            <Field
              label="Password"
              type="password"
              required
              value={password}
              placeholder="The password from the branch"
              onChange={(event) => setPassword(event.target.value)}
            />
            {error && <p className="text-sm text-red">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-red py-3.5 font-medium text-white disabled:opacity-60"
            >
              {busy ? "Checking…" : "Sign in"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-muted">
            No account number yet? Ask the branch.
          </p>
        </section>
      </div>
    </main>
  );
}
