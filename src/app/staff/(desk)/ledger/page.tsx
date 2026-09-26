"use client";

import { useBank } from "@/components/bank-provider";
import { dollars } from "@/lib/books";

export default function LedgerPage() {
  const { journal } = useBank();

  return (
    <div className="px-5 py-7 sm:px-8">
      <p className="text-sm text-muted">Everything the desk has done</p>
      <h1 className="font-display text-5xl tracking-tight">Ledger</h1>
      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-card">
        {journal.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3.5 text-sm">
            <div>
              <p>{item.text}</p>
              <p className="text-muted">{item.when}</p>
            </div>
            {item.amount ? <p className="font-medium">{dollars(item.amount)}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
