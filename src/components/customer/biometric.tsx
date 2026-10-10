"use client";

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { useCallback, useEffect, useState } from "react";
import { finishPasskeySetup, listPasskeys, removePasskey, startPasskeySetup } from "@/app/actions";
import { useToast } from "@/components/toast";
import type { PasskeyInfo } from "@/lib/passkeys";

/** Remembered on this phone so the sign-in page knows to offer the button. */
export const PASSKEY_FLAG = "ubex-passkey";
const NUDGE_DISMISSED = "ubex-passkey-nudge";
/** Which passkey belongs to this phone, so sign-in can ask for it directly. */
const CREDENTIAL_KEY = "ubex-passkey-id";

function savedCredentialId() {
  try {
    return localStorage.getItem(CREDENTIAL_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function saveCredentialId(id: string | null) {
  try {
    if (id) localStorage.setItem(CREDENTIAL_KEY, id);
    else localStorage.removeItem(CREDENTIAL_KEY);
  } catch {
    /* storage can be blocked */
  }
}

export async function biometricsAvailable() {
  try {
    return (
      typeof window !== "undefined" &&
      !!window.PublicKeyCredential &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  } catch {
    return false;
  }
}

export function hasPasskeyFlag() {
  try {
    return localStorage.getItem(PASSKEY_FLAG) === "1";
  } catch {
    return false;
  }
}

function setPasskeyFlag(on: boolean) {
  try {
    if (on) localStorage.setItem(PASSKEY_FLAG, "1");
    else localStorage.removeItem(PASSKEY_FLAG);
  } catch {
    /* storage can be blocked */
  }
}

/** Asks the phone to make a passkey. Returns "" on success, or a short message to show. */
export async function turnOnBiometrics(): Promise<string> {
  const started = await startPasskeySetup();
  if ("error" in started) return started.error ?? "Please try again.";
  try {
    const response = await startRegistration({ optionsJSON: started.options });
    const done = await finishPasskeySetup(response);
    if ("error" in done) return done.error ?? "Please try again.";
    setPasskeyFlag(true);
    saveCredentialId(response.id);
    return "";
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "NotAllowedError" || name === "AbortError") return "cancelled";
    if (name === "InvalidStateError") {
      setPasskeyFlag(true);
      return "This phone is already set up.";
    }
    return "This phone could not turn it on. Check that a screen lock is set.";
  }
}

/** Signs in with the phone's face or fingerprint check. Returns "" on success. */
export async function signInWithBiometrics(
  finish: (response: Awaited<ReturnType<typeof startAuthentication>>) => Promise<string>,
  start: (credentialId?: string) => Promise<{ options: Parameters<typeof startAuthentication>[0]["optionsJSON"] }>,
): Promise<string> {
  try {
    const { options } = await start(savedCredentialId());
    const response = await startAuthentication({ optionsJSON: options });
    const message = await finish(response);
    // Remember this phone's passkey for next time; forget it if it no longer works.
    saveCredentialId(message === "" ? response.id : null);
    return message;
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "NotAllowedError" || name === "AbortError") return "cancelled";
    return "That did not work. Sign in with your password instead.";
  }
}

const faceIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
    <path d="M9 10v1M15 10v1M12 10v3h-1M9.500 15.500c1.500 1.200 3.500 1.200 5 0" />
  </svg>
);

export { faceIcon };

/** The full control, shown in Settings. */
export function BiometricSettings() {
  const toast = useToast();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<PasskeyInfo[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setDevices(await listPasskeys());
  }, []);

  useEffect(() => {
    biometricsAvailable().then(setSupported);
    load().catch(() => {});
  }, [load]);

  async function enable() {
    setBusy(true);
    const message = await turnOnBiometrics();
    setBusy(false);
    if (message === "cancelled") return;
    if (message) {
      toast(message, "error");
      return;
    }
    toast("Face or fingerprint sign-in is on");
    await load();
  }

  async function remove(device: PasskeyInfo) {
    setBusy(true);
    await removePasskey(device.id);
    setBusy(false);
    if (device.id === savedCredentialId()) saveCredentialId(null);
    if (devices.length <= 1) setPasskeyFlag(false);
    toast("Removed");
    await load();
  }

  return (
    <section id="biometrics" className="rounded-[24px] border border-line bg-card px-4 py-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red/10 text-red">{faceIcon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium">Face or fingerprint sign-in</p>
          <p className="text-xs text-muted">Sign in with your phone&apos;s own lock. Your face or fingerprint never leaves your phone.</p>
        </div>
      </div>

      {devices.length > 0 && (
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
          {devices.map((device) => (
            <li key={device.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm">{device.label}</p>
                <p className="text-xs text-muted">
                  Added {device.added}
                  {device.lastUsed ? ` · used ${device.lastUsed}` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(device)}
                className="hit shrink-0 text-xs text-danger disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {supported === false ? (
        <p className="mt-3 rounded-2xl bg-paper px-3 py-2.5 text-xs text-muted">
          This phone or browser can&apos;t do it. Make sure a screen lock (PIN, face or fingerprint) is set up on the phone.
        </p>
      ) : (
        <button
          type="button"
          disabled={busy || supported === null}
          onClick={enable}
          className="mt-3 w-full rounded-full bg-solid py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Waiting for your phone…" : devices.length > 0 ? "Add this phone" : "Turn on for this phone"}
        </button>
      )}
    </section>
  );
}

/** A small one-time offer on the home screen. */
export function BiometricNudge() {
  const toast = useToast();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(NUDGE_DISMISSED) === "1";
    } catch {
      /* storage can be blocked */
    }
    if (dismissed || hasPasskeyFlag()) return;
    biometricsAvailable().then(setShow);
  }, []);

  if (!show) return null;

  async function turnOn() {
    setBusy(true);
    const message = await turnOnBiometrics();
    setBusy(false);
    if (message === "cancelled") return;
    if (message) {
      toast(message, "error");
      return;
    }
    toast("Face or fingerprint sign-in is on");
    setShow(false);
  }

  function later() {
    try {
      localStorage.setItem(NUDGE_DISMISSED, "1");
    } catch {
      /* storage can be blocked */
    }
    setShow(false);
  }

  return (
    <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-line bg-card px-4 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red/10 text-red">{faceIcon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Sign in faster</p>
        <p className="text-xs text-muted">Use your face or fingerprint next time.</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <button
          type="button"
          onClick={turnOn}
          disabled={busy}
          className="rounded-full bg-solid px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
        >
          {busy ? "…" : "Turn on"}
        </button>
        <button type="button" onClick={later} className="hit text-[11px] text-muted">
          Not now
        </button>
      </div>
    </div>
  );
}
