import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileText, Layers, Sparkles, Upload } from "lucide-react";
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
  const summaryFn = useServerFn(generateSummary);
  const flashFn = useServerFn(generateFlashcards);

  const materials = useQuery({
    queryKey: ["materials", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("id, file_name, subject_id, created_at")
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

  async function handleUpload(file: File) {
    if (!user) return;
    setUploading(true);
    try {
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
      toast.success("Material enviado com sucesso!");
      qc.invalidateQueries({ queryKey: ["materials"] });
    } catch {
      toast.error("Não foi possível enviar o material.");
    } finally {
      setUploading(false);
    }
  }

  const summarize = useMutation({
    mutationFn: (materialId: string) => summaryFn({ data: { materialId, summaryType } }),
    onSuccess: () => {
      toast.success("Resumo gerado!");
      qc.invalidateQueries({ queryKey: ["summaries"] });
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível gerar o resumo."),
  });

  const makeFlashcards = useMutation({
    mutationFn: (materialId: string) => flashFn({ data: { materialId } }),
    onSuccess: () => {
      toast.success("Flashcards criados!");
      qc.invalidateQueries({ queryKey: ["flashcards"] });
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível gerar os flashcards."),
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
              accept=".pdf,.docx,.txt"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
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
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-xs text-muted-foreground">Tipo de resumo</Label>
            <Select value={summaryType} onValueChange={setSummaryType}>
              <SelectTrigger className="w-64">
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

          {(materials.data ?? []).length === 0 ? (
            <div className="card-premium p-8 text-center text-sm text-muted-foreground">
              Nenhum material enviado ainda.
            </div>
          ) : (
            (materials.data ?? []).map((m) => (
              <div
                key={m.id}
                className="card-premium flex flex-wrap items-center justify-between gap-3 p-5"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-display text-sm font-bold">{m.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-2"
                    disabled={summarize.isPending}
                    onClick={() => summarize.mutate(m.id)}
                  >
                    <Sparkles className="h-4 w-4" />
                    {summarize.isPending ? "Gerando..." : "Gerar resumo"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-2"
                    disabled={makeFlashcards.isPending}
                    onClick={() => makeFlashcards.mutate(m.id)}
                  >
                    <Layers className="h-4 w-4" /> Flashcards
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="resumos" className="mt-5 space-y-3">
          {(summaries.data ?? []).length === 0 ? (
            <div className="card-premium p-8 text-center text-sm text-muted-foreground">
              Nenhum resumo gerado ainda.
            </div>
          ) : (
            (summaries.data ?? []).map((s) => (
              <details key={s.id} className="card-premium p-5">
                <summary className="font-display cursor-pointer text-sm font-bold">
                  {s.title}
                </summary>
                <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">
                  {s.content}
                </p>
              </details>
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
