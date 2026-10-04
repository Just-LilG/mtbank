"use client";

import { useState } from "react";
import { getReviewStatus } from "@/app/actions";
import { MovementIcon } from "@/components/movement-icon";
import { MovementSheet, type ReviewStatus } from "@/components/movement-sheet";
import { useBank } from "@/components/bank-provider";
import { dollars, type Movement } from "@/lib/books";
import { dayKey, dayLabel, timeLabel } from "@/lib/dates";
import { useMounted } from "@/lib/use-mounted";

const filters = [
  { id: "all", label: "All" },
  { id: "in", label: "Money in" },
  { id: "out", label: "Money out" },
] as const;

export default function ActivityPage() {
  const { me } = useBank();
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [open, setOpen] = useState<Movement | null>(null);
  const [status, setStatus] = useState<ReviewStatus>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  // Dates render in the viewer's own time zone, so wait until we are in the browser.
  const mounted = useMounted();

  if (!me) return null;

  const shown = me.movements.filter((item) => {
    if (filter === "in") return item.amount > 0;
    if (filter === "out") return item.amount < 0;
    return true;
  });

  // Collapse runs of identical card on/off toggles into one row.
  const rows: { item: Movement; extra: number }[] = [];
  for (const item of shown) {
    const last = rows[rows.length - 1];
    const toggle = /^Card (active|paused)$/i;
    if (last && toggle.test(item.title) && toggle.test(last.item.title) && last.item.detail === item.detail) {
      last.extra += 1;
    } else {
      rows.push({ item, extra: 0 });
    }
  }

  const groups: { key: string; label: string; rows: typeof rows }[] = [];
  for (const row of rows) {
    const key = mounted ? dayKey(row.item.at) : "all";
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = { key, label: mounted ? dayLabel(row.item.at) : "", rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  }

  async function openMovement(item: Movement) {
    setOpen(item);
    setStatus(null);
    if (!item.reviewId || !me) return;
    setLoadingStatus(true);
    const result = await getReviewStatus(me.id, item.reviewId);
    setStatus(result);
    setLoadingStatus(false);
  }

  return (
    <div className="px-5 pb-8 pt-7">
      <h1 className="font-display text-2xl tracking-tight">Activity</h1>
      <div className="mt-5 flex gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-4 py-2 text-sm ${
              filter === item.id ? "bg-solid text-white" : "border border-line bg-card text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {groups.length === 0 && (
        <p className="mt-6 rounded-[24px] border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
          Nothing here yet.
        </p>
      )}
      <div className="mt-5 space-y-6">
        {groups.map((group) => (
          <section key={group.key}>
            {group.label && (
              <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.14em] text-muted">
                {group.label}
              </h2>
            )}
            <ul className="divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-card">
              {group.rows.map(({ item, extra }) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openMovement(item)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-line/60"
                  >
                    <MovementIcon amount={item.amount} title={item.title} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="line-clamp-2 text-sm text-muted">
                        {item.detail} · {mounted ? timeLabel(item.at) : item.when}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {extra > 0 && (
                        <span className="rounded-full bg-line/70 px-2.5 py-1 text-xs text-muted">
                          {extra + 1} changes
                        </span>
                      )}
                      {item.amount === 0 ? (
                        /pending/i.test(item.title) ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-800">Pending</span>
                        ) : /declined/i.test(item.title) ? (
                          <span className="rounded-full bg-danger/10 px-2.5 py-1 text-xs text-danger">Declined</span>
                        ) : null
                      ) : (
                        <p className={`tabular ${item.amount > 0 ? "text-moss" : ""}`}>
                          {`${item.amount > 0 ? "+" : "−"}${dollars(Math.abs(item.amount))}`}
                        </p>
                      )}
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {open && (
        <MovementSheet
          item={open}
          status={status}
          loading={loadingStatus}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
