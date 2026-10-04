"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBank } from "@/components/bank-provider";
import { Mark } from "@/components/mark";

const links = [
  { href: "/staff", label: "Desk", icon: "M3 11.500 12 4l9 7.500V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/staff/customers", label: "Customers", icon: "M16 19v-1.500a3.500 3.500 0 0 0-3.500-3.500h-4A3.500 3.500 0 0 0 5 17.500V19M10.500 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 19v-1a3 3 0 0 0-2-2.800M15.500 5.200A3 3 0 0 1 17 11" },
  { href: "/staff/accounts/new", label: "New account", icon: "M12 5v14M5 12h14" },
  { href: "/staff/cash", label: "Cash", icon: "M3 7h18v10H3zM12 14.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5ZM6.500 10v4M17.500 10v4" },
  { href: "/staff/cards", label: "Cards", icon: "M3.500 7.500h17v9h-17zM3.500 11h17" },
  { href: "/staff/approvals", label: "Reviews", icon: "M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6zM9 12l2 2 4-4" },
  { href: "/staff/transactions", label: "Transactions", icon: "M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3-3m-3 3 3 3" },
  { href: "/staff/ledger", label: "Ledger", icon: "M7 4h10a1 1 0 0 1 1 1v15l-3-2-3 2-3-2-3 2V5a1 1 0 0 1 1-1zM9 9h6M9 12.500h4" },
];

function active(path: string, href: string) {
  if (href === "/staff") return path === "/staff";
  return path === href || path.startsWith(`${href}/`);
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function StaffNav() {
  const path = usePathname();
  const router = useRouter();
  const bank = useBank();
  const waiting = bank.reviews.filter((item) => item.decision === "waiting").length;

  useEffect(() => {
    document
      .querySelector('[data-staff-tab="on"]')
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [path]);

  async function leave() {
    await bank.signOut();
    router.push("/");
  }

  const badge = (count: number) =>
    count > 0 ? (
      <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-red px-1.5 text-[11px] font-medium leading-5 text-white">
        {count > 9 ? "9+" : count}
      </span>
    ) : null;

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col bg-panel px-4 py-6 text-white md:sticky md:top-0 md:flex md:h-dvh">
        <Mark tone="light" />
        <p className="mt-8 px-3 text-[11px] uppercase tracking-[0.2em] text-white/40">Branch desk</p>
        <nav className="mt-3 flex flex-1 flex-col gap-1 overflow-y-auto">
          {links.map((link) => {
            const on = active(path, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={on ? "page" : undefined}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors ${
                  on ? "bg-solid text-white shadow-[0_10px_20px_-12px_rgba(225,6,0,0.9)]" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon d={link.icon} />
                {link.label}
                {link.href === "/staff/approvals" && badge(waiting)}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={leave}
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Icon d="M10 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M15 8l4 4-4 4M19 12H9" />
          Leave the desk
        </button>
      </aside>

      <div className="sticky top-0 z-30 border-b border-line bg-card/90 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Mark />
          <button
            type="button"
            onClick={leave}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm text-ink/80"
          >
            <Icon d="M10 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M15 8l4 4-4 4M19 12H9" />
            Leave
          </button>
        </div>
        <nav aria-label="Branch desk" className="flex gap-1.5 overflow-x-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => {
            const on = active(path, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                data-staff-tab={on ? "on" : undefined}
                aria-current={on ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-colors ${
                  on ? "bg-solid text-white" : "text-muted"
                }`}
              >
                {link.label}
                {link.href === "/staff/approvals" && waiting > 0 && (
                  <span className={`grid min-w-4 place-items-center rounded-full px-1 text-[11px] leading-4 ${on ? "bg-white text-red" : "bg-red text-white"}`}>
                    {waiting}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
