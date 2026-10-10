"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useBank } from "@/components/bank-provider";
import { MovementIcon } from "@/components/movement-icon";
import { useMovementSheet } from "@/components/movement-sheet";
import { dollars } from "@/lib/books";
import { dayKey, dayLabel, timeLabel } from "@/lib/dates";
import { isNotable, markNotificationsSeen, useLastSeen } from "@/lib/unread";
import { useMounted } from "@/lib/use-mounted";

export default function NotificationsPage() {
  const { me } = useBank();
  const { open: openMovement, sheet } = useMovementSheet();
  const mounted = useMounted();
  const seen = useLastSeen(me?.id);
  // Remember what was new when we arrived, then mark everything read.
  const arrivedAt = useRef<number | null>(null);
  if (seen !== null && arrivedAt.current === null) arrivedAt.current = seen;

  useEffect(() => {
    if (me && seen !== null) markNotificationsSeen(me.id);
  }, [me, seen]);

  if (!me) return null;

  const items = me.movements.filter(isNotable);
  const groups: { key: string; label: string; rows: typeof items }[] = [];
  for (const item of items) {
    const key = mounted ? dayKey(item.at) : "all";
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = { key, label: mounted ? dayLabel(item.at) : "", rows: [] };
      groups.push(group);
    }
    group.rows.push(item);
  }

  return (
    <div className="px-5 pb-8 pt-7 md:max-w-xl">
      <h1 className="font-display text-2xl tracking-tight">Notifications</h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-[24px] border border-dashed border-line px-6 py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-line/70 text-muted">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 10a6 6 0 1 1 12 0c0 3.2 1 5 1.6 5.8H4.4C5 15 6 13.2 6 10ZM9.5 19.5a2.5 2.5 0 0 0 5 0" />
            </svg>
          </span>
          <p className="font-display mt-4 text-lg">You are all caught up</p>
          <p className="mt-1 text-sm text-muted">Deposits, money received and changes from the branch will show up here.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {groups.map((group) => (
            <section key={group.key}>
              {group.label && (
                <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.14em] text-muted">{group.label}</h2>
              )}
              <ul className="divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-card">
                {group.rows.map((item) => {
                  const fresh =
                    arrivedAt.current !== null && new Date(item.at).getTime() > arrivedAt.current;
                  return (
                    <li key={item.id}>
                      <button type="button" onClick={() => openMovement(item)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-line/60">
                      <MovementIcon amount={item.amount} title={item.title} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate font-medium">
                          {item.title}
                          {fresh && <span aria-label="New" className="h-2 w-2 shrink-0 rounded-full bg-red" />}
                        </p>
                        <p className="line-clamp-2 text-sm text-muted">
                          {item.detail} · {mounted ? timeLabel(item.at) : item.when}
                        </p>
                      </div>
                      {item.amount !== 0 && (
                        <p className={`tabular shrink-0 ${item.amount > 0 ? "text-moss" : ""}`}>
                          {item.amount > 0 ? "+" : "−"}
                          {dollars(Math.abs(item.amount))}
                        </p>
                      )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Link href="/customer" className="mt-8 block text-center text-sm text-muted">
        Back home
      </Link>
      {sheet}
    </div>
  );
}
