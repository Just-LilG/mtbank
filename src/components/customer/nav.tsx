"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconCard,
  IconHome,
  IconList,
  IconSend,
  IconUser,
} from "@/components/icons";
import { Mark } from "@/components/mark";

const items = [
  { href: "/customer", label: "Home", icon: IconHome },
  { href: "/customer/send", label: "Send", icon: IconSend },
  { href: "/customer/activity", label: "Activity", icon: IconList },
  { href: "/customer/cards", label: "Cards", icon: IconCard },
  { href: "/customer/profile", label: "Me", icon: IconUser },
];

export function CustomerNav() {
  const path = usePathname();

  function isOn(href: string) {
    if (href === "/customer") return path === "/customer";
    if (href === "/customer/profile") return (
        path.startsWith(href) ||
        ["/customer/settings", "/customer/goals", "/customer/scheduled", "/customer/request"].some((own) => path.startsWith(own))
      );
    return path.startsWith(href);
  }

  return (
    <>
      <nav aria-label="Main" className="sticky bottom-0 safe-bottom border-t border-line bg-card px-2 pt-2 md:hidden">
        <ul className="grid grid-cols-5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isOn(item.href) ? "page" : undefined}
                  className={`relative flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] ${
                    isOn(item.href)
                      ? "font-medium text-red before:absolute before:-top-2 before:h-0.5 before:w-8 before:rounded-full before:bg-red"
                      : "text-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <aside className="hidden w-60 shrink-0 border-r border-line bg-card px-4 py-6 md:sticky md:top-0 md:flex md:h-dvh md:flex-col">
        <Mark />
        <nav className="mt-8 flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isOn(item.href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm ${
                  isOn(item.href) ? "bg-solid text-white" : "text-ink hover:bg-line/40"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
