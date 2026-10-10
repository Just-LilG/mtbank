"use client";

import { useMemo, useState } from "react";
import { useBank } from "@/components/bank-provider";
import { LogoMark } from "@/components/logo";
import { useToast } from "@/components/toast";
import { When } from "@/components/when";
import { BANK_NAME, BRANCH_NAME } from "@/lib/config";
import { dollars, type Movement } from "@/lib/books";
import { dateTimeLabel } from "@/lib/dates";
import { downloadCsv, printArea } from "@/lib/print";
import { useMounted } from "@/lib/use-mounted";

function monthKey(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Undated";
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

export default function StatementsPage() {
  const { me } = useBank();
  const toast = useToast();
  const mounted = useMounted();
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const groups = useMemo(() => {
    if (!me) return [];
    const map = new Map<string, Movement[]>();
    for (const item of me.movements) {
      const key = monthKey(item.at);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [me]);

  if (!me) return null;

  // A date range wins; otherwise the open month; otherwise everything.
  const inRange = (item: Movement) => {
    const day = new Date(item.at);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    return (!from || key >= from) && (!to || key <= to);
  };
  const ranged = Boolean(from || to);
  const exportRows = ranged
    ? me.movements.filter(inRange)
    : openMonth
      ? (groups.find(([month]) => month === openMonth)?.[1] ?? [])
      : me.movements;
  const exportLabel = ranged ? `${from || "Start"} to ${to || "today"}` : (openMonth ?? "All activity");
  const money = (item: Movement) => (item.amount === 0 ? "" : `${item.amount > 0 ? "+" : "−"}${dollars(Math.abs(item.amount))}`);

  function csv() {
    downloadCsv(`ubex-statement-${exportLabel.toLowerCase().replace(/\s+/g, "-")}.csv`, [
      ["Date", "Time", "Title", "Details", "Amount"],
      ...exportRows.map((item) => {
        const when = new Date(item.at);
        return [
          when.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }),
          when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
          item.title,
          item.detail,
          item.amount.toFixed(2),
        ];
      }),
    ]);
    toast("Statement downloaded");
  }

  const totalIn = exportRows.filter((i) => i.amount > 0).reduce((s, i) => s + i.amount, 0);
  const totalOut = exportRows.filter((i) => i.amount < 0).reduce((s, i) => s + Math.abs(i.amount), 0);

  return (
    <div className="px-5 pb-8 pt-7 md:max-w-xl">
      <div className="no-print">
        <h1 className="font-display text-2xl tracking-tight">Statements</h1>

        {groups.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs text-muted">From</span>
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => setFrom(event.target.value)}
                className="mt-1 w-full rounded-full border border-line bg-card px-4 py-2.5 text-sm outline-none ring-red/30 focus:ring-2"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted">To</span>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => setTo(event.target.value)}
                className="mt-1 w-full rounded-full border border-line bg-card px-4 py-2.5 text-sm outline-none ring-red/30 focus:ring-2"
              />
            </label>
            {ranged && (
              <button
                type="button"
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
                className="hit col-span-2 text-left text-xs text-red"
              >
                Clear dates · {exportRows.length} entries in range
              </button>
            )}
          </div>
        )}

        {groups.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={csv} className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-sm">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
              </svg>
              Download CSV
            </button>
            <button
              type="button"
              onClick={() => printArea("statement")}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-sm"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z" />
              </svg>
              Print or save as PDF
            </button>
            <p className="w-full text-xs text-muted">
              {ranged ? `Exports ${exportLabel}.` : openMonth ? `Exports ${openMonth}.` : "Exports everything. Pick dates, or open a month, to export less."}
            </p>
          </div>
        )}

        {groups.length === 0 && (
          <div className="mt-8 rounded-[24px] border border-dashed border-line px-6 py-12 text-center">
            <p className="font-display text-lg">Nothing on the books yet</p>
            <p className="mt-1 text-sm text-muted">Your statements will build up as you use the account.</p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {groups.map(([month, items]) => {
            const monthIn = items.filter((i) => i.amount > 0).reduce((s, i) => s + i.amount, 0);
            const monthOut = items.filter((i) => i.amount < 0).reduce((s, i) => s + Math.abs(i.amount), 0);
            const isOpen = openMonth === month;
            return (
              <div key={month} className="overflow-hidden rounded-[24px] border border-line bg-card">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenMonth(isOpen ? null : month)}
                  className="flex w-full items-center justify-between px-4 py-4 text-left"
                >
                  <div>
                    <p className="font-display text-xl tracking-tight">{month}</p>
                    <p className="text-sm text-muted">{items.length} entries</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm text-moss">+{dollars(monthIn)}</p>
                    <p className="tabular text-sm text-red">−{dollars(monthOut)}</p>
                  </div>
                </button>
                {isOpen && (
                  <ul className="divide-y divide-line border-t border-line">
                    {items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted">
                            {item.detail} · <When at={item.at} fallback={item.when} />
                          </p>
                        </div>
                        <p className={`tabular shrink-0 text-sm ${item.amount > 0 ? "text-moss" : ""}`}>{item.amount === 0 ? "—" : money(item)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* The page that comes out of the printer. Hidden on screen. */}
      <div className="print-area print-only">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LogoMark className="h-12 w-12" />
          <div>
            <p style={{ fontSize: 20, fontWeight: 600 }}>{BANK_NAME}</p>
            <p style={{ fontSize: 12 }}>{BRANCH_NAME}</p>
          </div>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 18 }}>Account statement</h2>
        <p style={{ fontSize: 13, marginTop: 4 }}>
          {me.name} · Account {me.account}
        </p>
        <p style={{ fontSize: 13 }}>
          {exportLabel}
          {mounted ? ` · Printed ${dateTimeLabel(new Date().toISOString())}` : ""}
        </p>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          Money in {dollars(totalIn)} · Money out {dollars(totalOut)} · Everyday {dollars(me.balance)} · Savings {dollars(me.savings)}
        </p>
        <table style={{ width: "100%", marginTop: 14, fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #888" }}>
              <th style={{ padding: "6px 4px" }}>Date</th>
              <th style={{ padding: "6px 4px" }}>Title</th>
              <th style={{ padding: "6px 4px" }}>Details</th>
              <th style={{ padding: "6px 4px", textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {exportRows.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "5px 4px", whiteSpace: "nowrap" }}>{mounted ? dateTimeLabel(item.at) : item.when}</td>
                <td style={{ padding: "5px 4px" }}>{item.title}</td>
                <td style={{ padding: "5px 4px" }}>{item.detail}</td>
                <td style={{ padding: "5px 4px", textAlign: "right", whiteSpace: "nowrap" }}>{money(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 11, marginTop: 18 }}>
          This statement was produced by {BANK_NAME}. If anything looks wrong, please tell the branch.
        </p>
      </div>
    </div>
  );
}
