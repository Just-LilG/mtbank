import { randomInt } from "crypto";
import { headers } from "next/headers";
import type { PoolClient } from "pg";
import { pool } from "@/db/pool";
import type { BankCard, Customer, JournalLine, Review } from "@/lib/books";
import { dollars } from "@/lib/books";
import {
  checkPassword,
  digits,
  hashPassword,
  makeAccountNumber,
  makePassword,
} from "@/lib/passwords";
import { deviceName, logSecurity } from "@/lib/security-log";
import { clearSession, readSession, writeSession } from "@/lib/session";

type Row = Record<string, unknown>;

export function num(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const MAX_AMOUNT = 10_000_000;
export const BAD_AMOUNT = "Enter an amount above zero with at most two decimal places.";

/** Money is compared in whole cents so floating point can never decide a close call. */
export const cents = (value: unknown) => Math.round(num(value) * 100);

/** Returns the amount if it is positive money with at most two decimals, else null. */
export function cleanAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0 || value > MAX_AMOUNT) return null;
  const whole = Math.round(value * 100);
  if (Math.abs(whole - value * 100) > 1e-6) return null;
  return whole / 100;
}

function when(value: unknown) {
  return new Date(String(value)).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function customerFrom(
  row: Row,
  cards: BankCard[],
  movements: Customer["movements"],
  recentPayees: Customer["recentPayees"] = [],
): Customer {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    nationalId: String(row.national_id ?? ""),
    address: String(row.address ?? ""),
    account: String(row.account_number),
    balance: num(row.balance),
    savings: num(row.savings),
    status: row.status === "Frozen" ? "Frozen" : "Open",
    opened: new Date(String(row.opened_at)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    dailyLimit: num(row.daily_limit),
    cards,
    movements,
    recentPayees,
  };
}

async function loadCustomers(client: PoolClient | typeof pool = pool, onlyId?: string) {
  const people = onlyId
    ? await client.query("select * from customers where id = $1", [onlyId])
    : await client.query("select * from customers order by opened_at desc");
  const cardRows = onlyId
    ? await client.query("select * from cards where customer_id = $1 order by id", [onlyId])
    : await client.query("select * from cards order by id");
  const moveRows = onlyId
    ? await client.query(
        "select * from movements where customer_id = $1 order by created_at desc",
        [onlyId],
      )
    : await client.query("select * from movements order by created_at desc");
  // People this customer has sent money to before, newest first.
  const payeeRows = onlyId
    ? await client.query(
        `select r.customer_id, r.payee_id, c.name, c.account_number, max(r.created_at) as last
         from reviews r join customers c on c.id = r.payee_id
         where r.customer_id = $1
         group by r.customer_id, r.payee_id, c.name, c.account_number
         order by last desc`,
        [onlyId],
      )
    : await client.query(
        `select r.customer_id, r.payee_id, c.name, c.account_number, max(r.created_at) as last
         from reviews r join customers c on c.id = r.payee_id
         where r.payee_id is not null
         group by r.customer_id, r.payee_id, c.name, c.account_number
         order by last desc`,
      );
  return people.rows.map((row: Row) => {
    const recentPayees = payeeRows.rows
      .filter((payee: Row) => payee.customer_id === row.id && payee.payee_id)
      .slice(0, 6)
      .map((payee: Row) => ({
        id: String(payee.payee_id),
        name: String(payee.name),
        account: String(payee.account_number),
      }));
    const cards: BankCard[] = cardRows.rows
      .filter((card: Row) => card.customer_id === row.id)
      .map((card: Row) => ({
        id: String(card.id),
        last4: String(card.last4),
        expires: String(card.expires),
        status: card.status as BankCard["status"],
      }));
    const movements = moveRows.rows
      .filter((move: Row) => move.customer_id === row.id)
      .map((move: Row) => ({
        id: String(move.id),
        title: String(move.title),
        detail: String(move.detail),
        amount: num(move.amount),
        when: when(move.created_at),
        at: new Date(String(move.created_at)).toISOString(),
        reviewId: move.review_id ? String(move.review_id) : null,
      }));
    return customerFrom(row, cards, movements, recentPayees);
  });
}

function newId() {
  return crypto.randomUUID();
}

export async function withTx<T>(run: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await run(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function addJournal(client: PoolClient | typeof pool, text: string, amount?: number) {
  // Record which staff member did it, so the ledger can answer "who?".
  let actor: string | null = null;
  const session = await readSession();
  if (session?.role === "staff") {
    const found = await client.query("select email from staff where id = $1", [session.id]);
    actor = found.rows[0] ? String(found.rows[0].email) : null;
  }
  await client.query("insert into journal (id, body, amount, actor) values ($1, $2, $3, $4)", [
    newId(),
    text,
    amount ?? null,
    actor,
  ]);
}

// ---- sign-in throttling -------------------------------------------------
export const LOCKED = "Too many wrong tries. Wait 15 minutes, then try again, or ask the branch for help.";
let dummyHash: string | undefined;

export async function callerIp() {
  try {
    const list = await headers();
    return (list.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  } catch {
    return "unknown";
  }
}

export async function lockedOut(keys: string[]) {
  try {
    const result = await pool.query(
      `select key, count(*)::int as n from login_attempts
       where key = any($1) and at > now() - interval '15 minutes' group by key`,
      [keys],
    );
    return (result.rows as Row[]).some(
      (row) => num(row.n) >= (String(row.key).startsWith("ip:") ? 30 : 5),
    );
  } catch (error) {
    console.error("Sign-in throttle unavailable", error);
    return false;
  }
}

export async function noteFailure(keys: string[]) {
  try {
    await pool.query("insert into login_attempts (key) select unnest($1::text[])", [keys]);
    await pool.query("delete from login_attempts where at < now() - interval '1 day'");
  } catch (error) {
    console.error("Could not record a failed sign-in", error);
  }
}

async function clearFailures(key: string) {
  try {
    await pool.query("delete from login_attempts where key = $1", [key]);
  } catch {
    /* nothing to do */
  }
}

/** Unknown accounts take as long to reject as real ones, so timing gives nothing away. */
function burnTime(password: string) {
  dummyHash ??= hashPassword("not-a-real-password");
  checkPassword(password, dummyHash);
}

async function addMove(
  client: PoolClient,
  customerId: string,
  title: string,
  detail: string,
  amount: number,
  reviewId?: string,
) {
  await client.query(
    "insert into movements (id, customer_id, title, detail, amount, review_id) values ($1, $2, $3, $4, $5, $6)",
    [newId(), customerId, title, detail, amount, reviewId ?? null],
  );
}

export async function snapshot() {
  const session = await readSession();
  const staffCount = await pool.query("select count(*)::int as count from staff");
  const hasStaff = staffCount.rows[0].count > 0;
  if (!session) {
    return { role: null, hasStaff, me: null, customers: [], reviews: [], journal: [] };
  }
  if (session.role === "customer") {
    const customers = await loadCustomers(pool, session.id);
    return {
      role: "customer" as const,
      hasStaff,
      me: customers[0] ?? null,
      customers: [],
      reviews: [],
      journal: [],
    };
  }
  const [customers, reviewRows, journalRows] = await Promise.all([
    loadCustomers(),
    pool.query(
      `select r.*, p.name as payee_name
       from reviews r
       left join customers p on p.id = r.payee_id
       order by r.created_at desc`,
    ),
    pool.query("select * from journal order by created_at desc limit 40"),
  ]);
  const reviews: Review[] = reviewRows.rows.map((row: Row) => ({
    id: String(row.id),
    customerId: String(row.customer_id),
    amount: num(row.amount),
    reason: String(row.reason),
    decision: row.decision as Review["decision"],
    payeeId: row.payee_id ? String(row.payee_id) : null,
    payeeName: row.payee_name ? String(row.payee_name) : null,
    cancelled: Boolean(row.cancelled),
    at: new Date(String(row.created_at)).toISOString(),
  }));
  const journal: JournalLine[] = journalRows.rows.map((row: Row) => ({
    id: String(row.id),
    when: when(row.created_at),
    at: new Date(String(row.created_at)).toISOString(),
    text: String(row.body),
    amount: row.amount == null ? undefined : num(row.amount),
    actor: row.actor ? String(row.actor) : undefined,
  }));
  return { role: "staff" as const, hasStaff, me: null, customers, reviews, journal };
}

export async function createFirstStaff(email: string, password: string) {
  const count = await pool.query("select count(*)::int as count from staff");
  if (count.rows[0].count > 0) return "The branch login already exists.";
  if (!email.trim() || password.length < 10) {
    return "Use an email and a password of at least 10 characters.";
  }
  const id = newId();
  await pool.query("insert into staff (id, email, password_hash) values ($1, $2, $3)", [
    id,
    email.trim().toLowerCase(),
    hashPassword(password),
  ]);
  await writeSession({ role: "staff", id });
  return "";
}

export async function staffSignIn(email: string, password: string) {
  const clean = email.trim().toLowerCase();
  const keys = [`staff:${clean}`, `ip:${await callerIp()}`];
  if (await lockedOut(keys)) return LOCKED;
  const found = await pool.query("select * from staff where email = $1", [clean]);
  const row = found.rows[0] as Row | undefined;
  if (!row) burnTime(password);
  if (!row || !checkPassword(password, String(row.password_hash))) {
    await noteFailure(keys);
    return "That staff email or password is wrong.";
  }
  await clearFailures(keys[0]);
  await writeSession({ role: "staff", id: String(row.id) });
  return "";
}

export async function customerSignIn(account: string, password: string) {
  const keys = [`cust:${digits(account)}`, `ip:${await callerIp()}`];
  if (await lockedOut(keys)) return LOCKED;
  const found = await pool.query(
    "select * from customers where regexp_replace(account_number, '\\D', '', 'g') = $1",
    [digits(account)],
  );
  const row = found.rows[0] as Row | undefined;
  if (!row) burnTime(password);
  if (!row || !checkPassword(password, String(row.password_hash))) {
    await noteFailure(keys);
    // The real owner should be able to see that someone tried their account.
    if (row) await logSecurity(String(row.id), "failed", `Wrong password · ${await deviceName()}`);
    return "That account number or password is wrong. Ask the branch if you do not have one yet.";
  }
  await clearFailures(keys[0]);
  await writeSession({ role: "customer", id: String(row.id) });
  await logSecurity(String(row.id), "signin", `Password · ${await deviceName()}`);
  return "";
}

const WRONG_LOGIN =
  "That account number, email or password is wrong. Ask the branch if you do not have one yet.";

/**
 * One front door for everyone. An email means branch staff, digits mean a customer.
 * The failure message is the same for both, so it never hints at who works at the branch.
 */
export async function signInAnyone(
  identifier: string,
  password: string,
): Promise<{ error: string } | { role: "staff" | "customer" }> {
  const who = identifier.trim();
  if (!who || !password) return { error: WRONG_LOGIN };
  const staff = who.includes("@");
  const error = staff ? await staffSignIn(who, password) : await customerSignIn(who, password);
  if (error) return { error: error === LOCKED ? LOCKED : WRONG_LOGIN };
  return { role: staff ? "staff" : "customer" };
}

export async function signOut() {
  await clearSession();
}

async function requireStaff() {
  const session = await readSession();
  if (session?.role !== "staff") throw new Error("Staff sign-in required.");
  return session;
}

export async function openAccount(input: {
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  address: string;
  opening: number;
  pot: "everyday" | "savings";
}) {
  await requireStaff();
  const name = input.name.trim();
  if (!name) return { error: "Enter the customer's name." };
  const opening = input.opening === 0 ? 0 : cleanAmount(input.opening);
  if (opening === null) return { error: BAD_AMOUNT };
  const password = makePassword();
  let account = makeAccountNumber();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const taken = await pool.query("select 1 from customers where account_number = $1", [
      account,
    ]);
    if (taken.rowCount === 0) break;
    account = makeAccountNumber();
  }
  const id = newId();
  await withTx(async (client) => {
    await client.query(
      `insert into customers
        (id, name, phone, national_id, address, email, account_number, password_hash, balance, savings)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        name,
        input.phone.trim(),
        input.nationalId.trim(),
        input.address.trim(),
        input.email.trim().toLowerCase(),
        account,
        hashPassword(password),
        input.pot === "everyday" ? opening : 0,
        input.pot === "savings" ? opening : 0,
      ],
    );
    if (opening > 0) {
      await addMove(client, id, "Opening cash", "Branch counter", opening);
    }
    await addJournal(client, `Opened account ${account} for ${name}`, opening || undefined);
  });
  return { id, accountNumber: account, password };
}

export async function deposit(
  id: string,
  amount: number,
  pot: "everyday" | "savings",
  note: string,
) {
  await requireStaff();
  const value = cleanAmount(amount);
  if (value === null) return BAD_AMOUNT;
  const person = await pool.query("select name from customers where id = $1", [id]);
  if (!person.rows[0]) return "Customer not found.";
  const column = pot === "savings" ? "savings" : "balance";
  const title = pot === "savings" ? "Savings deposit" : "Deposit";
  await withTx(async (client) => {
    await client.query(`update customers set ${column} = ${column} + $1 where id = $2`, [
      value,
      id,
    ]);
    await addMove(client, id, title, note.trim() || "Branch counter", value);
    await addJournal(client, `Deposit into ${person.rows[0].name} · ${pot}`, value);
  });
  return "";
}

export async function withdraw(id: string, amount: number, note: string) {
  await requireStaff();
  const value = cleanAmount(amount);
  if (value === null) return BAD_AMOUNT;
  return withTx(async (client) => {
    const found = await client.query("select * from customers where id = $1 for update", [id]);
    const row = found.rows[0] as Row | undefined;
    if (!row) return "Customer not found.";
    if (row.status === "Frozen") return "This account is frozen. Cash cannot leave.";
    const waiting = await client.query(
      "select coalesce(sum(amount), 0) as held from reviews where customer_id = $1 and decision = 'waiting'",
      [id],
    );
    if (cents(row.balance) - cents(waiting.rows[0].held) < cents(value)) {
      return "Not enough free money in the everyday account (some may be set aside for waiting sends).";
    }
    await client.query("update customers set balance = balance - $1 where id = $2", [value, id]);
    await addMove(client, id, "Withdrawal", note.trim() || "Branch counter", -value);
    await addJournal(client, `Withdrawal for ${row.name}`, value);
    return "";
  });
}

export async function moveBetweenPots(
  customerId: string,
  direction: "toSavings" | "toEveryday",
  amount: number,
) {
  const session = await readSession();
  if (!session) return "Sign in first.";
  if (session.role === "customer" && session.id !== customerId) {
    return "You can only move your own money.";
  }
  const value = cleanAmount(amount);
  if (value === null) return BAD_AMOUNT;
  return withTx(async (client) => {
    const found = await client.query("select * from customers where id = $1 for update", [
      customerId,
    ]);
    const row = found.rows[0] as Row | undefined;
    if (!row) return "Customer not found.";
    if (row.status === "Frozen") return "This account is frozen. Money cannot move between pots.";
    const fromCol = direction === "toSavings" ? "balance" : "savings";
    const toCol = direction === "toSavings" ? "savings" : "balance";
    let free = cents(row[fromCol]);
    let setAside = 0;
    if (fromCol === "savings") {
      // Money promised to a savings goal is not free to move out.
      const goals = await client.query(
        "select coalesce(sum(saved), 0) as set_aside from goals where customer_id = $1",
        [customerId],
      );
      setAside = cents(goals.rows[0].set_aside);
      free -= setAside;
    }
    if (fromCol === "balance") {
      const waiting = await client.query(
        "select coalesce(sum(amount), 0) as held from reviews where customer_id = $1 and decision = 'waiting'",
        [customerId],
      );
      free -= cents(waiting.rows[0].held);
    }
    if (free < cents(value)) {
      return direction === "toSavings"
        ? "Not enough free money in the everyday account (some may be set aside for waiting sends)."
        : setAside > 0
          ? `Some of your savings is set aside for goals. Take it out of a goal first. You can move ${dollars(Math.max(free, 0) / 100)} right now.`
          : "Not enough in savings.";
    }
    await client.query(
      `update customers set ${fromCol} = ${fromCol} - $1, ${toCol} = ${toCol} + $1 where id = $2`,
      [value, customerId],
    );
    await addMove(
      client,
      customerId,
      direction === "toSavings" ? "To savings" : "To everyday",
      direction === "toSavings" ? "Moved from everyday" : "Moved from savings",
      -value,
    );
    await addMove(
      client,
      customerId,
      direction === "toSavings" ? "From everyday" : "From savings",
      "Between your own pots",
      value,
    );
    await addJournal(
      client,
      `${row.name} moved ${value.toFixed(2)} ${direction === "toSavings" ? "to savings" : "to everyday"}`,
      value,
    );
    return "";
  });
}

export async function lookupRecipient(fromId: string, to: string) {
  const session = await readSession();
  if (!session) return null;
  const needle = digits(to);
  if (needle.length < 4) return null;
  const result = await pool.query("select id, name, account_number from customers where id <> $1", [
    fromId,
  ]);
  const row = (result.rows as Row[]).find(
    (item) => digits(String(item.account_number)) === needle,
  );
  if (!row) return null;
  return { name: String(row.name) };
}

export async function reviewStatus(customerId: string, reviewId: string) {
  const session = await readSession();
  if (!session) return null;
  if (session.role === "customer" && session.id !== customerId) return null;
  const result = await pool.query(
    `select r.decision, r.cancelled, r.amount, r.created_at, p.name as payee_name
     from reviews r
     left join customers p on p.id = r.payee_id
     where r.id = $1 and r.customer_id = $2`,
    [reviewId, customerId],
  );
  const row = result.rows[0] as Row | undefined;
  if (!row) return null;
  return {
    decision: row.decision as "waiting" | "approved" | "declined",
    amount: num(row.amount),
    when: when(row.created_at),
    at: new Date(String(row.created_at)).toISOString(),
    payeeName: row.payee_name ? String(row.payee_name) : null,
    cancelled: Boolean(row.cancelled),
  };
}

/** A customer taking back a send the branch has not decided on yet. */
export async function cancelOwnSend(reviewId: string) {
  const session = await readSession();
  if (!session || session.role !== "customer") return "Sign in first.";
  return withTx(async (client) => {
    const found = await client.query("select * from reviews where id = $1 and customer_id = $2 for update", [
      reviewId,
      session.id,
    ]);
    const review = found.rows[0] as Row | undefined;
    if (!review) return "We could not find that send.";
    if (review.decision !== "waiting") return "Too late. The branch has already decided on this one.";

    const people = await client.query("select name from customers where id = $1", [session.id]);
    const payee = review.payee_id
      ? (await client.query("select name from customers where id = $1", [review.payee_id])).rows[0]
      : null;
    await client.query("update reviews set decision = 'declined', cancelled = true where id = $1", [reviewId]);
    await addMove(
      client,
      session.id,
      "Send cancelled",
      `${dollars(num(review.amount))}${payee ? ` to ${String(payee.name).split(" ")[0]}` : ""} · you cancelled it`,
      0,
    );
    await addJournal(
      client,
      `${people.rows[0]?.name ?? "A customer"} cancelled their send of ${num(review.amount).toFixed(2)}`,
      num(review.amount),
    );
    return "";
  });
}

/** Lost or stolen. Blocks the card for good; only the branch can turn it back on or replace it. */
export async function reportLostCard(cardId: string) {
  const session = await readSession();
  if (!session || session.role !== "customer") return "Sign in first.";
  const found = await pool.query(
    "select cards.last4, customers.name from cards join customers on customers.id = cards.customer_id where cards.id = $1 and cards.customer_id = $2",
    [cardId, session.id],
  );
  const row = found.rows[0] as Row | undefined;
  if (!row) return "Card not found.";
  await withTx(async (client) => {
    await client.query("update cards set status = 'Blocked' where id = $1", [cardId]);
    await addMove(client, session.id, "Card reported lost", `Debit ··· ${row.last4} · blocked`, 0);
    await addJournal(client, `${row.name} reported card ··· ${row.last4} lost or stolen. It is blocked`);
  });
  await logSecurity(session.id, "card_lost", `Card ··· ${row.last4}`);
  return "";
}

export async function send(fromId: string, to: string, amount: number, note: string) {
  const session = await readSession();
  if (!session) return "Sign in first.";
  if (session.role === "customer" && session.id !== fromId) return "You can only send from your account.";
  return createSendRequest(fromId, to, amount, note);
}

/**
 * Puts a send in front of the branch. Every rule (frozen, balance, daily limit) is checked here.
 * The caller must already have decided who is allowed to ask: a signed-in customer, or a schedule that
 * the customer set up themselves.
 */
export async function createSendRequest(fromId: string, to: string, amount: number, note: string) {
  const value = cleanAmount(amount);
  if (value === null) return BAD_AMOUNT;
  const needle = digits(to) || to.trim().toLowerCase();
  return withTx(async (client) => {
    // The sender's row stays locked until we finish, so two sends can never race.
    const found = await client.query("select * from customers where id = $1 for update", [fromId]);
    const from = found.rows[0] as Row | undefined;
    if (!from) return "Customer not found.";
    if (from.status === "Frozen") return "This account is frozen. Sends are stopped.";

    const limit = num(from.daily_limit);
    if (cents(value) > cents(limit)) {
      return `This is above the daily send limit of ${limit.toFixed(2)}.`;
    }

    // Money already promised to sends waiting on the branch is not free to spend again.
    const held = await client.query(
      "select coalesce(sum(amount), 0) as held from reviews where customer_id = $1 and decision = 'waiting'",
      [fromId],
    );
    const free = cents(from.balance) - cents(held.rows[0].held);
    if (cents(value) > free) {
      return cents(held.rows[0].held) > 0
        ? `Not enough free money. ${dollars(num(held.rows[0].held))} is already set aside for sends waiting on the branch.`
        : "Not enough money in the everyday account.";
    }

    // The limit is per rolling day, not per send.
    const day = await client.query(
      `select coalesce(sum(amount), 0) as spent from reviews
       where customer_id = $1 and decision in ('waiting', 'approved')
         and created_at > now() - interval '24 hours'`,
      [fromId],
    );
    const left = cents(limit) - cents(day.rows[0].spent);
    if (cents(value) > left) {
      return `That is over the daily limit. You can still send ${dollars(Math.max(left, 0) / 100)} in the next 24 hours.`;
    }

    const payees = await client.query("select * from customers where id <> $1 for update", [fromId]);
    const payee = (payees.rows as Row[]).find((row) => {
      const account = digits(String(row.account_number));
      return (
        String(row.name).toLowerCase() === to.trim().toLowerCase() ||
        account === needle ||
        (needle.length >= 4 && account.endsWith(needle))
      );
    });
    if (payee?.status === "Frozen") return "The receiving account is frozen.";

    const reason = payee
      ? `${from.name} → ${payee.name}${note.trim() ? ` · ${note.trim()}` : ""}`
      : `${from.name} → ${to.trim()}${note.trim() ? ` · ${note.trim()}` : ""}`;

    // A double tap or a retry must not create two identical sends.
    const twin = await client.query(
      `select 1 from reviews where customer_id = $1 and amount = $2 and reason = $3
         and decision = 'waiting' and created_at > now() - interval '30 seconds'`,
      [fromId, value, reason],
    );
    if (twin.rowCount) return "That send was just submitted. Check Activity before trying again.";

    const reviewId = newId();
    await client.query(
      "insert into reviews (id, customer_id, amount, reason, decision, payee_id) values ($1, $2, $3, $4, 'waiting', $5)",
      [reviewId, fromId, value, reason, payee ? payee.id : null],
    );
    await addMove(
      client,
      fromId,
      payee ? `Send to ${String(payee.name).split(" ")[0]} · pending` : "Send pending",
      `${dollars(value)} · waiting on the branch`,
      0,
      reviewId,
    );
    await addJournal(
      client,
      payee
        ? `${from.name} asked to send ${value.toFixed(2)} to ${payee.name} — waiting review`
        : `${from.name} asked to send ${value.toFixed(2)} to ${to.trim()} — waiting review`,
      value,
    );
    return "";
  });
}

export async function setFrozen(id: string, frozen: boolean) {
  await requireStaff();
  const found = await pool.query("select name from customers where id = $1", [id]);
  if (!found.rows[0]) return "Customer not found.";
  await withTx(async (client) => {
    await client.query("update customers set status = $1 where id = $2", [
      frozen ? "Frozen" : "Open",
      id,
    ]);
    await addMove(
      client,
      id,
      frozen ? "Account frozen" : "Account opened again",
      "Branch desk",
      0,
    );
    await addJournal(
      client,
      frozen
        ? `Froze ${found.rows[0].name}'s account`
        : `Unfroze ${found.rows[0].name}'s account`,
    );
  });
  return "";
}

export async function deleteCustomer(id: string) {
  await requireStaff();
  return withTx(async (client) => {
    const found = await client.query("select * from customers where id = $1 for update", [id]);
    const row = found.rows[0] as Row | undefined;
    if (!row) return "Customer not found.";
    // An account that still holds money cannot simply disappear.
    if (cents(row.balance) > 0 || cents(row.savings) > 0) {
      return `Pay out the ${dollars(num(row.balance) + num(row.savings))} still on this account before closing it.`;
    }
    const waiting = await client.query(
      "select count(*)::int as n from reviews where customer_id = $1 and decision = 'waiting'",
      [id],
    );
    if (num(waiting.rows[0].n) > 0) return "Decide the sends waiting on this account first.";
    await client.query("delete from customers where id = $1", [id]);
    await addJournal(client, `Closed and removed ${row.name}'s account (${row.account_number})`);
    return "";
  });
}

export async function issueCard(id: string) {
  await requireStaff();
  const found = await pool.query("select name, status from customers where id = $1", [id]);
  const row = found.rows[0] as Row | undefined;
  if (!row) return "Customer not found.";
  if (row.status === "Frozen") return "Unfreeze the account before issuing a card.";
  const last4 = String(randomLast4());
  await withTx(async (client) => {
    await client.query(
      "insert into cards (id, customer_id, last4, expires, status) values ($1, $2, $3, '09/30', 'Active')",
      [newId(), id, last4],
    );
    await addMove(client, id, "Card issued", `Debit ··· ${last4}`, 0);
    await addJournal(client, `Issued debit ··· ${last4} to ${row.name}`);
  });
  return "";
}

function randomLast4() {
  return randomInt(1000, 10000);
}

export async function setCardStatus(
  id: string,
  cardId: string,
  status: BankCard["status"],
) {
  const session = await readSession();
  if (!session) return "Sign in first.";
  if (session.role === "customer" && session.id !== id) return "That card is not yours.";
  const found = await pool.query(
    "select cards.last4, customers.name from cards join customers on customers.id = cards.customer_id where cards.id = $1 and cards.customer_id = $2",
    [cardId, id],
  );
  const row = found.rows[0] as Row | undefined;
  if (!row) return "Card not found.";
  if (session.role === "customer" && status === "Blocked") {
    return "Only the branch can block a card.";
  }
  if (session.role === "customer") {
    const current = await pool.query("select status from cards where id = $1", [cardId]);
    if (current.rows[0]?.status === "Blocked") {
      return "The branch blocked this card.";
    }
  }
  const title =
    status === "Blocked" ? "Card blocked" : status === "Paused" ? "Card paused" : "Card active";
  await withTx(async (client) => {
    await client.query("update cards set status = $1 where id = $2", [status, cardId]);
    await addMove(client, id, title, `Debit ··· ${row.last4}`, 0);
    await addJournal(client, `${title} ··· ${row.last4} for ${row.name}`);
  });
  return "";
}

export async function deleteCard(id: string, cardId: string) {
  await requireStaff();
  const found = await pool.query(
    "select cards.last4, customers.name from cards join customers on customers.id = cards.customer_id where cards.id = $1 and cards.customer_id = $2",
    [cardId, id],
  );
  const row = found.rows[0] as Row | undefined;
  if (!row) return "Card not found.";
  await withTx(async (client) => {
    await client.query("delete from cards where id = $1", [cardId]);
    await addMove(client, id, "Card removed", `Debit ··· ${row.last4}`, 0);
    await addJournal(client, `Removed card ··· ${row.last4} for ${row.name}`);
  });
  return "";
}

export async function setLimit(id: string, limit: number) {
  await requireStaff();
  const value = limit === 0 ? 0 : cleanAmount(limit);
  if (value === null) return BAD_AMOUNT;
  const found = await pool.query("select name from customers where id = $1", [id]);
  if (!found.rows[0]) return "Customer not found.";
  await withTx(async (client) => {
    await client.query("update customers set daily_limit = $1 where id = $2", [value, id]);
    await addJournal(client, `Set ${found.rows[0].name}'s daily send limit to ${value.toFixed(2)}`);
  });
  return "";
}

export async function resetPassword(id: string) {
  await requireStaff();
  const found = await pool.query("select name, account_number from customers where id = $1", [id]);
  const row = found.rows[0] as Row | undefined;
  if (!row) return { error: "Customer not found." };
  const password = makePassword();
  await pool.query("update customers set password_hash = $1 where id = $2", [
    hashPassword(password),
    id,
  ]);
  await addJournal(pool, `Reset the password for ${row.name}`);
  await logSecurity(id, "branch_reset", "The branch gave you a new password");
  return { accountNumber: String(row.account_number), password };
}

export async function decideReview(id: string, decision: "approved" | "declined", note?: string) {
  await requireStaff();
  const why = (note ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  return withTx(async (client) => {
    const found = await client.query("select * from reviews where id = $1 for update", [id]);
    const review = found.rows[0] as Row | undefined;
    if (!review || review.decision !== "waiting") return "This review is already closed.";
    const people = await client.query("select * from customers where id = $1 for update", [
      review.customer_id,
    ]);
    const person = people.rows[0] as Row | undefined;
    if (!person) return "Customer not found.";

    let payee: Row | undefined;
    if (review.payee_id) {
      const payees = await client.query("select * from customers where id = $1 for update", [
        review.payee_id,
      ]);
      payee = payees.rows[0] as Row | undefined;
    }

    if (decision === "approved") {
      if (person.status === "Frozen") return "Unfreeze the sender's account before releasing this.";
      if (cents(person.balance) < cents(review.amount)) {
        return "Not enough money to release this send.";
      }
      if (payee?.status === "Frozen") return "The receiving account is frozen.";

      await client.query("update customers set balance = balance - $1 where id = $2", [
        review.amount,
        person.id,
      ]);
      await addMove(
        client,
        String(person.id),
        payee ? `Sent to ${String(payee.name).split(" ")[0]}` : "Wire released",
        payee ? `Ubex ··· ${String(payee.account_number).slice(-4)}` : String(review.reason),
        -num(review.amount),
      );

      if (payee) {
        await client.query("update customers set balance = balance + $1 where id = $2", [
          review.amount,
          payee.id,
        ]);
        await addMove(
          client,
          String(payee.id),
          `From ${String(person.name).split(" ")[0]}`,
          `Ubex ··· ${String(person.account_number).slice(-4)}`,
          num(review.amount),
        );
      }
    } else {
      await addMove(
        client,
        String(person.id),
        "Send declined",
        payee
          ? `${dollars(num(review.amount))} to ${String(payee.name).split(" ")[0]} · ${why || "the branch said no"}`
          : `${dollars(num(review.amount))} · ${why || "the branch said no"}`,
        0,
      );
    }

    await client.query("update reviews set decision = $1 where id = $2", [decision, id]);
    await addJournal(
      client,
      decision === "approved"
        ? `Approved ${num(review.amount).toFixed(2)} for ${person.name}${payee ? ` → ${payee.name}` : ""}`
        : `Declined ${num(review.amount).toFixed(2)} for ${person.name}${why ? ` (${why})` : ""}`,
      num(review.amount),
    );
    return "";
  });
}

export async function changeOwnPassword(current: string, next: string) {
  const session = await readSession();
  if (!session || session.role !== "customer") return "Sign in first.";
  if (next.length < 8) return "Use at least 8 characters for the new password.";
  if (next === current) return "Choose a password that is different from the current one.";

  const keys = [`pw:${session.id}`];
  if (await lockedOut(keys)) return LOCKED;

  const found = await pool.query("select * from customers where id = $1", [session.id]);
  const row = found.rows[0] as Row | undefined;
  if (!row) return "Customer not found.";
  if (!checkPassword(current, String(row.password_hash))) {
    await noteFailure(keys);
    return "That is not your current password.";
  }
  await clearFailures(keys[0]);
  await pool.query("update customers set password_hash = $1 where id = $2", [
    hashPassword(next),
    session.id,
  ]);
  await addJournal(pool, `${row.name} changed their own password`);
  await logSecurity(String(session.id), "password_changed", await deviceName());
  return "";
}
