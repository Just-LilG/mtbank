"use client";

import { useCallback, useEffect, useState } from "react";
import { findRecipient, listPayees, listSchedules, makeSchedule, pauseSchedule, removeSchedule } from "@/app/actions";
import { useBank } from "@/components/bank-provider";
import { PageTop } from "@/components/customer/page-top";
import { SavedPayees, groupAccount } from "@/components/customer/payees";
import { Spinner } from "@/components/staff/ui";
import { useToast } from "@/components/toast";
import { cleanAmountInput } from "@/lib/amount-input";
import { dollars } from "@/lib/books";
import type { Payee } from "@/lib/payees";
import type { Frequency, Schedule } from "@/lib/scheduled";

const FREQUENCY: { value: Frequency; label: string }[] = [
  { value: "once", label: "Once" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
];

/** "2026-11-03" -> "Tue 3 Nov 2026". The date is a plain calendar day, so no time zone can shift it. */
function dayLabel(day: string) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function ScheduledPage() {
  const { me } = useBank();
  const toast = useToast();
  const [items, setItems] = useState<Schedule[] | null>(null);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [creating, setCreating] = useState(false);
  const [who, setWho] = useState("");
  const [recipient, setRecipient] = useState<{ name: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [startDate, setStartDate] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sure, setSure] = useState("");

  const load = useCallback(async () => setItems(await listSchedules()), []);
  useEffect(() => {
    load().catch(() => setItems([]));
    listPayees()
      .then(setPayees)
      .catch(() => {});
    setStartDate(tomorrow());
  }, [load]);

  // Show who the account number belongs to as it is typed.
  useEffect(() => {
    const digits = who.replace(/\D/g, "");
    if (!me || digits.length < 8) {
      setRecipient(null);
      return;
    }
    const id = setTimeout(async () => setRecipient(await findRecipient(me.id, who)), 350);
    return () => clearTimeout(id);
  }, [who, me]);

  if (!me) return null;

  async function create() {
    setBusy(true);
    setError("");
    const result = await makeSchedule({ account: who, amount: Number(amount), note, frequency, startDate });
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast("Scheduled");
    setCreating(false);
    setWho("");
    setAmount("");
    setNote("");
    await load();
  }

  async function toggle(item: Schedule) {
    const result = await pauseSchedule(item.id, !item.active);
    if ("error" in result) toast(result.error, "error");
    await load();
  }

  async function remove(item: Schedule) {
    if (sure !== item.id) {
      setSure(item.id);
      return;
    }
    await removeSchedule(item.id);
    setSure("");
    toast("Deleted");
    await load();
  }

  return (
    <div className="px-5 pb-10 pt-7 md:max-w-xl">
      <PageTop title="Scheduled transfers" />
      <p className="mt-3 text-sm text-muted">
        Send on a date, or on repeat. It runs each morning and goes to the branch for approval like any other send, so
        your limits and balance still apply.
      </p>

      {items === null ? (
        <div className="mt-5 space-y-3">
          <div className="skeleton h-[110px] rounded-[24px]" />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.length === 0 && !creating && (
            <li className="rounded-[24px] border border-dashed border-line px-5 py-10 text-center">
              <p className="font-display text-lg">Nothing scheduled</p>
              <p className="mt-1 text-sm text-muted">Rent, school fees, a monthly gift. Set it once.</p>
            </li>
          )}
          {items.map((item) => (
            <li key={item.id} className={`rounded-[24px] border border-line bg-card p-4 ${item.active ? "" : "opacity-70"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.payeeName}</p>
                  <p className="text-sm text-muted">
                    <span className="sensitive tabular">{dollars(item.amount)}</span> ·{" "}
                    {FREQUENCY.find((entry) => entry.value === item.frequency)?.label}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${
                    item.active ? "bg-moss/15 text-moss" : "bg-line text-muted"
                  }`}
                >
                  {item.active ? "On" : item.frequency === "once" ? "Done" : "Paused"}
                </span>
              </div>
              {item.active && <p className="mt-2 text-sm">Next: {dayLabel(item.nextRun)}</p>}
              {item.note && <p className="mt-0.5 text-xs text-muted">“{item.note}”</p>}
              {item.lastStatus && <p className="mt-1 text-xs text-muted">Last run: {item.lastStatus}</p>}
              <div className="mt-4 flex items-center gap-2">
                {(item.active || item.frequency !== "once") && (
                  <button type="button" onClick={() => toggle(item)} className="rounded-full border border-line px-4 py-2.5 text-sm">
                    {item.active ? "Pause" : "Resume"}
                  </button>
                )}
                <button type="button" onClick={() => remove(item)} className="hit ml-auto text-xs text-danger">
                  {sure === item.id ? "Tap again to delete" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {creating ? (
        <section className="mt-4 space-y-4 rounded-[24px] border border-line bg-card p-4">
          <p className="font-medium">New scheduled transfer</p>

          <SavedPayees
            payees={payees}
            picked={who.replace(/\D/g, "")}
            onPick={(account) => setWho(account)}
            onChanged={() => listPayees().then(setPayees)}
          />

          <div>
            <input
              value={who}
              onChange={(event) => setWho(groupAccount(event.target.value))}
              placeholder="Their account number"
              inputMode="numeric"
              autoComplete="off"
              maxLength={14}
              className="w-full rounded-full border border-line bg-card px-4 py-3 text-sm outline-none ring-red/30 focus:ring-2"
            />
            {recipient && <p className="mt-1.5 px-2 text-sm text-moss">Sending to {recipient.name}</p>}
          </div>

          <input
            value={amount}
            onChange={(event) => setAmount(cleanAmountInput(event.target.value))}
            placeholder="Amount"
            inputMode="decimal"
            autoComplete="off"
            className="w-full rounded-full border border-line bg-card px-4 py-3 text-sm outline-none ring-red/30 focus:ring-2"
          />

          <div className="grid grid-cols-3 gap-2">
            {FREQUENCY.map((entry) => (
              <button
                key={entry.value}
                type="button"
                aria-pressed={frequency === entry.value}
                onClick={() => setFrequency(entry.value)}
                className={`rounded-full py-2.5 text-xs transition-colors ${
                  frequency === entry.value ? "bg-solid text-white" : "border border-line bg-card"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="text-sm text-muted">{frequency === "once" ? "On" : "Starting"}</span>
            <input
              type="date"
              value={startDate}
              min={tomorrow()}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-1 w-full rounded-full border border-line bg-card px-4 py-3 text-sm outline-none ring-red/30 focus:ring-2"
            />
          </label>

          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Note, e.g. Rent (optional)"
            maxLength={60}
            autoComplete="off"
            className="w-full rounded-full border border-line bg-card px-4 py-3 text-sm outline-none ring-red/30 focus:ring-2"
          />

          {error && (
            <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setCreating(false)} className="rounded-full border border-line py-3 text-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={create}
              disabled={busy || who.replace(/\D/g, "").length < 8 || !(Number(amount) > 0) || !startDate}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-solid py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy && <Spinner />}
              Schedule it
            </button>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setError("");
          }}
          className="mt-4 w-full rounded-full border border-line bg-card py-3.5 text-sm font-medium"
        >
          New scheduled transfer
        </button>
      )}
    </div>
  );
}
