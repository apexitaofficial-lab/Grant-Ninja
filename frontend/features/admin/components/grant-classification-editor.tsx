"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveGrantClassification } from "@/features/admin/actions/grant-actions";
import type { GrantReferenceData } from "@/features/admin/components/grant-classification-fields";
import {
  GrantClassificationFields,
  NEW_AGENCY,
} from "@/features/admin/components/grant-classification-fields";
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
  const [newAgencyName, setNewAgencyName] = useState("");
  const [newAgencyWebsite, setNewAgencyWebsite] = useState("");
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

  const addingAgency = organizationId === NEW_AGENCY;
  const agencyMissing = organizationId === "";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);

    if (agencyMissing) {
      setFormError("Choose a funding agency for the new country before saving.");

      return;
    }

    if (addingAgency && newAgencyName.trim() === "") {
      setFormError("Give the new agency a name, or pick an existing one.");

      return;
    }

    setSubmitting(true);

    const result = await saveGrantClassification({
      grantId: grant.id,
      countryId,
      organizationId: addingAgency ? null : organizationId,
      newOrganizationName: addingAgency ? newAgencyName : "",
      newOrganizationWebsite: addingAgency ? newAgencyWebsite : "",
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
    // The agency may have just been created; re-reading gives the form the id
    // the server assigned instead of leaving it on the "add new" sentinel.
    setNewAgencyName("");
    setNewAgencyWebsite("");
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
        // Moving a grant to a country with no agencies recorded — which is
        // every country except the United States — is otherwise impossible:
        // the agency list comes back empty and there is nothing to pick.
        allowNewAgency
        newAgencyName={newAgencyName}
        onNewAgencyNameChange={setNewAgencyName}
        newAgencyWebsite={newAgencyWebsite}
        onNewAgencyWebsiteChange={setNewAgencyWebsite}
      />

      <div className="flex flex-col gap-2">
        <Label className="text-xs">Reason for this change</Label>
        <Input
          placeholder="Moved to the correct ministry"
          value={changeReason}
          onChange={(event) => setChangeReason(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save filing"}
          </Button>
        </div>
        {/*
          Says why rather than going quiet. A disabled button with no
          explanation is how a country change silently fails to save: the
          country select moves, the agency beneath it empties, and the only
          feedback is a button that no longer responds.
        */}
        {agencyMissing && (
          <p className="text-xs text-muted-foreground">
            Changing the country cleared the agency, because the previous one belongs to a different
            country. Pick an agency — or add one — to save.
          </p>
        )}
      </div>
    </form>
  );
}
