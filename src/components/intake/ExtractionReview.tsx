import { useState } from 'react';
import { Check, Copy, Download, Mail } from 'lucide-react';
import type { ExtractedItem } from '../../types';

const TRADES = [
  'Painting & Touch-Up', 'Trim / Baseboard / Caulk', 'Stairs / Flooring', 'Plumbing',
  'HVAC', 'Door Hardware', 'Drywall', 'Concrete', 'Framing / Siding', 'Windows',
  'Garage', 'Garage Door', 'General Cleaning', 'Landscaping / Irrigation', 'Gutters',
  'Electrical', 'Roofing', 'Insulation', 'Appliances', 'Cabinets / Countertops',
  'Masonry / Stone', 'Mirrors / Shower Glass', 'Stucco / Plastering', 'Fencing',
  'Pest Control', 'Uncategorized',
];

interface ReviewItem extends ExtractedItem {
  selected: boolean;
  fileId: string;
  fileName: string;
}

interface ExtractionReviewProps {
  items: ReviewItem[];
  onItemsChange: (items: ReviewItem[]) => void;
  onCommit: (items: ReviewItem[]) => void;
  loading?: boolean;
}

export function ExtractionReview({ items, onItemsChange, onCommit, loading }: ExtractionReviewProps) {
  const [editingId, setEditingId] = useState<number | null>(null);

  const toggleSelect = (index: number) => {
    onItemsChange(items.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item)));
  };

  const toggleAll = () => {
    const allSelected = items.every((i) => i.selected);
    onItemsChange(items.map((item) => ({ ...item, selected: !allSelected })));
  };

  const updateItem = (index: number, updates: Partial<ReviewItem>) => {
    onItemsChange(items.map((item, i) => (i === index ? Object.assign({}, item, updates) : item)));
  };

  const selectedCount = items.filter((i) => i.selected).length;

  const byTrade = items.reduce<Record<string, { items: ReviewItem[]; indices: number[] }>>(
    (acc, item, i) => {
      const trade = item.trade || 'Uncategorized';
      if (!acc[trade]) acc[trade] = { items: [], indices: [] };
      acc[trade].items.push(item);
      acc[trade].indices.push(i);
      return acc;
    },
    {}
  );

  const copyList = () => {
    const selected = items.filter((i) => i.selected);
    const text = selected
      .map((item, i) => `${i + 1}. [${item.trade}] ${item.text}${item.location ? ` (${item.location})` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
  };

  const downloadList = () => {
    const selected = items.filter((i) => i.selected);
    const text = selected
      .map((item, i) => `${i + 1}. [${item.trade}] ${item.text}${item.location ? ` (${item.location})` : ''}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `punch-list-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const emailList = () => {
    const selected = items.filter((i) => i.selected);
    const text = selected
      .map((item, i) => `${i + 1}. [${item.trade}] ${item.text}${item.location ? ` (${item.location})` : ''}`)
      .join('\n');
    const subject = `Punch List — ${selectedCount} Items`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-4 pb-6">
      {items.length === 0 ? (
        <div className="app-card text-center py-10">
          <p className="text-sm font-bold text-[var(--text)] mb-1">No items extracted</p>
          <p className="text-xs text-[var(--text-3)] leading-relaxed">
            Claude didn't find any punch items. Upload a different file, or go back and
            add items manually from the project page.
          </p>
        </div>
      ) : (
        <div className="app-card !p-3 flex items-center justify-between">
          <button
            onClick={toggleAll}
            className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:underline"
          >
            {items.every((i) => i.selected) ? 'Deselect all' : 'Select all'}
          </button>
          <span className="text-xs text-[var(--text-3)] font-mono tabular-nums">
            {selectedCount}/{items.length} selected
          </span>
        </div>
      )}

      {Object.entries(byTrade).map(([trade, group]) => (
        <div key={trade} className="app-card !p-0 overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
            <span className="font-display text-sm font-bold uppercase tracking-wider text-[var(--text)]">
              {trade}
            </span>
            <span className="font-mono text-[10px] text-[var(--text-3)] bg-[var(--card-2)] px-2 py-0.5 rounded-full border border-[var(--border)] tabular-nums">
              {group.items.length}
            </span>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {group.items.map((item, j) => {
              const globalIndex = group.indices[j]!;
              const isEditing = editingId === globalIndex;
              return (
                <div
                  key={globalIndex}
                  className={`px-4 py-3 transition-colors ${
                    item.selected ? 'bg-[var(--card)]' : 'bg-[var(--card-2)]/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleSelect(globalIndex)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        item.selected
                          ? 'bg-[var(--accent)] border-[var(--accent)]'
                          : 'border-[var(--border-2)] hover:border-[var(--accent)]'
                      }`}
                      aria-label={item.selected ? 'Deselect' : 'Select'}
                    >
                      {item.selected && <Check size={12} strokeWidth={3} className="text-white" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <textarea
                          className="w-full px-3 py-2 rounded-lg border-2 border-[var(--border)] bg-[var(--card-2)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none resize-none text-sm"
                          rows={2}
                          value={item.text}
                          onChange={(e) => updateItem(globalIndex, { text: e.target.value })}
                          onBlur={() => setEditingId(null)}
                          autoFocus
                        />
                      ) : (
                        <p
                          className="text-sm font-semibold text-[var(--text)] cursor-pointer hover:text-[var(--accent)]"
                          onClick={() => setEditingId(globalIndex)}
                        >
                          {item.text}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {item.priority !== 'normal' && (
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              item.priority === 'hot'
                                ? 'bg-[var(--red)]/10 text-[var(--red)] border-[var(--red)]/30'
                                : 'bg-[var(--amber)]/10 text-[var(--amber)] border-[var(--amber)]/30'
                            }`}
                          >
                            {item.priority}
                          </span>
                        )}
                        {item.repaired && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/30">
                            repaired
                          </span>
                        )}
                        {item.location && (
                          <span className="text-[10px] font-mono uppercase text-[var(--text-3)]">
                            {item.location}
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--text-4)] font-mono truncate max-w-[100px]">
                          {item.fileName}
                        </span>

                        <select
                          className="text-[11px] border border-[var(--border)] rounded px-1.5 py-0.5 text-[var(--text-2)] bg-[var(--card-2)] ml-auto focus:outline-none focus:border-[var(--accent)]"
                          value={item.trade}
                          onChange={(e) => updateItem(globalIndex, { trade: e.target.value })}
                        >
                          {TRADES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => {
                            const next =
                              item.priority === 'normal'
                                ? 'hot'
                                : item.priority === 'hot'
                                  ? 'elevated'
                                  : 'normal';
                            updateItem(globalIndex, { priority: next as ExtractedItem['priority'] });
                          }}
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                            item.priority === 'hot'
                              ? 'bg-[var(--red)] text-white'
                              : item.priority === 'elevated'
                                ? 'bg-[var(--amber)] text-white'
                                : 'bg-[var(--card-2)] text-[var(--text-3)] border border-[var(--border)] hover:border-[var(--accent)]'
                          }`}
                          title="Toggle priority"
                        >
                          !
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {items.length > 0 && (
        <div className="app-card space-y-2 !p-4">
          <button
            onClick={() => onCommit(items.filter((i) => i.selected))}
            disabled={selectedCount === 0 || loading}
            className="app-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Adding…'
              : selectedCount === 0
                ? 'Select items above'
                : `Add ${selectedCount} item${selectedCount !== 1 ? 's' : ''} to project`}
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={copyList}
              disabled={selectedCount === 0}
              className="app-btn-ghost text-xs py-2 disabled:opacity-40"
            >
              <Copy size={12} strokeWidth={2.5} />
              Copy
            </button>
            <button
              onClick={downloadList}
              disabled={selectedCount === 0}
              className="app-btn-ghost text-xs py-2 disabled:opacity-40"
            >
              <Download size={12} strokeWidth={2.5} />
              Download
            </button>
            <button
              onClick={emailList}
              disabled={selectedCount === 0}
              className="app-btn-ghost text-xs py-2 disabled:opacity-40"
            >
              <Mail size={12} strokeWidth={2.5} />
              Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export type { ReviewItem };
