import type { Metadata } from "next";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader } from "@/components/admin/page-header";
import { dbState, listInquiries } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/dal";
import { InboxView } from "./inbox-view";

export const metadata: Metadata = { title: "Inbox" };

export default async function InboxPage() {
  await requireAdmin();
  const state = await dbState();
  return (
    <>
      <PageHeader title="Inbox" description="Enquiries from the contact form. Reply by email, then mark them replied so nobody waits." />
      {state === "ready" || state === "empty" ? <InboxView initial={await listInquiries()} /> : <DbNotice state={state} />}
    </>
  );
}
