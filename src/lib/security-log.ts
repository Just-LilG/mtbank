import { headers } from "next/headers";
import { pool } from "@/db/pool";
import { readSession } from "@/lib/session";

export type SecurityKind =
  | "signin"
  | "failed"
  | "password_changed"
  | "passkey_added"
  | "passkey_removed"
  | "branch_reset"
  | "card_lost";

export type SecurityEvent = { id: string; kind: SecurityKind; detail: string; at: string };

/** A friendly name for the device, from what the browser says it is. */
export async function deviceName() {
  const agent = ((await headers()).get("user-agent") ?? "").toLowerCase();
  if (agent.includes("iphone")) return "iPhone";
  if (agent.includes("ipad")) return "iPad";
  if (agent.includes("android")) return "Android phone";
  if (agent.includes("mac os")) return "Mac";
  if (agent.includes("windows")) return "Windows PC";
  return "Unknown device";
}

/**
 * Writes one line to the account's security history. It must never get in the way of the
 * thing it is recording, so any failure here is swallowed.
 */
export async function logSecurity(customerId: string, kind: SecurityKind, detail = "") {
  try {
    await pool.query("insert into security_events (customer_id, kind, detail) values ($1, $2, $3)", [
      customerId,
      kind,
      detail.slice(0, 120),
    ]);
    // Keep the newest 60 lines for each customer.
    await pool.query(
      `delete from security_events where customer_id = $1 and created_at < (
         select created_at from security_events where customer_id = $1 order by created_at desc offset 59 limit 1
       )`,
      [customerId],
    );
  } catch (error) {
    console.error("Could not write security history", error);
  }
}

export async function securityList(): Promise<SecurityEvent[]> {
  const session = await readSession();
  if (!session || session.role !== "customer") return [];
  const rows = await pool.query(
    "select id, kind, detail, created_at from security_events where customer_id = $1 order by created_at desc limit 20",
    [session.id],
  );
  return rows.rows.map((row) => ({
    id: String(row.id),
    kind: String(row.kind) as SecurityKind,
    detail: row.detail ? String(row.detail) : "",
    at: new Date(String(row.created_at)).toISOString(),
  }));
}
