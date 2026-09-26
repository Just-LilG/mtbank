"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBank } from "@/components/bank-provider";

export default function ProfilePage() {
  const bank = useBank();
  const router = useRouter();
  const me = bank.me;
  if (!me) return null;

  const rows = [
    ["Full name", me.name],
    ["Account", me.account],
    ["Email", me.email],
    ["Phone", me.phone],
    ["Status", me.status],
  ];

  const links = [
    { href: "/customer/statements", label: "Statements" },
    { href: "/support", label: "Support" },
    { href: "/about", label: "About" },
    { href: "/staff/login", label: "Branch desk" },
  ];

  return (
    <div className="px-5 pb-8 pt-7">
      <p className="text-sm text-muted">You</p>
      <h1 className="font-display text-4xl tracking-tight">{me.name.split(" ")[0]}</h1>
      <dl className="mt-6 divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-card">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 py-3.5">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-right text-sm">{value}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-card">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center justify-between px-4 py-3.5 text-sm"
            >
              {link.label}
              <span className="text-muted">→</span>
            </Link>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={async () => {
          await bank.signOut();
          router.push("/");
        }}
        className="mt-6 w-full rounded-full border border-line py-3.5 text-sm"
      >
        Sign out
      </button>
    </div>
  );
}

