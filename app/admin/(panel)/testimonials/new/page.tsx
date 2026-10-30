import type { Metadata } from "next";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { SubTabs, testimonialTabs } from "@/components/admin/sub-tabs";
import { dbState, listProjects } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/dal";
import { canUpload } from "../../content-actions";
import { NewTestimonial } from "./new-testimonial";

export const metadata: Metadata = { title: "Add testimonial" };

export default async function NewTestimonialPage() {
  await requireAdmin();
  const state = await dbState();
  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Add a quote from a client. It stays a draft until the client agrees and you publish it."
      />
      <SubTabs tabs={testimonialTabs} active="/admin/testimonials/new" />
      {state === "ready" ? (
        <Panel className="max-w-[760px] p-5 sm:p-6">
          <NewTestimonial
            projects={(await listProjects()).map((p) => ({ slug: p.slug, title: p.title }))}
            canUpload={await canUpload()}
          />
        </Panel>
      ) : (
        <DbNotice state={state} />
      )}
    </>
  );
}
