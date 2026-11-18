import { motion, useReducedMotion } from "motion/react";
import { Award, Flame, GraduationCap, Sparkles, TrendingUp } from "lucide-react";
import { cycleClosingMessage, cycleMotivationalMessages } from "@/lib/motivation";

const accents = [
  { icon: Flame, className: "text-celebration-coral border-celebration-coral/25 bg-celebration-coral/10" },
  { icon: TrendingUp, className: "text-celebration-teal border-celebration-teal/25 bg-celebration-teal/10" },
  { icon: GraduationCap, className: "text-celebration-gold border-celebration-gold/25 bg-celebration-gold/10" },
];

export function MotivationBanner({ periodNumber }: { periodNumber: number | null | undefined }) {
  const reduce = useReducedMotion();
  const closingMessage = cycleClosingMessage(periodNumber);

  return (
    <section aria-labelledby="cycle-motivation-title" className="celebration-band relative isolate overflow-hidden border-y border-celebration-teal/25 px-5 py-7 md:px-8 md:py-9">
      <div className="celebration-ribbon absolute inset-x-0 top-0 h-1" aria-hidden="true" />
      <div className="pointer-events-none absolute right-5 top-6 flex gap-3 opacity-30 md:right-8" aria-hidden="true">
        <Sparkles className="h-5 w-5 text-celebration-coral" />
        <Sparkles className="mt-4 h-3 w-3 text-celebration-gold" />
      </div>
      <div className="relative flex items-start gap-4 pr-8">
        <motion.div
          animate={reduce ? false : { rotate: [0, -6, 6, 0], y: [0, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-celebration-gold/30 bg-celebration-gold/15 text-celebration-gold"
        >
          <Award className="h-8 w-8" aria-hidden="true" />
        </motion.div>
        <h2 id="cycle-motivation-title" className="font-display self-center text-2xl font-extrabold leading-tight md:text-3xl">
          {closingMessage ? "Reta final do 6º período" : "Sua evolução merece ser reconhecida"}
        </h2>
      </div>
      {closingMessage && <p className="relative mt-5 max-w-4xl text-base leading-relaxed text-celebration-muted">{closingMessage}</p>}
      <ul className="relative mt-6 grid gap-3 md:grid-cols-3">
        {cycleMotivationalMessages.map((message, index) => {
          const accent = accents[index] ?? accents[0];
          if (!accent) return null;
          const Icon = accent.icon;
          return (
            <motion.li
              key={message}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.12 }}
              whileHover={reduce ? {} : { y: -4 }}
              className={`flex items-start gap-3 rounded-lg border p-4 text-sm font-semibold leading-relaxed ${accent.className}`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{message}</span>
            </motion.li>
          );
        })}
      </ul>
      <p className="relative mt-6 flex items-center gap-2 text-xs font-bold text-celebration-teal">
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
        Uma mensagem do aluno OBEDE-EDOM
      </p>
    </section>
  );
}