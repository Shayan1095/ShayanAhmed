/** Admin-only data shapes shared by server and client components. */

export type Stage = "new" | "contacted" | "proposal" | "won" | "lost";

export type LeadActivity = {
  id: string;
  kind: "stage" | "note" | "followup" | "value" | "email" | "created";
  text: string;
  at: string;
};

/** A lead: a contact-form enquiry or one added by hand, tracked through the pipeline. */
export type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  projectType: string;
  budget: string;
  message: string;
  /** Inbox state: unread / read / replied, or archived (hidden from the pipeline). */
  status: "new" | "read" | "replied" | "archived";
  /** False when the notification email failed; the enquiry is still saved. */
  emailed: boolean;
  source: string;
  stage: Stage;
  /** Expected deal value, in the CRM currency. 0 = not estimated yet. */
  value: number;
  /** ISO date at UTC midnight of the follow-up day, or null. */
  followUpAt: string | null;
  firstReplyAt: string | null;
  closedAt: string | null;
  activity: LeadActivity[];
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

export type PlannerHabit = { id: string; name: string; color: string };

export type PlannerConfig = {
  columns: PlannerColumn[];
  lists: PlannerList[];
  tags: PlannerTag[];
  weeklyGoal: number;
  /** Tasks to finish for a day to count towards the streak. */
  dailyGoal: number;
  habits: PlannerHabit[];
  /** Focus timer length, minutes. */
  focusLength: number;
};

/** One local day on the Today page. */
export type PlannerDay = {
  date: string;
  intention: string;
  top3: string[];
  habits: string[];
  focusMinutes: number;
  focusSessions: number;
  review: { win: string; improve: string; energy: number };
  reviewedAt: string | null;
};
