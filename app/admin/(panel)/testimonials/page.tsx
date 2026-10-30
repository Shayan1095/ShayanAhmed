import type { Metadata } from "next";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader } from "@/components/admin/page-header";
import { SubTabs, testimonialTabs } from "@/components/admin/sub-tabs";
import { dbState, listProjects, listTestimonials } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/dal";
import { canUpload } from "../content-actions";
import { TestimonialsManager } from "./testimonials-manager";

export const metadata: Metadata = { title: "Testimonials" };

export default async function TestimonialsPage() {
  await requireAdmin();
  const state = await dbState();
  if (state !== "ready")
    return (
      <>
        <PageHeader title="Testimonials" />
        <DbNotice state={state} />
      </>
    );
  const [items, projects] = await Promise.all([listTestimonials(), listProjects()]);
  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Quotes from clients, shown in the Testimonials section and on the linked case study. Each one needs the client's consent before it can go live."
      />
      <SubTabs tabs={testimonialTabs} active="/admin/testimonials" />
      <TestimonialsManager
      initial={items}
      projects={projects.map((p) => ({ slug: p.slug, title: p.title }))}
      canUpload={await canUpload()}
      />
    </>
  );
}
