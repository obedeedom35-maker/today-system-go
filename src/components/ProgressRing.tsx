import { motion, useReducedMotion } from "motion/react";
import { CountUp } from "@/components/motion";

export function ProgressRing({
  percent,
  size = 132,
  label,
}: {
  percent: number;
  size?: number;
  label?: string;
}) {
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(percent, 100));
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="fill-none stroke-secondary"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          className="fill-none stroke-primary"
          initial={{ strokeDashoffset: reduce ? offset : circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-extrabold">
          <CountUp value={clamped} suffix="%" />
        </span>
        {label && <span className="text-[11px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
