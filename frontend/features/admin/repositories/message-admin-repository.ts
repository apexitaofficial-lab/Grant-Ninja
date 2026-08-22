import "server-only";

import { BaseRepository } from "@/lib/repositories/base-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type MessageStatus = Database["public"]["Enums"]["message_status"];

export interface AdminMessage {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly company: string | null;
  readonly subject: string | null;
  readonly message: string;
  readonly status: MessageStatus;
  readonly createdAt: string;
}

export interface MessageCounts {
  readonly new: number;
  readonly read: number;
  readonly replied: number;
  readonly archived: number;
}

/**
 * Contact enquiries.
 *
 * Strangers may insert, only staff may read — that asymmetry is enforced by RLS
 * (`contact_anon_insert` / `contact_admin_read`), so these queries do not
 * repeat it.
 */
export class MessageAdminRepository extends BaseRepository {
  protected readonly entityName = "AdminMessage";

  async list(status: MessageStatus | undefined, limit = 100): Promise<readonly AdminMessage[]> {
    const supabase = await createSupabaseServerClient();

    let builder = supabase
      .from("contact_messages")
      .select("id, name, email, phone, company, subject, message, status, created_at");

    if (status !== undefined) {
      builder = builder.eq("status", status);
    }

    const { data, error } = await builder.order("created_at", { ascending: false }).limit(limit);

    if (error) {
      this.unwrap({ data: null, error }, "list");
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      subject: row.subject,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  async counts(): Promise<MessageCounts> {
    const supabase = await createSupabaseServerClient();

    const countFor = async (status: MessageStatus): Promise<number> => {
      const { count } = await supabase
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("status", status);

      return count ?? 0;
    };

    const [unread, read, replied, archived] = await Promise.all([
      countFor("new"),
      countFor("read"),
      countFor("replied"),
      countFor("archived"),
    ]);

    return { new: unread, read, replied, archived };
  }

  async setStatus(id: string, status: MessageStatus): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);

    if (error) {
      this.unwrap({ data: null, error }, "setStatus");
    }
  }

  /**
   * Marks a batch as read.
   *
   * Opening the inbox is what marks things read — the same as every mail
   * client. Leaving that to a manual button means the "new" counter on the
   * dashboard stays lit after someone has plainly seen them, and a counter
   * that lies is quickly ignored.
   */
  async markRead(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("contact_messages")
      .update({ status: "read" })
      .in("id", [...ids])
      .eq("status", "new");

    if (error) {
      this.unwrap({ data: null, error }, "markRead");
    }
  }
}

export const messageAdminRepository = new MessageAdminRepository();
