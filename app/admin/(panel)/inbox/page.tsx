import type { Metadata } from "next";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader } from "@/components/admin/page-header";
import { stages } from "@/lib/admin/crm";
import { dbState, listInquiries } from "@/lib/admin/data";
import type { Stage } from "@/lib/admin/types";
import { requireAdmin } from "@/lib/auth/dal";
import { InboxView } from "./inbox-view";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: PageProps<"/admin/inbox">) {
  await requireAdmin();
  const state = await dbState();
  const { lead, new: isNew, stage } = await searchParams;
  const focusStage = stages.some((s) => s.id === stage) ? (stage as Stage) : undefined;
  return (
    <>
      <PageHeader
        title="Leads"
        description="Every enquiry and lead, from first message to signed project. Reply fast, set a follow-up, move them along."
      />
      {state === "ready" || state === "empty" ? (
        <InboxView
          initial={await listInquiries()}
          initialLead={typeof lead === "string" ? lead : undefined}
          initialNew={isNew === "1"}
          initialStage={focusStage}
        />
      ) : (
        <DbNotice state={state} />
      )}
    </>
  );
}
