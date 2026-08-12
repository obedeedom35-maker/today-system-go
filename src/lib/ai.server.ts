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
