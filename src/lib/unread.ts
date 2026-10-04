"use client";

import { useEffect, useState } from "react";

const keyFor = (id: string) => `ubex:notifications-seen:${id}`;

/** Things the customer did themselves should not light the bell. */
export function isNotable(item: { title: string }) {
  return !/pending$|^card (paused|active)$|^(to|from) (savings|everyday)$/i.test(item.title.trim());
}

function readSeen(id: string) {
  try {
    const raw = localStorage.getItem(keyFor(id));
    if (raw === null) {
      // First visit on this device: existing history is not "new".
      const now = Date.now();
      localStorage.setItem(keyFor(id), String(now));
      return now;
    }
    return Number(raw) || 0;
  } catch {
    return Date.now();
  }
}

export function markNotificationsSeen(id: string) {
  try {
    localStorage.setItem(keyFor(id), String(Date.now()));
  } catch {
    /* storage can be blocked */
  }
}

/** The moment the customer last opened Notifications (null until we are in the browser). */
export function useLastSeen(id: string | undefined) {
  const [seen, setSeen] = useState<number | null>(null);
  useEffect(() => {
    if (id) setSeen(readSeen(id));
  }, [id]);
  return seen;
}

export function useUnreadCount(id: string | undefined, items: { at: string; title: string }[]) {
  const seen = useLastSeen(id);
  if (seen === null) return 0;
  return items.filter((item) => isNotable(item) && new Date(item.at).getTime() > seen).length;
}
