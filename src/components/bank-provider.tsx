"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  changeCard,
  changeLimit,
  createCard,
  createStaff,
  freezeAccount,
  loadBank,
  newCustomerPassword,
  openCustomerAccount,
  postDeposit,
  postMove,
  postSend,
  postWithdraw,
  removeCard,
  removeCustomer,
  reviewDecision,
  finishPasskeySignIn,
  signInUnified,
  signOutBank,
} from "@/app/actions";
import type { AuthenticationResponseJSON } from "@simplewebauthn/browser";
import type { BankCard, Book, Customer, Review } from "@/lib/books";

type OpenInput = {
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  address: string;
  opening: number;
  pot: "everyday" | "savings";
};

type Opened =
  | { error: string }
  | { id: string; accountNumber: string; password: string };

type Reset =
  | { error: string }
  | { accountNumber: string; password: string };

type BankApi = {
  ready: boolean;
  hasStaff: boolean;
  role: "staff" | "customer" | null;
  customers: Customer[];
  reviews: Review[];
  journal: Book["journal"];
  me: Customer | null;
  refresh: () => Promise<void>;
  updatedAt: number | null;
  signInWithPasskey: (response: AuthenticationResponseJSON) => Promise<string>;
  signIn: (
    identifier: string,
    password: string,
  ) => Promise<{ error: string } | { role: "staff" | "customer" }>;
  createStaff: (email: string, password: string) => Promise<string>;
  signOut: () => Promise<void>;
  openAccount: (input: OpenInput) => Promise<Opened>;
  resetPassword: (id: string) => Promise<Reset>;
  deposit: (
    id: string,
    amount: number,
    pot: "everyday" | "savings",
    note: string,
  ) => Promise<string>;
  withdraw: (id: string, amount: number, note: string) => Promise<string>;
  send: (fromId: string, to: string, amount: number, note: string) => Promise<string>;
  moveBetweenPots: (
    customerId: string,
    direction: "toSavings" | "toEveryday",
    amount: number,
  ) => Promise<string>;
  setFrozen: (id: string, frozen: boolean) => Promise<string>;
  deleteCustomer: (id: string) => Promise<string>;
  issueCard: (id: string) => Promise<string>;
  setCardStatus: (
    id: string,
    cardId: string,
    status: BankCard["status"],
  ) => Promise<string>;
  deleteCard: (id: string, cardId: string) => Promise<string>;
  setLimit: (id: string, limit: number) => Promise<string>;
  decideReview: (id: string, decision: "approved" | "declined", note?: string) => Promise<string>;
};

const BankContext = createContext<BankApi | null>(null);

export function BankProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hasStaff, setHasStaff] = useState(false);
  const [role, setRole] = useState<BankApi["role"]>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [journal, setJournal] = useState<Book["journal"]>([]);
  const [me, setMe] = useState<Customer | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const snap = await loadBank();
    setHasStaff(snap.hasStaff);
    setRole(snap.role);
    setCustomers(snap.customers);
    setReviews(snap.reviews);
    setJournal(snap.journal);
    setMe(snap.me);
    setReady(true);
    setUpdatedAt(Date.now());
  }, []);

  useEffect(() => {
    let alive = true;
    loadBank()
      .then((snap) => {
        if (!alive) return;
        setHasStaff(snap.hasStaff);
        setRole(snap.role);
        setCustomers(snap.customers);
        setReviews(snap.reviews);
        setJournal(snap.journal);
        setMe(snap.me);
        setReady(true);
        setUpdatedAt(Date.now());
      })
      .catch(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Keep the screen fresh: when you come back to the tab, when the network returns,
  // and every minute while the app is open.
  useEffect(() => {
    if (!role) return;
    const quiet = () => {
      if (document.visibilityState === "visible") refresh().catch(() => {});
    };
    document.addEventListener("visibilitychange", quiet);
    window.addEventListener("online", quiet);
    const timer = setInterval(quiet, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", quiet);
      window.removeEventListener("online", quiet);
      clearInterval(timer);
    };
  }, [role, refresh]);

  async function after(error: string) {
    if (!error) await refresh();
    return error;
  }

  const api: BankApi = {
    ready,
    hasStaff,
    role,
    customers,
    reviews,
    journal,
    me,
    refresh,
    updatedAt,
    signInWithPasskey: async (response) => {
      const result = await finishPasskeySignIn(response);
      if ("error" in result && result.error) return result.error;
      await refresh();
      return "";
    },
    signIn: async (identifier, password) => {
      const result = await signInUnified(identifier, password);
      if (!("error" in result)) await refresh();
      return result;
    },
    createStaff: async (email, password) => {
      const error = await createStaff(email, password);
      if (!error) await refresh();
      return error;
    },
    signOut: async () => {
      await signOutBank();
      await refresh();
    },
    openAccount: async (input) => {
      const result = await openCustomerAccount(input);
      if (!("error" in result)) await refresh();
      return result;
    },
    resetPassword: async (id) => newCustomerPassword(id),
    deposit: (id, amount, pot, note) => postDeposit(id, amount, pot, note).then(after),
    withdraw: (id, amount, note) => postWithdraw(id, amount, note).then(after),
    send: (fromId, to, amount, note) => postSend(fromId, to, amount, note).then(after),
    moveBetweenPots: (customerId, direction, amount) =>
      postMove(customerId, direction, amount).then(after),
    setFrozen: (id, frozen) => freezeAccount(id, frozen).then(after),
    deleteCustomer: (id) => removeCustomer(id).then(after),
    issueCard: (id) => createCard(id).then(after),
    setCardStatus: (id, cardId, status) => changeCard(id, cardId, status).then(after),
    deleteCard: (id, cardId) => removeCard(id, cardId).then(after),
    setLimit: (id, limit) => changeLimit(id, limit).then(after),
    decideReview: (id, decision, note) => reviewDecision(id, decision, note).then(after),
  };

  return <BankContext.Provider value={api}>{children}</BankContext.Provider>;
}

export function useBank() {
  const bank = useContext(BankContext);
  if (!bank) throw new Error("useBank must be used inside BankProvider");
  return bank;
}
