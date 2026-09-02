import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Sparkles,
  Target,
  BookOpen,
  GraduationCap,
  BarChart3,
  Clock,
  Trophy,
  MessageSquareText,
  ArrowRight,
  CheckCircle2,
  Gift,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import videoAsset from "@/assets/apresentacao.mp4.asset.json";
import printInicio from "@/assets/app-print-inicio.jpg.asset.json";
import printObjetivo from "@/assets/app-print-objetivo.jpg.asset.json";
import printDisciplinas from "@/assets/app-print-disciplinas.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Odonto Progress — Sistema gratuito para alunos de Odontologia" },
      {
        name: "description",
        content:
          "Sistema gratuito feito por um aluno para alunos de Odontologia: metas clínicas, progresso do período, resumos, flashcards, simulados e Tutor IA.",
      },
      { property: "og:title", content: "Odonto Progress — gratuito para alunos de Odontologia" },
      {
        property: "og:description",
        content:
          "Acompanhe suas metas clínicas e estude com IA: resumos premium, flashcards e simulados. 100% gratuito, feito por aluno para alunos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: Target,
    title: "Metas clínicas organizadas",
    text: "Cadastre disciplinas do período e acompanhe meta a meta quantos procedimentos faltam para concluir cada exigência.",
  },
  {
    icon: BarChart3,
    title: "Progresso em tempo real",
    text: "Círculo de progresso, roadmap do período e desempenho com gráficos para você saber exatamente onde está.",
  },
  {
    icon: BookOpen,
    title: "Central de Estudos com IA",
    text: "Envie seus PDFs e gere resumos em formato apostila premium, flashcards (Sei/Revisar) e simulados adaptativos corrigidos.",
  },
  {
    icon: MessageSquareText,
    title: "Tutor IA com seus materiais",
    text: "Converse com seus próprios PDFs: o Tutor responde citando as fontes dos seus materiais.",
  },
  {
    icon: Clock,
    title: "Timer Pomodoro",
    text: "Sessões de foco com pausas para manter o ritmo de estudo sem cansar.",
  },
  {
    icon: Trophy,
    title: "Gamificação",
    text: "Conquistas, medalhas e sequências de estudo para manter a motivação ao longo do período.",
  },
];

const FREE_POINTS = [
  "Sem mensalidade, sem cartão de crédito",
  "Feito por aluno de Odontologia, para alunos",
  "Resumos, flashcards, simulados e Tutor IA inclusos",
  "Seus dados salvos com segurança",
];

function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.navigate({ to: "/painel" });
  }, [loading, user, router]);

  return (
    <div className="min-h-screen bg-surface text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/brand_logo.png" alt="Odonto Progress" className="h-10 w-auto" />
            <div className="leading-tight">
              <p className="font-display text-sm font-bold">Odonto Progress</p>
              <p className="text-[9px] font-bold tracking-wide text-primary uppercase">
                Criado pelo aluno OBEDE-EDOM
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Criar conta grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-brand relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary-foreground/5 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <Reveal>
            <div className="space-y-6 text-primary-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-1.5 text-xs font-bold tracking-widest uppercase">
                <Gift className="h-4 w-4" /> 100% gratuito · Exclusivo para alunos
              </span>
              <h1 className="font-display text-4xl leading-tight font-extrabold sm:text-5xl">
                Seu progresso na Odontologia, em um só lugar.
              </h1>
              <p className="max-w-lg text-base text-primary-foreground/85 sm:text-lg">
                Metas clínicas, progresso do período, resumos premium, flashcards,
                simulados corrigidos e um Tutor IA que conversa com os seus próprios
                materiais. Tudo de graça, feito por quem vive a mesma rotina que você.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/auth">
                    Começar agora — é grátis <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <p className="text-xs font-bold tracking-widest text-primary-foreground/70 uppercase">
                Criado pelo aluno OBEDE-EDOM
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="card-premium overflow-hidden p-2 shadow-[var(--shadow-glow)]">
              <video
                src={videoAsset.url}
                className="aspect-video w-full rounded-xl bg-black"
                controls
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
              <p className="px-3 py-2 text-center text-xs text-muted-foreground">
                Conheça o sistema e a faculdade no vídeo de apresentação
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Inside the app */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
        <Reveal>
          <div className="mb-12 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-bold tracking-widest text-secondary-foreground uppercase">
              <Target className="h-4 w-4" /> Por dentro da plataforma
            </span>
            <h2 className="font-display mt-4 text-3xl font-extrabold sm:text-4xl">
              Veja como é usar no dia a dia
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Telas reais do sistema rodando no celular: progresso do período, próximo
              objetivo sugerido e suas disciplinas com metas.
            </p>
          </div>
        </Reveal>

        <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { src: printInicio.url, alt: "Tela inicial do Odonto Progress com progresso do período" },
            { src: printObjetivo.url, alt: "Seu próximo objetivo e resumo de metas no Odonto Progress" },
            { src: printDisciplinas.url, alt: "Lista de disciplinas com progresso no Odonto Progress" },
          ].map((shot) => (
            <StaggerItem key={shot.src}>
              <div className="card-premium mx-auto max-w-[300px] overflow-hidden p-2 shadow-[var(--shadow-glow)] transition-transform duration-300 hover:-translate-y-1">
                <img
                  src={shot.src}
                  alt={shot.alt}
                  loading="lazy"
                  className="w-full rounded-xl"
                />
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-4 pb-16 lg:pb-24">
        <Reveal>
          <div className="mb-12 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-bold tracking-widest text-secondary-foreground uppercase">
              <GraduationCap className="h-4 w-4" /> Tudo que você precisa no período
            </span>
            <h2 className="font-display mt-4 text-3xl font-extrabold sm:text-4xl">
              O que o sistema faz por você
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Uma plataforma completa para organizar a faculdade de Odontologia — da clínica
              integrada até a véspera da prova.
            </p>
          </div>
        </Reveal>

        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <StaggerItem key={f.title}>
              <div className="card-premium h-full p-6 transition-transform duration-300 hover:-translate-y-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display mt-4 text-base font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Free for students */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <Reveal>
          <div className="bg-brand grid items-center gap-8 rounded-3xl p-8 text-primary-foreground shadow-[var(--shadow-glow)] lg:grid-cols-2 lg:p-12">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-1.5 text-xs font-bold tracking-widest uppercase">
                <Users className="h-4 w-4" /> De aluno para aluno
              </span>
              <h2 className="font-display text-3xl font-extrabold">
                Gratuito. Hoje, amanhã e sempre.
              </h2>
              <p className="text-sm text-primary-foreground/85 sm:text-base">
                O Odonto Progress foi criado pelo aluno OBEDE-EDOM para ajudar a turma a
                acompanhar metas clínicas e estudar melhor. Não existe plano pago: todo
                recurso está liberado para todos os alunos.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth">
                  Criar minha conta grátis <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ul className="space-y-3">
              {FREE_POINTS.map((p) => (
                <li
                  key={p}
                  className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 px-4 py-3 text-sm font-medium"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0" /> {p}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center">
          <img src="/brand_logo.png" alt="Odonto Progress" className="h-12 w-auto" />
          <p className="font-display text-sm font-bold">Odonto Progress</p>
          <p className="rounded-full bg-secondary px-4 py-1.5 font-display text-[11px] font-extrabold tracking-widest text-secondary-foreground uppercase">
            Criado pelo aluno OBEDE-EDOM · Gratuito para alunos
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Resumos, flashcards e simulados com Inteligência Artificial
          </div>
        </div>
      </footer>
    </div>
  );
}
