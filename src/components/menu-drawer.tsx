"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "/staff/login", label: "Admin", note: "The branch desk" },
  { href: "/support", label: "Support", note: "Get help with your account" },
  { href: "/about", label: "About", note: "Who Ubex Bank is" },
];

export function MenuDrawer({
  tone = "light",
  signedIn = false,
}: {
  tone?: "light" | "ink";
  signedIn?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={`grid h-10 w-10 place-items-center rounded-full transition-colors ${
          tone === "light"
            ? "text-white hover:bg-white/10"
            : "text-ink hover:bg-ink/5"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-full max-w-[320px] flex-col bg-card px-6 py-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Menu</p>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-ink/5"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                  <path
                    d="M5 5l14 14M19 5L5 19"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <nav className="mt-8 flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-center justify-between rounded-2xl px-3 py-4 hover:bg-ink/5"
                >
                  <span>
                    <span className="font-display block text-2xl tracking-tight text-ink">
                      {link.label}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">{link.note}</span>
                  </span>
                  <span className="text-muted transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              ))}
            </nav>

            <div className="mt-auto pt-8">
              {signedIn ? (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center text-sm text-muted"
                >
                  Close
                </button>
              ) : (
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="block text-center text-sm text-muted"
                >
                  Back to sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
