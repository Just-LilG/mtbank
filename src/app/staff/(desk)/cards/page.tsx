"use client";

import Link from "next/link";
import { useState } from "react";
import { useBank } from "@/components/bank-provider";

export default function CardsDeskPage() {
  const bank = useBank();
  const [customerId, setCustomerId] = useState(bank.customers[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const rows = bank.customers.flatMap((person) =>
    person.cards.map((card) => ({ person, card })),
  );

  return (
    <div className="px-5 py-7 sm:px-8">
      <p className="text-sm text-muted">Plastic on the books</p>
      <h1 className="font-display text-5xl tracking-tight">Cards</h1>
      <form
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const problem = await bank.issueCard(customerId);
          setMessage(problem || "Card issued.");
        }}
      >
        <label className="block min-w-64 flex-1">
          <span className="text-sm text-muted">Issue a debit card to</span>
          <select
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-line bg-card px-4 py-3"
          >
            {bank.customers.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-full bg-red px-5 py-3 text-white">
          Issue card
        </button>
        {message && (
          <p className={`w-full text-sm ${message === "Card issued." ? "text-moss" : "text-red"}`}>
            {message}
          </p>
        )}
      </form>

      <div className="mt-6 overflow-x-auto rounded-[24px] border border-line bg-card">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-paper text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Card</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ person, card }) => (
              <tr key={card.id} className="border-t border-line">
                <td className="px-4 py-3.5">
                  <Link href={`/staff/customers/${person.id}`} className="font-medium">
                    {person.name}
                  </Link>
                </td>
                <td className="px-4 py-3.5">··· {card.last4}</td>
                <td className="px-4 py-3.5">{card.status}</td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={async () => {
                      const problem = await bank.setCardStatus(
                        person.id,
                        card.id,
                        card.status === "Blocked" ? "Active" : "Blocked",
                      );
                      setMessage(problem || (card.status === "Blocked" ? "Card is active." : "Card blocked."));
                    }}
                    className="rounded-full border border-line px-3 py-1.5"
                  >
                    {card.status === "Blocked" ? "Unblock" : "Block"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
