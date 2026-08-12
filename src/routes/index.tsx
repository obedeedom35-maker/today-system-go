import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, BookOpen, Sparkles, Target, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProgressRing } from "@/components/ProgressRing";
import { useProfile, useProgressData, useNotifications } from "@/lib/data";
import { dailyMotivation, randomMessage, welcomeBackMessages } from "@/lib/motivation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Odonto Progress" },
      {
        name: "description",
        content:
          "Acompanhe metas, procedimentos clínicos e estudos do seu período de Odontologia em um painel único.",
      },
      { property: "og:title", content: "Odonto Progress — seu progresso na Odontologia" },
      {
        property: "og:description",
        content: "Metas, procedimentos e estudos com IA para estudantes de Odontologia.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Dashboard />
    </AppShell>
  ),
});

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string | undefined;
}) {
  return (
    <div className="card-premium p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="font-display mt-4 text-3xl font-extrabold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const profile = useProfile();
  const periodNumber = profile.data?.period_number ?? 6;
  const progress = useProgressData(periodNumber);
  const notifications = useNotifications();

  const subjects = progress.data?.subjects ?? [];
  const overall = progress.data?.overall ?? 0;
  const totalGoals = subjects.reduce((a, s) => a + s.goals.length, 0);
  const done = subjects.reduce((a, s) => a + s.completedGoals, 0);
  const procedures = subjects.reduce((a, s) => a + s.totalDone, 0);
  const firstName = (profile.data?.full_name ?? "").split(" ")[0] || "estudante";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{randomMessage(welcomeBackMessages)}</p>
          <h1 className="font-display text-3xl font-extrabold">Olá, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {periodNumber}º Período · {profile.data?.course ?? "Odontologia"}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/disciplinas">
            Registrar procedimento <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <section className="card-premium flex flex-col items-center gap-8 p-8 md:flex-row">
        <ProgressRing percent={overall} label="do período" size={148} />
        <div className="flex-1 space-y-3">
          <h2 className="font-display text-xl font-bold">Progresso geral do período</h2>
          <p className="text-sm text-muted-foreground">{dailyMotivation(overall)}</p>
          <Progress value={Math.min(overall, 100)} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={BookOpen} label="Disciplinas" value={String(subjects.length)} />
        <Stat
          icon={Target}
          label="Metas concluídas"
          value={`${done}/${totalGoals}`}
          hint={totalGoals === 0 ? "Cadastre suas metas nas disciplinas" : undefined}
        />
        <Stat icon={TrendingUp} label="Procedimentos" value={String(procedures)} />
        <Stat
          icon={Bell}
          label="Notificações"
          value={String((notifications.data ?? []).filter((n) => !n.is_read).length)}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Suas disciplinas</h2>
          <Link to="/disciplinas" className="text-sm font-medium text-primary hover:underline">
            Ver todas
          </Link>
        </div>

        {progress.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando disciplinas...</p>
        ) : subjects.length === 0 ? (
          <div className="card-premium p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma disciplina cadastrada para o {periodNumber}º período ainda.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {subjects.map((s) => (
              <Link
                key={s.subject.id}
                to="/disciplinas"
                className="card-premium p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.subject.code}</p>
                    <h3 className="font-display text-base font-bold">{s.subject.name}</h3>
                  </div>
                  {s.subject.is_clinic_integrated && (
                    <span className="rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold text-primary">
                      Clínica
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {s.completedGoals}/{s.goals.length} metas concluídas
                  </span>
                  <span className="font-display font-bold text-primary">
                    {s.percent.toFixed(0)}%
                  </span>
                </div>
                <Progress value={Math.min(s.percent, 100)} className="mt-2" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-brand flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6" />
          <div>
            <p className="font-display font-bold">Estude com Inteligência Artificial</p>
            <p className="text-sm text-primary-foreground/80">
              Envie seus materiais e gere resumos, flashcards e simulados corrigidos.
            </p>
          </div>
        </div>
        <Button asChild variant="secondary">
          <Link to="/estudos">Ir para Meus Estudos</Link>
        </Button>
      </section>
    </div>
  );
}
