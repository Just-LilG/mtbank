"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useBank } from "@/components/bank-provider";
import { Mark } from "@/components/mark";

const links = [
  { href: "/staff", label: "Desk" },
  { href: "/staff/customers", label: "Customers" },
  { href: "/staff/accounts/new", label: "New account" },
  { href: "/staff/cash", label: "Cash" },
  { href: "/staff/cards", label: "Cards" },
  { href: "/staff/approvals", label: "Reviews" },
  { href: "/staff/transactions", label: "Transactions" },
  { href: "/staff/ledger", label: "Ledger" },
];

function active(path: string, href: string) {
  if (href === "/staff") return path === "/staff";
  return path === href || path.startsWith(`${href}/`);
}

export function StaffNav() {
  const path = usePathname();
  const router = useRouter();
  const bank = useBank();

  async function leave() {
    await bank.signOut();
    router.push("/");
  }

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col bg-ink px-4 py-6 text-white md:flex">
        <Mark tone="light" />
        <p className="mt-8 px-2 text-xs uppercase tracking-[0.2em] text-white/45">
          Branch desk
        </p>
        <nav className="mt-3 flex flex-1 flex-col gap-1">
          {links.map((link) => {
            const on = active(path, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-2xl px-3 py-2.5 text-sm ${
                  on ? "bg-white text-ink" : "text-white/75 hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button type="button" onClick={leave} className="px-2 text-left text-sm text-white/60">
          Leave the desk
        </button>
      </aside>
      <div className="border-b border-line bg-card md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Mark />
          <button type="button" onClick={leave} className="text-sm">
            Leave
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
          {links.map((link) => {
            const on = active(path, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                  on ? "bg-ink text-white" : "text-muted"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
