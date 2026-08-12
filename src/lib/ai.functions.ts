import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AI_PERSONA, callAI, extractJson } from "./ai.server";

const summarySchema = z.object({
  materialId: z.string().uuid(),
  summaryType: z.string(),
});

export const generateSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => summarySchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: material, error } = await context.supabase
      .from("materials")
      .select("id, file_name, subject_id, extracted_text")
      .eq("id", data.materialId)
      .maybeSingle();

    if (error || !material) throw new Error("Material não encontrado.");
    const text = (material.extracted_text ?? "").slice(0, 60000);
    if (text.trim().length < 40)
      throw new Error("Não foi possível ler o conteúdo deste material. Envie um PDF com texto ou cole o conteúdo.");

    const instructions: Record<string, string> = {
      completo: "Faça um resumo completo e estruturado com títulos e subtópicos.",
      rapido: "Faça um resumo rápido e direto, em tópicos curtos.",
      revisao: "Faça um resumo focado em revisão pré-prova, com destaques.",
      prova: "Liste os principais pontos que podem cair na prova.",
      mapa: "Crie um mapa mental em formato de lista hierárquica indentada.",
    };

    const content = await callAI([
      { role: "system", content: AI_PERSONA },
      {
        role: "user",
        content: `${instructions[data.summaryType] ?? instructions["completo"]}\n\nMATERIAL (${material.file_name}):\n${text}`,
      },
    ]);

    const { data: saved, error: insertError } = await context.supabase
      .from("study_summaries")
      .insert({
        user_id: context.userId,
        material_id: material.id,
        subject_id: material.subject_id,
        title: `${material.file_name} — ${data.summaryType}`,
        summary_type: data.summaryType,
        content,
      })
      .select()
      .single();

    if (insertError) throw new Error("Não foi possível salvar o resumo.");
    return saved;
  });

export const generateFlashcards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ materialId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: material } = await context.supabase
      .from("materials")
      .select("id, file_name, subject_id, extracted_text")
      .eq("id", data.materialId)
      .maybeSingle();
    if (!material) throw new Error("Material não encontrado.");
    const text = (material.extracted_text ?? "").slice(0, 40000);
    if (text.trim().length < 40) throw new Error("Material sem texto legível.");

    const raw = await callAI([
      { role: "system", content: AI_PERSONA },
      {
        role: "user",
        content: `Crie 10 flashcards com base no material. Responda APENAS com JSON no formato [{"question":"...","answer":"..."}].\n\nMATERIAL:\n${text}`,
      },
    ]);

    const cards = extractJson<{ question: string; answer: string }[]>(raw).slice(0, 20);
    const { error } = await context.supabase.from("flashcards").insert(
      cards.map((c) => ({
        user_id: context.userId,
        material_id: material.id,
        subject_id: material.subject_id,
        question: c.question,
        answer: c.answer,
      })),
    );
    if (error) throw new Error("Não foi possível salvar os flashcards.");
    return { created: cards.length };
  });

const simSchema = z.object({
  subjectId: z.string().uuid().nullable(),
  materialIds: z.array(z.string().uuid()).min(1),
  questionCount: z.number().int().min(1).max(20),
  examType: z.enum(["primeira", "segunda", "ultima"]),
});

export const generateSimulation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => simSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: materials } = await context.supabase
      .from("materials")
      .select("file_name, extracted_text")
      .in("id", data.materialIds);

    const text = (materials ?? [])
      .map((m) => `### ${m.file_name}\n${m.extracted_text ?? ""}`)
      .join("\n\n")
      .slice(0, 60000);
    if (text.trim().length < 40) throw new Error("Os materiais selecionados não possuem texto legível.");

    const models: Record<string, string> = {
      primeira: `${data.questionCount} questões DISCURSIVAS`,
      segunda: `metade discursivas e metade objetivas (total ${data.questionCount})`,
      ultima: `${data.questionCount} questões OBJETIVAS com alternativas A, B, C, D e E`,
    };

    const raw = await callAI([
      { role: "system", content: AI_PERSONA },
      {
        role: "user",
        content:
          `Gere um simulado com ${models[data.examType]}, dificuldade compatível com graduação em Odontologia, ` +
          `baseado apenas no material abaixo. Responda APENAS com JSON: ` +
          `[{"question_type":"discursiva"|"objetiva","statement":"...","options":["A) ...","B) ...","C) ...","D) ...","E) ..."]|null,"correct_answer":"...","topic":"..."}]\n\nMATERIAL:\n${text}`,
      },
    ]);

    type Q = {
      question_type: string;
      statement: string;
      options: string[] | null;
      correct_answer: string;
      topic?: string;
    };
    const questions = extractJson<Q[]>(raw).slice(0, data.questionCount);
    if (!questions.length) throw new Error("A IA não conseguiu gerar questões deste material.");

    const { data: simulation, error } = await context.supabase
      .from("simulations")
      .insert({
        user_id: context.userId,
        subject_id: data.subjectId,
        title: `Simulado ${new Date().toLocaleDateString("pt-BR")}`,
        exam_type: data.examType,
        question_count: questions.length,
      })
      .select()
      .single();
    if (error || !simulation) throw new Error("Não foi possível criar o simulado.");

    const { error: qError } = await context.supabase.from("simulation_questions").insert(
      questions.map((q, i) => ({
        simulation_id: simulation.id,
        user_id: context.userId,
        position: i + 1,
        question_type: q.question_type === "objetiva" ? "objetiva" : "discursiva",
        statement: q.statement,
        options: q.options ?? null,
        correct_answer: q.correct_answer,
        topic: q.topic ?? null,
      })),
    );
    if (qError) throw new Error("Não foi possível salvar as questões.");
    return simulation;
  });

const gradeSchema = z.object({
  simulationId: z.string().uuid(),
  durationSeconds: z.number().int().min(0),
  answers: z.array(z.object({ questionId: z.string().uuid(), answer: z.string() })),
});

export const gradeSimulation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => gradeSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: questions } = await context.supabase
      .from("simulation_questions")
      .select("*")
      .eq("simulation_id", data.simulationId)
      .order("position");
    if (!questions?.length) throw new Error("Simulado não encontrado.");

    const payload = questions.map((q) => ({
      id: q.id,
      tipo: q.question_type,
      enunciado: q.statement,
      alternativas: q.options,
      resposta_correta: q.correct_answer,
      resposta_aluno: data.answers.find((a) => a.questionId === q.id)?.answer ?? "",
    }));

    const raw = await callAI([
      { role: "system", content: AI_PERSONA },
      {
        role: "user",
        content:
          "Corrija as respostas do aluno. Nas discursivas considere conceitos, raciocínio, palavras-chave e significado, " +
          "sem exigir reprodução literal. Explique didaticamente por que a correta está correta e, nas objetivas, por que as demais estão erradas. " +
          'Responda APENAS com JSON: [{"id":"...","is_correct":true,"score":1,"explanation":"...","review_topic":"..."}].\n\n' +
          JSON.stringify(payload),
      },
    ]);

    type G = { id: string; is_correct: boolean; score?: number; explanation: string; review_topic?: string };
    const grades = extractJson<G[]>(raw);

    const rows = questions.map((q) => {
      const g = grades.find((x) => x.id === q.id);
      return {
        simulation_id: data.simulationId,
        question_id: q.id,
        user_id: context.userId,
        answer: data.answers.find((a) => a.questionId === q.id)?.answer ?? "",
        is_correct: g?.is_correct ?? false,
        score: g?.score ?? (g?.is_correct ? 1 : 0),
        explanation: g?.explanation ?? "",
        review_topic: g?.review_topic ?? q.topic,
      };
    });

    await context.supabase.from("simulation_answers").upsert(rows, { onConflict: "question_id" });

    const correct = rows.filter((r) => r.is_correct).length;
    const score = (correct / rows.length) * 10;

    await context.supabase
      .from("simulations")
      .update({
        status: "concluido",
        score,
        correct_count: correct,
        wrong_count: rows.length - correct,
        duration_seconds: data.durationSeconds,
        finished_at: new Date().toISOString(),
      })
      .eq("id", data.simulationId);

    return { correct, total: rows.length, score };
  });
