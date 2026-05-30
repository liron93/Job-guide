export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
  const data = await pdfParse(buffer);
  return data.text.trim();
}
