import { motion, useReducedMotion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, type LucideIcon } from "lucide-react";
import { CountUp, MotionBar, Stagger, StaggerItem } from "@/components/motion";

export type ProgressBannerData = {
  label: string;
  icon: LucideIcon;
  percent: number;
  detail: string;
  to: "/" | "/disciplinas" | "/progresso" | "/estudos" | "/simulados" | "/ia" | "/desempenho";
};

function Confetti() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {Array.from({ length: 10 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-success"
          style={{ left: `${8 + i * 9}%`, top: "-10%" }}
          animate={{ y: [0, 120], opacity: [1, 0], rotate: [0, 180] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.18, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

export function ProgressBanners({ items }: { items: ProgressBannerData[] }) {
  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const complete = item.percent >= 100;
        return (
          <StaggerItem key={item.label}>
            <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
              <Link
                to={item.to}
                className="card-premium relative block overflow-hidden p-5 transition-shadow hover:shadow-[var(--shadow-glow)]"
              >
                {complete && <Confetti />}
                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                  </div>
                  {complete ? (
                    <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-[11px] font-bold text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
                    </span>
                  ) : (
                    <span className="font-display text-lg font-extrabold text-primary">
                      <CountUp value={item.percent} suffix="%" />
                    </span>
                  )}
                </div>
                <MotionBar percent={item.percent} className="relative mt-4" />
                <p className="relative mt-2 text-xs text-muted-foreground">{item.detail}</p>
              </Link>
            </motion.div>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
