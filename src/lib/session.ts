import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

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
    JSON.stringify({ ...session, exp: Date.now() + 1000 * 60 * 60 * 12 }),
  ).toString("base64url");
  const jar = await cookies();
  jar.set("ubex_session", `${body}.${sign(body)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete("ubex_session");
}
