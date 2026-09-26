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
  { href: "/customer/cards", label: "Card", icon: IconCard },
  { href: "/customer/profile", label: "Me", icon: IconUser },
];

export function CustomerNav() {
  const path = usePathname();

  function isOn(href: string) {
    return href === "/customer" ? path === "/customer" : path.startsWith(href);
  }

  return (
    <>
      <nav className="sticky bottom-0 border-t border-line bg-card/95 px-2 pb-3 pt-2 backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-1 text-[11px] ${
                    isOn(item.href) ? "text-red" : "text-muted"
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

      <aside className="hidden w-56 shrink-0 border-l border-line bg-card px-4 py-6 md:flex md:flex-col">
        <Mark />
        <nav className="mt-8 flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm ${
                  isOn(item.href) ? "bg-ink text-white" : "text-ink hover:bg-line/40"
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
