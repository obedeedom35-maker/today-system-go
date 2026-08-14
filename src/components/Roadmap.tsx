import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MARKS = [0, 25, 50, 75, 90, 100];

export function Roadmap({ percent }: { percent: number }) {
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(percent, 100));

  return (
    <div className="card-premium p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">Roadmap do período</h2>
        <span className="text-xs text-muted-foreground">Marcos da sua jornada</span>
      </div>

      <div className="relative mt-10 pb-2">
        <div className="absolute top-3 right-2 left-2 h-1.5 rounded-full bg-secondary" />
        <motion.div
          className="bg-brand absolute top-3 left-2 h-1.5 rounded-full"
          style={{ maxWidth: "calc(100% - 1rem)" }}
          initial={{ width: reduce ? `${clamped}%` : 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="relative flex justify-between">
          {MARKS.map((mark, i) => {
            const reached = clamped >= mark;
            return (
              <motion.div
                key={mark}
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.09, duration: 0.4 }}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors",
                    reached
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {reached ? <Check className="h-3.5 w-3.5" /> : mark}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    reached ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {mark}%
                </span>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="mt-6 flex justify-center"
          initial={{ opacity: 0, y: reduce ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <span className="bg-brand rounded-full px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-[var(--shadow-glow)]">
            {clamped.toFixed(0)}% · VOCÊ ESTÁ AQUI
          </span>
        </motion.div>
      </div>
    </div>
  );
}
