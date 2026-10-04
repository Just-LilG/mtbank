"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBank } from "@/components/bank-provider";
import { MovementIcon } from "@/components/movement-icon";
import { Avatar, Chips, EmptyState, PageHeader, SearchBox, StaffPage, ghostBtn } from "@/components/staff/ui";
import { When } from "@/components/when";
import { dollars } from "@/lib/books";
import { dayKey, dayLabel, timeLabel } from "@/lib/dates";
import { useMounted } from "@/lib/use-mounted";

type Kind = "all" | "in" | "out";
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

const PAGE = 60;

export default function TransactionsPage() {
  const { customers } = useBank();
  const mounted = useMounted();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [limit, setLimit] = useState(PAGE);

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
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
      row.customerName.toLowerCase().includes(needle) ||
      row.title.toLowerCase().includes(needle) ||
      row.detail.toLowerCase().includes(needle)
    );
  });

  const visible = filtered.slice(0, limit);
  const groups: { key: string; label: string; rows: Row[] }[] = [];
  for (const row of visible) {
    const key = mounted ? dayKey(row.at) : "all";
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = { key, label: mounted ? dayLabel(row.at) : "", rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  }

  const money = (row: Row) =>
    row.amount === 0 ? "" : `${row.amount > 0 ? "+" : "−"}${dollars(Math.abs(row.amount))}`;

  return (
    <StaffPage>
      <PageHeader title="Transactions" subtitle={`${filtered.length} ${filtered.length === 1 ? "entry" : "entries"} across every account`} />

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="md:max-w-sm md:flex-1">
          <SearchBox
            value={query}
            onChange={(value) => {
              setQuery(value);
              setLimit(PAGE);
            }}
            placeholder="Search name, title or detail"
          />
        </div>
        <Chips
          value={kind}
          onChange={(value) => {
            setKind(value);
            setLimit(PAGE);
          }}
          options={[
            { value: "all", label: "All" },
            { value: "in", label: "Money in" },
            { value: "out", label: "Money out" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-5">
          <EmptyState title="Nothing matches" text="Try a different search or filter." />
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {groups.map((group) => (
            <section key={group.key}>
              {group.label && (
                <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.14em] text-muted">{group.label}</h2>
              )}

              <ul className="divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-card md:hidden">
                {group.rows.map((row) => (
                  <li key={row.id} className="flex items-center gap-3 px-4 py-3.5">
                    <MovementIcon amount={row.amount} title={row.title} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{row.title}</p>
                      <p className="truncate text-sm text-muted">
                        <Link href={`/staff/customers/${row.customerId}`} className="text-ink/80">
                          {row.customerName}
                        </Link>{" "}
                        · {mounted ? timeLabel(row.at) : row.when}
                      </p>
                    </div>
                    <p className={`tabular shrink-0 text-sm ${row.amount > 0 ? "text-moss" : ""}`}>{money(row)}</p>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-hidden rounded-[22px] border border-line bg-card md:block">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-line">
                    {group.rows.map((row) => (
                      <tr key={row.id} className="hover:bg-line/30">
                        <td className="w-[28%] px-5 py-3">
                          <Link href={`/staff/customers/${row.customerId}`} className="flex items-center gap-3 font-medium">
                            <Avatar name={row.customerName} />
                            <span className="truncate">{row.customerName}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">{row.title}</td>
                        <td className="px-4 py-3 text-muted">{row.detail}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted">
                          <When at={row.at} fallback={row.when} mode="time" />
                        </td>
                        <td className={`tabular whitespace-nowrap px-5 py-3 text-right font-medium ${row.amount > 0 ? "text-moss" : ""}`}>
                          {money(row)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          {filtered.length > visible.length && (
            <div className="text-center">
              <button type="button" onClick={() => setLimit((value) => value + PAGE)} className={ghostBtn}>
                Show more ({filtered.length - visible.length} left)
              </button>
            </div>
          )}
        </div>
      )}
    </StaffPage>
  );
}
