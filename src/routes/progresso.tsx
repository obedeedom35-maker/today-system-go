import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ProgressRing } from "@/components/ProgressRing";
import { useProfile, useProgressData } from "@/lib/data";
import { periodMessage, clinicMessages, randomMessage } from "@/lib/motivation";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/progresso")({
  head: () => ({
    meta: [
      { title: "Meu Progresso | Odonto Progress" },
      {
        name: "description",
        content:
          "Veja o percentual de conclusão de cada disciplina e do período completo em Odontologia.",
      },
      { property: "og:title", content: "Meu Progresso | Odonto Progress" },
      {
        property: "og:description",
        content: "Percentuais por disciplina, metas restantes e evolução do período.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Progresso />
    </AppShell>
  ),
});

function Progresso() {
  const profile = useProfile();
  const periodNumber = profile.data?.period_number ?? 6;
  const progress = useProgressData(periodNumber);
  const subjects = progress.data?.subjects ?? [];
  const overall = progress.data?.overall ?? 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Meu Progresso</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe o quanto falta para concluir as metas do {periodNumber}º período.
        </p>
      </header>

      <section className="card-premium flex flex-col items-center gap-8 p-8 md:flex-row">
        <ProgressRing percent={overall} size={148} label="do período" />
        <div className="flex-1 space-y-3">
          <h2 className="font-display text-xl font-bold">Visão geral</h2>
          <p className="text-sm text-muted-foreground">{periodMessage(overall)}</p>
          <p className="text-xs text-muted-foreground">{randomMessage(clinicMessages)}</p>
        </div>
      </section>

      <section className="space-y-4">
        {subjects.map((s) => (
          <div key={s.subject.id} className="card-premium p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{s.subject.code}</p>
                <h3 className="font-display text-base font-bold">{s.subject.name}</h3>
              </div>
              <span className="font-display text-2xl font-extrabold text-primary">
                {s.percent.toFixed(0)}%
              </span>
            </div>
            <Progress value={Math.min(s.percent, 100)} className="mt-3" />
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
              <span>Metas: {s.goals.length}</span>
              <span>Concluídas: {s.completedGoals}</span>
              <span>Em andamento: {s.ongoingGoals}</span>
              <span>Faltam: {s.remaining} procedimentos</span>
            </div>
          </div>
        ))}
        {subjects.length === 0 && !progress.isLoading && (
          <div className="card-premium p-8 text-center text-sm text-muted-foreground">
            Cadastre metas nas disciplinas para acompanhar seu progresso aqui.
          </div>
        )}
      </section>
    </div>
  );
}
