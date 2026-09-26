import Link from "next/link";
import { Mark } from "@/components/mark";

export default function Home() {
  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Mark />
          <p className="hidden text-sm text-muted sm:block">Customer access and the branch desk</p>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-red">UBEX BANK</p>
            <h1 className="font-display mt-4 max-w-xl text-5xl leading-[0.95] tracking-tight sm:text-7xl">
              Your money, and the desk that keeps it.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              Customers sign in with the account number and password the branch
              gives them. Staff open accounts, take cash, issue cards, and freeze
              an account when they need to.
            </p>
          </div>

          <div className="grid gap-4">
            <Link href="/customer/login" className="overflow-hidden rounded-[28px] bg-ink text-white">
              <div className="flex items-end justify-between gap-4 p-6 sm:p-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/60">Customer</p>
                  <p className="font-display mt-3 text-4xl tracking-tight">Sign in</p>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/70">
                    Use the account number the branch wrote down for you. New accounts are opened at the desk.
                  </p>
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-red text-sm">
                  Go
                </span>
              </div>
            </Link>

            <Link href="/staff/login" className="rounded-[28px] border border-line bg-card p-6 sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Staff</p>
                  <p className="font-display mt-3 text-4xl tracking-tight">Branch desk</p>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                    Open accounts, deposit, withdraw, issue cards, set limits, and review large sends.
                  </p>
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line text-sm">
                  Go
                </span>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
