"use client";

import { useCallback, useEffect, useState } from "react";
import { cancelRequest, listRequests, makeRequest } from "@/app/actions";
import { useBank } from "@/components/bank-provider";
import { PageTop } from "@/components/customer/page-top";
import { QrCode } from "@/components/qr-code";
import { Spinner } from "@/components/staff/ui";
import { useToast } from "@/components/toast";
import { cleanAmountInput } from "@/lib/amount-input";
import { dollars } from "@/lib/books";
import type { MoneyRequest } from "@/lib/requests";

const linkFor = (token: string) => `${window.location.origin}/pay/${token}`;

export default function RequestPage() {
  const { me } = useBank();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<MoneyRequest[] | null>(null);
  const [showing, setShowing] = useState("");

  const load = useCallback(async () => setOpen(await listRequests()), []);
  useEffect(() => {
    load().catch(() => setOpen([]));
  }, [load]);

  if (!me) return null;

  async function create() {
    setBusy(true);
    setError("");
    const result = await makeRequest(amount ? Number(amount) : null, note);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setAmount("");
    setNote("");
    setShowing(result.token);
    await load();
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(linkFor(token));
      toast("Link copied");
    } catch {
      toast("Could not copy. Press and hold the link instead.", "error");
    }
  }

  async function share(request: MoneyRequest) {
    const text = request.amount
      ? `Please send me ${dollars(request.amount)} on Ubex Bank.`
      : "Please send me money on Ubex Bank.";
    try {
      if (navigator.share) await navigator.share({ title: "Payment request", text, url: linkFor(request.token) });
      else await copy(request.token);
    } catch {
      /* the person closed the share sheet */
    }
  }

  async function cancel(request: MoneyRequest) {
    await cancelRequest(request.id);
    if (showing === request.token) setShowing("");
    toast("Request cancelled");
    await load();
  }

  return (
    <div className="px-5 pb-10 pt-7 md:max-w-xl">
      <PageTop title="Request money" />
      <p className="mt-3 text-sm text-muted">
        Make a link or QR code. Whoever opens it signs in and sees the details filled in, ready to send to you.
      </p>

      <section className="mt-5 space-y-3 rounded-[24px] border border-line bg-card p-4">
        <input
          value={amount}
          onChange={(event) => setAmount(cleanAmountInput(event.target.value))}
          placeholder="Amount (leave empty to let them choose)"
          inputMode="decimal"
          autoComplete="off"
          className="w-full rounded-full border border-line bg-card px-4 py-3 text-sm outline-none ring-red/30 focus:ring-2"
        />
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What is it for? (optional)"
          maxLength={80}
          autoComplete="off"
          className="w-full rounded-full border border-line bg-card px-4 py-3 text-sm outline-none ring-red/30 focus:ring-2"
        />
        {error && (
          <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={create}
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-solid py-3.5 font-medium text-white disabled:opacity-60"
        >
          {busy && <Spinner />}
          Create link
        </button>
      </section>

      {open && open.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 px-1 text-xs font-medium uppercase tracking-[0.14em] text-muted">Open requests</h2>
          <ul className="space-y-3">
            {open.map((request) => (
              <li key={request.id} className="rounded-[24px] border border-line bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display tabular text-xl">{request.amount ? dollars(request.amount) : "Any amount"}</p>
                    <p className="truncate text-sm text-muted">{request.note || "No note"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowing(showing === request.token ? "" : request.token)}
                    className="hit shrink-0 text-xs text-red"
                  >
                    {showing === request.token ? "Hide QR" : "Show QR"}
                  </button>
                </div>

                {showing === request.token && (
                  <div className="mx-auto mt-4 w-full max-w-[240px]">
                    <QrCode text={linkFor(request.token)} label="QR code for this payment request" />
                    <p className="mt-2 text-center text-xs text-muted">Point a phone camera at this to pay.</p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <button type="button" onClick={() => share(request)} className="rounded-full bg-solid px-5 py-2.5 text-sm font-medium text-white">
                    Share
                  </button>
                  <button type="button" onClick={() => copy(request.token)} className="rounded-full border border-line px-4 py-2.5 text-sm">
                    Copy link
                  </button>
                  <button type="button" onClick={() => cancel(request)} className="hit ml-auto text-xs text-danger">
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 px-1 text-xs text-muted">
            Links stop working after 7 days or when you cancel them. When someone pays, you will see the money in Activity.
          </p>
        </>
      )}
    </div>
  );
}
