"use client";

import { Archive, CornerUpLeft, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setMessageStatus } from "@/features/admin/actions/message-actions";
import type {
  AdminMessage,
  MessageStatus,
} from "@/features/admin/repositories/message-admin-repository";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_TONE: Readonly<Record<MessageStatus, string>> = {
  new: "border-primary/40 bg-primary/10 text-primary",
  read: "",
  replied: "border-success/40 bg-success/10 text-success",
  archived: "",
};

const STATUS_LABEL: Readonly<Record<MessageStatus, string>> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

/**
 * One enquiry, with the actions that move it along.
 *
 * "Reply" opens the operator's own mail client rather than building a sending
 * UI here. The reply itself belongs in a real inbox — that is where the thread,
 * the signature and the follow-up already live, and duplicating that badly
 * would make it harder to answer someone, not easier. Marking it replied is the
 * part that belongs in the panel.
 */
export function MessageCard({ message }: { readonly message: AdminMessage }) {
  const router = useRouter();
  const [busy, setBusy] = useState<MessageStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function apply(status: MessageStatus) {
    setBusy(status);
    setError(null);

    try {
      const result = await setMessageStatus({ id: message.id, status });

      if (!result.ok) {
        setError(result.message);

        return;
      }

      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const mailto = `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(
    message.subject === null || message.subject.trim() === ""
      ? "Re: your enquiry to Grant Ninja"
      : `Re: ${message.subject}`,
  )}`;

  return (
    <article
      className={cn(
        "rounded-card border border-border",
        message.status === "new" && "border-primary/30",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {message.name}
            <a
              href={mailto}
              className="ml-2 font-normal text-muted-foreground underline-offset-4 hover:underline"
            >
              {message.email}
            </a>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[message.company, message.phone].filter(Boolean).join(" · ")}
            {(message.company !== null || message.phone !== null) && " · "}
            {formatDate(message.createdAt)}
          </p>
        </div>

        <Badge variant="outline" className={cn("shrink-0 text-xs", STATUS_TONE[message.status])}>
          {STATUS_LABEL[message.status]}
        </Badge>
      </header>

      <div className="flex flex-col gap-2 px-4 py-4">
        {message.subject !== null && message.subject.trim() !== "" && (
          <p className="text-sm font-medium">{message.subject}</p>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {message.message}
        </p>
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
        <Button asChild size="sm" variant="outline">
          <a href={mailto}>
            <CornerUpLeft className="size-3.5" aria-hidden="true" />
            Reply by email
          </a>
        </Button>

        {message.status !== "replied" && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => apply("replied")}
            disabled={busy !== null}
          >
            <Mail className="size-3.5" aria-hidden="true" />
            {busy === "replied" ? "…" : "Mark replied"}
          </Button>
        )}

        {message.status !== "archived" && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => apply("archived")}
            disabled={busy !== null}
          >
            <Archive className="size-3.5" aria-hidden="true" />
            {busy === "archived" ? "…" : "Archive"}
          </Button>
        )}

        {message.status === "archived" && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => apply("read")}
            disabled={busy !== null}
          >
            {busy === "read" ? "…" : "Restore"}
          </Button>
        )}

        {error !== null && (
          <span role="alert" className="text-xs font-medium text-destructive">
            {error}
          </span>
        )}
      </footer>
    </article>
  );
}
