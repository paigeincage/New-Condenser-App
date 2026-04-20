// ═══════════════════════════════════════════════
// THE CONDENSER — Text-Based Classification
// For DOCX, XLSX, TXT files where we have raw text.
// L0: Keyword match (free, instant)
// L1: Claude Haiku (cheap fallback)
// ═══════════════════════════════════════════════

import { anthropic } from '../lib/anthropic.js';
import { classifyByKeyword, detectPriority, tradeListForPrompt, CLASSIFICATION_RULES } from './classify.js';

export interface ClassifiedItem {
  text: string;
  trade: string;
  priority: 'normal' | 'elevated' | 'hot';
  location: string | null;
  method: 'keyword' | 'ai' | 'unmatched';
}

/**
 * Classify an array of text items using keyword matching + Claude Haiku fallback.
 */
export async function classifyTextItems(
  items: string[],
  feedbackExamples?: { text: string; correctedTrade: string }[]
): Promise<ClassifiedItem[]> {
  const results: ClassifiedItem[] = [];
  const needsAI: { index: number; text: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    const text = items[i].trim();
    if (!text) continue;

    const kw = classifyByKeyword(text);
    const priority = detectPriority(text);

    if (kw && kw.confidence >= 0.6) {
      results.push({ text, trade: kw.trade, priority, location: null, method: 'keyword' });
    } else {
      needsAI.push({ index: results.length, text });
      results.push({ text, trade: 'Uncategorized', priority, location: null, method: 'unmatched' });
    }
  }

  // Send uncategorized items to Claude Haiku
  if (needsAI.length > 0) {
    try {
      const inputArr = needsAI.map((b, i) => ({ msg_index: i, text: b.text }));

      let prompt = `You are a construction punch list classifier. Classify each item into exactly ONE trade category.

TRADE CATEGORIES:
${tradeListForPrompt()}
- Uncategorized (only if truly no match)

RULES:
${CLASSIFICATION_RULES}

Return ONLY JSON: [{"msg_index": 0, "trade": "...", "priority": "normal", "location": null, "summary": "..."}]

Items: ${JSON.stringify(inputArr)}`;

      if (feedbackExamples && feedbackExamples.length > 0) {
        const examples = feedbackExamples
          .slice(0, 20)
          .map((f) => `"${f.text}" → ${f.correctedTrade}`)
          .join('\n');
        prompt += `\n\nPrevious user corrections (use as guidance):\n${examples}`;
      }

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      const raw = textBlock?.text?.trim() || '[]';
      const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
      const aiResults: {
        msg_index: number; trade: string; priority?: string;
        location?: string | null; summary?: string;
      }[] = JSON.parse(jsonStr);

      for (const ai of aiResults) {
        const target = needsAI[ai.msg_index];
        if (!target) continue;
        const result = results[target.index];
        result.trade = ai.trade || 'Uncategorized';
        if (ai.priority) result.priority = ai.priority as ClassifiedItem['priority'];
        if (ai.location) result.location = ai.location;
        result.method = 'ai';
      }
    } catch (err) {
      console.error('[TextClassify] AI fallback error:', err);
    }
  }

  return results;
}
