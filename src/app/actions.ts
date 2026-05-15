"use server";

import { revalidatePath } from "next/cache";

/**
 * Server Action to trigger on-demand revalidation for a country page.
 * Called from the manual refresh button in CountryDashboard.
 */
export async function revalidateCountryData(countryCode: string) {
  revalidatePath(`/country/${countryCode.toLowerCase()}`);
  return { revalidated: true, timestamp: new Date().toISOString() };
}

/**
 * Server Action to revalidate the globe/home page.
 */
export async function revalidateGlobeData() {
  revalidatePath("/");
  return { revalidated: true, timestamp: new Date().toISOString() };
}
