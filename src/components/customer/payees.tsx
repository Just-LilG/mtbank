"use client";

import { useState } from "react";
import { removePayee, savePayee } from "@/app/actions";
import { useToast } from "@/components/toast";
import type { Payee } from "@/lib/payees";

export const groupAccount = (value: string) =>
  value.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");

const initials = (text: string) =>
  text
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

/** The row of payees you saved, each with the nickname you gave it. */
export function SavedPayees({
  payees,
  picked,
  onPick,
  onChanged,
}: {
  payees: Payee[];
  picked: string;
  onPick: (account: string) => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);

  if (payees.length === 0) return null;

  async function remove(payee: Payee) {
    await removePayee(payee.id);
    toast(`Removed ${payee.nickname}`);
    onChanged();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Saved payees</p>
        <button type="button" onClick={() => setEditing((value) => !value)} className="hit text-xs text-red">
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      <ul className="-mx-5 mt-2 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {payees.map((payee) => {
          const on = picked === payee.account;
          return (
            <li key={payee.id} className="relative shrink-0">
              <button
                type="button"
                aria-pressed={on}
                onClick={() => (editing ? undefined : onPick(groupAccount(payee.account)))}
                className="flex w-[72px] flex-col items-center gap-1.5"
              >
                <span
                  className={`font-display grid h-14 w-14 place-items-center rounded-full text-base transition-colors ${
                    on ? "bg-solid text-white" : "bg-red/10 text-red"
                  }`}
                >
                  {initials(payee.nickname)}
                </span>
                <span className="w-full truncate text-center text-xs text-ink/80">{payee.nickname}</span>
              </button>
              {editing && (
                <button
                  type="button"
                  aria-label={`Remove ${payee.nickname}`}
                  onClick={() => remove(payee)}
                  className="absolute -right-0.5 -top-1 grid h-6 w-6 place-items-center rounded-full bg-danger text-white shadow"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A small "save this person" prompt. Hidden when they are already saved. */
export function SavePayee({
  account,
  name,
  saved,
  onSaved,
}: {
  account: string;
  name: string;
  saved: boolean;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);

  if (saved) return null;

  async function save() {
    setBusy(true);
    const result = await savePayee(account, nickname || name.split(" ")[0]);
    setBusy(false);
    if ("error" in result) {
      toast(result.error, "error");
      return;
    }
    toast("Payee saved");
    setOpen(false);
    setNickname("");
    onSaved();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="hit mt-1.5 text-sm text-red">
        Save {name.split(" ")[0]} as a payee
      </button>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        onKeyDown={(event) => {
          // Enter saves the nickname; it must not submit the whole Send form.
          if (event.key === "Enter") {
            event.preventDefault();
            save();
          }
        }}
        placeholder={`Nickname, e.g. ${name.split(" ")[0]}`}
        maxLength={30}
        autoComplete="off"
        autoFocus
        className="min-w-0 flex-1 rounded-full border border-line bg-card px-4 py-2.5 text-sm outline-none ring-red/30 focus:ring-2"
      />
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="shrink-0 rounded-full bg-solid px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {busy ? "…" : "Save"}
      </button>
    </div>
  );
}
