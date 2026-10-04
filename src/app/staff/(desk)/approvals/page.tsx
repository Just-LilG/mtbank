"use client";

import Link from "next/link";
import { useState } from "react";
import { useBank } from "@/components/bank-provider";
import { Avatar, Chips, EmptyState, Notice, PageHeader, Pill, Spinner, StaffPage, ghostBtn, primaryBtn } from "@/components/staff/ui";
import { When } from "@/components/when";
import { dollars } from "@/lib/books";

type View = "waiting" | "decided";

export default function ApprovalsPage() {
  const bank = useBank();
  const [view, setView] = useState<View>("waiting");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const waiting = bank.reviews.filter((item) => item.decision === "waiting");
  const decided = bank.reviews.filter((item) => item.decision !== "waiting");
  const shown = view === "waiting" ? waiting : decided;

  async function decide(id: string, decision: "approved" | "declined") {
    setBusyId(id);
    setMessage(null);
    const problem = await bank.decideReview(id, decision);
    setBusyId("");
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
          return (
            <li key={item.id} className="rounded-[24px] border border-line bg-card p-5">
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
                    {item.decision === "approved" ? "Approved" : "Declined"}
                  </Pill>
                )}
              </div>

              <p className="font-display tabular mt-4 text-4xl tracking-tight">{dollars(item.amount)}</p>
              <p className="mt-1 text-sm text-muted">{item.reason}</p>

              {item.decision === "waiting" && (
                <>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {frozen ? (
                      <Pill tone="bad">Account is frozen</Pill>
                    ) : covers ? (
                      <Pill tone="ok">Covered · {dollars(person?.balance ?? 0)} available</Pill>
                    ) : (
                      <Pill tone="bad">
                        Short by {dollars(item.amount - (person?.balance ?? 0))}
                      </Pill>
                    )}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                    <button type="button" disabled={busy} onClick={() => decide(item.id, "declined")} className={ghostBtn}>
                      Decline
                    </button>
                    <button type="button" disabled={busy} onClick={() => decide(item.id, "approved")} className={primaryBtn}>
                      {busy && <Spinner />}
                      Approve
                    </button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </StaffPage>
  );
}
