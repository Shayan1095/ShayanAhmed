/** Starter habits for the Today page; edit them there. */
export const defaultHabits = [
  { id: "leads", name: "Reply to every lead", color: "#c9853f" },
  { id: "ship", name: "Ship something visible", color: "#5d7a4a" },
  { id: "learn", name: "Learn for 30 minutes", color: "#7a4f78" },
  { id: "move", name: "Move your body", color: "#3f6f8f" },
];

/** The planner's starting setup. Everything here can be changed in Planner → Customise. */
export const defaultPlannerConfig = {
  key: "planner",
  columns: [
    { id: "backlog", name: "Backlog", color: "#8a8172", done: false },
    { id: "week", name: "This week", color: "#3f6f8f", done: false },
    { id: "doing", name: "Doing", color: "#c9853f", done: false },
    { id: "done", name: "Done", color: "#5d7a4a", done: true },
  ],
  lists: [
    { id: "portfolio", name: "Portfolio", color: "#c9853f" },
    { id: "clients", name: "Clients", color: "#3f6f8f" },
    { id: "learning", name: "Learning", color: "#7a4f78" },
  ],
  tags: [
    { id: "content", name: "Content", color: "#b8901c" },
    { id: "outreach", name: "Outreach", color: "#b4525a" },
  ],
  weeklyGoal: 10,
  dailyGoal: 3,
  focusLength: 25,
  habits: defaultHabits,
};
