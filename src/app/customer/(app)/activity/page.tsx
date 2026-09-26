"use client";

import { useState } from "react";
import { getReviewStatus } from "@/app/actions";
import { useBank } from "@/components/bank-provider";
import { dollars, type Movement } from "@/lib/books";

const filters = [
  { id: "all", label: "All" },
  { id: "in", label: "Money in" },
  { id: "out", label: "Money out" },
] as const;

type Status = {
  decision: "waiting" | "approved" | "declined";
  amount: number;
  when: string;
  payeeName: string | null;
};

export default function ActivityPage() {
  const { me } = useBank();
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [open, setOpen] = useState<Movement | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  if (!me) return null;

  const shown = me.movements.filter((item) => {
    if (filter === "in") return item.amount > 0;
    if (filter === "out") return item.amount < 0;
    return true;
  });

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
      <p className="text-sm text-muted">The book</p>
      <h1 className="font-display text-4xl tracking-tight">Activity</h1>
      <div className="mt-5 flex gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-4 py-2 text-sm ${
              filter === item.id ? "bg-ink text-white" : "border border-line bg-card text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <ul className="mt-5 space-y-2">
        {shown.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => openMovement(item)}
              className="flex w-full items-center justify-between rounded-2xl border border-line bg-card px-4 py-3.5 text-left transition-colors active:bg-line/40"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted">
                  {item.detail} · {item.when}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className={item.amount > 0 ? "text-moss" : ""}>
                  {item.amount === 0
                    ? "—"
                    : `${item.amount > 0 ? "+" : "−"}${dollars(Math.abs(item.amount))}`}
                </p>
                <span className="text-muted">›</span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <button
            aria-label="Close"
            onClick={() => setOpen(null)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="relative w-full max-w-[430px] rounded-t-[28px] bg-paper px-6 pb-8 pt-6 shadow-2xl">
            <div className="mx-auto h-1 w-10 rounded-full bg-line" />
            <p className="mt-5 text-sm text-muted">{open.title}</p>
            <h2 className="font-display text-4xl tracking-tight">
              {status ? dollars(status.amount) : dollars(Math.abs(open.amount))}
            </h2>

            {loadingStatus && (
              <div className="mt-8 space-y-3">
                <div className="skeleton h-10 w-full rounded-2xl" />
                <div className="skeleton h-10 w-full rounded-2xl" />
              </div>
            )}

            {!loadingStatus && status && (
              <>
                <ol className="mt-8">
                  {[
                    { label: "Requested", when: status.when, done: true },
                    {
                      label: "Branch review",
                      when:
                        status.decision === "waiting"
                          ? "In progress"
                          : status.decision === "approved"
                            ? "Reviewed"
                            : "Reviewed",
                      done: true,
                      current: status.decision === "waiting",
                    },
                    {
                      label: status.decision === "declined" ? "Declined" : "Approved and sent",
                      when:
                        status.decision === "waiting"
                          ? "Not yet"
                          : status.decision === "approved"
                            ? "Money moved"
                            : "No money moved",
                      done: status.decision !== "waiting",
                      current: status.decision !== "waiting",
                      isEnd: true,
                    },
                  ].map((stage, i, arr) => (
                    <li key={stage.label} className="relative flex gap-4 pb-8 last:pb-0">
                      {i < arr.length - 1 && (
                        <span
                          aria-hidden
                          className={`absolute left-[15px] top-8 h-full w-px ${
                            stage.done ? "bg-ink/30" : "bg-line"
                          }`}
                        />
                      )}
                      <span
                        className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                          stage.current && status.decision === "declined" && stage.isEnd
                            ? "bg-red text-white"
                            : stage.current
                              ? "bg-red text-white"
                              : stage.done
                                ? "bg-ink text-white"
                                : "border border-line bg-card text-muted"
                        }`}
                      >
                        {stage.done && !(stage.current && status.decision === "waiting") ? (
                          status.decision === "declined" && stage.isEnd ? (
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                              <path
                                d="M6 6l12 12M18 6L6 18"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                              />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                              <path
                                d="M5 12.5l4.5 4.5L19 7"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )
                        ) : stage.current ? (
                          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-line" />
                        )}
                      </span>
                      <div className="pt-1">
                        <p className={`text-sm font-medium ${stage.done ? "text-ink" : "text-muted"}`}>
                          {stage.label}
                        </p>
                        <p className="text-sm text-muted">{stage.when}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                {status.payeeName && (
                  <p className="text-sm text-muted">To {status.payeeName}</p>
                )}
              </>
            )}

            {!open.reviewId && (
              <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-muted">Detail</span>
                  <span className="text-right">{open.detail}</span>
                </div>
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-muted">When</span>
                  <span>{open.when}</span>
                </div>
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-muted">Reference</span>
                  <span className="font-mono">{open.id.slice(-8).toUpperCase()}</span>
                </div>
              </div>
            )}

            {!loadingStatus && open.reviewId && !status && (
              <p className="mt-6 text-sm text-muted">
                Could not find the status for this one.
              </p>
            )}

            <button
              type="button"
              onClick={() => setOpen(null)}
              className="mt-8 w-full rounded-full border border-line py-3 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
