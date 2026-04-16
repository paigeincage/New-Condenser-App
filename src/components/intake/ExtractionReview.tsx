import { useState } from 'react';
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
    const next = items.map((item, i) => i === index ? { ...item, selected: !item.selected } : item);
    onItemsChange(next);
  };

  const toggleAll = () => {
    const allSelected = items.every((i) => i.selected);
    onItemsChange(items.map((item) => ({ ...item, selected: !allSelected })));
  };

  const updateItem = (index: number, updates: Partial<ReviewItem>) => {
    const next = items.map((item, i) => i === index ? Object.assign({}, item, updates) : item);
    onItemsChange(next);
  };

  const selectedCount = items.filter((i) => i.selected).length;

  // Group items by trade
  const byTrade = items.reduce<Record<string, { items: ReviewItem[]; indices: number[] }>>((acc, item, i) => {
    const trade = item.trade || 'Uncategorized';
    if (!acc[trade]) acc[trade] = { items: [], indices: [] };
    acc[trade].items.push(item);
    acc[trade].indices.push(i);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={toggleAll} className="text-sm text-mar font-medium hover:underline">
            {items.every((i) => i.selected) ? 'Deselect all' : 'Select all'}
          </button>
          <span className="text-sm text-g400">
            {selectedCount} of {items.length} items selected
          </span>
        </div>
      </div>

      {/* Items grouped by trade */}
      {Object.entries(byTrade).map(([trade, group]) => (
        <div key={trade} className="rounded-xl border border-g100 overflow-hidden">
          <div className="bg-surface px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-g700">{trade}</span>
            <span className="text-xs text-g400 bg-white px-2 py-0.5 rounded-full">
              {group.items.length}
            </span>
          </div>

          <div className="divide-y divide-g100">
            {group.items.map((item, j) => {
              const globalIndex = group.indices[j]!;
              const isEditing = editingId === globalIndex;

              return (
                <div
                  key={globalIndex}
                  className={`px-4 py-3 transition-colors ${item.selected ? 'bg-white' : 'bg-surface-2/30'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(globalIndex)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                        ${item.selected ? 'bg-mar border-mar' : 'border-g300 hover:border-mar'}`}
                    >
                      {item.selected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      {/* Item text */}
                      {isEditing ? (
                        <textarea
                          className="w-full text-sm border border-g200 rounded-lg p-2 focus:outline-none focus:border-mar resize-none"
                          rows={2}
                          value={item.text}
                          onChange={(e) => updateItem(globalIndex, { text: e.target.value })}
                          onBlur={() => setEditingId(null)}
                          autoFocus
                        />
                      ) : (
                        <p
                          className="text-sm text-g700 cursor-pointer hover:text-mar"
                          onClick={() => setEditingId(globalIndex)}
                        >
                          {item.text}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {/* Priority badge */}
                        {item.priority !== 'normal' && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            item.priority === 'hot' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.priority}
                          </span>
                        )}

                        {/* Repaired badge */}
                        {item.repaired && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            repaired
                          </span>
                        )}

                        {/* Location */}
                        {item.location && (
                          <span className="text-xs text-g400">{item.location}</span>
                        )}

                        {/* File name */}
                        <span className="text-xs text-g400 font-mono">{item.fileName}</span>

                        {/* Trade selector */}
                        <select
                          className="text-xs border border-g200 rounded px-1.5 py-0.5 text-g600 bg-white ml-auto"
                          value={item.trade}
                          onChange={(e) => updateItem(globalIndex, { trade: e.target.value })}
                        >
                          {TRADES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>

                        {/* Priority toggle */}
                        <button
                          onClick={() => {
                            const next = item.priority === 'normal' ? 'hot' : item.priority === 'hot' ? 'elevated' : 'normal';
                            updateItem(globalIndex, { priority: next as ExtractedItem['priority'] });
                          }}
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors ${
                            item.priority === 'hot' ? 'bg-red-500 text-white' :
                            item.priority === 'elevated' ? 'bg-amber-500 text-white' :
                            'bg-g200 text-g400 hover:bg-g300'
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

      {/* Commit button */}
      <button
        onClick={() => onCommit(items.filter((i) => i.selected))}
        disabled={selectedCount === 0 || loading}
        className="w-full py-3.5 rounded-xl font-semibold text-white bg-mar hover:bg-mar-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base"
      >
        {loading ? 'Adding...' : `Add ${selectedCount} Item${selectedCount !== 1 ? 's' : ''} to Project`}
      </button>
    </div>
  );
}

export type { ReviewItem };
