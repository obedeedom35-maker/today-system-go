import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Play, Pause, SkipForward, RotateCcw, Coffee, Brain } from "lucide-react";

export const Route = createFileRoute("/pomodoro")({
  head: () => ({
    meta: [
      { title: "Pomodoro | Odonto Progress" },
      {
        name: "description",
        content: "Temporizador Pomodoro para otimizar seus estudos.",
      },
      { property: "og:title", content: "Pomodoro | Odonto Progress" },
      {
        property: "og:description",
        content: "Temporizador Pomodoro para otimizar seus estudos.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Pomodoro />
    </AppShell>
  ),
});

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

function Pomodoro() {
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkMode, setIsWorkMode] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Auto-switch mode
      if (isWorkMode) {
        setSessionCount((prev) => prev + 1);
        setIsWorkMode(false);
        setTimeLeft(BREAK_TIME);
      } else {
        setIsWorkMode(true);
        setTimeLeft(WORK_TIME);
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isWorkMode]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(isWorkMode ? WORK_TIME : BREAK_TIME);
  };

  const skipSession = () => {
    if (isWorkMode) {
      setSessionCount((prev) => prev + 1);
      setIsWorkMode(false);
      setTimeLeft(BREAK_TIME);
    } else {
      setIsWorkMode(true);
      setTimeLeft(WORK_TIME);
    }
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalTime = isWorkMode ? WORK_TIME : BREAK_TIME;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-8 max-w-md mx-auto">
      <header className="text-center">
        <h1 className="font-display text-4xl font-extrabold flex items-center justify-center gap-3">
          {isWorkMode ? (
            <><Brain className="w-8 h-8 text-primary" /> Foco</>
          ) : (
            <><Coffee className="w-8 h-8 text-secondary" /> Pausa</>
          )}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sessões concluídas hoje: <strong className="text-foreground">{sessionCount}</strong>
        </p>
      </header>

      <div className="relative flex items-center justify-center my-8">
        <svg width="300" height="300" className="transform -rotate-90">
          <circle
            cx="150"
            cy="150"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-muted/20"
          />
          <motion.circle
            cx="150"
            cy="150"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeLinecap="round"
            className={isWorkMode ? "text-primary" : "text-secondary"}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "linear" }}
            strokeDasharray={circumference}
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className="font-display text-6xl font-black tabular-nums tracking-tighter">
            {formatTime(timeLeft)}
          </span>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-2">
            {isWorkMode ? "Trabalho" : "Descanso"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={resetTimer}
          className="p-4 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary transition-colors"
          title="Resetar"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
        <button
          onClick={toggleTimer}
          className="p-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-transform active:scale-95 flex items-center justify-center"
          title={isRunning ? "Pausar" : "Iniciar"}
        >
          {isRunning ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current ml-1" />
          )}
        </button>
        <button
          onClick={skipSession}
          className="p-4 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary transition-colors"
          title="Pular"
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>
      
      <div className="card-premium p-6 w-full text-center mt-8">
        <h3 className="font-display font-bold mb-2">Método Pomodoro</h3>
        <p className="text-sm text-muted-foreground">
          25 minutos de foco absoluto seguido por 5 minutos de pausa. 
          Isso ajuda a manter sua mente fresca e maximizar a absorção do conteúdo.
        </p>
      </div>
    </div>
  );
}
