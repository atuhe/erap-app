// Idle-based session timeout. When the user shows no activity for
// `IDLE_LIMIT_MS`, we clear their token and bounce them to /login.
// A short warning fires before the hard logout so they can stay signed in.

import { clearToken, getToken } from "./apiClient";

export const IDLE_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
export const IDLE_WARNING_MS = 60 * 1000;    // warn 60s before logout

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "visibilitychange"] as const;
const LAST_ACTIVITY_KEY = "erap:last-activity";

type Listener = (kind: "warn" | "expire", detail: { from: string }) => void;

let warnTimer: ReturnType<typeof setTimeout> | null = null;
let expireTimer: ReturnType<typeof setTimeout> | null = null;
let listeners = new Set<Listener>();
let started = false;

function now() { return Date.now(); }

function clearTimers() {
  if (warnTimer) { clearTimeout(warnTimer); warnTimer = null; }
  if (expireTimer) { clearTimeout(expireTimer); expireTimer = null; }
}

function emit(kind: "warn" | "expire") {
  const from = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
  listeners.forEach((l) => l(kind, { from }));
}

function schedule() {
  clearTimers();
  if (!getToken()) return;
  const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || now();
  const elapsed = now() - last;
  const untilExpire = Math.max(0, IDLE_LIMIT_MS - elapsed);
  const untilWarn = Math.max(0, untilExpire - IDLE_WARNING_MS);

  if (untilExpire === 0) {
    handleExpire();
    return;
  }
  if (untilWarn > 0) {
    warnTimer = setTimeout(() => emit("warn"), untilWarn);
  } else {
    emit("warn");
  }
  expireTimer = setTimeout(handleExpire, untilExpire);
}

function handleExpire() {
  clearTimers();
  if (!getToken()) return;
  clearToken();
  emit("expire");
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    const from = window.location.pathname + window.location.search;
    window.dispatchEvent(new CustomEvent("erap:unauthorized", { detail: { from, reason: "timeout" } }));
  }
}

/** Record activity — resets the idle timers everywhere (cross-tab via storage). */
export function markActivity(): void {
  if (typeof window === "undefined") return;
  if (!getToken()) return;
  localStorage.setItem(LAST_ACTIVITY_KEY, String(now()));
  schedule();
}

export function onSessionTimeoutEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Start listening for user activity + cross-tab sync. Idempotent. */
export function startSessionTimeoutWatcher(): () => void {
  if (typeof window === "undefined") return () => {};
  if (started) return () => {};
  started = true;

  const onActivity = () => markActivity();
  ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

  const onStorage = (e: StorageEvent) => {
    if (e.key === LAST_ACTIVITY_KEY) schedule();
  };
  window.addEventListener("storage", onStorage);

  // Seed activity if not present, then schedule.
  if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now()));
  }
  schedule();

  return () => {
    started = false;
    ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
    window.removeEventListener("storage", onStorage);
    clearTimers();
  };
}

/** Called after successful login to (re)start the countdown. */
export function resetSessionTimeout(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_ACTIVITY_KEY, String(now()));
  schedule();
}

/** Called on explicit logout so the timer stops immediately. */
export function stopSessionTimeout(): void {
  clearTimers();
  if (typeof window !== "undefined") localStorage.removeItem(LAST_ACTIVITY_KEY);
}