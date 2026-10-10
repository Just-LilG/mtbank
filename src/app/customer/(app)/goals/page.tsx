"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { changeGoal, getGoals, makeGoal, removeGoal } from "@/app/actions";
import { useBank } from "@/components/bank-provider";
import { PageTop } from "@/components/customer/page-top";
import { Spinner } from "@/components/staff/ui";
import { useToast } from "@/components/toast";
import { cleanAmountInput } from "@/lib/amount-input";
import { dollars } from "@/lib/books";
import type { Goal, GoalsView } from "@/lib/goals";

type Sheet = { goal: Goal; mode: "add" | "take" };

function Progress({ goal }: { goal: Goal }) {
  const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));
  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.name} is ${percent} percent saved`}
        className="h-2.5 w-full overflow-hidden rounded-full bg-line"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${goal.done ? "bg-moss" : "bg-solid"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">{percent}% there</p>
    </div>
  );
}

export default function GoalsPage() {
  const { me } = useBank();
  const toast = useToast();
  const [view, setView] = useState<GoalsView | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sure, setSure] = useState("");

  const load = useCallback(async () => setView(await getGoals()), []);
  useEffect(() => {
    load().catch(() => setView({ goals: [], free: 0 }));
  }, [load]);

  if (!me) return null;

  async function create() {
    setBusy(true);
    setError("");
    const result = await makeGoal(name, Number(target));
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setCreating(false);
    setName("");
    setTarget("");
    toast("Goal created");
    await load();
  }

  async function confirmChange() {
    if (!sheet) return;
    setBusy(true);
    setError("");
    const result = await changeGoal(sheet.goal.id, Number(amount), sheet.mode);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast(sheet.mode === "add" ? "Set aside" : "Taken out of the goal");
    setSheet(null);
    setAmount("");
    await load();
  }

  async function remove(goal: Goal) {
    if (sure !== goal.id) {
      setSure(goal.id);
      return;
    }
    await removeGoal(goal.id);
    setSure("");
    toast("Goal deleted. The money stays in your savings.");
    await load();
  }

  const setAside = view ? view.goals.reduce((sum, goal) => sum + goal.saved, 0) : 0;

  return (
    <div className="px-5 pb-10 pt-7 md:max-w-xl">
      <PageTop title="Savings goals" />

      <section className="mt-6 rounded-[24px] border border-line bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted">Free in savings</p>
            <p className="sensitive font-display tabular mt-1 text-xl">{view ? dollars(view.free) : "…"}</p>
          </div>
          <div className="border-l border-line pl-4">
            <p className="text-xs text-muted">Set aside for goals</p>
            <p className="sensitive font-display tabular mt-1 text-xl">{view ? dollars(setAside) : "…"}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          Goals do not move your money. They mark part of your savings as spoken for.{" "}
          <Link href="/customer/move" className="text-red">
            Move money to savings
          </Link>
        </p>
      </section>

      {view === null ? (
        <div className="mt-5 space-y-3">
          <div className="skeleton h-[130px] rounded-[24px]" />
          <div className="skeleton h-[130px] rounded-[24px]" />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {view.goals.length === 0 && !creating && (
            <li className="rounded-[24px] border border-dashed border-line px-5 py-10 text-center">
              <p className="font-display text-lg">No goals yet</p>
              <p className="mt-1 text-sm text-muted">A trip, a phone, school fees. Name it and watch it fill up.</p>
            </li>
          )}
          {view.goals.map((goal) => (
            <li key={goal.id} className="rounded-[24px] border border-line bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{goal.name}</p>
                  <p className="sensitive tabular text-sm text-muted">
                    {dollars(goal.saved)} of {dollars(goal.target)}
                  </p>
                </div>
                {goal.done && <span className="shrink-0 rounded-full bg-moss/15 px-2.5 py-1 text-xs text-moss">Reached</span>}
              </div>
              <div className="mt-3">
                <Progress goal={goal} />
              </div>
              <div className="mt-4 flex items-center gap-2">
                {!goal.done && (
                  <button
                    type="button"
                    onClick={() => {
                      setSheet({ goal, mode: "add" });
                      setError("");
                      setAmount("");
                    }}
                    className="rounded-full bg-solid px-5 py-2.5 text-sm font-medium text-white"
                  >
                    Add money
                  </button>
                )}
                {goal.saved > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSheet({ goal, mode: "take" });
                      setError("");
                      setAmount("");
                    }}
                    className="rounded-full border border-line px-4 py-2.5 text-sm"
                  >
                    Take out
                  </button>
                )}
                <button type="button" onClick={() => remove(goal)} className="hit ml-auto text-xs text-danger">
                  {sure === goal.id ? "Tap again to delete" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {creating ? (
        <section className="mt-4 space-y-3 rounded-[24px] border border-line bg-card p-4">
          <p className="font-medium">New goal</p>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="What are you saving for?"
            maxLength={40}
            autoComplete="off"
            className="w-full rounded-full border border-line bg-card px-4 py-3 text-sm outline-none ring-red/30 focus:ring-2"
          />
          <input
            value={target}
            onChange={(event) => setTarget(cleanAmountInput(event.target.value))}
            placeholder="How much? e.g. 500"
            inputMode="decimal"
            autoComplete="off"
            className="w-full rounded-full border border-line bg-card px-4 py-3 text-sm outline-none ring-red/30 focus:ring-2"
          />
          {error && !sheet && (
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
              disabled={busy || !name.trim() || !(Number(target) > 0)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-solid py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy && <Spinner />}
              Create goal
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
          New goal
        </button>
      )}

      {sheet &&
        createPortal(
          <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/55">
            <button type="button" aria-label="Close" onClick={() => setSheet(null)} className="absolute inset-0 cursor-default" />
            <div role="dialog" aria-modal="true" className="relative w-full max-w-[430px] rounded-t-[28px] bg-card p-6 pb-8 shadow-2xl">
              <p className="font-display text-xl tracking-tight">
                {sheet.mode === "add" ? `Add to ${sheet.goal.name}` : `Take out of ${sheet.goal.name}`}
              </p>
              <p className="mt-1 text-sm text-muted">
                {sheet.mode === "add"
                  ? `${dollars(view?.free ?? 0)} free in savings · ${dollars(Math.max(sheet.goal.target - sheet.goal.saved, 0))} to go`
                  : `${dollars(sheet.goal.saved)} is set aside`}
              </p>
              <input
                value={amount}
                onChange={(event) => {
                  setAmount(cleanAmountInput(event.target.value));
                  setError("");
                }}
                placeholder="0.00"
                inputMode="decimal"
                autoComplete="off"
                autoFocus
                className="font-display tabular mt-4 w-full rounded-2xl border border-line bg-card px-4 py-4 text-3xl outline-none ring-red/30 focus:ring-2"
              />
              {error && (
                <p role="alert" className="mt-3 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
                  {error}
                </p>
              )}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setSheet(null)} className="rounded-full border border-line py-3.5 text-sm">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmChange}
                  disabled={busy || !(Number(amount) > 0)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-solid py-3.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {busy && <Spinner />}
                  {sheet.mode === "add" ? "Set aside" : "Take out"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
