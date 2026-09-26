"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBank } from "@/components/bank-provider";
import { Field, SelectField } from "@/components/field";
import { dollars } from "@/lib/books";

const tools = ["Deposit", "Withdraw", "Move", "Limit"] as const;

export function CustomerFile({ id }: { id: string }) {
  const bank = useBank();
  const router = useRouter();
  const person = bank.customers.find((item) => item.id === id);
  const [tool, setTool] = useState<(typeof tools)[number] | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pot, setPot] = useState<"everyday" | "savings">("everyday");
  const [payee, setPayee] = useState("");
  const [limit, setLimit] = useState("");
  const [message, setMessage] = useState("");
  const [askFreeze, setAskFreeze] = useState(false);
  const [freshPassword, setFreshPassword] = useState("");
  const [askDelete, setAskDelete] = useState(false);
  const [confirmCardId, setConfirmCardId] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!person) {
    return (
      <div className="px-5 py-8 sm:px-8">
        <p>That customer file is not on the books.</p>
        <Link href="/staff/customers" className="mt-4 inline-block text-sm text-red">
          Back to customers
        </Link>
      </div>
    );
  }

  async function run(error: Promise<string>) {
    setBusy(true);
    const problem = await error;
    setBusy(false);
    setMessage(problem || "Saved.");
    if (!problem) {
      setAmount("");
      setNote("");
      setPayee("");
    }
  }

  return (
    <div className="px-5 py-7 sm:px-8">
      <Link href="/staff/customers" className="text-sm text-muted">
        Customers
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tracking-tight">{person.name}</h1>
          <p className="mt-2 text-muted">
            Everyday · {person.account}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm ${
            person.status === "Frozen" ? "bg-red/10 text-red" : "bg-moss/10 text-moss"
          }`}
        >
          {person.status}
        </span>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <article className="rounded-[24px] bg-ink p-5 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">Everyday</p>
          <p className="font-display mt-3 text-4xl">{dollars(person.balance)}</p>
        </article>
        <article className="rounded-[24px] border border-line bg-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Savings</p>
          <p className="font-display mt-3 text-4xl">{dollars(person.savings)}</p>
        </article>
        <article className="rounded-[24px] border border-line bg-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Daily send limit</p>
          <p className="font-display mt-3 text-4xl">{dollars(person.dailyLimit)}</p>
        </article>
      </section>

      <div className="mt-5 flex flex-wrap gap-2">
        {tools.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setTool(name);
              setMessage("");
              setLimit(String(person.dailyLimit));
            }}
            className={`rounded-full px-4 py-2 text-sm ${
              tool === name ? "bg-ink text-white" : "border border-line bg-card"
            }`}
          >
            {name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setAskFreeze(true);
            setTool(null);
            setMessage("");
          }}
          className="rounded-full bg-red px-4 py-2 text-sm text-white"
        >
          {person.status === "Frozen" ? "Unfreeze account" : "Freeze account"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(bank.issueCard(person.id))}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-sm transition-opacity disabled:opacity-50"
        >
          {busy && (
            <span
              aria-hidden
              className="h-3 w-3 animate-spin rounded-full border-2 border-ink/30 border-t-ink"
            />
          )}
          Issue card
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const result = await bank.resetPassword(person.id);
            setBusy(false);
            if ("error" in result) {
              setMessage(result.error);
              setFreshPassword("");
              return;
            }
            setFreshPassword(result.password);
            setMessage("New password is ready. Write it down now. The old one no longer works.");
          }}
          className="rounded-full border border-line bg-card px-4 py-2 text-sm disabled:opacity-50"
        >
          New password
        </button>
        <button
          type="button"
          onClick={() => {
            setAskDelete(true);
            setAskFreeze(false);
            setTool(null);
            setMessage("");
            setConfirmName("");
          }}
          className="rounded-full border border-red/30 px-4 py-2 text-sm text-red"
        >
          Delete account
        </button>
      </div>

      {askFreeze && (
        <div className="mt-4 rounded-[24px] border border-line bg-card p-5">
          <p>
            {person.status === "Frozen"
              ? "Let money leave this account again?"
              : "Freeze stops sends, withdrawals, and new cards. Deposits can still come in."}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                run(bank.setFrozen(person.id, person.status !== "Frozen"));
                setAskFreeze(false);
              }}
              className="rounded-full bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setAskFreeze(false)}
              className="rounded-full px-4 py-2 text-sm text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {askDelete && (
        <div className="mt-4 rounded-[24px] border border-red/30 bg-card p-5">
          <p className="font-medium text-red">This closes the account for good.</p>
          <p className="mt-1 text-sm text-muted">
            {person.name}&rsquo;s account, cards, and transaction history will be removed
            from the books. This cannot be undone
            {person.balance > 0 || person.savings > 0
              ? ` — there is still ${dollars(person.balance + person.savings)} on this account.`
              : "."}
          </p>
          <p className="mt-4 text-sm text-muted">
            Type <span className="font-medium text-ink">{person.name}</span> to confirm.
          </p>
          <input
            value={confirmName}
            onChange={(event) => setConfirmName(event.target.value)}
            className="mt-2 w-full max-w-sm rounded-2xl border border-line bg-paper px-4 py-2.5 outline-none ring-red/30 focus:ring-2"
            autoFocus
          />
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={confirmName.trim() !== person.name.trim() || deleting}
              onClick={async () => {
                setDeleting(true);
                const problem = await bank.deleteCustomer(person.id);
                setDeleting(false);
                if (problem) {
                  setMessage(problem);
                  return;
                }
                router.push("/staff/customers");
              }}
              className="rounded-full bg-red px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              {deleting ? "Deleting…" : "Delete account"}
            </button>
            <button
              type="button"
              onClick={() => setAskDelete(false)}
              className="rounded-full px-4 py-2 text-sm text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {tool && (
        <form
          className="mt-4 grid gap-3 rounded-[24px] border border-line bg-card p-5 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const value = Number(amount);
            if (tool === "Deposit") void run(bank.deposit(person.id, value, pot, note));
            if (tool === "Withdraw") void run(bank.withdraw(person.id, value, note));
            if (tool === "Move") void run(bank.send(person.id, payee, value, note));
            if (tool === "Limit") void run(bank.setLimit(person.id, Number(limit)));
          }}
        >
          {tool === "Deposit" && (
            <SelectField
              label="Which pot"
              value={pot}
              onChange={(event) => setPot(event.target.value as "everyday" | "savings")}
            >
              <option value="everyday">Everyday</option>
              <option value="savings">Savings</option>
            </SelectField>
          )}
          {tool === "Move" && (
            <Field
              label="Send to (name or account)"
              value={payee}
              onChange={(event) => setPayee(event.target.value)}
              required
            />
          )}
          {tool === "Limit" ? (
            <Field
              label="New daily send limit"
              inputMode="decimal"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              required
            />
          ) : (
            <Field
              label="Amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          )}
          {tool !== "Limit" && (
            <Field
              label="Note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Counter, salary, wire…"
            />
          )}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-red px-5 py-3 text-sm text-white transition-opacity disabled:opacity-50"
            >
              {busy && (
                <span
                  aria-hidden
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
              )}
              {busy ? "Saving…" : `Save ${tool.toLowerCase()}`}
            </button>
          </div>
        </form>
      )}

      {freshPassword && (
        <p className="mt-4 max-w-xl rounded-[24px] border border-line bg-card px-5 py-4">
          <span className="text-sm text-muted">Hand this password to {person.name}</span>
          <span className="mt-1 block font-mono text-2xl tracking-wide">{freshPassword}</span>
          <span className="mt-1 block text-sm text-muted">Account {person.account}</span>
        </p>
      )}

      {message && (
        <p className={`mt-3 text-sm ${message === "Saved." || message.startsWith("New password") ? "text-moss" : "text-red"}`}>
          {message}
        </p>
      )}

      <section className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="font-display text-2xl">Cards</h2>
          <ul className="mt-3 space-y-2">
            {person.cards.length === 0 && (
              <li className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-muted">
                No card yet. Issue one from this file.
              </li>
            )}
            {person.cards.map((card) => (
              <li
                key={card.id}
                className="rounded-2xl border border-line bg-card px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Debit ··· {card.last4}</p>
                    <p className="text-sm text-muted">
                      {card.status} · exp {card.expires}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        run(
                          bank.setCardStatus(
                            person.id,
                            card.id,
                            card.status === "Blocked" ? "Active" : "Blocked",
                          ),
                        )
                      }
                      className="rounded-full border border-line px-3 py-1.5 text-sm"
                    >
                      {card.status === "Blocked" ? "Unblock" : "Block card"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCardId(confirmCardId === card.id ? null : card.id)}
                      className="rounded-full border border-red/30 px-3 py-1.5 text-sm text-red"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {confirmCardId === card.id && (
                  <div className="mt-3 rounded-2xl bg-red/10 px-3 py-2.5">
                    <p className="text-sm text-red">
                      Remove this card for good? The customer will not be able to use it again.
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          run(bank.deleteCard(person.id, card.id));
                          setConfirmCardId(null);
                        }}
                        className="rounded-full bg-red px-3 py-1.5 text-sm text-white"
                      >
                        Yes, remove it
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmCardId(null)}
                        className="rounded-full px-3 py-1.5 text-sm text-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <h2 className="font-display mt-8 text-2xl">On file</h2>
          <dl className="mt-3 divide-y divide-line rounded-[24px] border border-line bg-card text-sm">
            {[
              ["Email", person.email],
              ["Phone", person.phone || "—"],
              ["ID", person.nationalId || "—"],
              ["Address", person.address || "—"],
              ["Opened", person.opened],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 px-4 py-3">
                <dt className="shrink-0 text-muted">{label}</dt>
                <dd className="text-right break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="font-display text-2xl">Account tape</h2>
          <ul className="mt-3 divide-y divide-line rounded-[24px] border border-line bg-card">
            {person.movements.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted">
                    {item.detail} · {item.when}
                  </p>
                </div>
                <p className={item.amount < 0 ? "" : item.amount > 0 ? "text-moss" : "text-muted"}>
                  {item.amount === 0
                    ? "—"
                    : `${item.amount > 0 ? "+" : "−"}${dollars(Math.abs(item.amount))}`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
