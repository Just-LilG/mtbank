"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useBank } from "@/components/bank-provider";
import { Avatar, Chips, EmptyState, Notice, PageHeader, Pill, Spinner, StaffPage, ghostBtn, primaryBtn } from "@/components/staff/ui";
import { When } from "@/components/when";
import { dollars } from "@/lib/books";
import type { Review } from "@/lib/books";

type View = "waiting" | "decided";
type Choice = { item: Review; decision: "approved" | "declined" };

const DECLINE_REASONS = [
  "Not enough information",
  "Looks suspicious",
  "Over the limit",
  "Customer asked to cancel",
];

/**
 * On a touch screen, swipe right to approve and left to decline.
 * A swipe only opens the confirmation sheet. It never moves money by itself.
 */
function Swipeable({
  children,
  disabled,
  onApprove,
  onDecline,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const sideways = useRef(false);

  function reset() {
    start.current = null;
    sideways.current = false;
    setDx(0);
  }

  return (
    <div className="relative overflow-hidden rounded-[24px]">
      <div
        aria-hidden
        className={`absolute inset-0 flex items-center px-6 text-sm font-medium text-white ${
          dx >= 0 ? "justify-start bg-moss" : "justify-end bg-danger"
        }`}
      >
        {dx > 0 ? "Approve" : dx < 0 ? "Decline" : ""}
      </div>
      <div
        style={{ transform: `translateX(${dx}px)`, touchAction: "pan-y" }}
        className={dx === 0 ? "transition-transform duration-200" : ""}
        onPointerDown={(event) => {
          if (disabled || event.pointerType === "mouse") return;
          start.current = { x: event.clientX, y: event.clientY };
          sideways.current = false;
        }}
        onPointerMove={(event) => {
          const from = start.current;
          if (!from) return;
          const moveX = event.clientX - from.x;
          const moveY = event.clientY - from.y;
          if (!sideways.current) {
            if (Math.abs(moveX) > 10 && Math.abs(moveX) > Math.abs(moveY) * 1.5) {
              sideways.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
            } else {
              return;
            }
          }
          setDx(Math.max(-140, Math.min(140, moveX)));
        }}
        onPointerUp={() => {
          const moved = dx;
          reset();
          if (moved >= 90) onApprove();
          else if (moved <= -90) onDecline();
        }}
        onPointerCancel={reset}
      >
        {children}
      </div>
    </div>
  );
}

function DecisionSheet({
  choice,
  busy,
  onCancel,
  onConfirm,
}: {
  choice: Choice;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}) {
  const bank = useBank();
  const [note, setNote] = useState("");
  const { item, decision } = choice;
  const person = bank.customers.find((customer) => customer.id === item.customerId);
  const covers = person ? person.balance >= item.amount : false;
  const frozen = person?.status === "Frozen";
  const approving = decision === "approved";
  const blocked = approving && (frozen || !covers);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/55 sm:items-center sm:p-6">
      <button type="button" aria-label="Cancel" onClick={onCancel} className="absolute inset-0 cursor-default" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-title"
        className="relative w-full max-w-md rounded-t-[28px] bg-card p-6 shadow-2xl sm:rounded-[28px]"
      >
        <p id="decision-title" className="font-display text-xl tracking-tight">
          {approving ? "Approve this send?" : "Decline this send?"}
        </p>
        <p className="font-display tabular mt-3 text-4xl tracking-tight">{dollars(item.amount)}</p>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">From</dt>
            <dd className="text-right">{person?.name ?? "Unknown customer"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">To</dt>
            <dd className="text-right">{item.payeeName ?? "Outside the bank"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Note</dt>
            <dd className="text-right">{item.reason}</dd>
          </div>
        </dl>

        {approving ? (
          <div className="mt-4">
            {frozen ? (
              <Pill tone="bad">Account is frozen. Unfreeze it first.</Pill>
            ) : covers ? (
              <Pill tone="ok">Covered · {dollars(person?.balance ?? 0)} available</Pill>
            ) : (
              <Pill tone="bad">Short by {dollars(item.amount - (person?.balance ?? 0))}</Pill>
            )}
            <p className="mt-3 text-xs text-muted">The money leaves the everyday account right away.</p>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-muted">Why? The customer will see this.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DECLINE_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setNote(reason)}
                  aria-pressed={note === reason}
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                    note === reason ? "bg-solid text-white" : "border border-line bg-card"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={80}
              placeholder="Or write your own (optional)"
              className="mt-3 w-full rounded-full border border-line bg-card px-4 py-2.5 text-sm outline-none ring-red/30 focus:ring-2"
            />
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className={ghostBtn}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || blocked}
            onClick={() => onConfirm(note)}
            className={
              approving
                ? primaryBtn
                : "inline-flex items-center justify-center gap-2 rounded-full bg-danger px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
            }
          >
            {busy && <Spinner />}
            {approving ? "Approve" : "Decline"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function ApprovalsPage() {
  const bank = useBank();
  const [view, setView] = useState<View>("waiting");
  const [busyId, setBusyId] = useState("");
  const [choice, setChoice] = useState<Choice | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  // Oldest first, so the longest wait is always at the top.
  const waiting = bank.reviews
    .filter((item) => item.decision === "waiting")
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const decided = bank.reviews.filter((item) => item.decision !== "waiting");
  const shown = view === "waiting" ? waiting : decided;

  async function decide(item: Review, decision: "approved" | "declined", note: string) {
    setBusyId(item.id);
    setMessage(null);
    const problem = await bank.decideReview(item.id, decision, note);
    setBusyId("");
    setChoice(null);
    setMessage(
      problem
        ? { tone: "error", text: problem }
        : { tone: "ok", text: decision === "approved" ? "Approved. The money has moved." : "Declined. Nothing moved." },
    );
  }

  return (
    <StaffPage>
      <PageHeader
        title="Reviews"
        subtitle="Approving takes the money out of the everyday account. A frozen account or a short balance will not release."
      />
      <div className="mt-5">
        <Chips
          value={view}
          onChange={setView}
          options={[
            { value: "waiting", label: "Waiting", count: waiting.length },
            { value: "decided", label: "Decided", count: decided.length },
          ]}
        />
      </div>
      {view === "waiting" && waiting.length > 0 && (
        <p className="mt-3 hidden text-xs text-muted [@media(pointer:coarse)]:block">
          Swipe a card right to approve or left to decline. You will be asked to confirm.
        </p>
      )}
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <ul className="mt-5 grid gap-3">
        {shown.length === 0 && (
          <li>
            <EmptyState
              title={view === "waiting" ? "Nothing waiting" : "Nothing decided yet"}
              text={view === "waiting" ? "New sends that need a decision will show up here." : undefined}
            />
          </li>
        )}
        {shown.map((item) => {
          const person = bank.customers.find((customer) => customer.id === item.customerId);
          const covers = person ? person.balance >= item.amount : false;
          const frozen = person?.status === "Frozen";
          const busy = busyId === item.id;
          const card = (
            <div className="rounded-[24px] border border-line bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={person?.name ?? "?"} />
                  <div className="min-w-0">
                    <Link href={person ? `/staff/customers/${person.id}` : "#"} className="block truncate font-medium">
                      {person?.name ?? "Unknown customer"}
                    </Link>
                    <p className="text-xs text-muted">
                      {person?.account} · <When at={item.at} />
                    </p>
                  </div>
                </div>
                {item.decision !== "waiting" && (
                  <Pill tone={item.decision === "approved" ? "ok" : "bad"}>
                    {item.decision === "approved" ? "Approved" : item.cancelled ? "Cancelled by customer" : "Declined"}
                  </Pill>
                )}
              </div>

              <p className="font-display tabular mt-4 text-4xl tracking-tight">{dollars(item.amount)}</p>
              <p className="mt-1 text-sm">
                <span className="text-muted">To </span>
                {item.payeeName ?? "Outside the bank"}
              </p>
              <p className="mt-0.5 text-sm text-muted">{item.reason}</p>

              {item.decision === "waiting" && (
                <>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {frozen ? (
                      <Pill tone="bad">Account is frozen</Pill>
                    ) : covers ? (
                      <Pill tone="ok">Covered · {dollars(person?.balance ?? 0)} available</Pill>
                    ) : (
                      <Pill tone="bad">Short by {dollars(item.amount - (person?.balance ?? 0))}</Pill>
                    )}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setChoice({ item, decision: "declined" })}
                      className={ghostBtn}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setChoice({ item, decision: "approved" })}
                      className={primaryBtn}
                    >
                      {busy && <Spinner />}
                      Approve
                    </button>
                  </div>
                </>
              )}
            </div>
          );
          return (
            <li key={item.id}>
              {item.decision === "waiting" ? (
                <Swipeable
                  disabled={busy}
                  onApprove={() => setChoice({ item, decision: "approved" })}
                  onDecline={() => setChoice({ item, decision: "declined" })}
                >
                  {card}
                </Swipeable>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ul>

      {choice && (
        <DecisionSheet
          choice={choice}
          busy={busyId === choice.item.id}
          onCancel={() => setChoice(null)}
          onConfirm={(note) => decide(choice.item, choice.decision, note)}
        />
      )}
    </StaffPage>
  );
}
