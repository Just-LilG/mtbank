"use client";

import { useEffect, useState } from "react";
import { useBank } from "@/components/bank-provider";
import { Spinner } from "@/components/staff/ui";

function ago(then: number, now: number) {
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 20) return "just now";
  if (seconds < 90) return "a minute ago";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} h ago`;
}

/** "Updated just now", tap to refresh. */
export function Freshness() {
  const { updatedAt, refresh } = useBank();
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 20_000);
    return () => clearInterval(timer);
  }, []);

  if (updatedAt === null) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        setBusy(true);
        try {
          await refresh();
        } catch {
          /* the offline banner explains it */
        }
        setBusy(false);
        setNow(Date.now());
      }}
      className="hit mt-1 inline-flex items-center gap-1.5 text-xs text-muted"
      title="Tap to refresh"
    >
      {busy ? (
        <Spinner light={false} />
      ) : (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 12a8 8 0 0 1 14-5.300L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.300L4 15M4 20v-5h5" />
        </svg>
      )}
      Updated {ago(updatedAt, now)}
    </button>
  );
}
