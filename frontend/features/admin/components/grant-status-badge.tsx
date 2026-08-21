import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type GrantStatus = Database["public"]["Enums"]["grant_status"];

const LABELS: Readonly<Record<GrantStatus, string>> = {
  draft: "Draft",
  pending_review: "Needs review",
  published: "Published",
  archived: "Archived",
  expired: "Expired",
};

/**
 * `pending_review` carries the only colour that asks for attention. The others
 * are states, not alerts — if everything is highlighted, nothing is.
 */
const TONES: Readonly<Record<GrantStatus, string>> = {
  draft: "",
  pending_review: "border-warning/40 bg-warning/10 text-warning",
  published: "border-success/40 bg-success/10 text-success",
  archived: "",
  expired: "",
};

export function GrantStatusBadge({ status }: { readonly status: GrantStatus }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", TONES[status])}>
      {LABELS[status]}
    </Badge>
  );
}
