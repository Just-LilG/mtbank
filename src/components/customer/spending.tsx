"use client";

import { dollars, isInternalMove, type Movement } from "@/lib/books";
import { useMounted } from "@/lib/use-mounted";


const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export function SpendingCard({ movements }: { movements: Movement[] }) {
  const mounted = useMounted();
  if (!mounted) return <div className="skeleton mt-6 h-[210px] rounded-[24px]" />;

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const real = movements.filter((item) => item.amount !== 0 && !isInternalMove(item));

  let income = 0;
  let spent = 0;
  let spentBefore = 0;
  for (const item of real) {
    const when = new Date(item.at);
    if (sameMonth(when, now)) {
      if (item.amount > 0) income += item.amount;
      else spent += -item.amount;
    } else if (sameMonth(when, lastMonth) && item.amount < 0) {
      spentBefore += -item.amount;
    }
  }

  // The last seven days, oldest first.
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const out = real
      .filter((item) => item.amount < 0 && new Date(item.at).toDateString() === day.toDateString())
      .reduce((sum, item) => sum - item.amount, 0);
    return { label: day.toLocaleDateString(undefined, { weekday: "narrow" }), out, today: i === 6 };
  });
  const tallest = Math.max(...days.map((day) => day.out), 1);
  const weekTotal = days.reduce((sum, day) => sum + day.out, 0);

  // Never say "100% less" while money did go out, and keep huge swings readable.
  const raw = spentBefore > 0 ? ((spent - spentBefore) / spentBefore) * 100 : null;
  const change = raw === null ? null : raw < 0 && spent > 0 ? Math.max(Math.round(raw), -99) : Math.round(raw);
  const size = change === null ? 0 : Math.abs(change);

  // Where this month's money out went, by the kind of transaction.
  const kinds: { label: string; tone: string; total: number }[] = [
    { label: "To people", tone: "bg-solid", total: 0 },
    { label: "Wires", tone: "bg-red/60", total: 0 },
    { label: "Cash out", tone: "bg-red/35", total: 0 },
    { label: "Other", tone: "bg-line", total: 0 },
  ];
  for (const item of real) {
    if (item.amount >= 0 || !sameMonth(new Date(item.at), now)) continue;
    const kind = /^sent/i.test(item.title) ? 0 : /wire/i.test(item.title) ? 1 : /withdraw/i.test(item.title) ? 2 : 3;
    kinds[kind].total += -item.amount;
  }
  const used = kinds.filter((kind) => kind.total > 0);
  const month = now.toLocaleDateString(undefined, { month: "long" });

  return (
    <section className="mt-6 rounded-[24px] border border-line bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg">{month}</h2>
          <p className="text-xs text-muted">Money in and out, not counting your own transfers</p>
        </div>
        {change !== null && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${
              change <= 0 ? "bg-moss/10 text-moss" : "bg-amber-100 text-amber-800"
            }`}
          >
            {change === 0 ? "Same as last month" : `${size > 999 ? "999%+" : `${size}%`} ${change < 0 ? "less" : "more"} spent`}
          </span>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-moss/10 px-3.5 py-3">
          <dt className="text-xs text-muted">Money in</dt>
          <dd className="sensitive font-display tabular mt-0.5 text-lg text-moss">{dollars(income)}</dd>
        </div>
        <div className="rounded-2xl bg-line/60 px-3.5 py-3">
          <dt className="text-xs text-muted">Money out</dt>
          <dd className="sensitive font-display tabular mt-0.5 text-lg">{dollars(spent)}</dd>
        </div>
      </dl>

      {used.length > 0 && spent > 0 && (
        <div className="mt-5">
          <p className="text-sm font-medium">Where it went</p>
          <div role="img" aria-label="Money out this month by kind" className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-line">
            {used.map((kind) => (
              <div key={kind.label} className={kind.tone} style={{ width: `${(kind.total / spent) * 100}%` }} />
            ))}
          </div>
          <ul className="mt-3 space-y-1.5">
            {used.map((kind) => (
              <li key={kind.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${kind.tone}`} />
                  {kind.label}
                </span>
                <span className="sensitive tabular text-muted">
                  {dollars(kind.total)} · {Math.max(1, Math.round((kind.total / spent) * 100))}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        role="img"
        aria-label={`Money out over the last seven days: ${dollars(weekTotal)} in total`}
        className="mt-5"
      >
        <div className="flex h-16 items-end gap-2">
          {days.map((day, i) => (
            <div key={i} className="flex h-full flex-1 items-end">
              <div
                className={`w-full rounded-t-md ${day.today ? "bg-solid" : "bg-red/25"}`}
                style={{ height: `${Math.max(day.out > 0 ? (day.out / tallest) * 100 : 0, day.out > 0 ? 8 : 3)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-2 text-center text-[11px] text-muted">
          {days.map((day, i) => (
            <span key={i} className={`flex-1 ${day.today ? "font-medium text-ink" : ""}`}>
              {day.label}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          {weekTotal > 0 ? `${dollars(weekTotal)} out in the last 7 days` : "Nothing went out in the last 7 days"}
        </p>
      </div>
    </section>
  );
}
