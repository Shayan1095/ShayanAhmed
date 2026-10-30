import type { Metadata } from "next";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader } from "@/components/admin/page-header";
import { dbState, getPlannerConfig, listTasks } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/dal";
import { PlannerTabs } from "../planner-tabs";
import { ProgressView } from "./progress-view";

export const metadata: Metadata = { title: "Progress" };

export default async function ProgressPage() {
  await requireAdmin();
  const state = await dbState();
  return (
    <>
      <PageHeader title="Planner" description="Plan your work, keep today in focus, and track what gets done." />
      <PlannerTabs active="progress" />
      {state === "ready" || state === "empty" ? (
        <ProgressView config={await getPlannerConfig()} tasks={await listTasks()} />
      ) : (
        <DbNotice state={state} />
      )}
    </>
  );
}
