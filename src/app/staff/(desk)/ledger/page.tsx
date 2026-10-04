"use client";

import { useBank } from "@/components/bank-provider";
import { EmptyState, LedgerIcon, PageHeader, StaffPage } from "@/components/staff/ui";
import { dollars } from "@/lib/books";
import { dayKey, dayLabel, timeLabel } from "@/lib/dates";
import { useMounted } from "@/lib/use-mounted";

export default function LedgerPage() {
  const { journal } = useBank();
  const mounted = useMounted();

  const groups: { key: string; label: string; rows: typeof journal }[] = [];
  for (const item of journal) {
    const key = mounted ? dayKey(item.at) : "all";
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = { key, label: mounted ? dayLabel(item.at) : "", rows: [] };
      groups.push(group);
    }
    group.rows.push(item);
  }

  return (
    <StaffPage>
      <PageHeader title="Ledger" subtitle="Everything the desk has done, and who did it" />
      {journal.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing logged yet" text="Every desk action is recorded here." />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map((group) => (
            <section key={group.key}>
              {group.label && (
                <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.14em] text-muted">{group.label}</h2>
              )}
              <ul className="divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-card">
                {group.rows.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3.5 text-sm">
                    <LedgerIcon text={item.text} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-3">{item.text}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {item.actor ? `${item.actor} · ` : ""}
                        {mounted ? timeLabel(item.at) : item.when}
                      </p>
                    </div>
                    {item.amount ? <p className="tabular shrink-0 font-medium">{dollars(item.amount)}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </StaffPage>
  );
}
