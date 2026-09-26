import Link from "next/link";
import { Mark } from "@/components/mark";
import { MenuDrawer } from "@/components/menu-drawer";

export default function SupportPage() {
  return (
    <main className="min-h-dvh bg-[#e7e1d4]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-paper">
        <section className="bg-red px-6 pb-16 pt-8 text-white">
          <div className="flex items-center justify-between">
            <Mark tone="light" />
            <MenuDrawer tone="light" />
          </div>
          <h1 className="font-display mt-12 text-5xl leading-none tracking-tight">
            Support.
          </h1>
          <p className="mt-4 max-w-xs text-white/80">
            Most things are faster to sort out at the branch than over email.
          </p>
        </section>

        <section className="-mt-8 flex-1 rounded-t-[28px] bg-card px-6 py-8">
          <div className="space-y-6">
            <div>
              <p className="font-display text-xl tracking-tight">Lost your password</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Passwords are reset at the desk, in person. Bring the ID you
                opened the account with.
              </p>
            </div>
            <div className="h-px bg-line" />
            <div>
              <p className="font-display text-xl tracking-tight">Card not working</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Check the card&rsquo;s status under Cards in your account first —
                it may be frozen or paused. If it still won&rsquo;t work, the
                branch can issue a new one.
              </p>
            </div>
            <div className="h-px bg-line" />
            <div>
              <p className="font-display text-xl tracking-tight">Something looks wrong</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                If a balance or a transfer looks off, come by the branch with
                your account number. A member of staff can pull up the full
                record.
              </p>
            </div>
          </div>

          <Link href="/" className="mt-10 block text-center text-sm text-muted">
            Back to sign in
          </Link>
        </section>
      </div>
    </main>
  );
}
