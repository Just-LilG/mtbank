"use client";

import Link from "next/link";
import { useUnreadCount } from "@/lib/unread";

export function NotificationBell({
  customerId,
  movements,
}: {
  customerId: string;
  movements: { at: string; title: string }[];
}) {
  const count = useUnreadCount(customerId, movements);
  return (
    <Link
      href="/customer/notifications"
      aria-label={count > 0 ? `Notifications, ${count} new` : "Notifications"}
      className="relative grid h-11 w-11 place-items-center rounded-full border border-line bg-card text-ink shadow-sm"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <path
          d="M6 10a6 6 0 1 1 12 0c0 3.2 1 5 1.6 5.8a.9.9 0 0 1-.7 1.4H5.1a.9.9 0 0 1-.7-1.4C5 15 6 13.2 6 10Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9.5 19.5a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 grid min-h-[20px] min-w-[20px] place-items-center rounded-full bg-red px-1 text-[11px] font-medium leading-none text-white ring-2 ring-paper"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
