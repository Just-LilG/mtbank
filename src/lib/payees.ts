import { pool } from "@/db/pool";
import { digits } from "@/lib/passwords";
import { readSession } from "@/lib/session";

export type Payee = { id: string; account: string; name: string; nickname: string };

const MAX_PAYEES = 20;

async function me() {
  const session = await readSession();
  return session && session.role === "customer" ? session.id : null;
}

export async function payeeList(): Promise<Payee[]> {
  const id = await me();
  if (!id) return [];
  const rows = await pool.query(
    "select id, account, name, nickname from payees where customer_id = $1 order by lower(nickname)",
    [id],
  );
  return rows.rows.map((row) => ({
    id: String(row.id),
    account: String(row.account),
    name: String(row.name),
    nickname: String(row.nickname),
  }));
}

export async function payeeSave(account: string, nickname: string): Promise<{ error: string } | { ok: true }> {
  const id = await me();
  if (!id) return { error: "Sign in first." };
  const nick = nickname.trim().replace(/\s+/g, " ").slice(0, 30);
  if (!nick) return { error: "Give this payee a short name." };
  const wanted = digits(account);
  if (wanted.length < 4) return { error: "Enter the account number first." };

  const found = await pool.query(
    "select name, account_number from customers where id <> $1 and regexp_replace(account_number, '\\D', '', 'g') = $2",
    [id, wanted],
  );
  const target = found.rows[0];
  if (!target) return { error: "No Ubex account matches that number." };
  const clean = digits(String(target.account_number));

  const count = await pool.query("select count(*)::int as n from payees where customer_id = $1", [id]);
  const exists = await pool.query("select 1 from payees where customer_id = $1 and account = $2", [id, clean]);
  if (count.rows[0].n >= MAX_PAYEES && exists.rows.length === 0) {
    return { error: `You can save up to ${MAX_PAYEES} payees. Remove one first.` };
  }
  await pool.query(
    `insert into payees (customer_id, account, name, nickname) values ($1, $2, $3, $4)
     on conflict (customer_id, account) do update set nickname = excluded.nickname, name = excluded.name`,
    [id, clean, String(target.name), nick],
  );
  return { ok: true };
}

export async function payeeRemove(payeeId: string): Promise<{ ok: true }> {
  const id = await me();
  if (id) await pool.query("delete from payees where id = $1 and customer_id = $2", [payeeId, id]);
  return { ok: true };
}
