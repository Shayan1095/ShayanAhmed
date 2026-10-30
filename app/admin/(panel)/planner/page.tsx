import type { Metadata } from "next";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader } from "@/components/admin/page-header";
import { dbState, getPlannerConfig, listTasks } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/dal";
import { Planner } from "./planner";
import { PlannerTabs } from "./planner-tabs";

export const metadata: Metadata = { title: "Planner" };

export default async function PlannerPage({ searchParams }: PageProps<"/admin/planner">) {
  await requireAdmin();
  const state = await dbState();
  const { view } = await searchParams;
  const initialView = view === "list" || view === "today" ? view : "board";
  return (
    <>
      <PageHeader title="Planner" description="Plan your work, keep today in focus, and track what gets done." />
      <PlannerTabs active="tasks" />
      {state === "ready" || state === "empty" ? (
        <Planner config={await getPlannerConfig()} initial={await listTasks()} initialView={initialView} />
      ) : (
        <DbNotice state={state} />
      )}
    </>
  );
}
