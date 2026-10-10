"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useBank } from "@/components/bank-provider";
import { IDLE_EVENT, readIdleMinutes } from "@/lib/idle";

const WARN_SECONDS = 30;
const ACTIVITY = ["pointerdown", "keydown", "touchstart", "wheel", "scroll"] as const;

/**
 * Signs the person out after a quiet spell. A phone left unlocked on a table
 * should not leave a bank account open. Gives a short warning first.
 */
export function IdleGuard({ minutes: standard, adjustable = false }: { minutes: number; adjustable?: boolean }) {
  const bank = useBank();
  const router = useRouter();
  const signedIn = Boolean(bank.role);
  const last = useRef(Date.now());
  const warning = useRef(false);
  const ending = useRef(false);
  const signOutRef = useRef(bank.signOut);
  const [left, setLeft] = useState<number | null>(null);
  const [minutes, setMinutes] = useState(standard);

  // A customer can choose their own time in Settings. Staff always use the desk standard.
  useEffect(() => {
    if (!adjustable) return;
    const load = () => setMinutes(readIdleMinutes(standard));
    load();
    window.addEventListener(IDLE_EVENT, load);
    return () => window.removeEventListener(IDLE_EVENT, load);
  }, [adjustable, standard]);

  useEffect(() => {
    signOutRef.current = bank.signOut;
  });

  useEffect(() => {
    if (!signedIn) return;
    const limit = minutes * 60 * 1000;
    last.current = Date.now();
    warning.current = false;
    ending.current = false;

    async function leave() {
      if (ending.current) return;
      ending.current = true;
      try {
        await signOutRef.current();
      } catch {
        /* the cookie still expires on its own */
      }
      router.replace("/?timeout=1");
    }

    function tick() {
      const idle = Date.now() - last.current;
      if (idle >= limit) {
        leave();
        return;
      }
      const remaining = Math.ceil((limit - idle) / 1000);
      if (remaining <= WARN_SECONDS) {
        warning.current = true;
        setLeft(remaining);
      }
    }

    // While the warning is up, only the buttons count. A stray touch should not keep it open.
    function touch() {
      if (warning.current) return;
      last.current = Date.now();
    }

    function visible() {
      if (document.visibilityState === "visible") tick();
    }

    for (const name of ACTIVITY) window.addEventListener(name, touch, { passive: true });
    document.addEventListener("visibilitychange", visible);
    const timer = setInterval(tick, 1000);
    return () => {
      for (const name of ACTIVITY) window.removeEventListener(name, touch);
      document.removeEventListener("visibilitychange", visible);
      clearInterval(timer);
    };
  }, [signedIn, minutes, router]);

  if (left === null) return null;

  function stay() {
    last.current = Date.now();
    warning.current = false;
    setLeft(null);
  }

  async function leaveNow() {
    ending.current = true;
    try {
      await signOutRef.current();
    } catch {
      /* the cookie still expires on its own */
    }
    router.replace("/");
  }

  return createPortal(
    <div className="fixed inset-0 z-[300] grid place-items-center bg-black/60 px-6">
      <div role="alertdialog" aria-modal="true" aria-labelledby="idle-title" className="w-full max-w-sm rounded-[28px] bg-card p-6 text-center shadow-2xl">
        <p id="idle-title" className="font-display text-xl tracking-tight">
          Are you still there?
        </p>
        <p className="mt-2 text-sm text-muted">
          To keep your money safe, we sign you out when the app is quiet. Signing out in{" "}
          <span className="tabular font-medium text-ink">{left}</span> seconds.
        </p>
        <button
          type="button"
          autoFocus
          onClick={stay}
          className="mt-5 w-full rounded-full bg-solid py-3.5 font-medium text-white"
        >
          Stay signed in
        </button>
        <button type="button" onClick={leaveNow} className="mt-2 w-full py-3 text-sm text-muted">
          Sign out now
        </button>
      </div>
    </div>,
    document.body,
  );
}
