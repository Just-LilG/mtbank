"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { startPasskeySignIn } from "@/app/actions";
import { useBank } from "@/components/bank-provider";
import { faceIcon, hasPasskeyFlag, signInWithBiometrics } from "@/components/customer/biometric";
import { Field, PasswordField } from "@/components/field";
import { LogoMark } from "@/components/logo";
import { MenuDrawer } from "@/components/menu-drawer";
import { Spinner } from "@/components/staff/ui";
import building from "@/assets/ubex-building.jpg";
import { BRANCH_NAME } from "@/lib/config";

const REMEMBER_KEY = "ubex:last-account";

/** "134320432890" becomes "1343 2043 2890" as you type. */
function groupDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 12).replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Letters or an @ mean this is a staff email, not an account number. */
const looksLikeEmail = (value: string) => /[A-Za-z@]/.test(value);

const userIcon = (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3.500 7.500h17v9h-17zM3.500 11h17M7 14.500h3" />
  </svg>
);
const emailIcon = (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
    <path d="m4 8 8 5.500L20 8" />
  </svg>
);
const lockIcon = (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="5" y="11" width="14" height="9" rx="2.500" />
    <path d="M8.500 11V8a3.500 3.500 0 0 1 7 0v3" />
  </svg>
);

export default function Home() {
  const bank = useBank();
  const router = useRouter();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [caps, setCaps] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);
  const [busy, setBusy] = useState(false);
  const [staffMode, setStaffMode] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [canBio, setCanBio] = useState(false);
  const [notice, setNotice] = useState("");
  const [next, setNext] = useState("");

  // A payment link sends people here first. Only our own pay pages are allowed as a destination.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("next") ?? "";
    if (/^\/pay\/[A-Za-z0-9_-]{16,40}$/.test(wanted)) setNext(wanted);
  }, []);

  // Offer face or fingerprint only on a phone that has been set up for it.
  useEffect(() => {
    setCanBio(hasPasskeyFlag());
  }, []);

  // Explain a sign-out that was not the person's own choice.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("timeout")) {
      setNotice("You were signed out because the app was quiet for a while.");
      window.history.replaceState(null, "", "/");
    }
  }, []);

  // Bring back the account number saved on this device, and jump to the password.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setAccount(groupDigits(saved));
        setRemember(true);
        setTimeout(() => document.getElementById("login-password")?.focus(), 60);
      }
    } catch {
      /* storage can be blocked */
    }
  }, []);

  const isEmail = staffMode || looksLikeEmail(account);
  const digits = account.replace(/\D/g, "").length;

  async function biometricSignIn() {
    if (busy) return;
    setBusy(true);
    setError("");
    const message = await signInWithBiometrics(bank.signInWithPasskey, startPasskeySignIn);
    setBusy(false);
    if (message === "cancelled") return;
    if (message) {
      setError(message);
      return;
    }
    router.push(next || "/customer");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    // Tell people what is missing and take them there, instead of a button that will not press.
    if (isEmail ? !account.includes("@") : digits < 8) {
      setError(isEmail ? "Enter your staff email." : "Enter your account number first. It is 12 digits.");
      document.getElementById("login-account")?.focus();
      return;
    }
    if (password.length === 0) {
      setError("Enter your password to continue.");
      document.getElementById("login-password")?.focus();
      return;
    }
    setBusy(true);
    setError("");
    const result = await bank.signIn(account.trim(), password);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      setShake((count) => count + 1);
      setPassword("");
      // The field remounts for the shake, so focus it once that has happened.
      setTimeout(() => document.getElementById("login-password")?.focus(), 60);
      return;
    }
    try {
      // Only customer account numbers are remembered. A staff email is never stored.
      if (result.role === "customer") {
        if (remember) localStorage.setItem(REMEMBER_KEY, account.replace(/\D/g, ""));
        else localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      /* storage can be blocked */
    }
    router.push(result.role === "staff" ? "/staff" : next || "/customer");
  }

  return (
    <main className="app-bg min-h-dvh overflow-x-clip md:flex md:items-center md:justify-center md:p-8">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col md:min-h-0 md:max-w-6xl md:flex-row md:rounded-[32px] md:shadow-[0_30px_80px_-30px_rgba(22,19,15,0.3)]">
        {/* ---- the building ---- */}
        <section className="relative isolate h-[30dvh] min-h-[250px] overflow-hidden text-white md:h-auto md:min-h-[540px] md:w-[62%] md:rounded-l-[32px]">
          <Image
            src={building}
            alt="The front of an Ubex Bank branch, with the red Ubex logo and the name in large white letters"
            fill
            priority
            placeholder="blur"
            sizes="(min-width: 768px) 700px, 100vw"
            className="object-cover"
            style={{ objectPosition: "62% 80%" }}
          />
          {/* keeps the white lettering readable, and tints the photo toward the brand red */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(80% 55% at 0% 0%, rgba(225,6,0,0.42), transparent 70%), linear-gradient(180deg, rgba(8,10,16,0.62) 0%, rgba(8,10,16,0.34) 30%, rgba(8,10,16,0.04) 58%, rgba(8,10,16,0.22) 100%)",
            }}
          />

          <div className="relative flex items-start justify-between px-6 pt-[max(2rem,calc(env(safe-area-inset-top)+1rem))] md:px-10 md:pt-10">
            <div className="flex items-center gap-4">
              <LogoMark
                tone="light"
                className="h-[52px] w-[52px] shrink-0 drop-shadow-[0_8px_14px_rgba(0,0,0,0.35)] md:h-[76px] md:w-[76px]"
              />
              <div className="leading-none">
                <p className="hidden text-sm text-white/85 md:block md:text-base">Welcome back</p>
                <h1 className="font-display text-[1.7rem] leading-none tracking-tight md:mt-1.5 md:text-[3.4rem]">
                  UBEX BANK
                </h1>
                <p className="mt-2 hidden text-[11px] uppercase tracking-[0.28em] text-white/75 md:block">{BRANCH_NAME}</p>
              </div>
            </div>
            <MenuDrawer tone="light" />
          </div>
        </section>

        {/* ---- the form ---- */}
        <section className="relative z-10 -mt-7 flex-1 rounded-t-[28px] bg-card px-6 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))] pt-8 md:mt-0 md:flex md:w-[38%] md:flex-col md:justify-center md:rounded-r-[32px] md:rounded-t-none md:px-12 md:py-16">
          <h2 className="font-display text-2xl tracking-tight">{isEmail ? "Staff sign in" : "Sign in"}</h2>
          {notice && (
            <p role="status" className="mt-3 rounded-2xl bg-paper px-4 py-3 text-sm text-muted">
              {notice}
            </p>
          )}

          {canBio && !isEmail && (
            <div className="mt-6">
              <button
                type="button"
                onClick={biometricSignIn}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-solid py-3.5 font-medium text-white shadow-[0_10px_22px_-12px_rgba(225,6,0,0.9)] transition-opacity active:opacity-90 disabled:opacity-70"
              >
                {faceIcon}
                Sign in with face or fingerprint
              </button>
              <p className="mt-5 text-center text-xs text-muted">or use your password</p>
            </div>
          )}

          <form className="mt-6 space-y-5" onSubmit={submit} noValidate>
            <div>
              <div className="flex items-end justify-between gap-3">
                <label htmlFor="login-account" className="text-sm text-muted">
                  {isEmail ? "Staff email" : "Account number"}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isEmail;
                    setStaffMode(next);
                    setAccount("");
                    setError("");
                    // The keyboard only changes shape when the field is focused again.
                    setTimeout(() => {
                      const box = document.getElementById("login-account");
                      box?.blur();
                      box?.focus();
                    }, 40);
                  }}
                  className="hit text-xs text-muted underline-offset-4 hover:underline"
                >
                  {isEmail ? "Use account number" : "Staff? Use email"}
                </button>
              </div>
              <Field
                id="login-account"
                label=""
                name="account"
                required
                icon={isEmail ? emailIcon : userIcon}
                value={account}
                placeholder={isEmail ? "you@branch.test" : "4821 0093 2218"}
                type={isEmail ? "email" : "text"}
                inputMode={isEmail ? "email" : "numeric"}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                maxLength={isEmail ? 120 : 14}
                hint={!isEmail && digits > 0 && digits < 12 ? `${12 - digits} more digit${12 - digits === 1 ? "" : "s"}` : undefined}
                onChange={(event) => {
                  const raw = event.target.value;
                  if (error) setError("");
                  // Typing letters or an @ (on a computer keyboard) switches to staff email on its own.
                  if (staffMode || looksLikeEmail(raw)) {
                    setAccount(raw);
                    return;
                  }
                  const next = groupDigits(raw);
                  setAccount(next);
                  // A full account number: move straight on to the password.
                  if (next.replace(/\D/g, "").length === 12 && digits < 12) {
                    setTimeout(() => document.getElementById("login-password")?.focus(), 30);
                  }
                }}
              />
            </div>
            <div key={shake} className={shake > 0 ? "shake" : ""}>
              <PasswordField
                id="login-password"
                label="Password"
                name="password"
                autoComplete="current-password"
                enterKeyHint="go"
                required
                icon={lockIcon}
                value={password}
                placeholder="The password from the branch"
                hint={caps ? "Caps Lock is on" : undefined}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError("");
                }}
                onKeyUp={(event) => setCaps(event.getModifierState("CapsLock"))}
                onKeyDown={(event) => setCaps(event.getModifierState("CapsLock"))}
              />
            </div>

            {!isEmail && (
            <label className="flex cursor-pointer items-center gap-3 text-sm text-ink/80">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-[18px] w-[18px] shrink-0 accent-[#e10600]"
              />
              Remember my account number
            </label>
            )}

            {error && (
              <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-solid py-3.5 font-medium text-white shadow-[0_10px_22px_-12px_rgba(225,6,0,0.9)] transition-opacity active:opacity-90 disabled:opacity-70"
            >
              {busy ? <Spinner /> : lockIcon}
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              aria-expanded={showForgot}
              onClick={() => setShowForgot((value) => !value)}
              className="hit text-sm text-ink/80 underline-offset-4 hover:underline"
            >
              Forgot password or no account yet?
            </button>
            {showForgot && (
              <p className="mt-3 rounded-2xl bg-paper px-4 py-3 text-left text-sm leading-relaxed text-muted">
                For your safety, passwords are reset in person. Visit the branch with your ID and ask the desk for a
                new one, or to open an account. You can change your password yourself afterwards in Settings.
              </p>
            )}
          </div>

          <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-moss" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6l-7-3ZM9 12l2 2 4-4" />
            </svg>
            We never ask for your password by phone, text or email.
          </p>

          <p className="mt-4 flex justify-center gap-5 text-xs text-muted">
            <Link href="/about" className="hit">About</Link>
            <Link href="/support" className="hit">Support</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
