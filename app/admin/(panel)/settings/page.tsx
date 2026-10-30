import type { Metadata } from "next";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader } from "@/components/admin/page-header";
import { dbState, getSettings } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/dal";
import { canUpload } from "../content-actions";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const state = await dbState();
  if (state !== "ready")
    return (
      <>
        <PageHeader title="Settings" />
        <DbNotice state={state} />
      </>
    );
  const s = await getSettings();
  return (
    <>
      <PageHeader
        title="Site settings"
        description="The facts about you that appear across the site. Empty fields stay hidden, so only fill in what is true."
      />
      <SettingsForm
        canUpload={await canUpload()}
        initial={{
          availability: s.availability,
          email: s.email,
          linkedin: s.linkedin,
          bookingUrl: s.bookingUrl,
          startingPrice: s.startingPrice,
          budgetRanges: s.budgetRanges,
          projectTypes: s.projectTypes,
          specSheet: s.specSheet,
          portrait: s.portrait,
        }}
      />
    </>
  );
}
