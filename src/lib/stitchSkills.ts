// src/lib/stitchSkills.ts
import { call_mcp_tool } from "agy";

/**
 * Executa o skill `stitch-design` para gerar código de tela a partir de
 * uma descrição em linguagem natural.
 *
 * @param description Texto que descreve a tela desejada.
 * @returns Código JSX/TSX da tela gerada.
 */
export async function runStitchDesign(description: string): Promise<string> {
  const res = await call_mcp_tool({
    ServerName: "stitch",
    ToolName: "stitch-design",
    Arguments: { description },
    toolAction: "Running stitch-design",
    toolSummary: "Stitch design generation",
  });
  // O retorno esperado contém a propriedade `screenCode`.
  return (res as any).screenCode ?? "";
}

/**
 * Converte um design já criado (identificado por designId) em componentes React.
 * Utiliza o skill `react:components`.
 */
export async function generateReactComponents(designId: string): Promise<string> {
  const res = await call_mcp_tool({
    ServerName: "stitch",
    ToolName: "react:components",
    Arguments: { designId },
    toolAction: "Generating React components",
    toolSummary: "Stitch React conversion",
  });
  return (res as any).code ?? "";
}

/**
 * Executa o skill `stitch-loop` que automatiza a criação de múltiplas telas
 * a partir de um prompt de projeto.
 */
export async function runStitchLoop(projectName: string): Promise<void> {
  await call_mcp_tool({
    ServerName: "stitch",
    ToolName: "stitch-loop",
    Arguments: { projectName },
    toolAction: "Running stitch-loop",
    toolSummary: "Stitch autonomous loop",
  });
}
