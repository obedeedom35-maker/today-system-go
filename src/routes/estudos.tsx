import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileText, Layers, Sparkles, Upload, MoreVertical, Trash2 } from "lucide-react";
import { SummaryViewer } from "@/components/SummaryViewer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "motion/react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useSubjects } from "@/lib/data";
import { extractTextFromFile } from "@/lib/extract-text";
import { generateSummary, generateFlashcards } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/estudos")({
  head: () => ({
    meta: [
      { title: "Meus Estudos | Odonto Progress" },
      {
        name: "description",
        content:
          "Envie materiais em PDF e gere resumos, flashcards e simulados com inteligência artificial.",
      },
      { property: "og:title", content: "Meus Estudos com IA | Odonto Progress" },
      {
        property: "og:description",
        content: "Resumos, flashcards e simulados gerados a partir dos seus próprios materiais.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Estudos />
    </AppShell>
  ),
});

const SUMMARY_TYPES = [
  { value: "completo", label: "Resumo completo" },
  { value: "rapido", label: "Resumo rápido" },
  { value: "revisao", label: "Revisão pré-prova" },
  { value: "prova", label: "Pontos que podem cair na prova" },
  { value: "mapa", label: "Mapa mental" },
];

function Estudos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useProfile();
  const subjects = useSubjects(profile.data?.period_number ?? 6);
  const [subjectId, setSubjectId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [summaryType, setSummaryType] = useState("completo");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [genState, setGenState] = useState<"idle" | "lendo" | "extraindo" | "gerando" | "pronto">("idle");
  const summaryFn = useServerFn(generateSummary);
  const flashFn = useServerFn(generateFlashcards);

  const materials = useQuery({
    queryKey: ["materials", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("id, file_name, subject_id, created_at, file_path")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const summaries = useQuery({
    queryKey: ["summaries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_summaries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const flashcards = useQuery({
    queryKey: ["flashcards", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data;
    },
  });

  async function handleUpload(files: FileList | File[]) {
    if (!user || files.length === 0) return;
    setUploading(true);
    let uploadedCount = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const text = await extractTextFromFile(file);
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("materials").upload(path, file);
        if (upErr) throw upErr;
        const { error } = await supabase.from("materials").insert({
          user_id: user.id,
          subject_id: subjectId || null,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type || "application/octet-stream",
          extracted_text: text,
        });
        if (error) throw error;
        uploadedCount++;
      }
      toast.success(`${uploadedCount} material(is) enviado(s) com sucesso!`);
      qc.invalidateQueries({ queryKey: ["materials"] });
    } catch {
      toast.error("Não foi possível enviar um ou mais materiais.");
    } finally {
      setUploading(false);
    }
  }

  const summarize = useMutation({
    mutationFn: async (materialIds: string[]) => {
      setGenState("lendo");
      await new Promise((r) => setTimeout(r, 800));
      setGenState("extraindo");
      await new Promise((r) => setTimeout(r, 1200));
      setGenState("gerando");
      return summaryFn({ data: { materialIds, summaryType } });
    },
    onSuccess: () => {
      setGenState("pronto");
      setTimeout(() => setGenState("idle"), 2000);
      toast.success("Resumo gerado!");
      setSelectedMaterials([]);
      qc.invalidateQueries({ queryKey: ["summaries"] });
    },
    onError: (e: Error) => {
      setGenState("idle");
      toast.error(e.message || "Não foi possível gerar o resumo.");
    },
  });

  const makeFlashcards = useMutation({
    mutationFn: async (materialIds: string[]) => {
      setGenState("lendo");
      await new Promise((r) => setTimeout(r, 800));
      setGenState("extraindo");
      await new Promise((r) => setTimeout(r, 1200));
      setGenState("gerando");
      return flashFn({ data: { materialIds } });
    },
    onSuccess: () => {
      setGenState("pronto");
      setTimeout(() => setGenState("idle"), 2000);
      toast.success("Flashcards criados!");
      setSelectedMaterials([]);
      qc.invalidateQueries({ queryKey: ["flashcards"] });
    },
    onError: (e: Error) => {
      setGenState("idle");
      toast.error(e.message || "Não foi possível gerar os flashcards.");
    },
  });

  const deleteSummary = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("study_summaries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resumo excluído com sucesso!");
      qc.invalidateQueries({ queryKey: ["summaries"] });
    },
    onError: () => toast.error("Não foi possível excluir o resumo."),
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Meus Estudos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie seus materiais e transforme-os em resumos, flashcards e simulados.
        </p>
      </header>

      <section className="card-premium space-y-4 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Disciplina (opcional)</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma disciplina" />
              </SelectTrigger>
              <SelectContent>
                {(subjects.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Material (PDF, DOCX ou TXT)</Label>
            <Input
              id="file"
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files) void handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Enviando e lendo o material..." : "O conteúdo é lido automaticamente para a IA."}
        </p>
      </section>

      <Tabs defaultValue="materiais">
        <TabsList>
          <TabsTrigger value="materiais">Materiais</TabsTrigger>
          <TabsTrigger value="resumos">Resumos</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
        </TabsList>

        <TabsContent value="materiais" className="mt-5 space-y-3">
          <AnimatePresence>
            {genState !== "idle" && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="overflow-hidden"
              >
                <div className="card-premium p-6 mb-4 flex items-center gap-4 bg-primary/5 border-primary/20">
                  <div className="relative h-10 w-10 shrink-0">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary"
                    />
                    <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-primary">
                      {genState === "lendo" && "Lendo materiais..."}
                      {genState === "extraindo" && "Extraindo conceitos principais..."}
                      {genState === "gerando" && "Gerando conteúdo com IA..."}
                      {genState === "pronto" && "Tudo pronto!"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      A inteligência artificial está processando seu conteúdo.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações em lote</Label>
              <Select value={summaryType} onValueChange={setSummaryType}>
                <SelectTrigger className="w-48 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUMMARY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="gap-2 h-8 text-xs"
                disabled={selectedMaterials.length === 0 || summarize.isPending || makeFlashcards.isPending}
                onClick={() => summarize.mutate(selectedMaterials)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Gerar Resumo ({selectedMaterials.length})
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="gap-2 h-8 text-xs"
                disabled={selectedMaterials.length === 0 || summarize.isPending || makeFlashcards.isPending}
                onClick={() => makeFlashcards.mutate(selectedMaterials)}
              >
                <Layers className="h-3.5 w-3.5" /> Flashcards ({selectedMaterials.length})
              </Button>
            </div>
          </div>

          {(materials.data ?? []).length === 0 ? (
            <div className="card-premium p-8 text-center text-sm text-muted-foreground">
              Nenhum material enviado ainda.
            </div>
          ) : (
            (materials.data ?? []).map((m) => (
              <div
                key={m.id}
                className="card-premium flex items-center gap-4 p-4 transition-colors hover:bg-muted/30"
              >
                <Checkbox 
                  checked={selectedMaterials.includes(m.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedMaterials((prev) => [...prev, m.id]);
                    } else {
                      setSelectedMaterials((prev) => prev.filter((id) => id !== m.id));
                    }
                  }}
                />
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold line-clamp-1">{m.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-60 hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    disabled={summarize.isPending || makeFlashcards.isPending}
                    onClick={() => summarize.mutate([m.id])}
                    title="Gerar resumo deste material"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-secondary"
                    disabled={summarize.isPending || makeFlashcards.isPending}
                    onClick={() => makeFlashcards.mutate([m.id])}
                    title="Gerar flashcards deste material"
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={summarize.isPending || makeFlashcards.isPending}
                    onClick={async () => {
                      if (confirm('Excluir este material permanentemente?')) {
                        // Delete from storage
                        const { error: delError } = await supabase.storage.from('materials').remove([m.file_path]);
                        // Delete DB record
                        const { error: dbError } = await supabase.from('materials').delete().eq('id', m.id);
                        if (delError || dbError) {
                          toast.error('Erro ao excluir material.');
                        } else {
                          toast.success('Material excluído.');
                          qc.invalidateQueries({ queryKey: ['materials'] });
                        }
                      }
                    }}
                    title="Excluir material"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="resumos" className="mt-5 space-y-6">
          {(summaries.data ?? []).length === 0 ? (
            <div className="card-premium p-8 text-center text-sm text-muted-foreground">
              Nenhum resumo gerado ainda.
            </div>
          ) : (
            (summaries.data ?? []).map((s) => (
              <div key={s.id} className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="absolute top-4 right-4 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur-md shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer" 
                        onClick={() => deleteSummary.mutate(s.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir resumo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <SummaryViewer summary={s} />
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="flashcards" className="mt-5 grid gap-4 md:grid-cols-2">
          {(flashcards.data ?? []).length === 0 ? (
            <div className="card-premium p-8 text-center text-sm text-muted-foreground md:col-span-2">
              Nenhum flashcard criado ainda.
            </div>
          ) : (
            (flashcards.data ?? []).map((f) => (
              <details key={f.id} className="card-premium p-5">
                <summary className="cursor-pointer text-sm font-semibold">{f.question}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.answer}</p>
              </details>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
