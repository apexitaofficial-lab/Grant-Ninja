"use client";

import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveDuplicate } from "@/features/admin/actions/duplicate-actions";
import type {
  DuplicatePair,
  DuplicateSide,
} from "@/features/admin/repositories/duplicate-admin-repository";
import { formatCurrency, formatDate, NOT_ANNOUNCED } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * One flagged pair, side by side.
 *
 * Fields that differ are highlighted. That is the whole job of this screen:
 * two grant records are mostly identical text, and a reviewer scanning two
 * paragraphs for the one changed date will miss it. Showing *what differs*
 * turns a reading task into a glance.
 */
export function DuplicatePairCard({ pair }: { readonly pair: DuplicatePair }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(decision: "duplicate" | "different", keepGrantId: string | null) {
    setBusy(decision + (keepGrantId ?? ""));
    setError(null);

    try {
      const result = await resolveDuplicate({
        id: pair.id,
        decision,
        keepGrantId,
        reason: reason || undefined,
      });

      if (!result.ok) {
        setError(result.message);

        return;
      }

      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const differences = compare(pair.left, pair.right);

  return (
    <article className="rounded-card border border-border">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono">
            {pair.confidence}% · {pair.method}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {differences.length === 0
              ? "Every compared field matches"
              : `${differences.length} field${differences.length === 1 ? "" : "s"} differ`}
          </span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          flagged {formatDate(pair.createdAt)}
        </span>
      </header>

      <div className="grid gap-px bg-border md:grid-cols-2">
        <SidePanel side={pair.left} differences={differences} />
        <SidePanel side={pair.right} differences={differences} />
      </div>

      <footer className="flex flex-col gap-3 border-t border-border px-4 py-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`reason-${pair.id}`} className="text-xs">
            Note for the history
          </Label>
          <Input
            id={`reason-${pair.id}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Same programme, the second listing is a re-post"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => resolve("duplicate", pair.left.id)}
            disabled={busy !== null}
          >
            Keep left, archive right
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => resolve("duplicate", pair.right.id)}
            disabled={busy !== null}
          >
            Keep right, archive left
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => resolve("different", null)}
            disabled={busy !== null}
          >
            Not duplicates
          </Button>
          {busy !== null && <span className="text-xs text-muted-foreground">Saving…</span>}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Archiving hides a grant from the public site but keeps the record — its source URL is what
          stops the crawler rediscovering it as new on the next run.
        </p>

        {error !== null && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        )}
      </footer>
    </article>
  );
}

type FieldKey = "title" | "organizationName" | "amount" | "closesAt" | "opensAt" | "officialUrl";

function compare(left: DuplicateSide, right: DuplicateSide): readonly FieldKey[] {
  const differing: FieldKey[] = [];

  if (left.title !== right.title) differing.push("title");
  if (left.organizationName !== right.organizationName) differing.push("organizationName");
  if (left.maximumAmount !== right.maximumAmount || left.minimumAmount !== right.minimumAmount) {
    differing.push("amount");
  }
  if (left.closesAt !== right.closesAt) differing.push("closesAt");
  if (left.opensAt !== right.opensAt) differing.push("opensAt");
  if (left.officialUrl !== right.officialUrl) differing.push("officialUrl");

  return differing;
}

function SidePanel({
  side,
  differences,
}: {
  readonly side: DuplicateSide;
  readonly differences: readonly FieldKey[];
}) {
  const amount =
    side.maximumAmount === null
      ? NOT_ANNOUNCED
      : side.minimumAmount === null
        ? `Up to ${formatCurrency(side.maximumAmount, side.currency)}`
        : `${formatCurrency(side.minimumAmount, side.currency)} – ${formatCurrency(side.maximumAmount, side.currency)}`;

  return (
    <div className="flex flex-col gap-3 bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/grants/${side.id}`}
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          {side.title}
        </Link>
        <Badge variant="outline" className="shrink-0 text-xs">
          {side.status}
        </Badge>
      </div>

      <dl className="flex flex-col gap-2 text-xs">
        <Row
          label="Agency"
          value={side.organizationName}
          changed={differences.includes("organizationName")}
        />
        <Row label="Award" value={amount} changed={differences.includes("amount")} />
        <Row
          label="Opens"
          value={side.opensAt === null ? "—" : (formatDate(side.opensAt) ?? "—")}
          changed={differences.includes("opensAt")}
        />
        <Row
          label="Closes"
          value={side.closesAt === null ? "—" : (formatDate(side.closesAt) ?? "—")}
          changed={differences.includes("closesAt")}
        />
        <Row
          label="Confidence"
          value={side.aiConfidence === null ? "—" : String(side.aiConfidence)}
          changed={false}
        />
        <Row label="Added" value={formatDate(side.createdAt) ?? "—"} changed={false} />
      </dl>

      {side.sourceUrl !== null && (
        <a
          href={side.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex w-fit items-center gap-1 text-xs underline underline-offset-4"
        >
          Original notice
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      )}

      {side.shortDescription !== null && (
        <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {side.shortDescription}
        </p>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  changed,
}: {
  readonly label: string;
  readonly value: string;
  readonly changed: boolean;
}) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={cn("flex-1", changed && "rounded bg-warning/15 px-1 font-medium text-warning")}
      >
        {changed && <ArrowRight className="mr-1 inline size-3" aria-hidden="true" />}
        {value}
      </dd>
    </div>
  );
}
