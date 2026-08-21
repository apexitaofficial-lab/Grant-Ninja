"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { adminUserRepository } from "@/features/admin/repositories/admin-user-repository";
import { signInSchema } from "@/features/admin/schemas/sign-in-schema";
import type { ActionResult } from "@/lib/errors";
import { failure, success, toActionFailure } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Only same-site admin paths are accepted as a redirect target. Taking the
 * value as given would turn the login form into an open redirect that phishing
 * links could point anywhere.
 */
function safeRedirectTarget(next: string | undefined): string {
  if (next === undefined || !next.startsWith(`${routes.admin.root}/`)) {
    return routes.admin.root;
  }

  return next.includes("//") ? routes.admin.root : next;
}

export async function signIn(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = signInSchema.safeParse(input);

  if (!parsed.success) {
    return failure("VALIDATION_FAILED", parsed.error.issues[0]?.message ?? "Check your details.");
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error !== null || data.user === null) {
      // Deliberately vague: saying which half was wrong tells an attacker
      // whether an address is registered.
      logger.warn("Failed admin sign-in", {
        feature: "admin",
        action: "signIn",
        reason: error?.message,
      });

      return failure("UNAUTHENTICATED", "That email and password do not match.");
    }

    const profile = await adminUserRepository.findById(data.user.id);

    if (profile === null || !profile.isActive) {
      // Signed in as far as Supabase is concerned, but not an operator here.
      await supabase.auth.signOut();

      return failure("FORBIDDEN", "This account is not active. Ask a super admin to enable it.");
    }

    await adminUserRepository.touchLastLogin(data.user.id);

    logger.info("Admin signed in", {
      feature: "admin",
      action: "signIn",
      userId: data.user.id,
      role: profile.role,
    });

    return success({ redirectTo: safeRedirectTarget(parsed.data.next) });
  } catch (error) {
    return toActionFailure(error, { feature: "admin", action: "signIn" });
  }
}

export async function signOut(): Promise<never> {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  // The admin shell is rendered from the session, so it must not be served
  // from cache after the session is gone.
  revalidatePath(routes.admin.root, "layout");
  redirect(routes.admin.login);
}
