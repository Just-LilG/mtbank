"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** Tells people when the phone has lost its connection, instead of failing silently. */
export function ConnectionBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;
  return (
    <p role="status" className="fixed inset-x-0 top-0 z-[300] bg-[#16181f] px-5 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] text-center text-sm text-white">
      You are offline. You can still look around, but nothing will send until you reconnect.
    </p>
  );
}
