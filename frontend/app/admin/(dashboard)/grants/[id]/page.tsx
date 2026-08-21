import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { routes } from "@/config/routes";
import { GrantEditor } from "@/features/admin/components/grant-editor";
import { GrantReviewActions } from "@/features/admin/components/grant-review-actions";
import { GrantStatusBadge } from "@/features/admin/components/grant-status-badge";
import { grantAdminRepository } from "@/features/admin/repositories/grant-admin-repository";
import { requireAdmin } from "@/features/admin/services/auth-service";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Edit grant" };

export default async function AdminGrantPage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}) {
  await requireAdmin("editor");

  const { id } = await params;
  const grant = await grantAdminRepository.findById(id);

  if (grant === null) {
    notFound();
  }

  const history = await grantAdminRepository.listHistory(grant.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href={`${routes.admin.grants}?status=${grant.status}`}
          className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to grants
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{grant.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {grant.organizationName}
              {grant.countryName === "" ? "" : ` · ${grant.countryName}`}
            </p>
          </div>
          <GrantStatusBadge status={grant.status} />
        </div>
      </div>

      <section aria-labelledby="facts">
        <SectionHeading id="facts">Provenance</SectionHeading>
        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-5 border-y border-border py-5 lg:grid-cols-4">
          <Fact
            label="AI confidence"
            value={grant.aiConfidence === null ? "—" : `${grant.aiConfidence}`}
          />
          <Fact label="Version" value={`v${grant.currentVersion}`} />
          <Fact
            label="Categories"
            value={grant.categoryNames.length === 0 ? "none" : grant.categoryNames.join(", ")}
          />
          <Fact
            label="Published"
            value={grant.publishedAt === null ? "not yet" : (formatDate(grant.publishedAt) ?? "—")}
          />
        </dl>
        {grant.sourceUrl !== null && (
          <p className="mt-3 text-xs text-muted-foreground">
            Extracted from{" "}
            <a
              href={grant.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 underline underline-offset-4"
            >
              the original notice
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
            . Check the facts below against it before publishing.
          </p>
        )}
      </section>

      <section aria-labelledby="decision">
        <SectionHeading id="decision">Decision</SectionHeading>
        <div className="mt-4">
          <GrantReviewActions
            grantId={grant.id}
            status={grant.status}
            hasCategory={grant.categoryNames.length > 0}
          />
        </div>
      </section>

      <section aria-labelledby="details">
        <SectionHeading id="details">Details</SectionHeading>
        <div className="mt-4">
          <GrantEditor grant={grant} />
        </div>
      </section>

      <section aria-labelledby="history">
        <SectionHeading id="history">History</SectionHeading>
        {history.length === 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">Nothing recorded yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {history.map((entry) => (
              <li key={entry.id} className="flex gap-3 border-b border-border pb-3 last:border-0">
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  {entry.performedByType}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{entry.action}</p>
                  {entry.description !== null && (
                    <p className="text-xs text-muted-foreground">{entry.description}</p>
                  )}
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatDate(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SectionHeading({ id, children }: { readonly id: string; readonly children: string }) {
  return (
    <h2
      id={id}
      className="border-b border-border pb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase"
    >
      {children}
    </h2>
  );
}

function Fact({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
