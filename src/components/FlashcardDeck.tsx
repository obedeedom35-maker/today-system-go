import { useState } from "react";
import { motion } from "motion/react";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FlashcardItem = {
  id: string;
  question: string;
  answer: string;
  status: string | null;
};

export function FlashcardDeck({
  cards,
  onMark,
}: {
  cards: FlashcardItem[];
  onMark: (id: string, status: "sei" | "revisar") => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <FlipCard key={card.id} card={card} onMark={onMark} />
      ))}
    </div>
  );
}

function FlipCard({
  card,
  onMark,
}: {
  card: FlashcardItem;
  onMark: (id: string, status: "sei" | "revisar") => void;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div 
        className="group relative w-full h-48 sm:h-56 cursor-pointer"
        style={{ perspective: 1000 }}
        onClick={() => setFlipped(!flipped)}
      >
        <motion.div
          className="relative w-full h-full duration-500"
          style={{ transformStyle: "preserve-3d" }}
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* Front */}
          <div 
            className="absolute inset-0 w-full h-full rounded-2xl border border-border/50 bg-background/60 p-6 flex items-center justify-center text-center shadow-sm backdrop-blur-md transition-all hover:border-border hover:shadow-md dark:bg-zinc-900/60"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="font-semibold text-lg text-foreground tracking-tight">{card.question}</span>
            <span className="absolute bottom-3 right-4 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
              Toque para virar
            </span>
          </div>

          {/* Back */}
          <div 
            className="absolute inset-0 w-full h-full rounded-2xl border border-primary/20 bg-primary/5 p-6 flex items-center justify-center text-center shadow-md dark:bg-primary/10"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span className="text-foreground/90 text-base">{card.answer}</span>
            <span className="absolute bottom-3 right-4 text-[10px] uppercase tracking-wider text-primary/60 font-medium">
              Resposta
            </span>
          </div>
        </motion.div>
      </div>

      <div className="flex gap-3">
        <Button
          size="sm"
          variant={card.status === "sei" ? "default" : "outline"}
          className={cn(
            "flex-1 gap-2 font-medium transition-colors",
            card.status === "sei" && "bg-green-600 hover:bg-green-700 text-white border-green-600"
          )}
          onClick={() => onMark(card.id, "sei")}
        >
          <Check className="h-4 w-4" /> Sei
        </Button>
        <Button
          size="sm"
          variant={card.status === "revisar" ? "default" : "outline"}
          className={cn(
            "flex-1 gap-2 font-medium transition-colors",
            card.status === "revisar" && "bg-amber-500 hover:bg-amber-600 text-white border-amber-500 dark:bg-amber-600 dark:hover:bg-amber-700 dark:border-amber-600"
          )}
          onClick={() => onMark(card.id, "revisar")}
        >
          <RotateCcw className="h-4 w-4" /> Revisar
        </Button>
      </div>
    </div>
  );
}
