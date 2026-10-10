import { pool } from "@/db/pool";
import { BAD_AMOUNT, cents, cleanAmount, num, withTx } from "@/lib/records";
import { readSession } from "@/lib/session";

export type Goal = { id: string; name: string; target: number; saved: number; done: boolean };
export type GoalsView = { goals: Goal[]; free: number };
type Outcome = { error: string } | { ok: true };

const MAX_GOALS = 10;
const dollars = (value: number) => `$${value.toFixed(2)}`;

async function me() {
  const session = await readSession();
  return session && session.role === "customer" ? session.id : null;
}

/**
 * A goal sets part of your savings aside. No money moves: the savings balance stays one number,
 * and goals only say which part of it is spoken for.
 */
export async function goalsView(): Promise<GoalsView> {
  const id = await me();
  if (!id) return { goals: [], free: 0 };
  const [rows, customer] = await Promise.all([
    pool.query("select id, name, target, saved, completed_at from goals where customer_id = $1 order by created_at", [id]),
    pool.query("select savings from customers where id = $1", [id]),
  ]);
  const goals: Goal[] = rows.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    target: num(row.target),
    saved: num(row.saved),
    done: Boolean(row.completed_at),
  }));
  const setAside = goals.reduce((sum, goal) => sum + cents(goal.saved), 0);
  return { goals, free: Math.max(0, cents(customer.rows[0]?.savings) - setAside) / 100 };
}

export async function goalCreate(name: string, target: number): Promise<Outcome> {
  const id = await me();
  if (!id) return { error: "Sign in first." };
  const clean = name.trim().replace(/\s+/g, " ").slice(0, 40);
  if (!clean) return { error: "Give the goal a name." };
  const value = cleanAmount(target);
  if (value === null) return { error: BAD_AMOUNT };
  const count = await pool.query("select count(*)::int as n from goals where customer_id = $1", [id]);
  if (count.rows[0].n >= MAX_GOALS) return { error: `You can have up to ${MAX_GOALS} goals.` };
  await pool.query("insert into goals (customer_id, name, target) values ($1, $2, $3)", [id, clean, value]);
  return { ok: true };
}

export async function goalChange(goalId: string, amount: number, direction: "add" | "take"): Promise<Outcome> {
  const id = await me();
  if (!id) return { error: "Sign in first." };
  const value = cleanAmount(amount);
  if (value === null) return { error: BAD_AMOUNT };
  return withTx(async (client): Promise<Outcome> => {
    // Locking the customer row means two taps cannot both spend the same free savings.
    const owner = await client.query("select savings from customers where id = $1 for update", [id]);
    const goal = (await client.query("select * from goals where id = $1 and customer_id = $2 for update", [goalId, id])).rows[0];
    if (!owner.rows[0] || !goal) return { error: "We could not find that goal." };
    const saved = cents(goal.saved);
    const target = cents(goal.target);

    if (direction === "add") {
      const all = await client.query("select coalesce(sum(saved), 0) as set_aside from goals where customer_id = $1", [id]);
      const free = cents(owner.rows[0].savings) - cents(all.rows[0].set_aside);
      if (cents(value) > free) {
        return { error: `You only have ${dollars(Math.max(free, 0) / 100)} free in savings. Move money into savings first.` };
      }
      if (cents(value) > target - saved) {
        return { error: `This goal only needs ${dollars((target - saved) / 100)} more.` };
      }
      const reached = saved + cents(value) >= target;
      await client.query(
        "update goals set saved = saved + $1, completed_at = case when $3 then coalesce(completed_at, now()) else completed_at end where id = $2",
        [value, goalId, reached],
      );
    } else {
      if (cents(value) > saved) return { error: `Only ${dollars(saved / 100)} is set aside for this goal.` };
      await client.query("update goals set saved = saved - $1, completed_at = null where id = $2", [value, goalId]);
    }
    return { ok: true };
  });
}

export async function goalDelete(goalId: string): Promise<Outcome> {
  const id = await me();
  if (!id) return { error: "Sign in first." };
  // The money stays in savings; it just stops being set aside.
  await pool.query("delete from goals where id = $1 and customer_id = $2", [goalId, id]);
  return { ok: true };
}
