import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DbNotice } from "@/components/admin/db-notice";
import { PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { dbState, listProjects } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth/dal";
import { ProjectsTable } from "./projects-table";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  await requireAdmin();
  const state = await dbState();
  return (
    <>
      <PageHeader
        title="Projects"
        description="Your portfolio. Drag to set the order on the site. Featured projects get the large slides; the rest go in the archive."
        actions={
          state === "ready" && (
            <Link href="/admin/projects/new" className={buttonVariants({ size: "lg" })}>
              <Plus /> New project
            </Link>
          )
        }
      />
      {state === "ready" ? <ProjectsTable initial={await listProjects()} /> : <DbNotice state={state} />}
    </>
  );
}
