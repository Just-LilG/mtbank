"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useBank } from "@/components/bank-provider";
import { Field, PasswordField } from "@/components/field";
import { Mark } from "@/components/mark";

/**
 * Staff sign in with everyone else on the home page.
 * This screen only exists for the very first launch, when the branch has no staff login yet.
 */
export default function StaffSetupPage() {
  const bank = useBank();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (bank.ready && bank.hasStaff && bank.role !== "staff") router.replace("/");
    if (bank.ready && bank.role === "staff") router.replace("/staff");
  }, [bank.ready, bank.hasStaff, bank.role, router]);

  if (!bank.ready || bank.hasStaff) return null;

  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6 py-12">
      <div className="w-full max-w-md">
        <Mark />
        <h1 className="font-display mt-8 text-4xl">Create the desk login</h1>
        <p className="mt-2 text-muted">
          The books are empty. The first person here chooses the email and password for the branch desk.
          After this, staff sign in on the normal sign-in page.
        </p>
        <form
          className="mt-8 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            const problem = await bank.createStaff(email, password);
            setBusy(false);
            setError(problem);
            if (!problem) router.push("/staff");
          }}
        >
          <Field
            label="Staff email"
            type="email"
            autoComplete="username"
            required
            value={email}
            placeholder="teller@branch.test"
            onChange={(event) => setEmail(event.target.value)}
          />
          <PasswordField
            label="Password"
            autoComplete="new-password"
            required
            value={password}
            placeholder="At least 10 characters"
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && (
            <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-solid py-3.5 font-medium text-white hover:bg-[#c20500] disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create the desk login"}
          </button>
        </form>
      </div>
    </main>
  );
}
