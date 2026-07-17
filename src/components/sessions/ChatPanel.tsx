import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Check, CheckCheck, Clock, XCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { ErapRole, ROLE_LABELS, hasPermission } from "@/lib/erap-roles";
import { logAudit } from "@/lib/audit-log";
import { appendSessionEvent } from "@/lib/sessions";
import { useChatMessages, sendChatMessage, pushSystemChat, type ChatDelivery } from "@/lib/session-messaging";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  hostname: string;
  currentUser: string;
  actor: string;
  role: ErapRole;
}

export function ChatPanel({ open, onOpenChange, sessionId, hostname, currentUser, actor, role }: Props) {
  const messages = useChatMessages(sessionId);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const canChat = hasPermission(role, "chat");

  useEffect(() => {
    if (open && sessionId && messages.length === 0) {
      pushSystemChat(sessionId, `Chat channel opened with ${currentUser} on ${hostname}.`);
    }
  }, [open, sessionId, hostname, currentUser, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = () => {
    const text = draft.trim();
    if (!text || !sessionId) return;
    if (!canChat) {
      logAudit({ actor, actorRole: role, category: "session", action: "chat_message_denied", target: hostname, targetId: sessionId, status: "denied", details: "Role lacks Chat" });
      return;
    }
    sendChatMessage(sessionId, actor, text);
    appendSessionEvent(sessionId, { kind: "chat", message: `${actor}: ${text}` });
    logAudit({ actor, actorRole: role, category: "session", action: "chat_message_sent", target: hostname, targetId: sessionId, status: "success", details: text.slice(0, 120) });
    setDraft("");
  };

  const grouped = useMemo(() => messages, [messages]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Session chat
          </DialogTitle>
          <DialogDescription>
            Encrypted chat with <span className="font-medium">{currentUser}</span> on <span className="font-mono">{hostname}</span>. All messages are audit-logged.
          </DialogDescription>
        </DialogHeader>

        {!canChat && (
          <div className="flex items-start gap-2 rounded-md border bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5" />
            <span>Your role ({ROLE_LABELS[role]}) can read chat but cannot send messages.</span>
          </div>
        )}

        <div ref={scrollRef} className="h-72 overflow-y-auto rounded-md border bg-muted/20 p-3">
          {grouped.length === 0 && (
            <div className="grid h-full place-items-center text-xs text-muted-foreground">No messages yet.</div>
          )}
          <ul className="space-y-2">
            {grouped.map((m) => (
              <li key={m.id} className={cn("flex", m.sender === "technician" ? "justify-end" : "justify-start")}>
                {m.sender === "system" ? (
                  <div className="mx-auto text-[11px] text-muted-foreground">— {m.text} —</div>
                ) : (
                  <div className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    m.sender === "technician" ? "bg-primary text-primary-foreground" : "bg-card border",
                  )}>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-semibold", m.sender === "technician" ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {m.senderName}
                      </span>
                      <span className={cn("text-[10px]", m.sender === "technician" ? "text-primary-foreground/60" : "text-muted-foreground")}>
                        {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="mt-0.5 whitespace-pre-wrap break-words">{m.text}</div>
                    {m.sender === "technician" && (
                      <div className="mt-1 flex justify-end">
                        <DeliveryIcon delivery={m.delivery} />
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <Separator />
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={canChat ? "Type a message…" : "Read-only for your role"}
            disabled={!canChat}
          />
          <Button onClick={send} disabled={!canChat || !draft.trim()}>
            <Send className="mr-2 h-4 w-4" /> Send
          </Button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{messages.filter((m) => m.sender !== "system").length} messages</span>
          <Badge variant="outline" className="border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Encrypted · private WAN</Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeliveryIcon({ delivery }: { delivery: ChatDelivery }) {
  if (delivery === "sending") return <Clock className="h-3 w-3 text-primary-foreground/70" aria-label="Sending" />;
  if (delivery === "sent") return <Check className="h-3 w-3 text-primary-foreground/80" aria-label="Sent" />;
  if (delivery === "delivered") return <CheckCheck className="h-3 w-3 text-primary-foreground/80" aria-label="Delivered" />;
  if (delivery === "read") return <CheckCheck className="h-3 w-3 text-emerald-300" aria-label="Read" />;
  return <XCircle className="h-3 w-3 text-red-300" aria-label="Failed" />;
}