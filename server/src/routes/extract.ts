// ═══════════════════════════════════════════════
// THE CONDENSER — Document Extraction Route
// POST /api/extract/:fileId
// Reads file from disk, dispatches by type, returns items.
// ═══════════════════════════════════════════════

import { Router } from 'express';
import fs from 'fs';
import { prisma } from '../lib/prisma.js';
import { getOwnedSourceFile } from '../lib/ownership.js';
import { extractPdfText, pdfToImages } from '../services/pdf-to-images.js';
import { extractWithVision, extractFromImage, extractFromText } from '../services/vision-extract.js';
import { classifyTextItems } from '../services/text-classify.js';

export const extractRouter = Router();

/** Load recent classification feedback for prompt injection */
async function getFeedbackExamples() {
  const feedback = await prisma.classificationFeedback.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return feedback.map((f) => ({ text: f.originalText, correctedTrade: f.correctedTrade }));
}

/** Split raw text into individual lines/items */
function splitTextToItems(text: string): string[] {
  return text
    .split(/\n/)
    .map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter((line) => line.length > 5);
}

extractRouter.post('/:fileId', async (req, res) => {
  const { fileId } = req.params;

  const file = await getOwnedSourceFile(req.userId!, fileId);
  if (!file) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  if (!fs.existsSync(file.storagePath)) {
    res.status(404).json({ error: 'File not found on disk' });
    return;
  }

  // Mark as processing
  await prisma.sourceFile.update({
    where: { id: fileId },
    data: { extractionStatus: 'processing' },
  });

  try {
    const feedback = await getFeedbackExamples();
    let items;

    const mime = file.mimeType.toLowerCase();

    if (mime === 'application/pdf') {
      // ── PDF: Try text extraction first, fall back to vision ──
      const pdfContent = await extractPdfText(file.storagePath);
      await prisma.sourceFile.update({ where: { id: fileId }, data: { pageCount: pdfContent.pageCount } });

      if (pdfContent.hasRichText) {
        // PDF has extractable text — send text to Claude (cheaper, works great for most PDFs)
        console.log(`[Extract] PDF has rich text (${pdfContent.text.length} chars), using text extraction`);
        items = await extractFromText(pdfContent.text, feedback);
      } else {
        // Scanned/image PDF — render to images and use Claude Vision
        console.log(`[Extract] PDF is scanned/image-based, using vision extraction`);
        const images = await pdfToImages(file.storagePath);
        if (images.length > 0) {
          items = await extractWithVision(images, feedback);
        } else {
          // Canvas rendering failed, try text anyway as last resort
          items = await extractFromText(pdfContent.text, feedback);
        }
      }

    } else if (mime.startsWith('image/')) {
      // ── Image: Direct to Claude Vision ──
      const buffer = fs.readFileSync(file.storagePath);
      const base64 = buffer.toString('base64');
      const mediaType = mime as 'image/png' | 'image/jpeg' | 'image/webp';
      items = await extractFromImage(base64, mediaType, feedback);

    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/msword'
    ) {
      // ── DOCX: Extract text with mammoth → text classification ──
      const mammoth = await import('mammoth');
      const result = await mammoth.default.extractRawText({ path: file.storagePath });
      const textItems = splitTextToItems(result.value);
      const classified = await classifyTextItems(textItems, feedback);
      items = classified.map((c) => ({
        text: c.text,
        trade: c.trade,
        priority: c.priority,
        location: c.location,
        repaired: false,
      }));

    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mime === 'application/vnd.ms-excel'
    ) {
      // ── XLSX: Parse with xlsx → text classification ──
      const XLSX = await import('xlsx');
      const workbook = XLSX.default.readFile(file.storagePath);
      const allText: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.default.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 });
        for (const row of rows) {
          const line = Object.values(row).filter(Boolean).join(' ').trim();
          if (line.length > 5) allText.push(line);
        }
      }
      const classified = await classifyTextItems(allText, feedback);
      items = classified.map((c) => ({
        text: c.text,
        trade: c.trade,
        priority: c.priority,
        location: c.location,
        repaired: false,
      }));

    } else if (mime === 'text/plain' || mime === 'text/csv') {
      // ── Plain text / CSV ──
      const text = fs.readFileSync(file.storagePath, 'utf-8');
      const textItems = splitTextToItems(text);
      const classified = await classifyTextItems(textItems, feedback);
      items = classified.map((c) => ({
        text: c.text,
        trade: c.trade,
        priority: c.priority,
        location: c.location,
        repaired: false,
      }));

    } else {
      await prisma.sourceFile.update({
        where: { id: fileId },
        data: { extractionStatus: 'failed' },
      });
      res.status(400).json({ error: `Unsupported file type: ${mime}` });
      return;
    }

    // Update file record
    await prisma.sourceFile.update({
      where: { id: fileId },
      data: {
        extractionStatus: 'done',
        extractedItemCount: items.length,
      },
    });

    res.json({
      fileId,
      fileName: file.originalName,
      itemCount: items.length,
      items,
    });

  } catch (err) {
    console.error(`[Extract] Error processing ${file.originalName}:`, err);
    await prisma.sourceFile.update({
      where: { id: fileId },
      data: { extractionStatus: 'failed' },
    });
    res.status(500).json({ error: 'Extraction failed', detail: String(err) });
  }
});
