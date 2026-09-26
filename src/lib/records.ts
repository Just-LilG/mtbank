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
import { clearSession, readSession, writeSession } from "@/lib/session";

type Row = Record<string, unknown>;

function num(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function when(value: unknown) {
  return new Date(String(value)).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function customerFrom(row: Row, cards: BankCard[], movements: Customer["movements"]): Customer {
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
  return people.rows.map((row: Row) => {
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
    return customerFrom(row, cards, movements);
  });
}

function newId() {
  return crypto.randomUUID();
}

async function withTx<T>(run: (client: PoolClient) => Promise<T>) {
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

async function addJournal(client: PoolClient, text: string, amount?: number) {
  await client.query("insert into journal (id, body, amount) values ($1, $2, $3)", [
    newId(),
    text,
    amount ?? null,
  ]);
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
  }));
  const journal: JournalLine[] = journalRows.rows.map((row: Row) => ({
    id: String(row.id),
    when: when(row.created_at),
    text: String(row.body),
    amount: row.amount == null ? undefined : num(row.amount),
  }));
  return { role: "staff" as const, hasStaff, me: null, customers, reviews, journal };
}

export async function createFirstStaff(email: string, password: string) {
  const count = await pool.query("select count(*)::int as count from staff");
  if (count.rows[0].count > 0) return "The branch login already exists.";
  if (!email.trim() || password.length < 6) {
    return "Use an email and a password of at least 6 characters.";
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
  const found = await pool.query("select * from staff where email = $1", [
    email.trim().toLowerCase(),
  ]);
  const row = found.rows[0] as Row | undefined;
  if (!row || !checkPassword(password, String(row.password_hash))) {
    return "That staff email or password is wrong.";
  }
  await writeSession({ role: "staff", id: String(row.id) });
  return "";
}

export async function customerSignIn(account: string, password: string) {
  const found = await pool.query(
    "select * from customers where regexp_replace(account_number, '\\D', '', 'g') = $1",
    [digits(account)],
  );
  const row = found.rows[0] as Row | undefined;
  if (!row || !checkPassword(password, String(row.password_hash))) {
    return "That account number or password is wrong. Ask the branch if you do not have one yet.";
  }
  await writeSession({ role: "customer", id: String(row.id) });
  return "";
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
  if (!Number.isFinite(input.opening) || input.opening < 0)
    return { error: "Opening cash cannot be below zero." };
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
        input.pot === "everyday" ? input.opening : 0,
        input.pot === "savings" ? input.opening : 0,
      ],
    );
    if (input.opening > 0) {
      await addMove(client, id, "Opening cash", "Branch counter", input.opening);
    }
    await addJournal(client, `Opened account ${account} for ${name}`, input.opening || undefined);
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
  if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount above zero.";
  const person = await pool.query("select name from customers where id = $1", [id]);
  if (!person.rows[0]) return "Customer not found.";
  const column = pot === "savings" ? "savings" : "balance";
  const title = pot === "savings" ? "Savings deposit" : "Deposit";
  await withTx(async (client) => {
    await client.query(`update customers set ${column} = ${column} + $1 where id = $2`, [
      amount,
      id,
    ]);
    await addMove(client, id, title, note.trim() || "Branch counter", amount);
    await addJournal(client, `Deposit into ${person.rows[0].name} · ${pot}`, amount);
  });
  return "";
}

export async function withdraw(id: string, amount: number, note: string) {
  await requireStaff();
  if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount above zero.";
  return withTx(async (client) => {
    const found = await client.query("select * from customers where id = $1 for update", [id]);
    const row = found.rows[0] as Row | undefined;
    if (!row) return "Customer not found.";
    if (row.status === "Frozen") return "This account is frozen. Cash cannot leave.";
    if (num(row.balance) < amount) return "Not enough money in the everyday account.";
    await client.query("update customers set balance = balance - $1 where id = $2", [amount, id]);
    await addMove(client, id, "Withdrawal", note.trim() || "Branch counter", -amount);
    await addJournal(client, `Withdrawal for ${row.name}`, amount);
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
  if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount above zero.";
  return withTx(async (client) => {
    const found = await client.query("select * from customers where id = $1 for update", [
      customerId,
    ]);
    const row = found.rows[0] as Row | undefined;
    if (!row) return "Customer not found.";
    if (row.status === "Frozen") return "This account is frozen. Money cannot move between pots.";
    const fromCol = direction === "toSavings" ? "balance" : "savings";
    const toCol = direction === "toSavings" ? "savings" : "balance";
    if (num(row[fromCol]) < amount) {
      return direction === "toSavings"
        ? "Not enough in the everyday account."
        : "Not enough in savings.";
    }
    await client.query(
      `update customers set ${fromCol} = ${fromCol} - $1, ${toCol} = ${toCol} + $1 where id = $2`,
      [amount, customerId],
    );
    await addMove(
      client,
      customerId,
      direction === "toSavings" ? "To savings" : "To everyday",
      direction === "toSavings" ? "Moved from everyday" : "Moved from savings",
      -amount,
    );
    await addMove(
      client,
      customerId,
      direction === "toSavings" ? "From everyday" : "From savings",
      "Between your own pots",
      amount,
    );
    await addJournal(
      client,
      `${row.name} moved ${amount.toFixed(2)} ${direction === "toSavings" ? "to savings" : "to everyday"}`,
      amount,
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
    `select r.decision, r.amount, r.created_at, p.name as payee_name
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
    payeeName: row.payee_name ? String(row.payee_name) : null,
  };
}

export async function send(fromId: string, to: string, amount: number, note: string) {
  const session = await readSession();
  if (!session) return "Sign in first.";
  if (session.role === "customer" && session.id !== fromId) return "You can only send from your account.";
  if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount above zero.";
  const needle = digits(to) || to.trim().toLowerCase();
  return withTx(async (client) => {
    const found = await client.query("select * from customers where id = $1 for update", [fromId]);
    const from = found.rows[0] as Row | undefined;
    if (!from) return "Customer not found.";
    if (from.status === "Frozen") return "This account is frozen. Sends are stopped.";
    if (amount > num(from.daily_limit)) {
      return `This is above the daily send limit of ${num(from.daily_limit).toFixed(2)}.`;
    }
    if (num(from.balance) < amount) return "Not enough money in the everyday account.";
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

    const reviewId = newId();
    await client.query(
      "insert into reviews (id, customer_id, amount, reason, decision, payee_id) values ($1, $2, $3, $4, 'waiting', $5)",
      [reviewId, fromId, amount, reason, payee ? payee.id : null],
    );
    await addMove(
      client,
      fromId,
      payee ? `Send to ${String(payee.name).split(" ")[0]} · pending` : "Send pending",
      `${dollars(amount)} · waiting on the branch`,
      0,
      reviewId,
    );
    await addJournal(
      client,
      payee
        ? `${from.name} asked to send ${amount.toFixed(2)} to ${payee.name} — waiting review`
        : `${from.name} asked to send ${amount.toFixed(2)} to ${to.trim()} — waiting review`,
      amount,
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
  const found = await pool.query("select name, account_number from customers where id = $1", [
    id,
  ]);
  const row = found.rows[0] as Row | undefined;
  if (!row) return "Customer not found.";
  await withTx(async (client) => {
    await client.query("delete from customers where id = $1", [id]);
    await addJournal(client, `Closed and removed ${row.name}'s account (${row.account_number})`);
  });
  return "";
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
  return Math.floor(1000 + Math.random() * 9000);
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
  if (limit < 0) return "Limit cannot be below zero.";
  const found = await pool.query("select name from customers where id = $1", [id]);
  if (!found.rows[0]) return "Customer not found.";
  await withTx(async (client) => {
    await client.query("update customers set daily_limit = $1 where id = $2", [limit, id]);
    await addJournal(client, `Set ${found.rows[0].name}'s daily send limit to ${limit.toFixed(2)}`);
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
  await pool.query("insert into journal (id, body) values ($1, $2)", [
    newId(),
    `Reset the password for ${row.name}`,
  ]);
  return { accountNumber: String(row.account_number), password };
}

export async function decideReview(id: string, decision: "approved" | "declined") {
  await requireStaff();
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
      if (num(person.balance) < num(review.amount)) {
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
          ? `${dollars(num(review.amount))} to ${String(payee.name).split(" ")[0]} · the branch said no`
          : `${dollars(num(review.amount))} · the branch said no`,
        0,
      );
    }

    await client.query("update reviews set decision = $1 where id = $2", [decision, id]);
    await addJournal(
      client,
      decision === "approved"
        ? `Approved ${num(review.amount).toFixed(2)} for ${person.name}${payee ? ` → ${payee.name}` : ""}`
        : `Declined ${num(review.amount).toFixed(2)} for ${person.name}`,
      num(review.amount),
    );
    return "";
  });
}
