import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { buildGoalProgress, type GoalProgress } from "./progress";

export type Subject = {
  id: string;
  period_number: number;
  code: string;
  name: string;
  is_clinic_integrated: boolean;
};

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSubjects(periodNumber?: number) {
  return useQuery({
    queryKey: ["subjects", periodNumber],
    enabled: periodNumber != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("period_number", periodNumber!)
        .order("code");
      if (error) throw error;
      return data as Subject[];
    },
  });
}

export type SubjectProgress = {
  subject: Subject;
  goals: GoalProgress[];
  percent: number;
  completedGoals: number;
  ongoingGoals: number;
  remaining: number;
  totalDone: number;
};

export function useProgressData(periodNumber?: number) {
  const { user } = useAuth();
  const subjects = useSubjects(periodNumber);

  return useQuery({
    queryKey: ["progress", user?.id, periodNumber, subjects.data?.length],
    enabled: !!user && !!subjects.data,
    queryFn: async (): Promise<{ subjects: SubjectProgress[]; overall: number }> => {
      const [{ data: goals, error: goalError }, { data: records, error: recError }] =
        await Promise.all([
          supabase.from("goals").select("*").eq("user_id", user!.id),
          supabase.from("procedure_records").select("goal_id, quantity").eq("user_id", user!.id),
        ]);
      if (goalError) throw goalError;
      if (recError) throw recError;

      const doneByGoal = new Map<string, number>();
      for (const r of records ?? []) {
        doneByGoal.set(r.goal_id, (doneByGoal.get(r.goal_id) ?? 0) + r.quantity);
      }

      const list: SubjectProgress[] = (subjects.data ?? []).map((subject) => {
        const subjectGoals = (goals ?? [])
          .filter((g) => g.subject_id === subject.id)
          .map((g) => buildGoalProgress(g, doneByGoal.get(g.id) ?? 0));
        const target = subjectGoals.reduce((a, g) => a + g.target_quantity, 0);
        const done = subjectGoals.reduce((a, g) => a + Math.min(g.done, g.target_quantity), 0);
        return {
          subject,
          goals: subjectGoals,
          percent: target > 0 ? (done / target) * 100 : 0,
          completedGoals: subjectGoals.filter((g) => g.completed).length,
          ongoingGoals: subjectGoals.filter((g) => !g.completed).length,
          remaining: subjectGoals.reduce((a, g) => a + g.remaining, 0),
          totalDone: subjectGoals.reduce((a, g) => a + g.done, 0),
        };
      });

      const target = list.reduce(
        (a, s) => a + s.goals.reduce((b, g) => b + g.target_quantity, 0),
        0,
      );
      const done = list.reduce(
        (a, s) => a + s.goals.reduce((b, g) => b + Math.min(g.done, g.target_quantity), 0),
        0,
      );

      return { subjects: list, overall: target > 0 ? (done / target) * 100 : 0 };
    },
  });
}

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data;
    },
  });
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return (data ?? []).filter((n) => !n.is_read).length;
}

export async function notify(
  userId: string,
  title: string,
  message: string,
  kind: "info" | "sucesso" | "alerta" = "info",
) {
  await supabase.from("notifications").insert({ user_id: userId, title, message, kind });
}

export function useProgressSnapshots() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["progress_snapshots", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_snapshots")
        .select("*")
        .eq("user_id", user!.id)
        .order("snapshot_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export async function saveProgressSnapshot(userId: string, percent: number) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing, error: fetchError } = await supabase
    .from("progress_snapshots")
    .select("id")
    .eq("user_id", userId)
    .eq("snapshot_date", today)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (!existing) {
    const { error: insertError } = await supabase
      .from("progress_snapshots")
      .insert({ user_id: userId, snapshot_date: today, percent });
    if (insertError) throw insertError;
  }
}
