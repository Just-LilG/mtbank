"use client";

import { useEffect, useState } from "react";
import { listSecurityActivity } from "@/app/actions";
import { When } from "@/components/when";
import type { SecurityEvent, SecurityKind } from "@/lib/security-log";

const LOOK: Record<SecurityKind, { title: string; dot: string }> = {
  signin: { title: "Signed in", dot: "bg-moss" },
  failed: { title: "Failed sign-in attempt", dot: "bg-danger" },
  password_changed: { title: "Password changed", dot: "bg-amber-500" },
  branch_reset: { title: "Password reset by the branch", dot: "bg-amber-500" },
  passkey_added: { title: "Face or fingerprint turned on", dot: "bg-amber-500" },
  passkey_removed: { title: "Face or fingerprint turned off", dot: "bg-amber-500" },
  card_lost: { title: "Card reported lost", dot: "bg-danger" },
};

/** The recent sign-ins and changes on this account, newest first. */
export function SecurityActivity() {
  const [events, setEvents] = useState<SecurityEvent[] | null>(null);
  const [all, setAll] = useState(false);

  useEffect(() => {
    listSecurityActivity()
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  if (events === null) return <div className="skeleton h-[180px] rounded-[24px]" />;

  const shown = all ? events : events.slice(0, 6);
  const failures = events.filter((event) => event.kind === "failed").length;

  return (
    <section className="rounded-[24px] border border-line bg-card px-4 py-4">
      {events.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">Nothing yet. Sign-ins and changes will show up here.</p>
      ) : (
        <>
          {failures > 0 && (
            <p className="mb-3 rounded-2xl bg-danger/10 px-3 py-2.5 text-xs text-danger">
              {failures} failed {failures === 1 ? "attempt" : "attempts"} recently. If that was not you, change your
              password and tell the branch.
            </p>
          )}
          <ul className="divide-y divide-line">
            {shown.map((event) => (
              <li key={event.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${LOOK[event.kind]?.dot ?? "bg-muted"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{LOOK[event.kind]?.title ?? "Account activity"}</p>
                  <p className="truncate text-xs text-muted">
                    {event.detail ? `${event.detail} · ` : ""}
                    <When at={event.at} />
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {events.length > 6 && (
            <button type="button" onClick={() => setAll((value) => !value)} className="hit mt-3 w-full text-center text-xs text-red">
              {all ? "Show less" : `Show all ${events.length}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
