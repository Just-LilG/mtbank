"use client";

import { useState } from "react";
import { useBank } from "@/components/bank-provider";
import { Field, SelectField } from "@/components/field";
import {
  EmptyState,
  LedgerIcon,
  MoneyInput,
  Notice,
  PageHeader,
  Segmented,
  Spinner,
  StaffPage,
  primaryBtn,
} from "@/components/staff/ui";
import { When } from "@/components/when";
import { dollars } from "@/lib/books";

export default function CashPage() {
  const bank = useBank();
  const [customerId, setCustomerId] = useState(bank.customers[0]?.id ?? "");
  const [kind, setKind] = useState<"deposit" | "withdraw">("deposit");
  const [pot, setPot] = useState<"everyday" | "savings">("everyday");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const person = bank.customers.find((item) => item.id === customerId);
  const tape = bank.journal.filter(
    (item) => item.text.startsWith("Deposit") || item.text.startsWith("Withdrawal"),
  );
  const value = Number(amount);

  return (
    <StaffPage>
      <PageHeader title="Cash" subtitle="Deposits and withdrawals at the counter" />
      <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <form
          className="space-y-5 rounded-[24px] border border-line bg-card p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setMessage(null);
            const problem =
              kind === "deposit"
                ? await bank.deposit(customerId, value, pot, note)
                : await bank.withdraw(customerId, value, note);
            setBusy(false);
            if (problem) {
              setMessage({ tone: "error", text: problem });
              return;
            }
            setMessage({
              tone: "ok",
              text: `${kind === "deposit" ? "Deposited" : "Paid out"} ${dollars(value)} ${kind === "deposit" ? "into" : "from"} ${person?.name ?? "the account"}.`,
            });
            setAmount("");
            setNote("");
          }}
        >
          <Segmented
            label="What are you doing"
            value={kind}
            onChange={setKind}
            options={[
              { value: "deposit", label: "Deposit" },
              { value: "withdraw", label: "Withdrawal" },
            ]}
          />

          <SelectField label="Customer" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            {bank.customers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.status}
              </option>
            ))}
          </SelectField>

          {person && (
            <p className="-mt-2 text-sm text-muted">
              Everyday {dollars(person.balance)} · Savings {dollars(person.savings)}
              {person.status === "Frozen" && <span className="ml-2 text-danger">Frozen</span>}
            </p>
          )}

          {kind === "deposit" && (
            <div>
              <p className="text-sm text-muted">Into</p>
              <div className="mt-1.5">
                <Segmented
                  label="Pot"
                  value={pot}
                  onChange={setPot}
                  options={[
                    { value: "everyday", label: "Everyday" },
                    { value: "savings", label: "Savings" },
                  ]}
                />
              </div>
            </div>
          )}

          <MoneyInput label="Amount" required value={amount} onChange={setAmount} />
          <Field
            label="Note (optional)"
            placeholder="Counter, salary, wire…"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />

          <button type="submit" disabled={busy || !(value > 0) || !customerId} className={`${primaryBtn} w-full sm:w-auto`}>
            {busy && <Spinner />}
            {busy ? "Posting…" : kind === "deposit" ? "Post the deposit" : "Pay out the cash"}
          </button>
          {message && <Notice tone={message.tone}>{message.text}</Notice>}
        </form>

        <div className="rounded-[24px] border border-line bg-card p-5">
          <h2 className="font-display text-lg">Cash tape</h2>
          {tape.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No cash yet" text="Deposits and withdrawals will appear here." />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {tape.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
                  <LedgerIcon text={item.text} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2">{item.text}</p>
                    <p className="text-xs text-muted">
                      {item.actor ? `${item.actor} · ` : ""}
                      <When at={item.at} fallback={item.when} />
                    </p>
                  </div>
                  {item.amount ? (
                    <p className={`tabular font-medium ${item.text.startsWith("Deposit") ? "text-moss" : ""}`}>
                      {item.text.startsWith("Deposit") ? "+" : "−"}
                      {dollars(item.amount)}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </StaffPage>
  );
}
