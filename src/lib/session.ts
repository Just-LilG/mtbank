import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// The desk is a sensitive place: staff are signed out after 4 hours.
const STAFF_SECONDS = 60 * 60 * 4;
const CUSTOMER_SECONDS = 60 * 60 * 12;

export type Session = { role: "staff" | "customer"; id: string };

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is missing.");
  return value;
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export async function readSession(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get("ubex_session")?.value;
  if (!raw) return null;
  const [body, mac] = raw.split(".");
  if (!body || !mac) return null;
  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as Session & {
      exp: number;
    };
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    if (parsed.role !== "staff" && parsed.role !== "customer") return null;
    return { role: parsed.role, id: parsed.id };
  } catch {
    return null;
  }
}

export async function writeSession(session: Session) {
  const body = Buffer.from(
    JSON.stringify({ ...session, exp: Date.now() + 1000 * (session.role === "staff" ? STAFF_SECONDS : CUSTOMER_SECONDS) }),
  ).toString("base64url");
  const jar = await cookies();
  jar.set("ubex_session", `${body}.${sign(body)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: session.role === "staff" ? STAFF_SECONDS : CUSTOMER_SECONDS,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete("ubex_session");
}

// A passkey challenge lives for five minutes and can be used once.
const CHALLENGE_SECONDS = 60 * 5;

export async function writeChallenge(purpose: "register" | "login", challenge: string) {
  const body = Buffer.from(
    JSON.stringify({ c: challenge, p: purpose, exp: Date.now() + 1000 * CHALLENGE_SECONDS }),
  ).toString("base64url");
  const jar = await cookies();
  jar.set("ubex_challenge", `${body}.${sign(body)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CHALLENGE_SECONDS,
  });
}

/** Returns the challenge once, then forgets it, so a captured response cannot be replayed. */
export async function takeChallenge(purpose: "register" | "login"): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get("ubex_challenge")?.value;
  jar.delete("ubex_challenge");
  if (!raw) return null;
  const [body, mac] = raw.split(".");
  if (!body || !mac) return null;
  const a = Buffer.from(mac);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as { c: string; p: string; exp: number };
    if (parsed.p !== purpose || !parsed.exp || parsed.exp < Date.now()) return null;
    return parsed.c;
  } catch {
    return null;
  }
}
