"use client";

import Link from "next/link";
import { useBank } from "@/components/bank-provider";
import { dollars } from "@/lib/books";

export default function NotificationsPage() {
  const { me } = useBank();
  if (!me) return null;

  const items = me.movements;

  return (
    <div className="px-5 pb-8 pt-7">
      <p className="text-sm text-muted">Your account</p>
      <h1 className="font-display text-4xl tracking-tight">Notifications</h1>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          Nothing yet. Deposits, sends, and card changes will show up here.
        </p>
      ) : (
        <ul className="mt-5 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-line bg-card px-4 py-3.5"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{item.title}</p>
                {item.amount !== 0 && (
                  <p className={item.amount > 0 ? "text-moss" : ""}>
                    {item.amount > 0 ? "+" : "−"}
                    {dollars(Math.abs(item.amount))}
                  </p>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">
                {item.detail} · {item.when}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Link href="/customer" className="mt-8 block text-center text-sm text-muted">
        Back home
      </Link>
    </div>
  );
}
