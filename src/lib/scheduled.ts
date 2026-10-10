import { pool } from "@/db/pool";
import { digits } from "@/lib/passwords";
import { BAD_AMOUNT, cleanAmount, createSendRequest, num } from "@/lib/records";
import { readSession } from "@/lib/session";

export type Frequency = "once" | "weekly" | "monthly";
export type Schedule = {
  id: string;
  payeeName: string;
  payeeAccount: string;
  amount: number;
  note: string;
  frequency: Frequency;
  nextRun: string;
  active: boolean;
  lastStatus: string | null;
};
type Outcome = { error: string } | { ok: true };

const MAX_SCHEDULES = 10;
const FREQUENCIES: Frequency[] = ["once", "weekly", "monthly"];

async function me() {
  const session = await readSession();
  return session && session.role === "customer" ? session.id : null;
}

// ---- dates are plain YYYY-MM-DD strings, worked out in UTC ----------------
function addDays(day: string, count: number) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

/** The same day next month, or the last day of a shorter month. Never drifts earlier. */
function addMonth(day: string, anchor: number) {
  const [year, month] = day.split("-").map(Number);
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(anchor, last));
  return first.toISOString().slice(0, 10);
}

function following(day: string, frequency: Frequency, anchor: number) {
  return frequency === "weekly" ? addDays(day, 7) : addMonth(day, anchor);
}

// ---- what the customer does -----------------------------------------------
export async function scheduleList(): Promise<Schedule[]> {
  const id = await me();
  if (!id) return [];
  const rows = await pool.query(
    `select id, payee_name, payee_account, amount, note, frequency, active, last_status,
            to_char(next_run, 'YYYY-MM-DD') as next_run
       from scheduled_transfers where customer_id = $1 order by active desc, next_run`,
    [id],
  );
  return rows.rows.map((row) => ({
    id: String(row.id),
    payeeName: String(row.payee_name),
    payeeAccount: String(row.payee_account),
    amount: num(row.amount),
    note: String(row.note),
    frequency: String(row.frequency) as Frequency,
    nextRun: String(row.next_run),
    active: Boolean(row.active),
    lastStatus: row.last_status ? String(row.last_status) : null,
  }));
}

export async function scheduleCreate(input: {
  account: string;
  amount: number;
  note: string;
  frequency: Frequency;
  startDate: string;
}): Promise<Outcome> {
  const id = await me();
  if (!id) return { error: "Sign in first." };
  const value = cleanAmount(input.amount);
  if (value === null) return { error: BAD_AMOUNT };
  if (!FREQUENCIES.includes(input.frequency)) return { error: "Choose how often." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) return { error: "Choose a start date." };

  const clock = await pool.query("select to_char(current_date, 'YYYY-MM-DD') as today");
  const today: string = clock.rows[0].today;
  if (input.startDate <= today) return { error: "Choose a date after today. Schedules run in the morning." };
  if (input.startDate > addDays(today, 366)) return { error: "Choose a date within the next year." };

  const wanted = digits(input.account);
  if (wanted.length < 8) return { error: "Enter the full account number." };
  const target = await pool.query(
    "select name, account_number from customers where id <> $1 and regexp_replace(account_number, '\\D', '', 'g') = $2",
    [id, wanted],
  );
  if (!target.rows[0]) return { error: "No Ubex account matches that number." };

  const count = await pool.query("select count(*)::int as n from scheduled_transfers where customer_id = $1", [id]);
  if (count.rows[0].n >= MAX_SCHEDULES) return { error: `You can have up to ${MAX_SCHEDULES} scheduled transfers.` };

  await pool.query(
    `insert into scheduled_transfers (customer_id, payee_account, payee_name, amount, note, frequency, anchor_day, next_run)
     values ($1, $2, $3, $4, $5, $6, $7, $8::date)`,
    [
      id,
      digits(String(target.rows[0].account_number)),
      String(target.rows[0].name),
      value,
      input.note.trim().replace(/\s+/g, " ").slice(0, 60),
      input.frequency,
      Number(input.startDate.slice(8, 10)),
      input.startDate,
    ],
  );
  return { ok: true };
}

export async function scheduleSetActive(scheduleId: string, active: boolean): Promise<Outcome> {
  const id = await me();
  if (!id) return { error: "Sign in first." };
  if (active) {
    // Resuming picks the next date that is still ahead, so a paused weekly plan does not fire for old dates.
    const row = (
      await pool.query(
        "select frequency, anchor_day, to_char(next_run, 'YYYY-MM-DD') as next_run, to_char(current_date, 'YYYY-MM-DD') as today from scheduled_transfers where id = $1 and customer_id = $2",
        [scheduleId, id],
      )
    ).rows[0];
    if (!row) return { error: "We could not find that." };
    let next: string = row.next_run;
    if (row.frequency === "once") {
      if (next <= row.today) return { error: "That date has passed. Make a new one instead." };
    } else {
      while (next <= row.today) next = following(next, row.frequency, Number(row.anchor_day));
    }
    await pool.query("update scheduled_transfers set active = true, next_run = $3::date where id = $1 and customer_id = $2", [
      scheduleId,
      id,
      next,
    ]);
    return { ok: true };
  }
  await pool.query("update scheduled_transfers set active = false where id = $1 and customer_id = $2", [scheduleId, id]);
  return { ok: true };
}

export async function scheduleDelete(scheduleId: string): Promise<Outcome> {
  const id = await me();
  if (!id) return { error: "Sign in first." };
  await pool.query("delete from scheduled_transfers where id = $1 and customer_id = $2", [scheduleId, id]);
  return { ok: true };
}

// ---- the daily run (called by Vercel Cron) --------------------------------
/**
 * Turns every schedule that is due into an ordinary send request. It still waits for the branch to approve,
 * and every normal rule applies: frozen account, balance, daily limit.
 */
export async function runDueSchedules() {
  const due = await pool.query(
    `select id, customer_id, payee_account, amount, note, frequency, anchor_day,
            to_char(next_run, 'YYYY-MM-DD') as run_day, to_char(current_date, 'YYYY-MM-DD') as today
       from scheduled_transfers where active and next_run <= current_date order by next_run limit 200`,
  );
  let sent = 0;
  let skipped = 0;

  for (const row of due.rows) {
    const frequency = String(row.frequency) as Frequency;
    // Claim it first. If two runs overlap, only one of them gets the row.
    let claimed: { rowCount: number | null };
    if (frequency === "once") {
      claimed = await pool.query(
        "update scheduled_transfers set active = false, last_run = current_date where id = $1 and active and next_run = $2::date returning id",
        [row.id, row.run_day],
      );
    } else {
      // Skip any dates that were missed, so one outage never causes a burst of sends.
      let next = following(String(row.run_day), frequency, Number(row.anchor_day));
      while (next <= String(row.today)) next = following(next, frequency, Number(row.anchor_day));
      claimed = await pool.query(
        "update scheduled_transfers set next_run = $3::date, last_run = current_date where id = $1 and active and next_run = $2::date returning id",
        [row.id, row.run_day, next],
      );
    }
    if (!claimed.rowCount) continue;

    let problem: string;
    try {
      problem = await createSendRequest(
        String(row.customer_id),
        String(row.payee_account),
        num(row.amount),
        row.note ? `Scheduled · ${row.note}` : "Scheduled",
      );
    } catch (error) {
      console.error("Scheduled send failed", error);
      problem = "Something went wrong. We will try again next time.";
    }

    if (problem) {
      skipped += 1;
      await pool.query("update scheduled_transfers set last_status = $2 where id = $1", [row.id, `Skipped: ${problem}`.slice(0, 200)]);
      // The customer should see why it did not go.
      await pool.query(
        "insert into movements (id, customer_id, title, detail, amount) values (gen_random_uuid()::text, $1, 'Scheduled send skipped', $2, 0)",
        [row.customer_id, problem.slice(0, 160)],
      );
    } else {
      sent += 1;
      await pool.query("update scheduled_transfers set last_status = 'Sent for approval' where id = $1", [row.id]);
    }
  }
  return { due: due.rows.length, sent, skipped };
}
