"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBank } from "@/components/bank-provider";
import { dollars } from "@/lib/books";

export default function CustomersPage() {
  const { customers } = useBank();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | "Open" | "Frozen">("All");
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return customers.filter((person) => {
      const matchesStatus = status === "All" || person.status === status;
      const matchesQuery =
        !needle ||
        person.name.toLowerCase().includes(needle) ||
        person.email.toLowerCase().includes(needle) ||
        person.account.replace(/\s/g, "").includes(needle.replace(/\s/g, ""));
      return matchesStatus && matchesQuery;
    });
  }, [customers, query, status]);

  return (
    <div className="px-5 py-7 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Everyone on the books</p>
          <h1 className="font-display text-5xl tracking-tight">Customers</h1>
        </div>
        <Link href="/staff/accounts/new" className="rounded-full bg-red px-4 py-2 text-sm text-white">
          Open account
        </Link>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, or account"
          className="w-full max-w-md rounded-2xl border border-line bg-card px-4 py-3 outline-none ring-red/30 focus:ring-2"
        />
        {(["All", "Open", "Frozen"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            className={`rounded-full px-4 py-2 text-sm ${
              status === item ? "bg-ink text-white" : "border border-line bg-card text-muted"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-5 overflow-x-auto rounded-[24px] border border-line bg-card">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-paper text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Account</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Cards</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((person) => (
              <tr key={person.id} className="border-t border-line">
                <td className="px-4 py-3.5">
                  <Link href={`/staff/customers/${person.id}`} className="font-medium">
                    {person.name}
                  </Link>
                  <p className="text-xs text-muted">{person.email}</p>
                </td>
                <td className="hidden px-4 py-3.5 text-muted md:table-cell">{person.account}</td>
                <td className="px-4 py-3.5">{dollars(person.balance)}</td>
                <td className="hidden px-4 py-3.5 sm:table-cell">{person.cards.length}</td>
                <td className="px-4 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      person.status === "Frozen" ? "bg-red/10 text-red" : "bg-moss/10 text-moss"
                    }`}
                  >
                    {person.status}
                  </span>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-muted">
                  No customer matches that.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
