import type { Metadata } from "next";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader } from "@/components/admin/page-header";
import { dbState, getPlannerConfig, listDays, listTasks } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/dal";
import { PlannerTabs } from "../planner-tabs";
import { TodayView } from "./today-view";

export const metadata: Metadata = { title: "Today" };

/** Enough history for the 16-week heatmap and streaks (UTC date, a few days of slack). */
function historyStart() {
  return new Date(Date.now() - 130 * 86_400_000).toISOString().slice(0, 10);
}

/**
 * The daily ritual: morning plan (one intention, top 3), a focus timer,
 * habits, today's due tasks, a streak and level to keep, the 16-week
 * activity heatmap and an evening review that closes the day.
 */
export default async function TodayPage() {
  await requireAdmin();
  const state = await dbState();
  const since = historyStart();
  return (
    <>
      <PageHeader title="Planner" description="Plan the day, protect your focus, keep the streak alive." />
      <PlannerTabs active="today" />
      {state === "ready" || state === "empty" ? (
        <TodayView config={await getPlannerConfig()} initialTasks={await listTasks()} initialDays={await listDays(since)} />
      ) : (
        <DbNotice state={state} />
      )}
    </>
  );
}
