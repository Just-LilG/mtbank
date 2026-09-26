import Link from "next/link";
import { Mark } from "@/components/mark";
import { MenuDrawer } from "@/components/menu-drawer";

export default function AboutPage() {
  return (
    <main className="min-h-dvh bg-[#e7e1d4]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-paper">
        <section className="bg-red px-6 pb-16 pt-8 text-white">
          <div className="flex items-center justify-between">
            <Mark tone="light" />
            <MenuDrawer tone="light" />
          </div>
          <h1 className="font-display mt-12 text-5xl leading-none tracking-tight">
            One branch, one desk.
          </h1>
          <p className="mt-4 max-w-xs text-white/80">
            Ubex Bank runs out of the Osu branch. No call centre, no app-only
            accounts.
          </p>
        </section>

        <section className="-mt-8 flex-1 rounded-t-[28px] bg-card px-6 py-8">
          <div className="space-y-5 text-sm leading-relaxed text-muted">
            <p>
              Every account here was opened in person, by someone at the desk
              who wrote down your details and handed you a password. That
              hasn&rsquo;t changed — it&rsquo;s still the only way to open one.
            </p>
            <p>
              What this app does is give you a way to check your balance, move
              money, and manage your cards without a trip to the branch every
              time. The branch still handles anything that needs a human:
              opening accounts, resetting passwords, freezing a card.
            </p>
            <p>
              It&rsquo;s a small operation, and that&rsquo;s deliberate.
            </p>
          </div>

          <Link href="/" className="mt-10 block text-center text-sm text-muted">
            Back to sign in
          </Link>
        </section>
      </div>
    </main>
  );
}
