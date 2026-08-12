export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt")) {
    return (await file.text()).slice(0, 200000);
  }

  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    const buffer = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buffer }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n\n";
      if (text.length > 200000) break;
    }
    return text.slice(0, 200000);
  }

  // DOCX and other formats: best-effort plain text extraction
  const raw = await file.text();
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/[^\x20-\x7EÀ-ÿ\n]/g, " ")
    .replace(/\s{2,}/g, " ")
    .slice(0, 200000);
}
