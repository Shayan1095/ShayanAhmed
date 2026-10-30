import type { Metadata } from "next";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader } from "@/components/admin/page-header";
import { dbState, listFaqs } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/dal";
import { FaqManager } from "./faq-manager";

export const metadata: Metadata = { title: "FAQ" };

export default async function FaqPage() {
  await requireAdmin();
  const state = await dbState();
  return (
    <>
      <PageHeader
        title="FAQ"
        description="Answer the questions clients ask before the first call. Only published questions with an answer show on the site; Google can read them too."
      />
      {state === "ready" ? <FaqManager initial={await listFaqs()} /> : <DbNotice state={state} />}
    </>
  );
}
