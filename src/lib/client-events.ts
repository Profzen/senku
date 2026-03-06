"use client";

export const CLIENT_EVENTS = {
  tradesChanged: "senku:trades-changed",
  accountsChanged: "senku:accounts-changed",
} as const;

export function emitTradesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CLIENT_EVENTS.tradesChanged));
}

export function emitAccountsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CLIENT_EVENTS.accountsChanged));
}

export function onTradesChanged(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CLIENT_EVENTS.tradesChanged, handler);
  return () => window.removeEventListener(CLIENT_EVENTS.tradesChanged, handler);
}

export function onAccountsChanged(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CLIENT_EVENTS.accountsChanged, handler);
  return () => window.removeEventListener(CLIENT_EVENTS.accountsChanged, handler);
}
