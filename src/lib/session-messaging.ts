import { useSyncExternalStore } from "react";

// ─── Chat ────────────────────────────────────────────────────────────────

export type ChatDelivery = "sending" | "sent" | "delivered" | "read" | "failed";
export type ChatSender = "technician" | "user" | "system";

export interface ChatMessage {
  id: string;
  sessionId: string;
  ts: number;
  sender: ChatSender;
  senderName: string;
  text: string;
  delivery: ChatDelivery;
}

const chatListeners = new Set<() => void>();
let chatStore: ChatMessage[] = [];
let chatCounter = 0;

function emitChat() { for (const l of chatListeners) l(); }

export function useChatMessages(sessionId: string | null) {
  return useSyncExternalStore(
    (cb) => { chatListeners.add(cb); return () => chatListeners.delete(cb); },
    () => (sessionId ? chatStore.filter((m) => m.sessionId === sessionId) : EMPTY_CHAT),
    () => (sessionId ? chatStore.filter((m) => m.sessionId === sessionId) : EMPTY_CHAT),
  );
}
const EMPTY_CHAT: ChatMessage[] = [];

export function sendChatMessage(sessionId: string, senderName: string, text: string, sender: ChatSender = "technician"): ChatMessage {
  chatCounter += 1;
  const msg: ChatMessage = {
    id: `CHAT-${chatCounter}`,
    sessionId, ts: Date.now(), sender, senderName, text, delivery: "sending",
  };
  chatStore = [...chatStore, msg];
  emitChat();
  // simulate delivery ack over private WAN
  setTimeout(() => updateChatDelivery(msg.id, "sent"), 250);
  setTimeout(() => updateChatDelivery(msg.id, "delivered"), 700);
  setTimeout(() => updateChatDelivery(msg.id, "read"), 1600);
  return msg;
}

export function pushSystemChat(sessionId: string, text: string) {
  return sendChatMessage(sessionId, "System", text, "system");
}

function updateChatDelivery(id: string, delivery: ChatDelivery) {
  chatStore = chatStore.map((m) => (m.id === id ? { ...m, delivery } : m));
  emitChat();
}

// ─── Files ───────────────────────────────────────────────────────────────

export type TransferDirection = "upload" | "download";
export type TransferStatus = "queued" | "transferring" | "completed" | "failed" | "cancelled";

export interface FileTransfer {
  id: string;
  sessionId: string;
  ts: number;
  actor: string;
  direction: TransferDirection;
  name: string;
  sizeKb: number;
  progress: number; // 0-100
  status: TransferStatus;
  errorMessage?: string;
  checksum: string;
}

const fileListeners = new Set<() => void>();
let fileStore: FileTransfer[] = [];
let fileCounter = 0;

function emitFiles() { for (const l of fileListeners) l(); }

export function useFileTransfers(sessionId: string | null) {
  return useSyncExternalStore(
    (cb) => { fileListeners.add(cb); return () => fileListeners.delete(cb); },
    () => (sessionId ? fileStore.filter((f) => f.sessionId === sessionId) : EMPTY_FILES),
    () => (sessionId ? fileStore.filter((f) => f.sessionId === sessionId) : EMPTY_FILES),
  );
}
const EMPTY_FILES: FileTransfer[] = [];

function shortChecksum() {
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

export function startFileTransfer(
  sessionId: string,
  actor: string,
  direction: TransferDirection,
  name: string,
  sizeKb: number,
): FileTransfer {
  fileCounter += 1;
  const t: FileTransfer = {
    id: `FT-${fileCounter}`,
    sessionId, ts: Date.now(), actor, direction, name, sizeKb,
    progress: 0, status: "queued", checksum: shortChecksum(),
  };
  fileStore = [t, ...fileStore];
  emitFiles();

  // simulate transfer
  setTimeout(() => updateFile(t.id, { status: "transferring" }), 200);
  const total = 6;
  for (let i = 1; i <= total; i++) {
    setTimeout(() => {
      updateFile(t.id, { progress: Math.round((i / total) * 100) });
      if (i === total) updateFile(t.id, { status: "completed" });
    }, 200 + i * 350);
  }
  return t;
}

export function failFileTransfer(id: string, reason: string) {
  updateFile(id, { status: "failed", errorMessage: reason });
}

function updateFile(id: string, patch: Partial<FileTransfer>) {
  fileStore = fileStore.map((f) => (f.id === id ? { ...f, ...patch } : f));
  emitFiles();
}