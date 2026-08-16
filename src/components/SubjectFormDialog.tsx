import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export function SubjectFormDialog({
  periodNumber,
  trigger,
}: {
  periodNumber: number;
  trigger: React.ReactNode;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isClinic, setIsClinic] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name || !code) throw new Error("Preencha o código e nome.");
      const { error } = await supabase.from("subjects").insert({
        period_number: periodNumber,
        name,
        code,
        is_clinic_integrated: isClinic,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
      setOpen(false);
      setName("");
      setCode("");
      setIsClinic(false);
      toast.success("Disciplina cadastrada com sucesso!");
    },
    onError: (e) => toast.error(e.message || "Não foi possível cadastrar a disciplina."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova disciplina ({periodNumber}º Período)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1 space-y-2">
              <Label>Código</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: ODO101"
              />
            </div>
            <div className="col-span-3 space-y-2">
              <Label>Nome da disciplina</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Clínica Integrada I"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is_clinic"
              checked={isClinic}
              onCheckedChange={(c) => setIsClinic(!!c)}
            />
            <label
              htmlFor="is_clinic"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              É uma clínica integrada?
            </label>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !name || !code}
          >
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
