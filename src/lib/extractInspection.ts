import { pdfToImages } from "./pdfToImages";
import type { InspectionFieldHints } from "./types/inspection";

export async function extractInspection(
  file: File,
  fieldHints?: Partial<InspectionFieldHints>,
) {
  // Render each PDF page to an image via PDF.js so that annotation layers
  // (hand-marked X's, checked boxes, form-field overlays) are visible to Claude
  const images = await pdfToImages(file);

  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images, fieldHints }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Extraction failed");
  }
  return res.json();
}
