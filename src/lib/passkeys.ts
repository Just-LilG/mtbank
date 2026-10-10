import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { headers } from "next/headers";
import { pool } from "@/db/pool";
import { callerIp, LOCKED, lockedOut, noteFailure } from "@/lib/records";
import { deviceName, logSecurity } from "@/lib/security-log";
import { readSession, takeChallenge, writeChallenge, writeSession } from "@/lib/session";

const MAX_PER_CUSTOMER = 5;
const FAILED = "We could not confirm it was you. Sign in with your password instead.";

export type PasskeyInfo = { id: string; label: string; added: string; lastUsed: string | null };

/** Where the app lives. Passkeys only work on the exact site they were made on. */
async function site() {
  const fixed = process.env.APP_ORIGIN;
  if (fixed) {
    const url = new URL(fixed);
    return { origin: url.origin, rpID: url.hostname };
  }
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost";
  const local = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const proto = list.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return { origin: `${proto}://${host}`, rpID: host.split(":")[0] };
}

const deviceLabel = deviceName;

const toText = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url");
const toBytes = (text: string) => new Uint8Array(Buffer.from(text, "base64url"));

function formatDate(value: unknown) {
  return new Date(String(value)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---- turning it on (customer is already signed in) ----------------------

export async function passkeyRegisterOptions() {
  const session = await readSession();
  if (!session || session.role !== "customer") return { error: "Sign in first." };
  const customer = await pool.query("select id, name, account_number from customers where id = $1", [session.id]);
  const row = customer.rows[0];
  if (!row) return { error: "We could not find your account." };
  const existing = await pool.query("select id, transports from passkeys where customer_id = $1", [session.id]);
  if (existing.rows.length >= MAX_PER_CUSTOMER) {
    return { error: "You have reached the limit of 5 devices. Remove one first." };
  }
  const { rpID } = await site();
  const options = await generateRegistrationOptions({
    rpName: "Ubex Bank",
    rpID,
    userName: String(row.account_number).replace(/\D/g, ""),
    userDisplayName: String(row.name),
    userID: new Uint8Array(Buffer.from(String(row.id))),
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required",
    },
    excludeCredentials: existing.rows.map((item) => ({
      id: String(item.id),
      transports: item.transports ? (String(item.transports).split(",") as AuthenticatorTransportFuture[]) : undefined,
    })),
  });
  await writeChallenge("register", options.challenge);
  return { options };
}

export async function passkeyRegisterVerify(response: RegistrationResponseJSON) {
  const session = await readSession();
  if (!session || session.role !== "customer") return { error: "Sign in first." };
  const challenge = await takeChallenge("register");
  if (!challenge) return { error: "That took too long. Please try again." };
  const { origin, rpID } = await site();
  try {
    const result = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
    if (!result.verified) return { error: "We could not confirm that. Please try again." };
    const { credential } = result.registrationInfo;
    await pool.query(
      `insert into passkeys (id, customer_id, public_key, counter, transports, label)
       values ($1, $2, $3, $4, $5, $6) on conflict (id) do nothing`,
      [
        credential.id,
        session.id,
        toText(credential.publicKey),
        credential.counter,
        (credential.transports ?? []).join(","),
        await deviceLabel(),
      ],
    );
    await logSecurity(session.id, "passkey_added", await deviceName());
    return { ok: true as const };
  } catch (error) {
    console.error("Passkey registration failed", error);
    return { error: "We could not turn that on. Please try again." };
  }
}

// ---- signing in with it --------------------------------------------------

/**
 * If this phone remembers which passkey is its own, ask for just that one.
 * Android can then skip its "which passkey?" step and go straight to face or fingerprint.
 */
export async function passkeyLoginOptions(credentialId?: string) {
  const { rpID } = await site();
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: credentialId ? [{ id: credentialId, transports: ["internal"] }] : undefined,
  });
  await writeChallenge("login", options.challenge);
  return { options };
}

export async function passkeyLoginVerify(response: AuthenticationResponseJSON) {
  const keys = [`ip:${await callerIp()}`];
  if (await lockedOut(keys)) return { error: LOCKED };
  const challenge = await takeChallenge("login");
  if (!challenge) return { error: "That took too long. Please try again." };

  const found = await pool.query("select * from passkeys where id = $1", [response.id]);
  const saved = found.rows[0];
  if (!saved) {
    await noteFailure(keys);
    return { error: FAILED };
  }
  const { origin, rpID } = await site();
  try {
    const result = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: String(saved.id),
        publicKey: toBytes(String(saved.public_key)),
        counter: Number(saved.counter),
        transports: saved.transports ? (String(saved.transports).split(",") as AuthenticatorTransportFuture[]) : undefined,
      },
    });
    if (!result.verified) {
      await noteFailure(keys);
      return { error: FAILED };
    }
    await pool.query("update passkeys set counter = $2, last_used_at = now() where id = $1", [
      saved.id,
      result.authenticationInfo.newCounter,
    ]);
    await writeSession({ role: "customer", id: String(saved.customer_id) });
    await logSecurity(String(saved.customer_id), "signin", `Face or fingerprint · ${await deviceName()}`);
    return { ok: true as const };
  } catch (error) {
    console.error("Passkey sign-in failed", error);
    await noteFailure(keys);
    return { error: FAILED };
  }
}

// ---- managing devices ----------------------------------------------------

export async function passkeyList(): Promise<PasskeyInfo[]> {
  const session = await readSession();
  if (!session || session.role !== "customer") return [];
  const rows = await pool.query(
    "select id, label, created_at, last_used_at from passkeys where customer_id = $1 order by created_at",
    [session.id],
  );
  return rows.rows.map((row) => ({
    id: String(row.id),
    label: String(row.label),
    added: formatDate(row.created_at),
    lastUsed: row.last_used_at ? formatDate(row.last_used_at) : null,
  }));
}

export async function passkeyRemove(id: string) {
  const session = await readSession();
  if (!session || session.role !== "customer") return { error: "Sign in first." };
  const removed = await pool.query("delete from passkeys where id = $1 and customer_id = $2", [id, session.id]);
  if (removed.rowCount) await logSecurity(session.id, "passkey_removed", await deviceName());
  return { ok: true as const };
}
