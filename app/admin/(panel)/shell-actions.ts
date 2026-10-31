"use server";

import { auth } from "@/auth";
import { adminAction } from "@/lib/admin/action";
import { InquiryModel, ProjectModel } from "@/lib/db/models";

export type ShellData = {
  email: string;
  /** Leads waiting for a first reply. */
  waiting: number;
  /** Open leads whose follow-up day has arrived (UTC day). */
  followUps: number;
  leads: { id: string; name: string; company: string; stage: string }[];
  projects: { id: string; title: string }[];
};

/**
 * What the admin chrome needs on every screen: badge counts for the sidebar
 * and the records the command palette can jump to. Loaded by the client after
 * the page, so it never slows a screen down.
 */
export async function getShellData() {
  return adminAction<ShellData>(async () => {
    const session = await auth();
    const endOfToday = new Date();
    endOfToday.setUTCHours(23, 59, 59, 999);
    const open = { status: { $ne: "archived" } };
    const [waiting, followUps, leads, projects] = await Promise.all([
      InquiryModel.countDocuments({ ...open, $or: [{ stage: "new" }, { stage: { $exists: false }, status: { $in: ["new", "read"] } }] }),
      InquiryModel.countDocuments({ ...open, stage: { $in: ["new", "contacted", "proposal"] }, followUpAt: { $ne: null, $lte: endOfToday } }),
      InquiryModel.find(open, { name: 1, company: 1, stage: 1 }).sort({ createdAt: -1 }).limit(150).lean(),
      ProjectModel.find({}, { title: 1 }).sort({ order: 1 }).lean(),
    ]);
    return {
      email: session?.user?.email ?? "",
      waiting,
      followUps,
      leads: leads.map((l) => ({ id: String(l._id), name: l.name, company: l.company ?? "", stage: l.stage ?? "new" })),
      projects: projects.map((p) => ({ id: String(p._id), title: String(p.title) })),
    };
  });
}
