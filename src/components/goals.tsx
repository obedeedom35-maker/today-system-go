import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/data";
import { goalMessage, afterProcedureMessages, randomMessage } from "@/lib/motivation";
import type { GoalProgress } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function GoalFormDialog({
  subjectId,
  goal,
  trigger,
}: {
  subjectId: string;
  goal?: GoalProgress;
  trigger: React.ReactNode;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(goal?.name ?? "");
  const [category, setCategory] = useState(goal?.category ?? "");
  const [target, setTarget] = useState(String(goal?.target_quantity ?? 10));
  const [notes, setNotes] = useState(goal?.notes ?? "");

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        subject_id: subjectId,
        name,
        category: category || null,
        target_quantity: Math.max(Number(target) || 1, 1),
        notes: notes || null,
      };
      if (goal) {
        const { error } = await supabase.from("goals").update(payload).eq("id", goal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("goals").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress"] });
      setOpen(false);
      toast.success(goal ? "Meta atualizada." : "Meta criada com sucesso!");
    },
    onError: () => toast.error("Não foi possível salvar a meta."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal ? "Editar meta" : "Nova meta"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da meta</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Restaurações"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantidade exigida</Label>
              <Input
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex.: Dentística"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? "Salvando..." : "Salvar meta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RegisterProcedureDialog({
  goals,
  subjectId,
  trigger,
}: {
  goals: GoalProgress[];
  subjectId: string;
  trigger: React.ReactNode;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [goalId, setGoalId] = useState(goals[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const qty = Math.max(Number(quantity) || 1, 1);
      const { error } = await supabase.from("procedure_records").insert({
        user_id: user!.id,
        goal_id: goalId,
        subject_id: subjectId,
        quantity: qty,
        performed_on: date,
        notes: notes || null,
      });
      if (error) throw error;

      const goal = goals.find((g) => g.id === goalId);
      if (goal) {
        const total = goal.done + qty;
        if (total >= goal.target_quantity && goal.done < goal.target_quantity) {
          await notify(
            user!.id,
            "Meta concluída!",
            `Parabéns! Você concluiu a meta "${goal.name}".`,
            "sucesso",
          );
        } else if (goal.target_quantity - total === 1) {
          await notify(
            user!.id,
            "Quase lá!",
            `Falta apenas 1 procedimento para concluir "${goal.name}".`,
            "alerta",
          );
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      setOpen(false);
      setNotes("");
      setQuantity("1");
      toast.success(randomMessage(afterProcedureMessages));
    },
    onError: () => toast.error("Não foi possível registrar o procedimento."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar procedimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Meta</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="w-full"
            disabled={!goalId || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Registrando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GoalCard({ goal, subjectId }: { goal: GoalProgress; subjectId: string }) {
  const qc = useQueryClient();

  async function remove() {
    const { error } = await supabase.from("goals").delete().eq("id", goal.id);
    if (error) {
      toast.error("Não foi possível excluir a meta.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["progress"] });
    toast.success("Meta excluída.");
  }

  return (
    <div className="card-premium p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold">{goal.name}</h3>
          {goal.category && <p className="text-xs text-muted-foreground">{goal.category}</p>}
        </div>
        <div className="flex gap-1">
          <GoalFormDialog
            subjectId={subjectId}
            goal={goal}
            trigger={
              <Button variant="ghost" size="icon" aria-label="Editar meta">
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
          <Button variant="ghost" size="icon" aria-label="Excluir meta" onClick={remove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between text-sm">
        <span className="font-semibold">
          {goal.done}/{goal.target_quantity}
        </span>
        <span className="text-muted-foreground">
          {goal.completed ? "Meta atingida" : `faltam ${goal.remaining}`}
        </span>
        <span className="font-display font-bold text-primary">{goal.percent.toFixed(0)}%</span>
      </div>
      <Progress value={Math.min(goal.percent, 100)} className="mt-2" />

      <p
        className={`mt-3 text-xs ${goal.completed ? "font-semibold text-success" : "text-muted-foreground"}`}
      >
        {goal.exceeded > 0
          ? `META ULTRAPASSADA ✓ (+${goal.exceeded})`
          : goal.completed
            ? "META CONCLUÍDA ✓"
            : goalMessage(goal)}
      </p>

      <RegisterProcedureDialog
        goals={[goal]}
        subjectId={subjectId}
        trigger={
          <Button variant="secondary" size="sm" className="mt-4 w-full gap-2">
            <Plus className="h-4 w-4" /> Registrar procedimento
          </Button>
        }
      />
    </div>
  );
}
