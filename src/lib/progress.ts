export type GoalRow = {
  id: string;
  subject_id: string;
  name: string;
  category: string | null;
  target_quantity: number;
  notes: string | null;
};

export type GoalProgress = GoalRow & {
  done: number;
  remaining: number;
  percent: number;
  completed: boolean;
  exceeded: number;
};

export function buildGoalProgress(goal: GoalRow, done: number): GoalProgress {
  const percent = goal.target_quantity > 0 ? (done / goal.target_quantity) * 100 : 0;
  return {
    ...goal,
    done,
    remaining: Math.max(goal.target_quantity - done, 0),
    percent,
    completed: done >= goal.target_quantity,
    exceeded: Math.max(done - goal.target_quantity, 0),
  };
}

export function overallPercent(goals: GoalProgress[]) {
  const target = goals.reduce((acc, g) => acc + g.target_quantity, 0);
  const done = goals.reduce((acc, g) => acc + Math.min(g.done, g.target_quantity), 0);
  return target > 0 ? (done / target) * 100 : 0;
}

export function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}
