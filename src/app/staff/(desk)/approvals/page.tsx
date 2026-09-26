"use client";

import Link from "next/link";
import { useState } from "react";
import { useBank } from "@/components/bank-provider";
import { dollars } from "@/lib/books";

export default function ApprovalsPage() {
  const bank = useBank();
  const [message, setMessage] = useState("");

  return (
    <div className="px-5 py-7 sm:px-8">
      <p className="text-sm text-muted">Large sends</p>
      <h1 className="font-display text-5xl tracking-tight">Reviews</h1>
      <p className="mt-3 max-w-lg text-muted">
        Approving takes the money out of the everyday account. A frozen account or a short balance will not release.
      </p>
      {message && <p className="mt-3 text-sm text-red">{message}</p>}
      <ul className="mt-6 grid gap-3">
        {bank.reviews.map((item) => {
          const person = bank.customers.find((customer) => customer.id === item.customerId);
          return (
            <li
              key={item.id}
              className="rounded-[24px] border border-line bg-card p-5 sm:flex sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{person?.name}</p>
                <p className="text-sm text-muted">
                  {person?.account} · {item.reason}
                </p>
                <p className="font-display mt-2 text-3xl">{dollars(item.amount)}</p>
                {person && (
                  <Link href={`/staff/customers/${person.id}`} className="mt-1 inline-block text-sm text-red">
                    Open file · {dollars(person.balance)} available
                  </Link>
                )}
              </div>
              <div className="mt-4 sm:mt-0">
                {item.decision === "waiting" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => setMessage((await bank.decideReview(item.id, "declined")) || "Declined.")}
                      className="rounded-full border border-line px-4 py-2 text-sm"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={async () => setMessage((await bank.decideReview(item.id, "approved")) || "Approved.")}
                      className="rounded-full bg-ink px-4 py-2 text-sm text-white"
                    >
                      Approve
                    </button>
                  </div>
                ) : (
                  <p className="text-sm capitalize text-muted">{item.decision}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
