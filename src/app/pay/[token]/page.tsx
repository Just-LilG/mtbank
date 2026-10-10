"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { lookupRequest } from "@/app/actions";
import { useBank } from "@/components/bank-provider";
import { Mark } from "@/components/mark";
import { dollars } from "@/lib/books";
import type { RequestCard } from "@/lib/requests";

const groupAccount = (value: string) => value.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");

/** Where a payment link lands. Anyone can look; paying needs a sign-in. */
export default function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const bank = useBank();
  const [card, setCard] = useState<RequestCard | null | undefined>(undefined);

  useEffect(() => {
    lookupRequest(token)
      .then(setCard)
      .catch(() => setCard(null));
  }, [token]);

  const own = Boolean(card && bank.me && bank.me.account.replace(/\D/g, "") === card.account);
  const sendLink = card
    ? `/customer/send?${new URLSearchParams({
        to: card.account,
        ...(card.amount ? { amount: String(card.amount) } : {}),
        ...(card.note ? { note: card.note } : {}),
      }).toString()}`
    : "";

  return (
    <main className="app-bg grid min-h-dvh place-items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <Mark />
        <div className="mt-8 rounded-[28px] border border-line bg-card p-6 text-center shadow-sm">
          {card === undefined ? (
            <div className="space-y-3">
              <div className="skeleton mx-auto h-4 w-32 rounded-md" />
              <div className="skeleton mx-auto h-10 w-40 rounded-md" />
              <div className="skeleton mx-auto h-12 w-full rounded-full" />
            </div>
          ) : card === null ? (
            <>
              <p className="font-display text-xl">This request is no longer open</p>
              <p className="mt-2 text-sm text-muted">It may have expired or been cancelled. Ask them to send you a new one.</p>
              <Link href="/" className="mt-6 inline-block text-sm text-red">
                Go to Ubex Bank
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">{card.name} is asking for</p>
              <p className="font-display tabular mt-2 text-5xl tracking-tight">
                {card.amount ? dollars(card.amount) : "Any amount"}
              </p>
              {card.note && <p className="mt-3 text-sm">“{card.note}”</p>}
              <p className="mt-4 text-xs text-muted">Ubex account {groupAccount(card.account)}</p>

              {!bank.ready ? (
                <div className="skeleton mt-6 h-12 w-full rounded-full" />
              ) : own ? (
                <p className="mt-6 rounded-2xl bg-paper px-4 py-3 text-sm text-muted">
                  This is your own request. Share the link or QR code with the person who should pay you.
                </p>
              ) : bank.me ? (
                <Link href={sendLink} className="mt-6 block rounded-full bg-solid py-3.5 font-medium text-white">
                  Pay {card.name.split(" ")[0]}
                </Link>
              ) : (
                <>
                  <Link
                    href={`/?next=${encodeURIComponent(`/pay/${token}`)}`}
                    className="mt-6 block rounded-full bg-solid py-3.5 font-medium text-white"
                  >
                    Sign in to pay
                  </Link>
                  <p className="mt-3 text-xs text-muted">Only Ubex Bank customers can pay this request.</p>
                </>
              )}
              {bank.me && !own && (
                <p className="mt-3 text-xs text-muted">You will check the details before anything is sent.</p>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
