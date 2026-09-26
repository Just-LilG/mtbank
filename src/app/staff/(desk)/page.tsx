"use client";

import Link from "next/link";
import { useBank } from "@/components/bank-provider";
import { dollars } from "@/lib/books";

export default function StaffHomePage() {
  const { customers, reviews, journal } = useBank();
  const held = customers.reduce((sum, person) => sum + person.balance + person.savings, 0);
  const frozen = customers.filter((person) => person.status === "Frozen");
  const waiting = reviews.filter((item) => item.decision === "waiting");
  const cards = customers.reduce((sum, person) => sum + person.cards.length, 0);
  const cashIn = journal
    .filter((item) => item.text.startsWith("Deposit") && item.amount)
    .reduce((sum, item) => sum + (item.amount ?? 0), 0);

  return (
    <div className="px-5 py-7 sm:px-8">
      <p className="text-sm text-muted">Osu branch · live book</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl tracking-tight">The desk</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/staff/accounts/new" className="rounded-full bg-red px-4 py-2 text-sm text-white">
            Open account
          </Link>
          <Link href="/staff/cash" className="rounded-full border border-line bg-card px-4 py-2 text-sm">
            Take cash
          </Link>
          <Link href="/staff/cards" className="rounded-full border border-line bg-card px-4 py-2 text-sm">
            Cards
          </Link>
        </div>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[24px] bg-ink p-5 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">On the books</p>
          <p className="font-display mt-3 text-3xl">{dollars(held)}</p>
          <p className="mt-2 text-sm text-white/60">{customers.length} customers</p>
        </article>
        <article className="rounded-[24px] border border-line bg-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Waiting review</p>
          <p className="font-display mt-3 text-3xl">{waiting.length}</p>
          <Link href="/staff/approvals" className="mt-2 inline-block text-sm text-red">
            Open the pile
          </Link>
        </article>
        <article className="rounded-[24px] border border-line bg-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Frozen</p>
          <p className="font-display mt-3 text-3xl">{frozen.length}</p>
          <p className="mt-2 text-sm text-muted">Accounts that cannot send</p>
        </article>
        <article className="rounded-[24px] border border-line bg-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Cards issued</p>
          <p className="font-display mt-3 text-3xl">{cards}</p>
          <p className="mt-2 text-sm text-muted">Cash in logged {dollars(cashIn)}</p>
        </article>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[24px] border border-line bg-card p-5">
          <h2 className="font-display text-2xl">Needs a decision</h2>
          <ul className="mt-4 divide-y divide-line">
            {waiting.length === 0 && <li className="py-4 text-sm text-muted">Nothing waiting.</li>}
            {waiting.map((item) => {
              const person = customers.find((customer) => customer.id === item.customerId);
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{person?.name}</p>
                    <p className="text-sm text-muted">{item.reason}</p>
                  </div>
                  <p>{dollars(item.amount)}</p>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="rounded-[24px] border border-line bg-card p-5">
          <h2 className="font-display text-2xl">Frozen accounts</h2>
          <ul className="mt-4 divide-y divide-line">
            {frozen.length === 0 && <li className="py-4 text-sm text-muted">No frozen accounts.</li>}
            {frozen.map((person) => (
              <li key={person.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{person.name}</p>
                  <p className="text-sm text-muted">{person.account}</p>
                </div>
                <Link href={`/staff/customers/${person.id}`} className="text-sm text-red">
                  Open file
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-4 rounded-[24px] border border-line bg-card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Latest desk work</h2>
          <Link href="/staff/ledger" className="text-sm text-red">
            Full ledger
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-line">
          {journal.slice(0, 6).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div>
                <p>{item.text}</p>
                <p className="text-muted">{item.when}</p>
              </div>
              {item.amount ? <p>{dollars(item.amount)}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
