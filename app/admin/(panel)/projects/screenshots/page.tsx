import type { Metadata } from "next";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader } from "@/components/admin/page-header";
import { projectTabs, SubTabs } from "@/components/admin/sub-tabs";
import { dbState, listProjects } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/dal";
import { ScreenshotsBoard } from "./screenshots-board";

export const metadata: Metadata = { title: "Screenshots" };

export default async function ScreenshotsPage() {
  await requireAdmin();
  const state = await dbState();
  return (
    <>
      <PageHeader
        title="Projects"
        description="Upload or replace each project's screenshots. Drop a file on a slot or click it; changes go live straight away."
      />
      <SubTabs tabs={projectTabs} active="/admin/projects/screenshots" />
      {state === "ready" ? (
        <ScreenshotsBoard
          projects={(await listProjects()).map((p) => ({
            id: p.id,
            title: p.title,
            kind: p.kind,
            published: p.published,
            cover: p.cover,
            customerView: p.customerView,
            ownerView: p.ownerView,
          }))}
        />
      ) : (
        <DbNotice state={state} />
      )}
    </>
  );
}
