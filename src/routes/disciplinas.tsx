import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GoalCard, GoalFormDialog, RegisterProcedureDialog } from "@/components/goals";
import { useProfile, useProgressData } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/disciplinas")({
  head: () => ({
    meta: [
      { title: "Disciplinas | Odonto Progress" },
      {
        name: "description",
        content:
          "Cadastre metas por disciplina e registre procedimentos clínicos do seu período de Odontologia.",
      },
      { property: "og:title", content: "Disciplinas e metas | Odonto Progress" },
      {
        property: "og:description",
        content: "Organize metas e procedimentos de cada disciplina do seu período.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Disciplinas />
    </AppShell>
  ),
});

function Disciplinas() {
  const profile = useProfile();
  const [period, setPeriod] = useState<string | null>(null);
  const periodNumber = Number(period ?? profile.data?.period_number ?? 6);
  const progress = useProgressData(periodNumber);
  const subjects = progress.data?.subjects ?? [];
  const [selected, setSelected] = useState<string | null>(null);

  const current = subjects.find((s) => s.subject.id === selected) ?? subjects[0];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Disciplinas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina suas metas e registre cada procedimento realizado.
          </p>
        </div>
        <Select
          value={String(periodNumber)}
          onValueChange={(v) => {
            setPeriod(v);
            setSelected(null);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
              <SelectItem key={p} value={String(p)}>
                {p}º Período
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {progress.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : subjects.length === 0 ? (
        <div className="card-premium p-8 text-center text-sm text-muted-foreground">
          Ainda não há disciplinas cadastradas para o {periodNumber}º período.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-2">
            {subjects.map((s) => {
              const active = current?.subject.id === s.subject.id;
              return (
                <button
                  key={s.subject.id}
                  onClick={() => setSelected(s.subject.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? "border-primary bg-secondary"
                      : "border-border bg-card hover:bg-secondary/60"
                  }`}
                >
                  <p className="text-xs text-muted-foreground">{s.subject.code}</p>
                  <p className="font-display text-sm font-bold">{s.subject.name}</p>
                  <Progress value={Math.min(s.percent, 100)} className="mt-2" />
                </button>
              );
            })}
          </aside>

          {current && (
            <section className="space-y-5">
              <div className="card-premium flex flex-wrap items-center justify-between gap-4 p-6">
                <div>
                  <p className="text-xs text-muted-foreground">{current.subject.code}</p>
                  <h2 className="font-display text-xl font-bold">{current.subject.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {current.completedGoals} de {current.goals.length} metas concluídas ·{" "}
                    {current.percent.toFixed(0)}%
                  </p>
                  {current.subject.is_clinic_integrated && (
                    <p className="mt-2 text-xs text-primary">
                      Clínica Integrada: cadastre livremente as metas exigidas pelo seu professor.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {current.goals.length > 0 && (
                    <RegisterProcedureDialog
                      goals={current.goals}
                      subjectId={current.subject.id}
                      trigger={<Button variant="secondary">Registrar procedimento</Button>}
                    />
                  )}
                  <GoalFormDialog
                    subjectId={current.subject.id}
                    trigger={
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Nova meta
                      </Button>
                    }
                  />
                </div>
              </div>

              {current.goals.length === 0 ? (
                <div className="card-premium p-8 text-center text-sm text-muted-foreground">
                  Nenhuma meta cadastrada nesta disciplina. Comece criando sua primeira meta.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {current.goals.map((g) => (
                    <GoalCard key={g.id} goal={g} subjectId={current.subject.id} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
