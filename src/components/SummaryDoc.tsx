import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, BookOpen, CheckCircle2, HelpCircle, ListChecks, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MotionBar } from "@/components/motion";
import { cn } from "@/lib/utils";

export type StructuredSummary = {
  title?: string;
  objective?: string;
  quick_summary?: string;
  key_concepts?: { term: string; definition: string }[];
  topics?: { heading: string; paragraphs?: string[]; bullets?: string[]; source?: string }[];
  tables?: { title?: string; headers: string[]; rows: string[][] }[];
  diagram?: { title?: string; steps: string[] };
  attention?: string[];
  most_important?: string[];
  examples?: string[];
  quick_review?: string[];
  questions?: { q: string; a: string }[];
};

export function parseSummary(raw: unknown, content: string): StructuredSummary | null {
  if (raw && typeof raw === "object") return raw as StructuredSummary;
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object") return parsed as StructuredSummary;
  } catch {
    /* conteúdo antigo em texto puro */
  }
  return null;
}

function Section({
  id,
  title,
  icon: Icon,
  tone = "default",
  reviewed,
  onReview,
  children,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  tone?: "default" | "warning" | "success";
  reviewed: boolean;
  onReview: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className={cn(
        "rounded-2xl border p-5",
        tone === "warning" && "border-warning/40 bg-warning/10",
        tone === "success" && "border-success/40 bg-success/10",
        tone === "default" && "border-border bg-card",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-display flex items-center gap-2 text-base font-bold">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </h3>
        <Button
          size="sm"
          variant={reviewed ? "secondary" : "ghost"}
          className="shrink-0 gap-1 text-xs"
          onClick={() => onReview(id)}
        >
          <CheckCircle2 className={cn("h-3.5 w-3.5", reviewed && "text-success")} />
          {reviewed ? "Revisado" : "Marcar"}
        </Button>
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </motion.section>
  );
}

/** Renderiza um resumo estruturado em formato de apostila com Modo Estudo. */
export function SummaryDoc({
  data,
  fallback,
  onTest,
}: {
  data: StructuredSummary | null;
  fallback: string;
  onTest?: () => void;
}) {
  const [reviewed, setReviewed] = useState<string[]>([]);
  const toggle = (id: string) =>
    setReviewed((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  const sections = useMemo(() => {
    if (!data) return [] as string[];
    const list: string[] = [];
    if (data.quick_summary) list.push("resumo-rapido");
    if (data.key_concepts?.length) list.push("conceitos");
    data.topics?.forEach((_, i) => list.push(`topico-${i}`));
    if (data.tables?.length) list.push("tabelas");
    if (data.diagram?.steps?.length) list.push("esquema");
    if (data.attention?.length) list.push("atencao");
    if (data.most_important?.length) list.push("importante");
    if (data.examples?.length) list.push("exemplos");
    if (data.quick_review?.length) list.push("revisao");
    if (data.questions?.length) list.push("perguntas");
    return list;
  }, [data]);

  if (!data) {
    return (
      <div className="space-y-3">
        {fallback
          .split(/\n{2,}/)
          .filter(Boolean)
          .map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
      </div>
    );
  }

  const percent = sections.length ? (reviewed.length / sections.length) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-secondary/50 p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progresso da leitura</span>
          <span className="font-semibold text-primary">
            {reviewed.length}/{sections.length} seções
          </span>
        </div>
        <MotionBar percent={percent} className="mt-2" />
        {data.objective && <p className="mt-3 text-sm text-muted-foreground">{data.objective}</p>}
      </div>

      {data.quick_summary && (
        <Section id="resumo-rapido" title="Resumo rápido" icon={BookOpen} reviewed={reviewed.includes("resumo-rapido")} onReview={toggle}>
          <p>{data.quick_summary}</p>
        </Section>
      )}

      {!!data.key_concepts?.length && (
        <Section id="conceitos" title="Conceitos essenciais" icon={Star} reviewed={reviewed.includes("conceitos")} onReview={toggle}>
          <dl className="grid gap-3 sm:grid-cols-2">
            {data.key_concepts.map((c, i) => (
              <div key={i} className="rounded-xl bg-secondary/60 p-3">
                <dt className="font-semibold text-foreground">{c.term}</dt>
                <dd className="mt-1 text-xs">{c.definition}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {data.topics?.map((t, i) => (
        <Section
          key={i}
          id={`topico-${i}`}
          title={t.heading}
          icon={ListChecks}
          reviewed={reviewed.includes(`topico-${i}`)}
          onReview={toggle}
        >
          {t.paragraphs?.map((p, j) => <p key={j}>{p}</p>)}
          {!!t.bullets?.length && (
            <ul className="list-disc space-y-1 pl-5">
              {t.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          )}
          {t.source && <p className="text-xs italic text-primary">Fonte: {t.source}</p>}
        </Section>
      ))}

      {!!data.tables?.length && (
        <Section id="tabelas" title="Tabelas e comparações" icon={ListChecks} reviewed={reviewed.includes("tabelas")} onReview={toggle}>
          {data.tables.map((tb, i) => (
            <div key={i} className="overflow-x-auto">
              {tb.title && <p className="mb-1 font-semibold text-foreground">{tb.title}</p>}
              <table className="w-full min-w-[420px] border-collapse text-xs">
                <thead>
                  <tr>
                    {tb.headers?.map((h, j) => (
                      <th key={j} className="border border-border bg-secondary px-2 py-1.5 text-left font-semibold text-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tb.rows?.map((row, j) => (
                    <tr key={j}>
                      {row.map((cell, k) => (
                        <td key={k} className="border border-border px-2 py-1.5 align-top">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </Section>
      )}

      {!!data.diagram?.steps?.length && (
        <Section id="esquema" title={data.diagram.title || "Esquema / sequência"} icon={ListChecks} reviewed={reviewed.includes("esquema")} onReview={toggle}>
          <ol className="space-y-2">
            {data.diagram.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="bg-brand mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {!!data.attention?.length && (
        <Section id="atencao" title="Atenção" icon={AlertTriangle} tone="warning" reviewed={reviewed.includes("atencao")} onReview={toggle}>
          <ul className="list-disc space-y-1 pl-5">
            {data.attention.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Section>
      )}

      {!!data.most_important?.length && (
        <Section id="importante" title="O que mais importa" icon={Star} tone="success" reviewed={reviewed.includes("importante")} onReview={toggle}>
          <ul className="list-disc space-y-1 pl-5">
            {data.most_important.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Section>
      )}

      {!!data.examples?.length && (
        <Section id="exemplos" title="Exemplos" icon={BookOpen} reviewed={reviewed.includes("exemplos")} onReview={toggle}>
          <ul className="list-disc space-y-1 pl-5">
            {data.examples.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Section>
      )}

      {!!data.quick_review?.length && (
        <Section id="revisao" title="Revisão rápida" icon={ListChecks} reviewed={reviewed.includes("revisao")} onReview={toggle}>
          <ul className="list-disc space-y-1 pl-5">
            {data.quick_review.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Section>
      )}

      {!!data.questions?.length && (
        <Section id="perguntas" title="Perguntas de fixação" icon={HelpCircle} reviewed={reviewed.includes("perguntas")} onReview={toggle}>
          {data.questions.map((q, i) => (
            <details key={i} className="rounded-xl bg-secondary/60 p-3">
              <summary className="cursor-pointer font-medium text-foreground">{q.q}</summary>
              <p className="mt-2 text-xs">{q.a}</p>
            </details>
          ))}
        </Section>
      )}

      {onTest && (
        <Button className="w-full gap-2" onClick={onTest}>
          Testar meu conhecimento
        </Button>
      )}
    </div>
  );
}
