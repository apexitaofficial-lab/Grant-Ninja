import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/features/admin/actions/auth-actions";
import type { AdminProfile } from "@/features/admin/repositories/admin-user-repository";
import { ROLE_LABELS } from "@/features/admin/services/auth-service";

interface AdminTopbarProps {
  readonly admin: AdminProfile;
}

/**
 * Who you are signed in as, and the way out.
 *
 * Sign-out is a plain form posting to a Server Action, so it works without
 * JavaScript and needs no client component.
 */
export function AdminTopbar({ admin }: AdminTopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border px-5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{admin.displayName || admin.email}</p>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          {ROLE_LABELS[admin.role]}
        </p>
      </div>

      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm">
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </Button>
      </form>
    </header>
  );
}
