"use server";

import {
  cancelOwnSend,
  changeOwnPassword,
  createFirstStaff,
  decideReview,
  deleteCard,
  deleteCustomer,
  deposit,
  issueCard,
  lookupRecipient,
  moveBetweenPots,
  openAccount,
  reportLostCard,
  resetPassword,
  reviewStatus,
  send,
  setCardStatus,
  setFrozen,
  setLimit,
  signInAnyone,
  signOut,
  snapshot,
  withdraw,
} from "@/lib/records";
import type { BankCard } from "@/lib/books";
import { goalChange, goalCreate, goalDelete, goalsView } from "@/lib/goals";
import { payeeList, payeeRemove, payeeSave } from "@/lib/payees";
import { requestCancel, requestCreate, requestList, requestLookup } from "@/lib/requests";
import { scheduleCreate, scheduleDelete, scheduleList, scheduleSetActive } from "@/lib/scheduled";
import type { Frequency } from "@/lib/scheduled";
import { securityList } from "@/lib/security-log";
import {
  passkeyList,
  passkeyLoginOptions,
  passkeyLoginVerify,
  passkeyRegisterOptions,
  passkeyRegisterVerify,
  passkeyRemove,
} from "@/lib/passkeys";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";

export async function loadBank() {
  return snapshot();
}

export async function createStaff(email: string, password: string) {
  return createFirstStaff(email, password);
}

export async function signInUnified(identifier: string, password: string) {
  return signInAnyone(identifier, password);
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

export async function reviewDecision(id: string, decision: "approved" | "declined", note?: string) {
  return decideReview(id, decision, note);
}

export async function changePassword(current: string, next: string) {
  return changeOwnPassword(current, next);
}

export async function startPasskeySetup() {
  return passkeyRegisterOptions();
}

export async function finishPasskeySetup(response: RegistrationResponseJSON) {
  return passkeyRegisterVerify(response);
}

export async function startPasskeySignIn(credentialId?: string) {
  return passkeyLoginOptions(credentialId);
}

export async function finishPasskeySignIn(response: AuthenticationResponseJSON) {
  return passkeyLoginVerify(response);
}

export async function listPasskeys() {
  return passkeyList();
}

export async function removePasskey(id: string) {
  return passkeyRemove(id);
}

export async function listPayees() {
  return payeeList();
}

export async function savePayee(account: string, nickname: string) {
  return payeeSave(account, nickname);
}

export async function removePayee(id: string) {
  return payeeRemove(id);
}

export async function listSecurityActivity() {
  return securityList();
}

// ---- savings goals ----
export async function getGoals() {
  return goalsView();
}

export async function makeGoal(name: string, target: number) {
  return goalCreate(name, target);
}

export async function changeGoal(goalId: string, amount: number, direction: "add" | "take") {
  return goalChange(goalId, amount, direction);
}

export async function removeGoal(goalId: string) {
  return goalDelete(goalId);
}

// ---- payment requests ----
export async function makeRequest(amount: number | null, note: string) {
  return requestCreate(amount, note);
}

export async function listRequests() {
  return requestList();
}

export async function cancelRequest(id: string) {
  return requestCancel(id);
}

/** Open to anyone holding the link. Only returns who is asking and for how much. */
export async function lookupRequest(token: string) {
  return requestLookup(token);
}

// ---- scheduled transfers ----
export async function listSchedules() {
  return scheduleList();
}

export async function makeSchedule(input: {
  account: string;
  amount: number;
  note: string;
  frequency: Frequency;
  startDate: string;
}) {
  return scheduleCreate(input);
}

export async function pauseSchedule(id: string, active: boolean) {
  return scheduleSetActive(id, active);
}

export async function removeSchedule(id: string) {
  return scheduleDelete(id);
}

export async function cancelSend(reviewId: string) {
  return cancelOwnSend(reviewId);
}

export async function reportLost(cardId: string) {
  return reportLostCard(cardId);
}
