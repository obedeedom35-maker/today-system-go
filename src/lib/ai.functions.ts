import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  AI_PERSONA,
  GRADE_PROMPT,
  TUTOR_PROMPT,
  callAI,
  extractJson,
  joinMaterials,
  simulationPrompt,
  summaryPrompt,
} from "./ai.server";

export const generateSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        materialIds: z.array(z.string().uuid()).min(1).max(8),
        summaryType: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: materials, error } = await context.supabase
      .from("materials")
      .select("id, file_name, subject_id, extracted_text")
      .in("id", data.materialIds);
    if (error || !materials?.length) throw new Error("Materiais não encontrados.");

    const text = joinMaterials(materials);
    const raw = await callAI([
      { role: "system", content: AI_PERSONA },
      { role: "user", content: summaryPrompt(data.summaryType, text) },
    ]);

    const structured = extractJson<{ title?: string }>(raw);
    const title =
      structured.title?.trim() ||
      `${materials[0]!.file_name} — ${data.summaryType}`;

    const { data: saved, error: insertError } = await context.supabase
      .from("study_summaries")
      .insert({
        user_id: context.userId,
        material_id: materials[0]!.id,
        subject_id: materials[0]!.subject_id,
        material_ids: materials.map((m) => m.id),
        title,
        summary_type: data.summaryType,
        content: JSON.stringify(structured),
        structured,
      })
      .select()
      .single();

    if (insertError) throw new Error("Não foi possível salvar o resumo.");
    return saved;
  });

export const generateFlashcards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ materialIds: z.array(z.string().uuid()).min(1).max(8) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: materials } = await context.supabase
      .from("materials")
      .select("id, file_name, subject_id, extracted_text")
      .in("id", data.materialIds);
    if (!materials?.length) throw new Error("Materiais não encontrados.");

    const text = joinMaterials(materials, 50000);
    const raw = await callAI([
      { role: "system", content: AI_PERSONA },
      {
        role: "user",
        content: `Crie 12 flashcards objetivos com base no material. Responda APENAS com JSON no formato [{"question":"...","answer":"..."}].\n\nMATERIAL:\n${text}`,
      },
    ]);

    const cards = extractJson<{ question: string; answer: string }[]>(raw).slice(0, 20);
    const { error } = await context.supabase.from("flashcards").insert(
      cards.map((c) => ({
        user_id: context.userId,
        material_id: materials[0]!.id,
        subject_id: materials[0]!.subject_id,
        question: c.question,
        answer: c.answer,
      })),
    );
    if (error) throw new Error("Não foi possível salvar os flashcards.");
    return { created: cards.length };
  });

export const generateSimulation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        subjectId: z.string().uuid().nullable(),
        materialIds: z.array(z.string().uuid()).max(8).default([]),
        pdfTexts: z.array(z.string().max(40000)).max(5).default([]),
        questionCount: z.number().int().min(1).max(20),
        examType: z.enum(["primeira", "segunda", "ultima"]),
        difficulty: z.enum(["facil", "media", "dificil"]).default("media"),
        focusTopics: z.string().nullable().default(null),
        timeLimitMinutes: z.number().int().min(0).max(300).nullable().default(null),
        title: z.string().optional(),
      })
      .refine((d) => d.materialIds.length > 0 || d.pdfTexts.length > 0, {
        message: "Selecione ao menos um material ou faça upload de um PDF.",
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    let text = "";

    // Textos de materiais salvos no banco
    if (data.materialIds.length > 0) {
      const { data: materials } = await context.supabase
        .from("materials")
        .select("id, file_name, subject_id, extracted_text")
        .in("id", data.materialIds);
      if (materials?.length) {
        text += joinMaterials(materials, 35000);
      }
    }

    // Textos de PDFs enviados diretamente
    if (data.pdfTexts.length > 0) {
      const pdfContent = data.pdfTexts.join("\n\n---\n\n").slice(0, 35000);
      text += (text ? "\n\n" : "") + pdfContent;
    }

    if (!text.trim()) throw new Error("Nenhum conteúdo encontrado para gerar questões.");
    const raw = await callAI([
      { role: "system", content: AI_PERSONA },
      {
        role: "user",
        content: simulationPrompt({
          count: data.questionCount,
          examType: data.examType,
          difficulty: data.difficulty,
          focus: data.focusTopics,
          text,
        }),
      },
    ]);

    const questions = extractJson<
      {
        question_type: string;
        statement: string;
        options: string[] | null;
        correct_answer: string;
        topic?: string;
      }[]
    >(raw).slice(0, data.questionCount);
    if (!questions.length) throw new Error("A IA não conseguiu gerar questões deste material.");

    const { data: simulation, error } = await context.supabase
      .from("simulations")
      .insert({
        user_id: context.userId,
        subject_id: data.subjectId,
        title: data.title ?? `Simulado ${new Date().toLocaleDateString("pt-BR")}`,
        exam_type: data.examType,
        difficulty: data.difficulty,
        focus_topics: data.focusTopics,
        time_limit_minutes: data.timeLimitMinutes,
        material_ids: data.materialIds,
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

export const gradeSimulation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        simulationId: z.string().uuid(),
        durationSeconds: z.number().int().min(0),
        answers: z.array(z.object({ questionId: z.string().uuid(), answer: z.string() })),
      })
      .parse(data),
  )
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
      { role: "user", content: GRADE_PROMPT + JSON.stringify(payload) },
    ]);

    const grades = extractJson<
      { id: string; is_correct: boolean; score?: number; explanation: string; review_topic?: string }[]
    >(raw);

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

    const total = rows.reduce((a, r) => a + Number(r.score ?? 0), 0);
    const correct = rows.filter((r) => r.is_correct).length;
    const score = (total / rows.length) * 10;

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

    return { score, correct, total: rows.length };
  });

export const askMaterials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        materialIds: z.array(z.string().uuid()).max(8),
        question: z.string().min(2).max(2000),
        history: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
          .max(12)
          .default([]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    let contextText = "";
    if (data.materialIds.length) {
      const { data: materials } = await context.supabase
        .from("materials")
        .select("id, file_name, subject_id, extracted_text")
        .in("id", data.materialIds);
      if (materials?.length) contextText = joinMaterials(materials, 60000);
    }

    const answer = await callAI([
      { role: "system", content: `${AI_PERSONA}\n${TUTOR_PROMPT}` },
      ...(contextText ? [{ role: "user", content: `MATERIAIS DO ALUNO:\n${contextText}` }] : []),
      ...data.history,
      { role: "user", content: data.question },
    ]);

    return { answer };
  });
