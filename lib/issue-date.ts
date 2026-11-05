import { cacheLife } from "next/cache";

/** "NOVEMBER 2026": the current issue date for the cover and the intro (refreshed daily). */
export async function issueDate() {
  "use cache";
  cacheLife("days");
  return new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "Asia/Karachi" }).toUpperCase();
}
