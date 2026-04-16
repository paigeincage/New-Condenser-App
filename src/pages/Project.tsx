import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject } from '../api/projects';
import { updateItem, deleteItem, createItemsBulk } from '../api/items';
import { TopBar } from '../components/layout/TopBar';
import { SendModal } from '../components/send/SendModal';
import { useUI } from '../stores/ui';
import type { Project as ProjectType, PunchItem } from '../types';

const TRADES = [
  'Painting & Touch-Up', 'Trim / Baseboard / Caulk', 'Stairs / Flooring', 'Plumbing',
  'HVAC', 'Door Hardware', 'Drywall', 'Concrete', 'Framing / Siding', 'Windows',
  'Garage', 'Garage Door', 'General Cleaning', 'Landscaping / Irrigation', 'Gutters',
  'Electrical', 'Roofing', 'Insulation', 'Appliances', 'Cabinets / Countertops',
  'Masonry / Stone', 'Mirrors / Shower Glass', 'Stucco / Plastering', 'Fencing',
  'Pest Control', 'Uncategorized',
];

export function Project() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const addToast = useUI((s) => s.addToast);
  const [project, setProject] = useState<ProjectType | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'wip' | 'done'>('all');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<PunchItem | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [newItem, setNewItem] = useState<{ text: string; trade: string; location: string; priority: 'normal' | 'elevated' | 'hot' }>({ text: '', trade: 'Uncategorized', location: '', priority: 'normal' });

  const load = () => {
    if (!id) return;
    getProject(id)
      .then((r) => setProject(r.project))
      .catch(() => addToast('Failed to load project', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading) return <div className="text-center py-20 text-g400 text-sm">Loading...</div>;
  if (!project) return <div className="text-center py-20 text-g400">Project not found</div>;

  const allItems = project.items || [];
  const items = allItems.filter((i) => filter === 'all' || i.status === filter);

  // Group by trade
  const byTrade: Record<string, PunchItem[]> = {};
  for (const item of items) {
    const t = item.trade || 'Uncategorized';
    if (!byTrade[t]) byTrade[t] = [];
    byTrade[t].push(item);
  }

  const statusCounts = {
    all: allItems.length,
    pending: allItems.filter((i) => i.status === 'pending').length,
    wip: allItems.filter((i) => i.status === 'wip').length,
    done: allItems.filter((i) => i.status === 'done').length,
  };

  const completionPct = allItems.length > 0 ? Math.round((statusCounts.done / allItems.length) * 100) : 0;

  const cycleStatus = async (item: PunchItem) => {
    const next = item.status === 'pending' ? 'wip' : item.status === 'wip' ? 'done' : 'pending';
    try {
      await updateItem(item.id, { status: next });
      load();
    } catch {
      addToast('Failed to update', 'error');
    }
  };

  const handleDelete = async (item: PunchItem) => {
    try {
      await deleteItem(item.id);
      load();
    } catch {
      addToast('Failed to delete', 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await updateItem(editingItem.id, {
        text: editingItem.text,
        trade: editingItem.trade,
        location: editingItem.location,
        priority: editingItem.priority,
        notes: editingItem.notes,
        assignee: editingItem.assignee,
      });
      setEditingItem(null);
      load();
      addToast('Item updated', 'success');
    } catch {
      addToast('Failed to save', 'error');
    }
  };

  const handleAddItem = async () => {
    if (!newItem.text.trim() || !id) return;
    try {
      await createItemsBulk([{
        projectId: id,
        text: newItem.text.trim(),
        trade: newItem.trade,
        location: newItem.location,
        priority: newItem.priority,
        source: 'Manual',
      }]);
      setNewItem({ text: '', trade: 'Uncategorized', location: '', priority: 'normal' });
      setShowAddItem(false);
      load();
      addToast('Item added', 'success');
    } catch {
      addToast('Failed to add item', 'error');
    }
  };

  const toggleCollapse = (trade: string) => {
    setCollapsed((c) => ({ ...c, [trade]: !c[trade] }));
  };

  // Trade-level done counts
  const tradeDoneCounts: Record<string, { done: number; total: number }> = {};
  for (const item of allItems) {
    const t = item.trade || 'Uncategorized';
    if (!tradeDoneCounts[t]) tradeDoneCounts[t] = { done: 0, total: 0 };
    tradeDoneCounts[t].total++;
    if (item.status === 'done') tradeDoneCounts[t].done++;
  }

  return (
    <div>
      <TopBar
        title={project.address}
        back
        right={
          <div className="flex items-center gap-2">
            {allItems.length > 0 && (
              <button
                onClick={() => setShowSend(true)}
                className="border border-mar text-mar text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-mar hover:text-white transition-colors"
              >
                Send
              </button>
            )}
            <button
              onClick={() => nav(`/project/${id}/intake`)}
              className="bg-mar text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-mar-light transition-colors"
            >
              + Add Files
            </button>
          </div>
        }
      />

      {/* Project info */}
      {project.community && (
        <p className="text-sm text-g400 -mt-2 mb-4">
          {project.community}{project.lot ? ` · Lot ${project.lot}` : ''}
          {project.date ? ` · ${project.date}` : ''}
        </p>
      )}

      {/* Progress bar */}
      {allItems.length > 0 && (
        <div className="mb-4 bg-surface rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-g700">
              {statusCounts.done}/{allItems.length} Complete
            </span>
            <span className="text-sm font-bold text-mar">{completionPct}%</span>
          </div>
          <div className="w-full h-2 bg-g200 rounded-full overflow-hidden">
            <div
              className="h-full bg-mar rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-g400">
            <span>{statusCounts.pending} pending</span>
            <span>{statusCounts.wip} in progress</span>
            <span>{statusCounts.done} done</span>
          </div>
        </div>
      )}

      {/* Uploaded files */}
      {project.files && project.files.length > 0 && (
        <div className="mb-4 rounded-xl border border-g100 overflow-hidden">
          <button
            onClick={() => setCollapsed((c) => ({ ...c, __files: !c.__files }))}
            className="w-full bg-surface px-4 py-2.5 flex items-center justify-between hover:bg-g100 transition-colors"
          >
            <span className="text-sm font-semibold text-g700">Uploaded Files</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-g400 bg-white px-2 py-0.5 rounded-full">{project.files.length}</span>
              <svg
                className={`w-4 h-4 text-g400 transition-transform ${collapsed.__files ? '' : 'rotate-180'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          {!collapsed.__files && (
            <div className="divide-y divide-g100">
              {project.files.map((f) => (
                <div key={f.id} className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-g700 truncate">{f.originalName}</p>
                    <p className="text-xs text-g400">
                      {(f.sizeBytes / 1024).toFixed(0)} KB
                      {f.pageCount ? ` · ${f.pageCount} pages` : ''}
                      {f.extractedItemCount ? ` · ${f.extractedItemCount} items extracted` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      f.extractionStatus === 'done' ? 'bg-green-100 text-green-700' :
                      f.extractionStatus === 'processing' ? 'bg-amber-100 text-amber-700' :
                      f.extractionStatus === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-surface text-g400'
                    }`}>
                      {f.extractionStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-surface rounded-lg p-1">
        {(['all', 'pending', 'wip', 'done'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === f ? 'bg-white text-g700 shadow-sm' : 'text-g400 hover:text-g600'
            }`}
          >
            {f === 'all' ? 'All' : f === 'wip' ? 'WIP' : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1 text-xs opacity-60">{statusCounts[f]}</span>
          </button>
        ))}
      </div>

      {/* Items by trade */}
      {Object.keys(byTrade).length === 0 ? (
        <div className="text-center py-12 text-g400 text-sm">
          {filter === 'all' ? 'No items yet. Add files to extract punch items.' : `No ${filter} items.`}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(byTrade).sort(([a], [b]) => a.localeCompare(b)).map(([trade, tradeItems]) => {
            const tradeStats = tradeDoneCounts[trade];
            const tradePct = tradeStats ? Math.round((tradeStats.done / tradeStats.total) * 100) : 0;

            return (
              <div key={trade} className="rounded-xl border border-g100 overflow-hidden">
                <button
                  onClick={() => toggleCollapse(trade)}
                  className="w-full bg-surface px-4 py-2.5 flex items-center justify-between hover:bg-g100 transition-colors"
                >
                  <span className="text-sm font-semibold text-g700">{trade}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-g400">{tradePct}%</span>
                    <span className="text-xs text-g400 bg-white px-2 py-0.5 rounded-full">{tradeItems.length}</span>
                    <svg
                      className={`w-4 h-4 text-g400 transition-transform ${collapsed[trade] ? '' : 'rotate-180'}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {!collapsed[trade] && (
                  <div className="divide-y divide-g100">
                    {tradeItems.map((item) => (
                      <div key={item.id} className="px-4 py-3 flex items-start gap-3">
                        {/* Status button */}
                        <button
                          onClick={() => cycleStatus(item)}
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            item.status === 'done' ? 'bg-green-500 border-green-500' :
                            item.status === 'wip' ? 'bg-amber-500 border-amber-500' :
                            'border-g300 hover:border-mar'
                          }`}
                          title={`Status: ${item.status} (click to cycle)`}
                        >
                          {item.status === 'done' && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => setEditingItem({ ...item })}
                        >
                          <p className={`text-sm ${item.status === 'done' ? 'text-g400 line-through' : 'text-g700'}`}>
                            {item.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {item.priority !== 'normal' && (
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                item.priority === 'hot' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {item.priority}
                              </span>
                            )}
                            {item.location && (
                              <span className="text-xs text-g500 bg-g100 px-1.5 py-0.5 rounded">
                                {item.location}
                              </span>
                            )}
                            {item.assignee && <span className="text-xs text-g400">{item.assignee}</span>}
                            {item.notes && (
                              <span className="text-xs text-g400 italic truncate max-w-[150px]">{item.notes}</span>
                            )}
                            {item.source && item.source !== 'Manual' && (
                              <span className="text-xs text-g400 font-mono">{item.source}</span>
                            )}
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-g300 hover:text-red-500 p-1 shrink-0"
                          title="Delete item"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 space-y-2">
        {allItems.length > 0 && (
          <button
            onClick={() => setShowSend(true)}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-mar hover:bg-mar-light transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send Punch List
          </button>
        )}
        <button
          onClick={() => setShowAddItem(true)}
          className="w-full py-3 rounded-xl border-2 border-dashed border-g200 text-g400 hover:border-mar hover:text-mar font-medium text-sm transition-colors"
        >
          + Add Item Manually
        </button>
      </div>

      {/* ── Add Item Modal ── */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowAddItem(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-g700">Add Item</h3>

            <div>
              <label className="text-xs font-medium text-g500 mb-1 block">Description</label>
              <textarea
                className="w-full border border-g200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-mar resize-none"
                rows={3}
                placeholder="Describe the punch item..."
                value={newItem.text}
                onChange={(e) => setNewItem({ ...newItem, text: e.target.value })}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-g500 mb-1 block">Trade</label>
                <select
                  className="w-full border border-g200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-mar bg-white"
                  value={newItem.trade}
                  onChange={(e) => setNewItem({ ...newItem, trade: e.target.value })}
                >
                  {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-g500 mb-1 block">Priority</label>
                <select
                  className="w-full border border-g200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-mar bg-white"
                  value={newItem.priority}
                  onChange={(e) => setNewItem({ ...newItem, priority: e.target.value as 'normal' | 'elevated' | 'hot' })}
                >
                  <option value="normal">Normal</option>
                  <option value="elevated">Elevated</option>
                  <option value="hot">Hot</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-g500 mb-1 block">Location</label>
              <input
                className="w-full border border-g200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-mar"
                placeholder="e.g. Kitchen, Master Bedroom"
                value={newItem.location}
                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAddItem(false)}
                className="flex-1 py-3 rounded-xl border border-g200 text-g600 font-semibold text-sm hover:bg-g50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItem.text.trim()}
                className="flex-1 py-3 rounded-xl bg-mar text-white font-semibold text-sm hover:bg-mar-light disabled:opacity-40 transition-colors"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send Modal ── */}
      {showSend && (
        <SendModal
          items={allItems}
          projectAddress={project.address}
          onClose={() => setShowSend(false)}
        />
      )}

      {/* ── Edit Item Modal ── */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setEditingItem(null)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-g700">Edit Item</h3>

            <div>
              <label className="text-xs font-medium text-g500 mb-1 block">Description</label>
              <textarea
                className="w-full border border-g200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-mar resize-none"
                rows={3}
                value={editingItem.text}
                onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-g500 mb-1 block">Trade</label>
                <select
                  className="w-full border border-g200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-mar bg-white"
                  value={editingItem.trade}
                  onChange={(e) => setEditingItem({ ...editingItem, trade: e.target.value })}
                >
                  {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-g500 mb-1 block">Priority</label>
                <select
                  className="w-full border border-g200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-mar bg-white"
                  value={editingItem.priority}
                  onChange={(e) => setEditingItem({ ...editingItem, priority: e.target.value as 'normal' | 'elevated' | 'hot' })}
                >
                  <option value="normal">Normal</option>
                  <option value="elevated">Elevated</option>
                  <option value="hot">Hot</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-g500 mb-1 block">Location</label>
              <input
                className="w-full border border-g200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-mar"
                placeholder="e.g. Kitchen, Master Bedroom"
                value={editingItem.location}
                onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-g500 mb-1 block">Assignee</label>
              <input
                className="w-full border border-g200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-mar"
                placeholder="e.g. Joe's Painting"
                value={editingItem.assignee}
                onChange={(e) => setEditingItem({ ...editingItem, assignee: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-g500 mb-1 block">Notes</label>
              <textarea
                className="w-full border border-g200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-mar resize-none"
                rows={2}
                placeholder="Additional notes..."
                value={editingItem.notes}
                onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 py-3 rounded-xl border border-g200 text-g600 font-semibold text-sm hover:bg-g50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-3 rounded-xl bg-mar text-white font-semibold text-sm hover:bg-mar-light transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
