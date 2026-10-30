import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { projectTabs, SubTabs } from "@/components/admin/sub-tabs";
import { getProjectById } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/dal";
import { canUpload } from "../../content-actions";
import { emptyProject, ProjectEditor } from "../project-editor";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const p = await getProjectById(id);
  if (!p) notFound();
  const { id: _id, order, ...rest } = p;
  void _id;
  void order;
  return (
    <>
      <PageHeader title={p.title} description={p.published ? "Live on the site." : "Draft: not on the site yet."} />
      <SubTabs tabs={projectTabs} active="" />
      <ProjectEditor id={id} initial={{ ...emptyProject, ...rest }} canUpload={await canUpload()} />
    </>
  );
}
