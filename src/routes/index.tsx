import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, BookOpen, Sparkles, Target, TrendingUp, Award, CheckCircle2, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { ProgressBanners } from "@/components/ProgressBanners";
import { Roadmap } from "@/components/Roadmap";
import { NextStep } from "@/components/NextStep";
import { Reveal, Stagger, StaggerItem, CountUp, MotionBar } from "@/components/motion";
import { useProfile, useProgressData, useNotifications, useProgressSnapshots } from "@/lib/data";
import { dailyMotivation, randomMessage, welcomeBackMessages } from "@/lib/motivation";
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
  decimals = 0,
  suffix = "",
  extra,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  extra?: string | undefined;
  hint?: string | undefined;
}) {
  return (
    <div className="card-premium p-5 transition-transform duration-300 hover:-translate-y-1">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="font-display mt-4 text-3xl font-extrabold">
        <CountUp value={value} decimals={decimals} suffix={suffix} />
        {extra}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const profile = useProfile();
  const periodNumber = profile.data?.period_number ?? 6;
  const progress = useProgressData(periodNumber);
  const notifications = useNotifications();
  const snapshots = useProgressSnapshots();

  const subjects = progress.data?.subjects ?? [];
  const overall = progress.data?.overall ?? 0;
  const totalGoals = subjects.reduce((a, s) => a + s.goals.length, 0);
  const done = subjects.reduce((a, s) => a + s.completedGoals, 0);
  const procedures = subjects.reduce((a, s) => a + s.totalDone, 0);
  const firstName = (profile.data?.full_name ?? "").split(" ")[0] || "estudante";

  const historyData = snapshots.data?.map(s => ({
    date: new Date(s.snapshot_date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
    progresso: s.percent
  })) || [];

  const chartData = historyData.length > 0 ? historyData : [
    { date: "1 Ago", progresso: 10 },
    { date: "8 Ago", progresso: 25 },
    { date: "15 Ago", progresso: 45 },
    { date: "Hoje", progresso: overall },
  ];

  const recentAchievements = notifications.data?.filter(n => n.kind === "sucesso").slice(0, 3) || [];

  return (
    <div className="space-y-8">
      <Reveal>
        <HeroBanner
          name={firstName}
          period={periodNumber}
          course={profile.data?.course ?? "Odontologia"}
          percent={overall}
          message={randomMessage(welcomeBackMessages)}
        />
      </Reveal>

      <Reveal delay={0.05}>
        <ProgressBanners
          items={[
            {
              label: "Visão Geral",
              icon: Target,
              percent: overall,
              detail: "Progresso do período",
              to: "/disciplinas",
            },
            {
              label: "Metas",
              icon: CheckCircle2,
              percent: totalGoals > 0 ? Math.round((done / totalGoals) * 100) : 0,
              detail: `${done} de ${totalGoals} concluídas`,
              to: "/disciplinas",
            },
            {
              label: "Clínica",
              icon: TrendingUp,
              percent: Math.min(100, procedures * 5),
              detail: `${procedures} procedimentos feitos`,
              to: "/disciplinas",
            },
          ]}
        />
      </Reveal>

      <Reveal delay={0.15}>
        {/* Gráfico de Evolução - Full width, premium */}
        <div className="card-premium p-6 relative overflow-hidden">
          {/* Background decoration blobs */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
          <div className="absolute -left-8 bottom-0 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold">Evolução do Progresso</h2>
                <p className="text-xs text-muted-foreground">Histórico de progresso do período</p>
              </div>
            </div>

            {/* Stats chips */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-display text-3xl font-extrabold text-primary leading-none">
                  {overall.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">progresso atual</p>
              </div>
            </div>
          </div>

          {/* Mini stat pills */}
          <div className="flex flex-wrap gap-2 mb-4 relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 text-xs font-semibold">
              <CheckCircle2 className="h-3 w-3" /> {done}/{totalGoals} metas
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 text-xs font-semibold">
              <TrendingUp className="h-3 w-3" /> {procedures} procedimentos
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              <BookOpen className="h-3 w-3" /> {subjects.length} disciplinas
            </span>
          </div>

          {/* Chart */}
          <div className="relative z-10 h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="gradProgresso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  domain={[0, 100]}
                  width={38}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderRadius: '12px',
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    padding: '10px 14px',
                  }}
                  itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 700 }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontSize: '12px', marginBottom: '4px' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Progresso']}
                />
                <Area
                  type="monotone"
                  dataKey="progresso"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#gradProgresso)"
                  dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <section className="grid gap-4 md:grid-cols-2">
          {/* Conquistas Recentes */}
          <div className="card-premium p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Conquistas Recentes</h2>
              <Award className="h-5 w-5 text-primary" />
            </div>
            
            {recentAchievements.length > 0 ? (
              <div className="space-y-4 flex-1">
                {recentAchievements.map(a => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-success">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-3">
                  <Award className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium">Nenhuma conquista ainda</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete metas para ganhar conquistas.
                </p>
              </div>
            )}
            
            <Button variant="ghost" className="w-full mt-4 text-xs" asChild>
              <Link to="/disciplinas">Ver todas as metas</Link>
            </Button>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.2}>
        <Roadmap percent={overall} />
      </Reveal>

      <Reveal delay={0.25}>
        <NextStep subjects={subjects} />
      </Reveal>

      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <Stat icon={BookOpen} label="Disciplinas" value={subjects.length} />
        </StaggerItem>
        <StaggerItem>
          <Stat
            icon={Target}
            label="Metas concluídas"
            value={done}
            extra={`/${totalGoals}`}
            hint={totalGoals === 0 ? "Cadastre suas metas nas disciplinas" : undefined}
          />
        </StaggerItem>
        <StaggerItem>
          <Stat icon={TrendingUp} label="Procedimentos" value={procedures} />
        </StaggerItem>
        <StaggerItem>
          <Stat
            icon={Bell}
            label="Notificações"
            value={(notifications.data ?? []).filter((n) => !n.is_read).length}
          />
        </StaggerItem>
      </Stagger>

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
          <Stagger className="grid gap-4 md:grid-cols-2">
            {subjects.map((s) => (
              <StaggerItem key={s.subject.id}>
                <Link
                  to="/disciplinas"
                  className="card-premium block p-5 transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{s.subject.code}</p>
                      <h3 className="font-display text-base font-bold">🦷 {s.subject.name}</h3>
                    </div>
                    {s.subject.is_clinic_integrated && (
                      <span className="rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold text-primary">
                        Clínica
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {s.completedGoals}/{s.goals.length} metas concluídas · {s.remaining} restantes
                    </span>
                    <span className="font-display font-bold text-primary">
                      {s.percent.toFixed(0)}%
                    </span>
                  </div>
                  <MotionBar percent={s.percent} className="mt-2" />
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

      <Reveal>
        <section className="bg-brand flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6 text-primary-foreground shadow-[var(--shadow-glow)]">
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
      </Reveal>
    </div>
  );
}

