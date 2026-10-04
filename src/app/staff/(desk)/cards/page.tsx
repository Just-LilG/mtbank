"use client";

import Link from "next/link";
import { useState } from "react";
import { useBank } from "@/components/bank-provider";
import { SelectField } from "@/components/field";
import {
  Avatar,
  EmptyState,
  Notice,
  PageHeader,
  Pill,
  Spinner,
  StaffPage,
  ghostBtn,
  primaryBtn,
} from "@/components/staff/ui";

const tone = { Active: "ok", Paused: "warn", Blocked: "bad" } as const;

export default function CardsDeskPage() {
  const bank = useBank();
  const [customerId, setCustomerId] = useState(bank.customers[0]?.id ?? "");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = bank.customers.flatMap((person) => person.cards.map((card) => ({ person, card })));

  async function toggle(personId: string, cardId: string, status: string) {
    const problem = await bank.setCardStatus(personId, cardId, status === "Blocked" ? "Active" : "Blocked");
    setMessage(
      problem
        ? { tone: "error", text: problem }
        : { tone: "ok", text: status === "Blocked" ? "Card is active again." : "Card blocked." },
    );
  }

  return (
    <StaffPage>
      <PageHeader title="Cards" subtitle={`${rows.length} issued`} />

      <form
        className="mt-6 flex flex-col gap-3 rounded-[24px] border border-line bg-card p-5 sm:flex-row sm:items-end"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          const problem = await bank.issueCard(customerId);
          setBusy(false);
          setMessage(problem ? { tone: "error", text: problem } : { tone: "ok", text: "Card issued." });
        }}
      >
        <SelectField
          label="Issue a debit card to"
          className="min-w-0 flex-1"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
        >
          {bank.customers.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </SelectField>
        <button type="submit" disabled={busy || !customerId} className={primaryBtn}>
          {busy && <Spinner />}
          Issue card
        </button>
      </form>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <div className="mt-5">
        {rows.length === 0 ? (
          <EmptyState title="No cards yet" text="Issue the first one above." />
        ) : (
          <>
            <ul className="divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-card md:hidden">
              {rows.map(({ person, card }) => (
                <li key={card.id} className="flex items-center gap-3 px-4 py-3.5">
                  <Avatar name={person.name} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/staff/customers/${person.id}`} className="block truncate font-medium">
                      {person.name}
                    </Link>
                    <p className="text-xs text-muted">Debit ···· {card.last4} · exp {card.expires}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Pill tone={tone[card.status]}>{card.status}</Pill>
                    <button type="button" onClick={() => toggle(person.id, card.id, card.status)} className="text-xs text-red">
                      {card.status === "Blocked" ? "Unblock" : "Block"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-hidden rounded-[24px] border border-line bg-card md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-[0.12em] text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Card</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map(({ person, card }) => (
                    <tr key={card.id} className="hover:bg-line/30">
                      <td className="px-5 py-3">
                        <Link href={`/staff/customers/${person.id}`} className="flex items-center gap-3 font-medium">
                          <Avatar name={person.name} />
                          {person.name}
                        </Link>
                      </td>
                      <td className="tabular px-4 py-3">···· {card.last4}</td>
                      <td className="tabular px-4 py-3 text-muted">{card.expires}</td>
                      <td className="px-4 py-3">
                        <Pill tone={tone[card.status]}>{card.status}</Pill>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button type="button" onClick={() => toggle(person.id, card.id, card.status)} className={ghostBtn}>
                          {card.status === "Blocked" ? "Unblock" : "Block"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </StaffPage>
  );
}
