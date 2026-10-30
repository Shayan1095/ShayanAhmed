import type { Metadata } from "next";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader } from "@/components/admin/page-header";
import { dbState, getPlannerConfig } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/dal";
import { PlannerTabs } from "../planner-tabs";
import { CustomizeForm } from "./customize-form";

export const metadata: Metadata = { title: "Customise planner" };

export default async function CustomizePage() {
  await requireAdmin();
  const state = await dbState();
  return (
    <>
      <PageHeader title="Planner" description="Plan your work, keep today in focus, and track what gets done." />
      <PlannerTabs active="customize" />
      {state === "ready" || state === "empty" ? <CustomizeForm initial={await getPlannerConfig()} /> : <DbNotice state={state} />}
    </>
  );
}
