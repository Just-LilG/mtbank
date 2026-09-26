"use client";

import { useState } from "react";
import { useBank } from "@/components/bank-provider";
import { Field, SelectField } from "@/components/field";
import { dollars } from "@/lib/books";

export default function CashPage() {
  const bank = useBank();
  const [customerId, setCustomerId] = useState(bank.customers[0]?.id ?? "");
  const [kind, setKind] = useState<"deposit" | "withdraw">("deposit");
  const [pot, setPot] = useState<"everyday" | "savings">("everyday");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  const tape = bank.journal.filter(
    (item) => item.text.startsWith("Deposit") || item.text.startsWith("Withdrawal"),
  );

  return (
    <div className="px-5 py-7 sm:px-8">
      <p className="text-sm text-muted">Counter</p>
      <h1 className="font-display text-5xl tracking-tight">Cash</h1>
      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="space-y-4 rounded-[24px] border border-line bg-card p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            const value = Number(amount);
            const problem =
              kind === "deposit"
                ? await bank.deposit(customerId, value, pot, note)
                : await bank.withdraw(customerId, value, note);
            setMessage(problem || "Saved on the account.");
            if (!problem) {
              setAmount("");
              setNote("");
            }
          }}
        >
          <SelectField
            label="Customer"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
          >
            {bank.customers.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name} · {person.status}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="What are you doing"
            value={kind}
            onChange={(event) => setKind(event.target.value as "deposit" | "withdraw")}
          >
            <option value="deposit">Deposit</option>
            <option value="withdraw">Withdrawal</option>
          </SelectField>
          {kind === "deposit" && (
            <SelectField
              label="Pot"
              value={pot}
              onChange={(event) => setPot(event.target.value as "everyday" | "savings")}
            >
              <option value="everyday">Everyday</option>
              <option value="savings">Savings</option>
            </SelectField>
          )}
          <Field
            label="Amount"
            inputMode="decimal"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <Field label="Note" value={note} onChange={(event) => setNote(event.target.value)} />
          <button type="submit" className="rounded-full bg-red px-5 py-3 text-white">
            Post to the account
          </button>
          {message && (
            <p className={`text-sm ${message.startsWith("Saved") ? "text-moss" : "text-red"}`}>
              {message}
            </p>
          )}
        </form>
        <div className="rounded-[24px] border border-line bg-card p-5">
          <h2 className="font-display text-2xl">Cash tape</h2>
          <ul className="mt-3 divide-y divide-line">
            {tape.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p>{item.text}</p>
                  <p className="text-muted">{item.when}</p>
                </div>
                {item.amount ? <p>{dollars(item.amount)}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
