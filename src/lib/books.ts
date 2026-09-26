export type CardStatus = "Active" | "Paused" | "Blocked";

export type BankCard = {
  id: string;
  last4: string;
  expires: string;
  status: CardStatus;
};

export type Movement = {
  id: string;
  title: string;
  detail: string;
  amount: number;
  when: string;
  at: string;
  reviewId?: string | null;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  address: string;
  account: string;
  balance: number;
  savings: number;
  status: "Open" | "Frozen";
  opened: string;
  dailyLimit: number;
  cards: BankCard[];
  movements: Movement[];
};

export type Review = {
  id: string;
  customerId: string;
  amount: number;
  reason: string;
  decision: "waiting" | "approved" | "declined";
  payeeId?: string | null;
  payeeName?: string | null;
};

export type JournalLine = {
  id: string;
  when: string;
  text: string;
  amount?: number;
};

export type Book = {
  customers: Customer[];
  reviews: Review[];
  journal: JournalLine[];
};

export function dollars(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function dollarParts(amount: number) {
  const formatted = dollars(amount);
  const dot = formatted.lastIndexOf(".");
  if (dot === -1) return { whole: formatted, cents: "" };
  return { whole: formatted.slice(0, dot), cents: formatted.slice(dot) };
}

export function nowLabel(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function newId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export function emptyBook(): Book {
  return { customers: [], reviews: [], journal: [] };
}
