"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LogoMark } from "@/components/logo";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="app-bg grid min-h-dvh place-items-center px-6">
      <div className="max-w-sm text-center">
        <LogoMark className="mx-auto h-16 w-16" />
        <h1 className="font-display mt-8 text-2xl tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-muted">
          That was on us, not you. Your money is safe. Try again, and if it keeps happening, tell the branch.
        </p>
        {error.digest && <p className="num mt-3 text-xs text-muted">Reference {error.digest}</p>}
        <div className="mt-8 flex flex-col gap-2">
          <button type="button" onClick={reset} className="rounded-full bg-solid px-6 py-3 font-medium text-white">
            Try again
          </button>
          <Link href="/" className="rounded-full border border-line bg-card px-6 py-3 text-sm">
            Back to the start
          </Link>
        </div>
      </div>
    </main>
  );
}
