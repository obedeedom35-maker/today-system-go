import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ProgressRing } from "@/components/ProgressRing";
import { useProfile, useProgressData, useProgressSnapshots, saveProgressSnapshot } from "@/lib/data";
import { periodMessage, clinicMessages, randomMessage } from "@/lib/motivation";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  const { user } = useAuth();
  const profile = useProfile();
  const periodNumber = profile.data?.period_number ?? 6;
  const progress = useProgressData(periodNumber);
  const subjects = progress.data?.subjects ?? [];
  const overall = progress.data?.overall ?? 0;
  
  const snapshots = useProgressSnapshots();

  useEffect(() => {
    if (user?.id && !progress.isLoading && progress.data) {
      saveProgressSnapshot(user.id, overall).catch(console.error);
    }
  }, [user?.id, progress.isLoading, progress.data, overall]);

  const chartData = useMemo(() => {
    const data = snapshots.data || [];
    return data.map((s) => ({
      ...s,
      dateFormatted: new Date(s.snapshot_date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
    }));
  }, [snapshots.data]);

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

      {chartData.length > 0 && (
        <section className="card-premium p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold mb-6">Evolução Histórica</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="dateFormatted" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val}%`}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                    color: "hsl(var(--foreground))"
                  }} 
                  itemStyle={{ color: "hsl(var(--primary))" }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, "Progresso"]}
                  labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "0.25rem" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="percent" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
