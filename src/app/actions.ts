"use server";

import {
  createFirstStaff,
  customerSignIn,
  decideReview,
  deleteCard,
  deleteCustomer,
  deposit,
  issueCard,
  lookupRecipient,
  moveBetweenPots,
  openAccount,
  resetPassword,
  reviewStatus,
  send,
  setCardStatus,
  setFrozen,
  setLimit,
  signOut,
  snapshot,
  staffSignIn,
  withdraw,
} from "@/lib/records";
import type { BankCard } from "@/lib/books";

export async function loadBank() {
  return snapshot();
}

export async function signInStaff(email: string, password: string) {
  return staffSignIn(email, password);
}

export async function createStaff(email: string, password: string) {
  return createFirstStaff(email, password);
}

export async function signInCustomer(account: string, password: string) {
  return customerSignIn(account, password);
}

export async function signOutBank() {
  await signOut();
}

export async function openCustomerAccount(input: {
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  address: string;
  opening: number;
  pot: "everyday" | "savings";
}) {
  return openAccount(input);
}

export async function postDeposit(
  id: string,
  amount: number,
  pot: "everyday" | "savings",
  note: string,
) {
  return deposit(id, amount, pot, note);
}

export async function postWithdraw(id: string, amount: number, note: string) {
  return withdraw(id, amount, note);
}

export async function postSend(fromId: string, to: string, amount: number, note: string) {
  return send(fromId, to, amount, note);
}

export async function findRecipient(fromId: string, to: string) {
  return lookupRecipient(fromId, to);
}

export async function getReviewStatus(customerId: string, reviewId: string) {
  return reviewStatus(customerId, reviewId);
}

export async function postMove(
  customerId: string,
  direction: "toSavings" | "toEveryday",
  amount: number,
) {
  return moveBetweenPots(customerId, direction, amount);
}

export async function freezeAccount(id: string, frozen: boolean) {
  return setFrozen(id, frozen);
}

export async function removeCustomer(id: string) {
  return deleteCustomer(id);
}

export async function createCard(id: string) {
  return issueCard(id);
}

export async function changeCard(
  id: string,
  cardId: string,
  status: BankCard["status"],
) {
  return setCardStatus(id, cardId, status);
}

export async function removeCard(id: string, cardId: string) {
  return deleteCard(id, cardId);
}

export async function changeLimit(id: string, limit: number) {
  return setLimit(id, limit);
}

export async function newCustomerPassword(id: string) {
  return resetPassword(id);
}

export async function reviewDecision(id: string, decision: "approved" | "declined") {
  return decideReview(id, decision);
}
