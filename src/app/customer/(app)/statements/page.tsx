"use client";

import { useMemo, useState } from "react";
import { useBank } from "@/components/bank-provider";
import { dollars } from "@/lib/books";

function monthKey(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Undated";
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

export default function StatementsPage() {
  const { me } = useBank();
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  const groups = useMemo(() => {
    if (!me) return [];
    const map = new Map<string, typeof me.movements>();
    for (const item of me.movements) {
      const key = monthKey(item.at);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [me]);

  if (!me) return null;

  return (
    <div className="px-5 pb-8 pt-7">
      <p className="text-sm text-muted">By month</p>
      <h1 className="font-display text-4xl tracking-tight">Statements</h1>

      {groups.length === 0 && (
        <p className="mt-8 text-sm text-muted">Nothing on the books yet.</p>
      )}

      <div className="mt-6 space-y-3">
        {groups.map(([month, items]) => {
          const totalIn = items.filter((i) => i.amount > 0).reduce((s, i) => s + i.amount, 0);
          const totalOut = items
            .filter((i) => i.amount < 0)
            .reduce((s, i) => s + Math.abs(i.amount), 0);
          const isOpen = openMonth === month;
          return (
            <div key={month} className="overflow-hidden rounded-[24px] border border-line bg-card">
              <button
                type="button"
                onClick={() => setOpenMonth(isOpen ? null : month)}
                className="flex w-full items-center justify-between px-4 py-4 text-left"
              >
                <div>
                  <p className="font-display text-xl tracking-tight">{month}</p>
                  <p className="text-sm text-muted">{items.length} entries</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-moss">+{dollars(totalIn)}</p>
                  <p className="text-sm text-red">−{dollars(totalOut)}</p>
                </div>
              </button>
              {isOpen && (
                <ul className="divide-y divide-line border-t border-line">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted">
                          {item.detail} · {item.when}
                        </p>
                      </div>
                      <p className={`text-sm ${item.amount > 0 ? "text-moss" : ""}`}>
                        {item.amount === 0
                          ? "—"
                          : `${item.amount > 0 ? "+" : "−"}${dollars(Math.abs(item.amount))}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
