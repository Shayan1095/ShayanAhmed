import type { Metadata } from "next";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader } from "@/components/admin/page-header";
import { dbState, getPlannerConfig, listDays, listTasks } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/dal";
import { PlannerTabs } from "../planner-tabs";
import { ProgressView } from "./progress-view";
import { RitualInsights } from "./ritual-insights";

export const metadata: Metadata = { title: "Progress" };

/** History for streaks, focus and habits (UTC date, with slack for time zones). */
function historyStart() {
  return new Date(Date.now() - 130 * 86_400_000).toISOString().slice(0, 10);
}

export default async function ProgressPage() {
  await requireAdmin();
  const state = await dbState();
  return (
    <>
      <PageHeader title="Planner" description="Plan your work, keep today in focus, and track what gets done." />
      <PlannerTabs active="progress" />
      {state === "ready" || state === "empty" ? (
        <Progress />
      ) : (
        <DbNotice state={state} />
      )}
    </>
  );
}

async function Progress() {
  const [config, tasks, days] = await Promise.all([getPlannerConfig(), listTasks(), listDays(historyStart())]);
  return (
    <>
      <RitualInsights config={config} tasks={tasks} days={days} />
      <ProgressView config={config} tasks={tasks} />
    </>
  );
}
