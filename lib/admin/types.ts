/** Admin-only data shapes shared by server and client components. */

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  projectType: string;
  budget: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  /** False when the notification email failed; the enquiry is still saved. */
  emailed: boolean;
  createdAt: string;
};

export type Priority = "none" | "low" | "medium" | "high" | "urgent";

export type Task = {
  id: string;
  title: string;
  notes: string;
  columnId: string;
  listId: string;
  tags: string[];
  priority: Priority;
  /** ISO date at UTC midnight of the due day, or null. */
  due: string | null;
  checklist: { id: string; text: string; done: boolean }[];
  order: number;
  completedAt: string | null;
  createdAt: string;
};

export type PlannerColumn = { id: string; name: string; color: string; done: boolean };
export type PlannerList = { id: string; name: string; color: string };
export type PlannerTag = { id: string; name: string; color: string };

export type PlannerConfig = {
  columns: PlannerColumn[];
  lists: PlannerList[];
  tags: PlannerTag[];
  weeklyGoal: number;
};
