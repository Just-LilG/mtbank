"use client";

import Link from "next/link";
import { useBank } from "@/components/bank-provider";
import { Avatar, EmptyState, LedgerIcon, LinkButton, PageHeader, StaffPage } from "@/components/staff/ui";
import { When } from "@/components/when";
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
    <StaffPage>
      <PageHeader title="The desk" subtitle="Osu branch · live book">
        <LinkButton href="/staff/accounts/new" primary>
          Open account
        </LinkButton>
        <LinkButton href="/staff/cash">Take cash</LinkButton>
      </PageHeader>

      <section className="mt-6 overflow-hidden rounded-[28px] bg-panel p-6 text-white">
        <p className="text-xs uppercase tracking-[0.18em] text-white/50">On the books</p>
        <p className="font-display tabular mt-2 text-4xl tracking-tight md:text-5xl">{dollars(held)}</p>
        <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-5 text-sm">
          <div>
            <dt className="text-white/50">Customers</dt>
            <dd className="font-display tabular mt-1 text-xl">{customers.length}</dd>
          </div>
          <div>
            <dt className="text-white/50">Cards issued</dt>
            <dd className="font-display tabular mt-1 text-xl">{cards}</dd>
          </div>
          <div>
            <dt className="text-white/50">Cash in logged</dt>
            <dd className="font-display tabular mt-1 text-xl">{dollars(cashIn)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-3 grid grid-cols-2 gap-3">
        <Link
          href="/staff/approvals"
          className={`rounded-[24px] border p-5 transition-transform active:scale-[0.98] ${
            waiting.length > 0 ? "border-red/30 bg-red/5" : "border-line bg-card"
          }`}
        >
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Waiting review</p>
          <p className={`font-display tabular mt-2 text-4xl ${waiting.length > 0 ? "text-red" : ""}`}>{waiting.length}</p>
          <p className="mt-1 text-sm text-red">{waiting.length > 0 ? "Review now →" : "All clear"}</p>
        </Link>
        <article className="rounded-[24px] border border-line bg-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Frozen</p>
          <p className="font-display tabular mt-2 text-4xl">{frozen.length}</p>
          <p className="mt-1 text-sm text-muted">Cannot send</p>
        </article>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[24px] border border-line bg-card p-5">
          <h2 className="font-display text-lg">Needs a decision</h2>
          {waiting.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Nothing waiting. Nice.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {waiting.map((item) => {
                const person = customers.find((customer) => customer.id === item.customerId);
                return (
                  <li key={item.id}>
                    <Link href="/staff/approvals" className="flex items-center gap-3 py-3">
                      <Avatar name={person?.name ?? "?"} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{person?.name}</p>
                        <p className="truncate text-sm text-muted">{item.reason}</p>
                      </div>
                      <p className="tabular font-medium">{dollars(item.amount)}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-[24px] border border-line bg-card p-5">
          <h2 className="font-display text-lg">Frozen accounts</h2>
          {frozen.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No frozen accounts.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {frozen.map((person) => (
                <li key={person.id}>
                  <Link href={`/staff/customers/${person.id}`} className="flex items-center gap-3 py-3">
                    <Avatar name={person.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{person.name}</p>
                      <p className="text-sm text-muted">{person.account}</p>
                    </div>
                    <span className="text-sm text-red">Open file</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-4 rounded-[24px] border border-line bg-card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg">Latest desk work</h2>
          <Link href="/staff/ledger" className="text-sm text-red">
            Full ledger
          </Link>
        </div>
        {journal.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="Nothing yet" text="Everything the desk does will be logged here." />
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {journal.slice(0, 6).map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
                <LedgerIcon text={item.text} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2">{item.text}</p>
                  <p className="text-xs text-muted">
                    {item.actor ? `${item.actor} · ` : ""}
                    <When at={item.at} fallback={item.when} />
                  </p>
                </div>
                {item.amount ? <p className="tabular font-medium">{dollars(item.amount)}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </StaffPage>
  );
}
