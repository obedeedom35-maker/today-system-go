import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
    <div className="space-y-2">
      <motion.button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        whileTap={{ scale: 0.98 }}
        className="card-premium relative flex min-h-36 w-full items-center justify-center p-6 text-center"
        style={{ perspective: 1000 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={flipped ? "a" : "q"}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className={cn("text-sm", flipped ? "text-muted-foreground" : "font-semibold")}
          >
            {flipped ? card.answer : card.question}
          </motion.span>
        </AnimatePresence>
        <span className="absolute bottom-2 right-3 text-[10px] uppercase tracking-wide text-muted-foreground">
          {flipped ? "resposta" : "toque para virar"}
        </span>
      </motion.button>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={card.status === "sei" ? "default" : "secondary"}
          className="flex-1 gap-1"
          onClick={() => onMark(card.id, "sei")}
        >
          <Check className="h-4 w-4" /> Sei
        </Button>
        <Button
          size="sm"
          variant={card.status === "revisar" ? "default" : "secondary"}
          className="flex-1 gap-1"
          onClick={() => onMark(card.id, "revisar")}
        >
          <RotateCcw className="h-4 w-4" /> Revisar
        </Button>
      </div>
    </div>
  );
}
