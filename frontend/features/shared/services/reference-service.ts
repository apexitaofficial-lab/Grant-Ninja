import "server-only";

import type { OrganizationType } from "@/features/shared/repositories/reference-repository";
import { referenceRepository } from "@/features/shared/repositories/reference-repository";

/**
 * Reference-data reads for directory pages and the homepage.
 */

export const ORGANIZATION_TYPE_LABELS: Readonly<Record<OrganizationType, string>> = {
  government_federal: "Federal agency",
  government_state: "State agency",
  government_local: "Local government",
  university: "University",
  research_council: "Research council",
  innovation_agency: "Innovation agency",
  foundation: "Foundation",
  private: "Private organisation",
};

export const listCountries = () => referenceRepository.listCountries();
export const getCountry = (slug: string) => referenceRepository.findCountry(slug);
export const listStates = (countrySlug: string) => referenceRepository.listStates(countrySlug);
export const getFundingBreakdown = (countryId: string) =>
  referenceRepository.getFundingBreakdown(countryId);
export const getState = (countrySlug: string, stateSlug: string) =>
  referenceRepository.findState(countrySlug, stateSlug);

export const listCategories = () => referenceRepository.listCategories();
export const getCategory = (slug: string) => referenceRepository.findCategory(slug);

export const listOrganizations = () => referenceRepository.listOrganizations();
export const getOrganization = (slug: string) => referenceRepository.findOrganization(slug);

export const getStatistics = () => referenceRepository.getStatistics();

/**
 * Directory cards for countries with no grants yet would be dead ends, so the
 * homepage only browses the ones that lead somewhere. The full directory still
 * lists everything.
 */
export async function listCountriesWithGrants() {
  const countries = await listCountries();

  return countries.filter((country) => country.grantCount > 0);
}

export async function listCategoriesWithGrants() {
  const categories = await listCategories();

  return categories.filter((category) => category.grantCount > 0);
}
