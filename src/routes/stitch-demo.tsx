"use client";

import { useState, lazy, Suspense } from "react";
import { toast } from "@/components/ui/sonner";
import { runStitchDesign } from "@/lib/stitchSkills";
import { write_to_file } from "agy";

export default function StitchDemo() {
  const [prompt, setPrompt] = useState("");
  const [generatedName, setGeneratedName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    toast.info("Gerando tela via Stitch…");
    try {
      const screenCode = await runStitchDesign(prompt);
      const componentName = "StitchGeneratedScreen";
      const targetPath = `c:/Users/olimp/Documents/antigravity/intelligent-lovelace/src/components/generated/${componentName}.tsx`;
      await write_to_file({
        TargetFile: targetPath,
        Overwrite: true,
        CodeContent: screenCode,
        Description: "Tela gerada pelo Stitch a partir de prompt.",
        ArtifactMetadata: {
          RequestFeedback: false,
          Summary: `Componente ${componentName} criado via Stitch`,
          UserFacing: true
        },
        toolAction: "Saving generated screen",
        toolSummary: "File write"
      });
      setGeneratedName(componentName);
      toast.success("Tela gerada!");
    } catch (e) {
      console.error(e);
      toast.error("Falha ao gerar tela.");
    } finally {
      setLoading(false);
    }
  };

  const Generated = generatedName
    ? lazy(() => import(`@/components/generated/${generatedName}.tsx`).then(mod => ({ default: mod.default })))
    : null;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Stitch – Demo</h1>
      <textarea
        className="w-full h-32 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Descreva a tela que deseja gerar…"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        disabled={loading}
      />
      <button
        className="mt-3 btn-primary w-full"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? "Gerando…" : "Gerar tela"}
      </button>
      {Generated && (
        <section className="generated-screen-preview mt-6 p-4 bg-white/30 backdrop-blur-sm rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">Pré‑visualização</h2>
          <Suspense fallback={<div>Carregando preview…</div>}>
            <Generated />
          </Suspense>
        </section>
      )}
    </main>
  );
}
