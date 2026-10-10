"use client";

import { useEffect, useState } from "react";
import { IDLE_CHOICES, IDLE_EVENT, IDLE_KEY, readIdleMinutes } from "@/lib/idle";

/** Lets the person pick how long the app can sit quiet before it signs them out. */
export function AutoSignOut() {
  const [minutes, setMinutes] = useState(5);

  useEffect(() => {
    setMinutes(readIdleMinutes(5));
  }, []);

  function pick(next: number) {
    setMinutes(next);
    try {
      localStorage.setItem(IDLE_KEY, String(next));
    } catch {
      /* storage can be blocked */
    }
    window.dispatchEvent(new Event(IDLE_EVENT));
  }

  return (
    <section className="rounded-[24px] border border-line bg-card px-4 py-4">
      <p className="text-sm font-medium">Auto sign-out</p>
      <p className="text-xs text-muted">Sign out when the app has been quiet for</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {IDLE_CHOICES.map((choice) => (
          <button
            key={choice}
            type="button"
            aria-pressed={minutes === choice}
            onClick={() => pick(choice)}
            className={`rounded-full py-2.5 text-sm transition-colors ${
              minutes === choice ? "bg-solid text-white" : "border border-line bg-card"
            }`}
          >
            {choice} min
          </button>
        ))}
      </div>
    </section>
  );
}
