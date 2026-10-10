import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="app-bg grid min-h-dvh place-items-center px-6">
      <div className="max-w-sm text-center">
        <LogoMark className="mx-auto h-16 w-16" />
        <p className="font-display mt-8 text-6xl tracking-tight">404</p>
        <h1 className="font-display mt-2 text-2xl tracking-tight">This page is not on the books</h1>
        <p className="mt-2 text-muted">The link may be old, or the page may have moved.</p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-solid px-6 py-3 font-medium text-white">
          Back to Ubex Bank
        </Link>
      </div>
    </main>
  );
}
