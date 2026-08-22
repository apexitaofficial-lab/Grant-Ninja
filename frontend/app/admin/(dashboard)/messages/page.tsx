import type { Metadata } from "next";
import Link from "next/link";

import { MessageCard } from "@/features/admin/components/message-card";
import type { MessageStatus } from "@/features/admin/repositories/message-admin-repository";
import { messageAdminRepository } from "@/features/admin/repositories/message-admin-repository";
import { requireAdmin } from "@/features/admin/services/auth-service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

const TABS: readonly { readonly label: string; readonly value: MessageStatus | "all" }[] = [
  { label: "New", value: "new" },
  { label: "Read", value: "read" },
  { label: "Replied", value: "replied" },
  { label: "Archived", value: "archived" },
  { label: "All", value: "all" },
];

function parseStatus(value: string | undefined): MessageStatus | undefined {
  const known: readonly MessageStatus[] = ["new", "read", "replied", "archived"];

  return known.includes(value as MessageStatus) ? (value as MessageStatus) : undefined;
}

/**
 * Contact enquiries — the destination the dashboard's "New messages" counter
 * never had.
 *
 * Until now the contact form wrote to a table nobody could read from the panel,
 * so an enquiry was only visible to someone willing to query the database. From
 * the outside that looks identical to being ignored.
 */
export default async function AdminMessagesPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("editor");

  const params = await searchParams;
  const statusParam = typeof params["status"] === "string" ? params["status"] : "new";
  const status = statusParam === "all" ? undefined : parseStatus(statusParam);

  const [messages, counts] = await Promise.all([
    messageAdminRepository.list(status),
    messageAdminRepository.counts(),
  ]);

  // Opening the inbox marks what is in it as read, the way every mail client
  // behaves. Left to a manual button, the dashboard counter would stay lit
  // after someone had plainly seen them — and a counter that lies gets ignored.
  if (status === "new" && messages.length > 0) {
    await messageAdminRepository.markRead(messages.map((message) => message.id));
  }

  const countFor = (value: MessageStatus | "all"): number | null =>
    value === "all" ? null : counts[value];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Enquiries from the contact form. Each one also arrives by email; this is the record, and
          where you mark what has been handled.
        </p>
      </div>

      <nav
        aria-label="Filter by status"
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        {TABS.map((tab) => {
          const isActive = statusParam === tab.value;
          const count = countFor(tab.value);

          return (
            <Link
              key={tab.value}
              href={`/admin/messages?status=${tab.value}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {tab.label}
              {count !== null && <span className="font-mono tabular-nums opacity-70">{count}</span>}
            </Link>
          );
        })}
      </nav>

      {messages.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium">
            {statusParam === "new" ? "No unread enquiries" : "Nothing here"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
            {statusParam === "new"
              ? "Messages from the contact form land here first, and are marked read once you have opened this page."
              : "Try another tab."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <MessageCard key={message.id} message={message} />
          ))}
        </div>
      )}
    </div>
  );
}
