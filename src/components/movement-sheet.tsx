"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cancelSend, getReviewStatus } from "@/app/actions";
import { useBank } from "@/components/bank-provider";
import { MovementIcon } from "@/components/movement-icon";
import { BANK_NAME } from "@/lib/config";
import { dollars, type Movement } from "@/lib/books";
import { fullDateLabel, timeLabel } from "@/lib/dates";
import { shareReceipt } from "@/lib/receipt";
import { useMounted } from "@/lib/use-mounted";

export type ReviewStatus = {
  decision: "waiting" | "approved" | "declined";
  cancelled?: boolean;
  amount: number;
  when: string;
  at?: string;
  payeeName: string | null;
} | null;

const check = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function MovementSheet({
  item,
  status,
  loading,
  onClose,
}: {
  item: Movement;
  status: ReviewStatus;
  loading: boolean;
  onClose: () => void;
}) {
  const mounted = useMounted();
  const { me, refresh } = useBank();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = before;
    };
  }, [onClose]);

  const reference = `UBX-${item.id.slice(-8).toUpperCase()}`;
  const amount = status ? status.amount : Math.abs(item.amount);
  const money = item.amount !== 0 || Boolean(status);

  const pill = status
    ? status.decision === "waiting"
      ? { text: "Pending", tone: "bg-amber-100 text-amber-800" }
      : status.decision === "approved"
        ? { text: "Completed", tone: "bg-moss/10 text-moss" }
        : status.cancelled
          ? { text: "Cancelled", tone: "bg-line text-muted" }
          : { text: "Declined", tone: "bg-danger/10 text-danger" }
    : item.amount > 0
      ? { text: "Received", tone: "bg-moss/10 text-moss" }
      : item.amount < 0
        ? { text: "Sent", tone: "bg-line text-muted" }
        : null;

  const steps = status
    ? [
        { label: "Requested", note: status.at && mounted ? `${fullDateLabel(status.at)}, ${timeLabel(status.at)}` : status.when, state: "done" },
        {
          label: "Branch review",
          note: status.decision === "waiting" ? "In progress" : status.cancelled ? "Not needed" : "Reviewed",
          state: status.decision === "waiting" ? "current" : status.cancelled ? "todo" : "done",
        },
        {
          label: status.cancelled ? "Cancelled by you" : status.decision === "declined" ? "Declined" : "Approved and sent",
          note:
            status.decision === "waiting"
              ? "Not yet"
              : status.decision === "approved"
                ? "Money moved"
                : "No money moved",
          state:
            status.decision === "waiting" ? "todo" : status.decision === "declined" ? "failed" : "done",
        },
      ]
    : [];

  async function copy() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard can be blocked */
    }
  }

  async function cancelIt() {
    if (!item.reviewId) return;
    if (!sure) {
      setSure(true);
      return;
    }
    setBusy(true);
    setProblem("");
    const result = await cancelSend(item.reviewId);
    setBusy(false);
    setSure(false);
    await refresh();
    if (result) {
      setProblem(result);
      return;
    }
    onClose();
  }

  const canShare = !loading && money && (!status || status.decision === "approved");

  async function share() {
    const last4 = me?.account.replace(/\D/g, "").slice(-4);
    const outcome = await shareReceipt(
      {
        bank: BANK_NAME,
        heading: item.amount > 0 ? "Money received" : item.amount < 0 || status ? "Money sent" : "Receipt",
        amount: dollars(amount),
        status: "Completed",
        rows: [
          ["Details", item.detail],
          ...(status?.payeeName ? ([["To", status.payeeName]] as [string, string][]) : []),
          ...(me ? ([["Account", `${me.name} ··· ${last4}`]] as [string, string][]) : []),
          ["Date", fullDateLabel(item.at)],
          ["Time", timeLabel(item.at)],
          ["Reference", reference],
        ],
      },
      `ubex-receipt-${reference.toLowerCase()}`,
    ).catch(() => null);
    setNote(outcome === "saved" ? "Receipt saved to your downloads" : outcome === "shared" ? "" : "Could not make the receipt");
  }

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={item.title}>
      <button aria-label="Close" onClick={onClose} className="sheet-backdrop absolute inset-0 bg-black/55" />
      <div className="sheet-panel relative max-h-[90dvh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-paper px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:rounded-[28px]">
        <div className="mx-auto h-1 w-10 rounded-full bg-line" />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-line/70 text-ink"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="mt-5 flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center">
            <div className="scale-[1.55]">
              <MovementIcon amount={item.amount} title={item.title} />
            </div>
          </div>
          <p className="mt-3 text-sm text-muted">{item.title}</p>
          {money && (
            <p
              className={`font-display tabular mt-1 text-4xl tracking-tight ${
                !status && item.amount > 0 ? "text-moss" : ""
              }`}
            >
              {!status && item.amount !== 0 ? (item.amount > 0 ? "+" : "−") : ""}
              {dollars(amount)}
            </p>
          )}
          {pill && <span className={`mt-3 rounded-full px-3 py-1 text-xs ${pill.tone}`}>{pill.text}</span>}
        </div>

        {loading && (
          <div className="mt-6 space-y-3">
            <div className="skeleton h-10 w-full rounded-2xl" />
            <div className="skeleton h-10 w-full rounded-2xl" />
          </div>
        )}

        {!loading && status && (
          <ol className="mt-7 rounded-2xl border border-line bg-card p-4">
            {steps.map((step, index) => (
              <li key={step.label} className="relative flex gap-3 pb-6 last:pb-0">
                {index < steps.length - 1 && (
                  <span aria-hidden className={`absolute left-[13px] top-7 h-full w-px ${step.state === "done" ? "bg-moss/40" : "bg-line"}`} />
                )}
                <span
                  className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                    step.state === "done"
                      ? "bg-moss text-white"
                      : step.state === "current"
                        ? "bg-red text-white"
                        : step.state === "failed"
                          ? "bg-danger text-white"
                          : "border border-line bg-card text-muted"
                  }`}
                >
                  {step.state === "done" ? (
                    check
                  ) : step.state === "current" ? (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  ) : step.state === "failed" ? (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-line" />
                  )}
                </span>
                <div className="pt-0.5">
                  <p className={`text-sm font-medium ${step.state === "todo" ? "text-muted" : ""}`}>{step.label}</p>
                  <p className="text-sm text-muted">{step.note}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {!loading && item.reviewId && !status && (
          <p className="mt-6 rounded-2xl border border-dashed border-line px-4 py-4 text-sm text-muted">
            We could not find the status for this one.
          </p>
        )}

        <dl className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card text-sm">
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted">Details</dt>
            <dd className="text-right">{item.detail}</dd>
          </div>
          {status?.payeeName && (
            <div className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-muted">To</dt>
              <dd className="text-right">{status.payeeName}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted">Date</dt>
            <dd className="text-right">{mounted ? fullDateLabel(item.at) : item.when}</dd>
          </div>
          {mounted && (
            <div className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-muted">Time</dt>
              <dd className="tabular text-right">{timeLabel(item.at)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-muted">Reference</dt>
            <dd className="flex items-center gap-2">
              <span className="num tracking-wide">{reference}</span>
              <button type="button" onClick={copy} className="hit rounded-full bg-red/10 px-2.5 py-1 text-xs text-red" aria-live="polite">
                {copied ? "Copied" : "Copy"}
              </button>
            </dd>
          </div>
        </dl>

        {!loading && status?.decision === "waiting" && (
          <div className="mt-5">
            <button
              type="button"
              onClick={cancelIt}
              disabled={busy}
              className="w-full rounded-full border border-danger/40 py-3 text-sm font-medium text-danger disabled:opacity-60"
            >
              {busy ? "Cancelling…" : sure ? "Tap again to cancel this send" : "Cancel this send"}
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              {sure ? "Nothing has left your account. The branch will not see it." : "You can cancel until the branch decides."}
            </p>
          </div>
        )}
        {problem && (
          <p role="alert" className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
            {problem}
          </p>
        )}

        {canShare && (
          <button type="button" onClick={share} className="mt-5 w-full rounded-full border border-line bg-card py-3 text-sm font-medium">
            Share receipt
          </button>
        )}
        {note && <p className="mt-2 text-center text-xs text-muted">{note}</p>}

        <button type="button" onClick={onClose} className="mt-5 w-full rounded-full bg-solid py-3.5 font-medium text-white">
          Done
        </button>
        <Link href="/support" className="mt-3 block text-center text-sm text-muted">
          Something look wrong? Contact support
        </Link>
      </div>
    </div>,
    document.body,
  );
}

/** Tap any transaction, anywhere in the app, to open the same detail sheet. */
export function useMovementSheet() {
  const { me } = useBank();
  const [item, setItem] = useState<Movement | null>(null);
  const [status, setStatus] = useState<ReviewStatus>(null);
  const [loading, setLoading] = useState(false);
  const customerId = me?.id;

  const open = useCallback(
    async (movement: Movement) => {
      setItem(movement);
      setStatus(null);
      if (!movement.reviewId || !customerId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        setStatus(await getReviewStatus(customerId, movement.reviewId));
      } catch {
        setStatus(null);
      } finally {
        setLoading(false);
      }
    },
    [customerId],
  );

  const close = useCallback(() => setItem(null), []);
  const sheet = item ? <MovementSheet item={item} status={status} loading={loading} onClose={close} /> : null;
  return { open, sheet };
}
