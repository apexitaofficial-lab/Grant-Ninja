import "server-only";

import type { ContactMessageInput } from "@/features/contact/schemas/contact-schema";
import { BaseRepository } from "@/lib/repositories/base-repository";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export class ContactRepository extends BaseRepository {
  protected readonly entityName = "Contact message";

  /**
   * Inserted with the ordinary server client, not the secret key.
   *
   * The `contact_anon_insert` policy is what should admit this row, so the
   * write travels the same path a browser would. Using the secret key here
   * would bypass the policy and leave it untested in production.
   */
  async create(input: ContactMessageInput, ipAddress: string | null): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("contact_messages").insert({
      name: input.name,
      email: input.email,
      company: input.company ?? null,
      phone: input.phone ?? null,
      subject: input.subject ?? null,
      message: input.message,
      ip_address: ipAddress,
    });

    if (error) {
      this.unwrap({ data: null, error }, "create");
    }
  }

  /**
   * Counts recent submissions from one address.
   *
   * Needs the secret key: `anon` deliberately has no SELECT on this table, so
   * a stranger cannot read the inbox. Rate limiting is the one place the
   * server legitimately needs to look at rows it will not show anyone.
   *
   * Counting in the database rather than in memory means the limit survives a
   * restart and holds across every process behind the load balancer.
   */
  async countRecentFrom(ipAddress: string, windowMinutes: number): Promise<number> {
    const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
    const supabase = createSupabaseAdminClient();

    const { count, error } = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", ipAddress)
      .gte("created_at", since);

    if (error) {
      this.unwrap({ data: null, error }, "countRecentFrom");
    }

    return count ?? 0;
  }
}

export const contactRepository = new ContactRepository();
