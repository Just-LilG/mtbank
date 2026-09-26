"use client";

import { useMemo, useState } from "react";
import { useBank } from "@/components/bank-provider";
import { dollars } from "@/lib/books";

type Row = {
  id: string;
  customerName: string;
  customerId: string;
  title: string;
  detail: string;
  amount: number;
  when: string;
  at: string;
};

export default function TransactionsPage() {
  const { customers } = useBank();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | "in" | "out">("all");

  const rows = useMemo<Row[]>(() => {
    const all = customers.flatMap((person) =>
      person.movements.map((move) => ({
        id: move.id,
        customerName: person.name,
        customerId: person.id,
        title: move.title,
        detail: move.detail,
        amount: move.amount,
        when: move.when,
        at: move.at,
      })),
    );
    return all.sort((a, b) => (a.at < b.at ? 1 : -1));
  }, [customers]);

  const filtered = rows.filter((row) => {
    if (kind === "in" && row.amount <= 0) return false;
    if (kind === "out" && row.amount >= 0) return false;
    if (!query.trim()) return true;
    const needle = query.trim().toLowerCase();
    return (
      row.customerName.toLowerCase().includes(needle) ||
      row.title.toLowerCase().includes(needle) ||
      row.detail.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="px-5 py-7 sm:px-8">
      <p className="text-sm text-muted">Every account, one list</p>
      <h1 className="font-display text-5xl tracking-tight">Transactions</h1>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, title, or detail"
          className="flex-1 rounded-full border border-line bg-card px-4 py-2.5 text-sm outline-none ring-red/30 focus:ring-2"
        />
        <div className="flex gap-2">
          {(
            [
              ["all", "All"],
              ["in", "Money in"],
              ["out", "Money out"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setKind(id)}
              className={`rounded-full px-4 py-2 text-sm ${
                kind === id ? "bg-ink text-white" : "border border-line bg-card text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-sm text-muted">{filtered.length} entries</p>

      <div className="mt-3 overflow-x-auto rounded-[24px] border border-line bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-muted">
              <th className="px-4 py-3 font-normal">Customer</th>
              <th className="px-4 py-3 font-normal">Title</th>
              <th className="px-4 py-3 font-normal">Detail</th>
              <th className="px-4 py-3 font-normal">When</th>
              <th className="px-4 py-3 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium">{row.customerName}</td>
                <td className="px-4 py-3">{row.title}</td>
                <td className="px-4 py-3 text-muted">{row.detail}</td>
                <td className="px-4 py-3 text-muted">{row.when}</td>
                <td className={`px-4 py-3 text-right ${row.amount > 0 ? "text-moss" : ""}`}>
                  {row.amount === 0
                    ? "—"
                    : `${row.amount > 0 ? "+" : "−"}${dollars(Math.abs(row.amount))}`}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Nothing matches that.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
