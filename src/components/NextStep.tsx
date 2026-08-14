import { Link } from "@tanstack/react-router";
import { Target, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotionBar, CountUp } from "@/components/motion";
import type { SubjectProgress } from "@/lib/data";

export function NextStep({ subjects }: { subjects: SubjectProgress[] }) {
  const candidates = subjects.flatMap((s) =>
    s.goals
      .filter((g) => !g.completed)
      .map((g) => ({ goal: g, subject: s.subject })),
  );

  if (candidates.length === 0) return null;

  const next = candidates.sort((a, b) => b.goal.percent - a.goal.percent)[0]!;

  return (
    <section className="card-premium relative overflow-hidden p-6">
      <div className="bg-brand absolute inset-x-0 top-0 h-1" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              🎯 Seu próximo objetivo
            </p>
            <h3 className="font-display text-lg font-bold">{next.goal.name}</h3>
            <p className="text-sm text-muted-foreground">{next.subject.name}</p>
          </div>
        </div>
        <Button asChild className="gap-2">
          <Link to="/disciplinas">
            Continuar meta <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Você realizou <strong className="text-foreground">{next.goal.done}</strong> de{" "}
            {next.goal.target_quantity} · faltam{" "}
            <strong className="text-foreground">{next.goal.remaining}</strong>
          </span>
          <span className="font-display font-bold text-primary">
            <CountUp value={next.goal.percent} suffix="%" />
          </span>
        </div>
        <MotionBar percent={next.goal.percent} />
      </div>
    </section>
  );
}
