import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, Loader2 } from "lucide-react";

const DEFAULT_STEPS = [
  "Enviando",
  "Lendo materiais",
  "Extraindo conteúdo",
  "Identificando tópicos",
  "Organizando",
  "Gerando",
  "Revisando",
];

/** Etapas animadas do processamento da IA. */
export function AISteps({
  active,
  steps = DEFAULT_STEPS,
  intervalMs = 2600,
}: {
  active: boolean;
  steps?: string[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    const id = setInterval(() => {
      setIndex((i) => Math.min(i + 1, steps.length - 1));
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, steps.length, intervalMs]);

  if (!active) return null;

  return (
    <div className="card-premium space-y-2 p-5">
      <p className="font-display text-sm font-bold">A IA está trabalhando…</p>
      <ul className="space-y-1.5">
        {steps.map((step, i) => {
          const done = i < index;
          const current = i === index;
          return (
            <motion.li
              key={step}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: done || current ? 1 : 0.45, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 text-sm"
            >
              {done ? (
                <Check className="h-4 w-4 text-success" />
              ) : current ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <span className="h-4 w-4 rounded-full border border-border" />
              )}
              <span className={done ? "text-muted-foreground line-through" : ""}>{step}</span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
