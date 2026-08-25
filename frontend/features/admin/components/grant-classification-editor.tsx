"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveGrantClassification } from "@/features/admin/actions/grant-actions";
import type { GrantReferenceData } from "@/features/admin/components/grant-classification-fields";
import { GrantClassificationFields } from "@/features/admin/components/grant-classification-fields";
import type { AdminGrantDetail } from "@/features/admin/repositories/grant-admin-repository";
import type { FundingLevel } from "@/features/admin/schemas/grant-edit-schema";
import { fromFundingFlags } from "@/features/admin/schemas/grant-edit-schema";

/**
 * Re-files an existing grant: country, agency, region, funding level, categories.
 *
 * Separate from `GrantEditor`, which corrects text. The split follows the two
 * database functions behind them, and it matches how the work actually happens
 * — fixing a wrong deadline and moving a grant to the right agency are
 * different decisions, made at different times, and each is recorded as its own
 * entry in the history.
 */
export function GrantClassificationEditor({
  grant,
  data,
}: {
  readonly grant: AdminGrantDetail;
  readonly data: GrantReferenceData;
}) {
  const router = useRouter();

  const [countryId, setCountryId] = useState(grant.countryId);
  const [organizationId, setOrganizationId] = useState(grant.organizationId);
  const [stateId, setStateId] = useState(grant.stateId ?? "");
  const [fundingLevel, setFundingLevel] = useState<FundingLevel>(
    fromFundingFlags(grant.isFederal, grant.isPrivate),
  );
  const [categoryIds, setCategoryIds] = useState<readonly string[]>([...grant.categoryIds]);
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string | null>(
    grant.primaryCategoryId,
  );
  const [changeReason, setChangeReason] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleCountryChange(next: string) {
    setCountryId(next);
    // The agency and region belong to the old country and almost certainly do
    // not exist in the new one.
    setOrganizationId("");
    setStateId("");
  }

  function handleCategoryToggle(id: string, checked: boolean) {
    setCategoryIds((current) => {
      const next = checked ? [...current, id] : current.filter((entry) => entry !== id);

      setPrimaryCategoryId((primary) => {
        if (checked && primary === null) {
          return id;
        }

        return primary === id && !checked ? (next[0] ?? null) : primary;
      });

      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);
    setSubmitting(true);

    const result = await saveGrantClassification({
      grantId: grant.id,
      countryId,
      organizationId,
      stateId: stateId === "" ? null : stateId,
      categoryIds: [...categoryIds],
      primaryCategoryId,
      fundingLevel,
      changeReason: changeReason.trim() === "" ? undefined : changeReason.trim(),
    });

    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);

      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {formError !== null && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {saved && (
        <Alert role="status">
          <AlertDescription>Filing updated, and recorded in the history below.</AlertDescription>
        </Alert>
      )}

      <GrantClassificationFields
        data={data}
        countryId={countryId}
        onCountryChange={handleCountryChange}
        organizationId={organizationId}
        onOrganizationChange={setOrganizationId}
        stateId={stateId}
        onStateChange={(value) => setStateId(value === "none" ? "" : value)}
        fundingLevel={fundingLevel}
        onFundingLevelChange={setFundingLevel}
        categoryIds={categoryIds}
        onCategoryToggle={handleCategoryToggle}
        primaryCategoryId={primaryCategoryId}
        onPrimaryCategoryChange={setPrimaryCategoryId}
      />

      <div className="flex flex-col gap-2">
        <Label className="text-xs">Reason for this change</Label>
        <Input
          placeholder="Moved to the correct ministry"
          value={changeReason}
          onChange={(event) => setChangeReason(event.target.value)}
        />
      </div>

      <div>
        <Button type="submit" disabled={submitting || organizationId === ""}>
          {submitting ? "Saving…" : "Save filing"}
        </Button>
      </div>
    </form>
  );
}
