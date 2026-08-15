const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function callAI(messages: unknown[], model = "google/gemini-3.5-flash") {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("IA indisponível no momento.");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });

  if (res.status === 429) throw new Error("Muitas solicitações à IA. Tente novamente em instantes.");
  if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
  if (!res.ok) {
    const detail = await res.text();
    console.error("AI gateway error", res.status, detail);
    throw new Error("Não foi possível gerar o conteúdo agora. Tente novamente.");
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

export function extractJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice) as T;
}

export const AI_PERSONA =
  "Você é um professor especialista em Odontologia de nível de graduação. " +
  "Baseie-se EXCLUSIVAMENTE no conteúdo do material fornecido pelo aluno, sem inventar informações. " +
  "Use linguagem clara, técnica e didática, em português do Brasil.";

export type MaterialRow = {
  id: string;
  file_name: string;
  subject_id: string | null;
  extracted_text: string | null;
};

/** Junta vários materiais em um único contexto com marcação de origem. */
export function joinMaterials(materials: MaterialRow[], limit = 90000) {
  const text = materials
    .map((m) => `### ARQUIVO: ${m.file_name}\n${m.extracted_text ?? ""}`)
    .join("\n\n")
    .slice(0, limit);
  if (text.replace(/### ARQUIVO:.*/g, "").trim().length < 40)
    throw new Error("Os materiais selecionados não possuem texto legível. Envie um PDF com texto selecionável.");
  return text;
}

export const SUMMARY_SCHEMA = `{
 "title": "título curto do resumo",
 "objective": "para que serve este resumo (1-2 frases)",
 "quick_summary": "resumo rápido em até 4 frases",
 "key_concepts": [{"term":"...","definition":"..."}],
 "topics": [{"heading":"...","paragraphs":["parágrafo curto"],"bullets":["..."],"source":"arquivo, pág. X"}],
 "tables": [{"title":"...","headers":["..."],"rows":[["..."]]}],
 "diagram": {"title":"...","steps":["etapa 1","etapa 2"]},
 "attention": ["pontos de atenção / erros comuns"],
 "most_important": ["o que mais importa"],
 "examples": ["exemplo clínico"],
 "quick_review": ["frases de revisão rápida"],
 "questions": [{"q":"pergunta de fixação","a":"resposta"}]
}`;

export const SUMMARY_STYLES: Record<string, string> = {
  completo: "Apostila completa e aprofundada, com todos os tópicos do material.",
  rapido: "Versão enxuta e direta, priorizando o essencial.",
  revisao: "Foco em revisão pré-prova, com destaques e pegadinhas.",
  prova: "Foco no que provavelmente cai na prova.",
  mapa: "Estrutura de mapa mental: tópicos e subtópicos curtos e hierárquicos.",
};

export function summaryPrompt(style: string, text: string) {
  return (
    `Crie uma APOSTILA DE ESTUDO estruturada. Estilo: ${SUMMARY_STYLES[style] ?? SUMMARY_STYLES["completo"]}\n` +
    "Nunca devolva um bloco único de texto. Divida em seções, parágrafos curtos, listas e tabelas quando fizer sentido. " +
    "Quando houver sequência clínica ou processo, preencha \"diagram\" com as etapas. " +
    "Cite o arquivo de origem em \"source\" quando possível. Use no mínimo 4 tópicos quando o material permitir.\n" +
    `Responda APENAS com JSON válido no formato:\n${SUMMARY_SCHEMA}\n\nMATERIAL:\n${text}`
  );
}

export function simulationPrompt(opts: {
  count: number;
  examType: string;
  difficulty: string;
  focus: string | null;
  text: string;
}) {
  const models: Record<string, string> = {
    primeira: `${opts.count} questões 100% DISCURSIVAS`,
    segunda: `${opts.count} questões, sendo metade DISCURSIVAS e metade OBJETIVAS`,
    ultima: `${opts.count} questões 100% OBJETIVAS com 5 alternativas (A a E)`,
  };
  const diff: Record<string, string> = {
    facil: "nível introdutório (compreensão)",
    media: "nível intermediário (aplicação e comparação)",
    dificil: "nível avançado (raciocínio clínico e análise)",
  };
  return (
    `Etapa 1 (interna): identifique tópicos, subtópicos, conceitos, procedimentos e comparações do material e monte uma matriz de cobertura.\n` +
    `Etapa 2: gere ${models[opts.examType] ?? models["ultima"]}, dificuldade ${diff[opts.difficulty] ?? diff["media"]}, ` +
    `distribuindo as questões entre os tópicos (não concentrar em um só assunto), sem repetir perguntas e sem sair do material.\n` +
    (opts.focus ? `Priorize os assuntos: ${opts.focus}.\n` : "") +
    "Nas objetivas, as alternativas erradas devem ser plausíveis. Em correct_answer das objetivas informe a letra e o texto.\n" +
    'Responda APENAS com JSON: [{"question_type":"discursiva"|"objetiva","statement":"...","options":["A) ...","B) ...","C) ...","D) ...","E) ..."]|null,"correct_answer":"...","topic":"..."}]' +
    `\n\nMATERIAL:\n${opts.text}`
  );
}

export const GRADE_PROMPT =
  "Corrija as respostas do aluno. Nas discursivas avalie por critérios esperados (conceitos, raciocínio, palavras-chave), " +
  "permitindo pontuação parcial entre 0 e 1, sem exigir reprodução literal. Explique de forma didática por que a resposta correta é correta " +
  "e, nas objetivas, por que as outras estão erradas. Informe o conceito relacionado e o assunto para revisão. " +
  'Responda APENAS com JSON: [{"id":"...","is_correct":true,"score":1,"explanation":"...","review_topic":"..."}].\n\n';

export const TUTOR_PROMPT =
  "Você é o Tutor IA do aluno. Responda com base nos materiais fornecidos. " +
  "Se a informação não estiver nos materiais, diga claramente que não está no material e responda apenas o que for conhecimento geral, avisando disso. " +
  "Sempre que usar o material, cite a origem no formato [arquivo]. Seja objetivo, didático e use listas quando ajudar.";
