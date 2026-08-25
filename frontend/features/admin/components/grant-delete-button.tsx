"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/config/routes";
import { deleteGrant } from "@/features/admin/actions/grant-actions";

/**
 * Deletes a grant, behind a confirmation.
 *
 * The action existed from the start but had nothing calling it, so deleting a
 * grant was not actually possible from the panel.
 *
 * The delete is soft: the row stays, hidden from the public site, so the audit
 * trail and anything referencing it survive. The dialog says so, because
 * "delete" that does not destroy is worth stating plainly — and because it is
 * the difference between a reversible mistake and an unrecoverable one.
 */
export function GrantDeleteButton({
  grantId,
  title,
}: {
  readonly grantId: string;
  readonly title: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);

    const result = await deleteGrant({
      grantId,
      // The status field is required by the shared schema but ignored by the
      // delete action, which picks only grantId and reason.
      status: "archived",
      reason: reason.trim() === "" ? undefined : reason.trim(),
    });

    setBusy(false);

    if (!result.ok) {
      setError(result.message);

      return;
    }

    setOpen(false);
    router.push(routes.admin.grants);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="text-destructive">
          <Trash2 className="size-4" aria-hidden="true" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this grant?</DialogTitle>
          <DialogDescription>
            &ldquo;{title}&rdquo; will be removed from the public site, the search index and the
            sitemap. The record itself is kept, along with its history, so this can be undone by an
            administrator.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="delete-reason" className="text-xs">
            Reason
          </Label>
          <Input
            id="delete-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Duplicate of the NSF listing"
          />
        </div>

        {error !== null && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Keep it
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={confirm} disabled={busy}>
            {busy ? "Deleting…" : "Delete grant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
