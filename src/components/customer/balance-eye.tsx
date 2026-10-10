"use client";

import { useEffect, useState } from "react";

const KEY = "ubex:hide";

/** Blurs every amount in the app while on. The setting stays on this phone. */
export function BalanceEye() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(document.documentElement.dataset.hideBalance === "1");
  }, []);

  function toggle() {
    const next = !hidden;
    setHidden(next);
    if (next) document.documentElement.dataset.hideBalance = "1";
    else delete document.documentElement.dataset.hideBalance;
    try {
      if (next) localStorage.setItem(KEY, "1");
      else localStorage.removeItem(KEY);
    } catch {
      /* storage can be blocked */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={hidden}
      aria-label={hidden ? "Show balances" : "Hide balances"}
      className="hit grid h-8 w-8 place-items-center rounded-full text-muted"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {hidden ? (
          <>
            <path d="M3 3l18 18M10.6 5.1A9.700 9.700 0 0 1 12 5c5 0 8.500 4 9.500 7a12.700 12.700 0 0 1-2.600 4M6.600 6.600A12.600 12.600 0 0 0 2.500 12c1 3 4.500 7 9.500 7a9.500 9.500 0 0 0 4.200-1M9.900 9.900a3 3 0 0 0 4.200 4.200" />
          </>
        ) : (
          <>
            <path d="M2.500 12C3.500 9 7 5 12 5s8.500 4 9.500 7c-1 3-4.500 7-9.500 7s-8.500-4-9.500-7Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    </button>
  );
}
