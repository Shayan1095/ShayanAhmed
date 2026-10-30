import type { Metadata } from "next";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader } from "@/components/admin/page-header";
import { projectTabs, SubTabs } from "@/components/admin/sub-tabs";
import { dbState } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/dal";
import { canUpload } from "../../content-actions";
import { emptyProject, ProjectEditor } from "../project-editor";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireAdmin();
  const state = await dbState();
  return (
    <>
      <PageHeader title="Projects" description="Add a project. It stays a draft until you switch on Published." />
      <SubTabs tabs={projectTabs} active="/admin/projects/new" />
      {state === "ready" ? <ProjectEditor id={null} initial={emptyProject} canUpload={await canUpload()} /> : <DbNotice state={state} />}
    </>
  );
}
