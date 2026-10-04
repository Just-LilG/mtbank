"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBank } from "@/components/bank-provider";
import { Avatar, Chips, EmptyState, LinkButton, PageHeader, Pill, SearchBox, StaffPage } from "@/components/staff/ui";
import { dollars } from "@/lib/books";

type Filter = "All" | "Open" | "Frozen";

export default function CustomersPage() {
  const { customers } = useBank();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Filter>("All");

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

  const count = (value: Filter) =>
    value === "All" ? customers.length : customers.filter((person) => person.status === value).length;

  return (
    <StaffPage>
      <PageHeader title="Customers" subtitle={`${customers.length} on the books`}>
        <LinkButton href="/staff/accounts/new" primary>
          Open account
        </LinkButton>
      </PageHeader>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="md:max-w-sm md:flex-1">
          <SearchBox value={query} onChange={setQuery} placeholder="Search name, email or account" />
        </div>
        <Chips
          value={status}
          onChange={setStatus}
          options={(["All", "Open", "Frozen"] as const).map((value) => ({ value, label: value, count: count(value) }))}
        />
      </div>

      <div className="mt-5">
        {shown.length === 0 ? (
          <EmptyState title="No customer matches that" text="Try a different name or account number." />
        ) : (
          <>
            <ul className="divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-card md:hidden">
              {shown.map((person) => (
                <li key={person.id}>
                  <Link href={`/staff/customers/${person.id}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-line/60">
                    <Avatar name={person.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{person.name}</p>
                      <p className="truncate text-xs text-muted">
                        ···· {person.account.slice(-4)} · {person.cards.length} {person.cards.length === 1 ? "card" : "cards"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className="tabular text-sm font-medium">{dollars(person.balance)}</p>
                      <Pill tone={person.status === "Frozen" ? "bad" : "ok"}>{person.status}</Pill>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-hidden rounded-[24px] border border-line bg-card md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-paper/60 text-xs uppercase tracking-[0.12em] text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Account</th>
                    <th className="px-4 py-3 text-right font-medium">Everyday</th>
                    <th className="px-4 py-3 text-right font-medium">Savings</th>
                    <th className="px-4 py-3 text-right font-medium">Cards</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((person) => (
                    <tr key={person.id} className="transition-colors hover:bg-line/30">
                      <td className="px-5 py-3">
                        <Link href={`/staff/customers/${person.id}`} className="flex items-center gap-3">
                          <Avatar name={person.name} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{person.name}</span>
                            <span className="block truncate text-xs text-muted">{person.email || "No email"}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="tabular px-4 py-3 text-muted">{person.account}</td>
                      <td className="tabular px-4 py-3 text-right">{dollars(person.balance)}</td>
                      <td className="tabular px-4 py-3 text-right text-muted">{dollars(person.savings)}</td>
                      <td className="tabular px-4 py-3 text-right">{person.cards.length}</td>
                      <td className="px-5 py-3">
                        <Pill tone={person.status === "Frozen" ? "bad" : "ok"}>{person.status}</Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </StaffPage>
  );
}
