import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Target, 
  Zap, 
  KeySquare, 
  BookOpen, 
  Table2, 
  AlertTriangle, 
  Star, 
  Stethoscope, 
  CheckCircle2, 
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type SummaryStructured = {
  title?: string;
  objective?: string;
  quick_summary?: string;
  key_concepts?: { term: string; definition: string }[];
  topics?: { heading: string; paragraphs: string[]; bullets: string[]; source?: string }[];
  tables?: { title: string; headers: string[]; rows: string[][] }[];
  diagram?: { title: string; steps: string[] };
  attention?: string[];
  most_important?: string[];
  examples?: string[];
  quick_review?: string[];
  questions?: { q: string; a: string }[];
};

export type SummaryData = {
  id: string;
  title: string;
  summary_type: string;
  structured: unknown;
  content: string;
  created_at: string;
};

interface SummaryViewerProps {
  summary: SummaryData;
}

export function SummaryViewer({ summary }: SummaryViewerProps) {
  let structuredData: SummaryStructured | null = null;

  if (summary.structured && typeof summary.structured === 'object') {
    structuredData = summary.structured as SummaryStructured;
  } else if (summary.content) {
    try {
      structuredData = JSON.parse(summary.content);
    } catch (e) {
      // Fallback to null if parsing fails
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (!structuredData) {
    // Fallback view for plain text content
    return (
      <div className="bg-card border rounded-2xl p-6 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{summary.title}</h1>
        <div className="flex gap-2 mb-8">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            {summary.summary_type}
          </span>
        </div>
        <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap">
          {summary.content}
        </div>
      </div>
    );
  }

  const {
    title,
    objective,
    quick_summary,
    key_concepts,
    topics,
    tables,
    diagram,
    attention,
    most_important,
    examples,
    quick_review,
    questions
  } = structuredData;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-8 pb-12"
    >
      {/* 1. Cover/Header */}
      <motion.div variants={itemVariants} className="text-center space-y-4 pt-4 pb-8 border-b">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full text-primary mb-2">
          <FileText size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
          {title || summary.title}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full font-medium">
            {summary.summary_type}
          </span>
          <span className="text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {format(new Date(summary.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })}
          </span>
        </div>
      </motion.div>

      {/* 2. Objetivo */}
      {objective && (
        <motion.div variants={itemVariants} className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Target size={64} />
          </div>
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2 text-lg">
            <Target size={20} /> Objetivo
          </h3>
          <p className="text-blue-900/80 dark:text-blue-100/80 relative z-10 text-lg leading-relaxed">
            {objective}
          </p>
        </motion.div>
      )}

      {/* 3. Resumo Rápido */}
      {quick_summary && (
        <motion.div variants={itemVariants} className="card-premium p-6 italic text-muted-foreground text-lg border-l-4 border-l-primary">
          <div className="flex items-start gap-3">
            <Zap size={24} className="text-primary shrink-0 mt-1" />
            <p>{quick_summary}</p>
          </div>
        </motion.div>
      )}

      {/* 9. O que mais importa (Most Important) */}
      {most_important && most_important.length > 0 && (
        <motion.div variants={itemVariants} className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-2xl p-6">
          <h3 className="font-bold text-green-800 dark:text-green-300 flex items-center gap-2 mb-4 text-lg">
            <Star size={20} className="fill-green-500 text-green-500" /> O que mais importa
          </h3>
          <ul className="space-y-3">
            {most_important.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-green-900/80 dark:text-green-100/80">
                <CheckCircle2 size={20} className="text-green-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* 4. Conceitos-chave */}
      {key_concepts && key_concepts.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <KeySquare size={24} className="text-primary" /> Conceitos-chave
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {key_concepts.map((concept, i) => (
              <div key={i} className="bg-card border rounded-xl p-4 shadow-sm">
                <p className="font-bold text-foreground mb-1">{concept.term}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{concept.definition}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 5. Tópicos */}
      {topics && topics.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-8">
          <h3 className="font-bold text-xl flex items-center gap-2 border-b pb-2">
            <BookOpen size={24} className="text-primary" /> Conteúdo Detalhado
          </h3>
          <div className="space-y-10">
            {topics.map((topic, i) => (
              <div key={i} className="space-y-4">
                <h4 className="text-xl font-semibold text-foreground">{topic.heading}</h4>
                
                {topic.paragraphs && topic.paragraphs.map((p, j) => (
                  <p key={j} className="text-foreground/90 leading-relaxed">{p}</p>
                ))}
                
                {topic.bullets && topic.bullets.length > 0 && (
                  <ul className="list-disc pl-5 space-y-2 text-foreground/90 my-4">
                    {topic.bullets.map((bullet, j) => (
                      <li key={j}>{bullet}</li>
                    ))}
                  </ul>
                )}
                
                {topic.source && (
                  <p className="text-xs text-muted-foreground border-l-2 pl-2 italic">
                    Fonte: {topic.source}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 7. Diagrama/Fluxograma */}
      {diagram && diagram.steps && diagram.steps.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="font-bold text-xl">{diagram.title}</h3>
          <div className="w-full overflow-x-auto pb-4">
            <div className="flex items-center min-w-max px-2">
              {diagram.steps.map((step, i) => (
                <React.Fragment key={i}>
                  <div className="bg-primary/10 text-primary border border-primary/20 rounded-xl p-4 w-48 text-center shrink-0">
                    <span className="block text-xs font-bold mb-1 opacity-70">Passo {i + 1}</span>
                    <span className="font-medium text-sm">{step}</span>
                  </div>
                  {i < diagram.steps.length - 1 && (
                    <div className="w-8 h-[2px] bg-primary/30 relative shrink-0">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-primary/50 rotate-45"></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* 6. Tabelas */}
      {tables && tables.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-6">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <Table2 size={24} className="text-primary" /> Tabelas de Referência
          </h3>
          {tables.map((table, i) => (
            <div key={i} className="space-y-2">
              <h4 className="font-semibold text-lg">{table.title}</h4>
              <div className="rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        {table.headers.map((header, j) => (
                          <th key={j} className="px-6 py-3 font-semibold">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, j) => (
                        <tr key={j} className="bg-card border-b last:border-0 hover:bg-muted/50 transition-colors">
                          {row.map((cell, k) => (
                            <td key={k} className="px-6 py-4">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* 8. Atenção */}
      {attention && attention.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          {attention.map((alert, i) => (
            <div key={i} className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-r-xl p-4 flex gap-3 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="shrink-0 text-amber-500" size={24} />
              <div>
                <p className="font-semibold mb-1">Atenção!</p>
                <p className="text-sm opacity-90">{alert}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* 10. Exemplos clínicos */}
      {examples && examples.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <Stethoscope size={24} className="text-primary" /> Aplicação Clínica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examples.map((example, i) => (
              <div key={i} className="bg-card border border-primary/10 rounded-xl p-5 shadow-sm relative">
                <div className="absolute top-4 right-4 text-primary/20">
                  <Stethoscope size={48} />
                </div>
                <p className="text-foreground/90 relative z-10">{example}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 11. Revisão rápida */}
      {quick_review && quick_review.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Tags / Revisão Rápida</h3>
          <div className="flex flex-wrap gap-2">
            {quick_review.map((item, i) => (
              <span key={i} className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-sm font-medium">
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* 12. Perguntas de fixação */}
      {questions && questions.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4 pt-4">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <HelpCircle size={24} className="text-primary" /> Perguntas de Fixação
          </h3>
          <div className="space-y-2">
            {questions.map((q, i) => (
              <AccordionQuestion key={i} question={q.q} answer={q.a} />
            ))}
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}

function AccordionQuestion({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-xl bg-card overflow-hidden transition-all duration-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium pr-4">{question}</span>
        <ChevronDown 
          size={20} 
          className={`text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      <div 
        className={`grid transition-all duration-200 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-5 pt-0 text-muted-foreground border-t bg-muted/20 mt-2">
            <p className="mt-4">{answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
