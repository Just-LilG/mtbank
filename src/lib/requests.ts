import { randomBytes } from "node:crypto";
import { pool } from "@/db/pool";
import { digits } from "@/lib/passwords";
import { BAD_AMOUNT, cleanAmount, num } from "@/lib/records";
import { readSession } from "@/lib/session";

export type MoneyRequest = { id: string; token: string; amount: number | null; note: string; expires: string };
export type RequestCard = { name: string; account: string; amount: number | null; note: string };

const MAX_OPEN = 20;
const LIFETIME_DAYS = 7;

async function me() {
  const session = await readSession();
  return session && session.role === "customer" ? session.id : null;
}

/** amount is optional: leave it out and the payer chooses how much. */
export async function requestCreate(
  amount: number | null,
  note: string,
): Promise<{ error: string } | { token: string }> {
  const id = await me();
  if (!id) return { error: "Sign in first." };
  let value: number | null = null;
  if (amount !== null) {
    value = cleanAmount(amount);
    if (value === null) return { error: BAD_AMOUNT };
  }
  const open = await pool.query(
    "select count(*)::int as n from payment_requests where customer_id = $1 and cancelled_at is null and expires_at > now()",
    [id],
  );
  if (open.rows[0].n >= MAX_OPEN) return { error: "You have a lot of open requests. Cancel some first." };
  const token = randomBytes(16).toString("base64url");
  await pool.query(
    `insert into payment_requests (token, customer_id, amount, note, expires_at)
     values ($1, $2, $3, $4, now() + ($5 || ' days')::interval)`,
    [token, id, value, note.trim().replace(/\s+/g, " ").slice(0, 80), String(LIFETIME_DAYS)],
  );
  return { token };
}

export async function requestList(): Promise<MoneyRequest[]> {
  const id = await me();
  if (!id) return [];
  const rows = await pool.query(
    `select id, token, amount, note, expires_at from payment_requests
     where customer_id = $1 and cancelled_at is null and expires_at > now() order by created_at desc`,
    [id],
  );
  return rows.rows.map((row) => ({
    id: String(row.id),
    token: String(row.token),
    amount: row.amount === null ? null : num(row.amount),
    note: String(row.note),
    expires: new Date(String(row.expires_at)).toISOString(),
  }));
}

export async function requestCancel(requestId: string): Promise<{ ok: true }> {
  const id = await me();
  if (id) {
    await pool.query("update payment_requests set cancelled_at = now() where id = $1 and customer_id = $2", [requestId, id]);
  }
  return { ok: true };
}

/**
 * Anyone with the link can see who is asking and for how much. The link is the secret, so it is long and random.
 * It shows a name and an account number, which is what the owner chose to hand out.
 */
export async function requestLookup(token: string): Promise<RequestCard | null> {
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(token)) return null;
  const rows = await pool.query(
    `select r.amount, r.note, c.name, c.account_number
       from payment_requests r join customers c on c.id = r.customer_id
      where r.token = $1 and r.cancelled_at is null and r.expires_at > now()`,
    [token],
  );
  const row = rows.rows[0];
  if (!row) return null;
  return {
    name: String(row.name),
    account: digits(String(row.account_number)),
    amount: row.amount === null ? null : num(row.amount),
    note: String(row.note),
  };
}
