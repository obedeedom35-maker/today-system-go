import { motion, useReducedMotion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { CountUp, MotionBar } from "@/components/motion";
import { Button } from "@/components/ui/button";

function Particles() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  const dots = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-primary-foreground/25"
          style={{
            width: 6 + (i % 4) * 4,
            height: 6 + (i % 4) * 4,
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
          }}
          animate={{ y: [0, -22, 0], opacity: [0.15, 0.6, 0.15] }}
          transition={{
            duration: 5 + (i % 5),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.25,
          }}
        />
      ))}
      <motion.div
        className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary-foreground/10 blur-2xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-primary-foreground/10 blur-2xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export function HeroBanner({
  name,
  period,
  course,
  percent,
  message,
}: {
  name: string;
  period: number;
  course: string;
  percent: number;
  message: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="bg-brand relative overflow-hidden rounded-3xl p-6 text-primary-foreground shadow-[var(--shadow-glow)] md:p-10"
    >
      <Particles />
      <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Odonto Progress 3.0
          </span>
          <h1 className="font-display text-3xl font-extrabold leading-tight md:text-4xl">
            Olá, {name} 👋
          </h1>
          <p className="text-sm text-primary-foreground/85">
            {period}º Período · {course}
          </p>
          <p className="text-base text-primary-foreground/90">{message}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild variant="secondary" className="gap-2">
              <Link to="/disciplinas">
                Registrar procedimento <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="gap-2 border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
            >
              <Link to="/ia">Abrir Tutor IA</Link>
            </Button>
          </div>
        </div>

        <div className="w-full max-w-xs rounded-2xl bg-primary-foreground/12 p-5 backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-primary-foreground/70">
            Progresso do período
          </p>
          <p className="font-display mt-1 text-5xl font-extrabold">
            <CountUp value={percent} decimals={0} suffix="%" />
          </p>
          <MotionBar percent={percent} className="mt-4 bg-primary-foreground/25" />
          <p className="mt-3 text-xs text-primary-foreground/80">
            Cada procedimento registrado te aproxima dos 100%.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
