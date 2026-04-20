// ═══════════════════════════════════════════════
// THE CONDENSER — PDF Text Extraction + Page Images
// Strategy: Extract text via pdf-parse. If text is rich enough,
// send text to Claude. If not (scanned doc), render pages to images.
// ═══════════════════════════════════════════════

import fs from 'fs';
import pdf from 'pdf-parse';

export interface PageImage {
  pageNumber: number;
  base64: string;
  width: number;
  height: number;
}

export interface PdfContent {
  text: string;
  pageCount: number;
  hasRichText: boolean;
}

/**
 * Extract text from a PDF using pdf-parse.
 * Returns the full text and whether it's "rich" (has enough content to classify).
 */
export async function extractPdfText(filePath: string): Promise<PdfContent> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);

  // Consider text "rich" if we get at least 50 chars per page on average
  const avgCharsPerPage = data.text.length / Math.max(data.numpages, 1);
  const hasRichText = avgCharsPerPage > 50;

  return {
    text: data.text,
    pageCount: data.numpages,
    hasRichText,
  };
}

/**
 * Convert PDF pages to base64 PNG images for Claude Vision.
 * Uses canvas rendering. Falls back gracefully if canvas isn't available.
 */
export async function pdfToImages(filePath: string): Promise<PageImage[]> {
  // Dynamic import to handle canvas not being available
  try {
    const { createCanvas } = await import('canvas');
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const data = new Uint8Array(fs.readFileSync(filePath));
    const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;
    const pageCount = Math.min(doc.numPages, 50);
    const images: PageImage[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext('2d');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (page.render as any)({ canvasContext: ctx, viewport }).promise;

      images.push({
        pageNumber: i,
        base64: canvas.toBuffer('image/png').toString('base64'),
        width: viewport.width,
        height: viewport.height,
      });
      page.cleanup();
    }
    await doc.destroy();
    return images;
  } catch (err) {
    console.warn('[PDF] Canvas rendering failed, using text-only extraction:', err);
    return [];
  }
}

export async function getPageCount(filePath: string): Promise<number> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);
  return data.numpages;
}
