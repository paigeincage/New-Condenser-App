import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, Send, Plus, X, Flame, AlertCircle, FileText, Check, Mic, Camera, Loader2 } from 'lucide-react';
import { getProject } from '../api/projects';
import { updateItem, deleteItem, createItemsBulk } from '../api/items';
import { uploadFiles, extractFile } from '../api/files';
import { TopBar } from '../components/layout/TopBar';
import { SendModal } from '../components/send/SendModal';
import { PhotoAttachments } from '../components/items/PhotoAttachments';
import { VoiceCapture } from '../components/voice/VoiceCapture';
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

type Filter = 'all' | 'pending' | 'wip' | 'done';

export function Project() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const addToast = useUI((s) => s.addToast);
  const [project, setProject] = useState<ProjectType | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<PunchItem | null>(null);
  const [showSend, setShowSend] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [cameraUploading, setCameraUploading] = useState(false);
  const [quickAdd, setQuickAdd] = useState('');
  const cameraRef = useRef<HTMLInputElement>(null);

  const load = () => {
    if (!id) return;
    getProject(id)
      .then((r) => setProject(r.project))
      .catch(() => addToast('Failed to load project', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  if (loading)
    return (
      <div className="text-center py-20 text-[var(--text-3)] text-sm">Loading…</div>
    );
  if (!project)
    return (
      <div className="text-center py-20 text-[var(--text-3)] text-sm">Project not found</div>
    );

  const allItems = project.items || [];
  const items = allItems.filter((i) => filter === 'all' || i.status === filter);

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

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) {
      e.target.value = '';
      return;
    }
    setCameraUploading(true);
    try {
      const { files: uploaded } = await uploadFiles(id, [file]);
      const uf = uploaded[0];
      if (!uf) throw new Error('Upload returned no file');
      const result = await extractFile(uf.id);
      if (result.items.length === 0) {
        addToast('No punch items detected in photo', 'info');
      } else {
        await createItemsBulk(
          result.items.map((item) => ({
            projectId: id,
            text: item.text,
            trade: item.trade,
            priority: item.priority,
            source: 'Photo',
            sourceFileId: uf.id,
            location: item.location || '',
          }))
        );
        addToast(`Added ${result.items.length} items from photo`, 'success');
        load();
      }
    } catch (err) {
      addToast(`Photo extract failed: ${err}`, 'error');
    } finally {
      setCameraUploading(false);
      e.target.value = '';
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAdd.trim() || !id) return;
    try {
      await createItemsBulk([
        {
          projectId: id,
          text: quickAdd.trim(),
          trade: 'Uncategorized',
          location: '',
          priority: 'normal',
          source: 'Manual',
        },
      ]);
      setQuickAdd('');
      load();
    } catch {
      addToast('Failed to add', 'error');
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

  const toggleCollapse = (trade: string) => {
    setCollapsed((c) => ({ ...c, [trade]: !c[trade] }));
  };

  const tradeDoneCounts: Record<string, { done: number; total: number }> = {};
  for (const item of allItems) {
    const t = item.trade || 'Uncategorized';
    if (!tradeDoneCounts[t]) tradeDoneCounts[t] = { done: 0, total: 0 };
    tradeDoneCounts[t].total++;
    if (item.status === 'done') tradeDoneCounts[t].done++;
  }

  return (
    <div className="pb-28">
      <TopBar
        title={project.address}
        back
        right={
          allItems.length > 0 && (
            <button onClick={() => setShowSend(true)} className="app-btn-primary text-sm py-2 px-3">
              <Send size={14} strokeWidth={2.5} />
              Send
            </button>
          )
        }
      />

      {project.community && (
        <p className="text-xs text-[var(--text-3)] -mt-2 mb-5 font-mono">
          {project.community.toUpperCase()}
          {project.lot ? ` · LOT ${project.lot}` : ''}
          {project.date ? ` · ${project.date}` : ''}
        </p>
      )}

      {/* Progress */}
      {allItems.length > 0 && (
        <div className="app-card mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-3)] mb-0.5">
                Progress
              </div>
              <div className="font-display text-2xl font-extrabold uppercase text-[var(--text)]">
                {completionPct}% Complete
              </div>
            </div>
            <div className="font-mono text-xl font-bold text-[var(--accent)] tabular-nums">
              {statusCounts.done}/{allItems.length}
            </div>
          </div>
          <div className="w-full h-2.5 bg-[var(--card-2)] rounded-full overflow-hidden border border-[var(--border)]">
            <div
              className="h-full bg-gradient-to-r from-[var(--accent-deep)] to-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-[11px]">
            <StatDot color="var(--text-3)" label="Pending" value={statusCounts.pending} />
            <StatDot color="var(--amber)" label="WIP" value={statusCounts.wip} />
            <StatDot color="var(--green)" label="Done" value={statusCounts.done} />
            <StatDot color="var(--text-3)" label="Total" value={allItems.length} />
          </div>
        </div>
      )}

      {/* Files */}
      {project.files && project.files.length > 0 && (
        <FilesCollapse
          files={project.files}
          open={!collapsed.__files}
          onToggle={() => setCollapsed((c) => ({ ...c, __files: !c.__files }))}
        />
      )}

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {(['all', 'pending', 'wip', 'done'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border-2 shrink-0 ${
              filter === f
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--card-2)] text-[var(--text-2)] border-[var(--border)] hover:border-[var(--accent-glow)] hover:text-[var(--text)]'
            }`}
          >
            {f === 'all' ? 'All' : f === 'wip' ? 'WIP' : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 font-mono opacity-70">{statusCounts[f]}</span>
          </button>
        ))}
      </div>

      {/* Items */}
      {Object.keys(byTrade).length === 0 ? (
        <div className="app-card text-center py-8">
          <FileText size={28} className="mx-auto text-[var(--text-4)] mb-3" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-[var(--text-2)]">
            {filter === 'all' ? 'No items yet' : `No ${filter} items`}
          </p>
          <p className="text-xs text-[var(--text-3)] mt-1">
            {filter === 'all' ? 'Add files or type below to get started' : ''}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byTrade)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([trade, tradeItems]) => {
              const stats = tradeDoneCounts[trade];
              const pct = stats ? Math.round((stats.done / stats.total) * 100) : 0;
              const isCollapsed = collapsed[trade];
              return (
                <section key={trade}>
                  <button
                    onClick={() => toggleCollapse(trade)}
                    className="w-full flex items-center justify-between mb-2 group"
                  >
                    <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-[var(--text)]">
                      {trade} <span className="font-mono text-[var(--text-3)]">({tradeItems.length})</span>
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-[var(--text-3)] tabular-nums">
                        {pct}%
                      </span>
                      <ChevronDown
                        size={16}
                        strokeWidth={2}
                        className={`text-[var(--text-3)] transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                      />
                    </div>
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-2">
                      {tradeItems.map((item) => (
                        <PunchItemRow
                          key={item.id}
                          item={item}
                          projectId={project.id}
                          onCycleStatus={() => cycleStatus(item)}
                          onEdit={() => setEditingItem({ ...item })}
                          onDelete={() => handleDelete(item)}
                        />
                      ))}
                    </div>
                  )}
                  <div className="h-px bg-[var(--border)] mt-4" />
                </section>
              );
            })}
        </div>
      )}

      {/* Add files CTA */}
      <button
        onClick={() => nav(`/project/${id}/intake`)}
        className="w-full mt-5 py-3 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--text-3)] hover:border-[var(--accent-glow)] hover:text-[var(--accent)] font-semibold text-sm transition-colors"
      >
        + Add files or extract from PDF
      </button>

      {/* Bottom action bar — sticky */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-5 py-3 border-t-2"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-[680px] mx-auto flex gap-2">
          <button
            onClick={() => setShowVoice(true)}
            aria-label="Voice capture"
            className="w-12 h-12 shrink-0 rounded-xl bg-[var(--card-2)] border-2 border-[var(--border)] text-[var(--accent)] hover:border-[var(--accent-glow)] transition-colors flex items-center justify-center"
          >
            <Mic size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => cameraRef.current?.click()}
            disabled={cameraUploading}
            aria-label="Take photo of notes"
            className="w-12 h-12 shrink-0 rounded-xl bg-[var(--card-2)] border-2 border-[var(--border)] text-[var(--accent)] hover:border-[var(--accent-glow)] transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {cameraUploading ? (
              <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
            ) : (
              <Camera size={18} strokeWidth={2.5} />
            )}
          </button>
          <input
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            placeholder="Add punch item…"
            className="flex-1 min-w-0 px-4 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--card-2)] text-[var(--text)] placeholder:text-[var(--text-3)] focus:border-[var(--accent)] focus:outline-none transition-colors text-sm"
          />
          <button
            onClick={handleQuickAdd}
            disabled={!quickAdd.trim()}
            className="app-btn-primary px-4 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCameraCapture}
        />
      </div>

      {showSend && (
        <SendModal items={allItems} projectAddress={project.address} onClose={() => setShowSend(false)} />
      )}

      {showVoice && (
        <VoiceCapture
          projectId={project.id}
          onClose={() => setShowVoice(false)}
          onCommitted={load}
        />
      )}

      {editingItem && (
        <EditItemModal
          item={editingItem}
          projectId={project.id}
          onChange={setEditingItem}
          onSave={handleSaveEdit}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

function StatDot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ color, background: color, width: 8, height: 8 }} className="rounded-full" />
      <span className="text-[var(--text-3)] uppercase tracking-wider text-[10px] font-bold">{label}</span>
      <span className="font-mono text-[var(--text)] tabular-nums font-semibold">{value}</span>
    </div>
  );
}

function PunchItemRow({
  item,
  projectId,
  onCycleStatus,
  onEdit,
  onDelete,
}: {
  item: PunchItem;
  projectId: string;
  onCycleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const done = item.status === 'done';
  const wip = item.status === 'wip';

  return (
    <div className="app-card !p-3"><div className="flex items-start gap-3">
      {/* Status cycle button */}
      <button
        onClick={onCycleStatus}
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          done
            ? 'bg-[var(--green)] border-[var(--green)]'
            : wip
              ? 'bg-[var(--amber)] border-[var(--amber)]'
              : 'border-[var(--border-2)] hover:border-[var(--accent)]'
        }`}
        aria-label={`Status: ${item.status}. Tap to cycle.`}
      >
        {done && <Check size={14} strokeWidth={3} className="text-white" />}
      </button>

      {/* Priority left-border bar */}
      {item.priority !== 'normal' && (
        <div
          className="w-1 rounded-full self-stretch shrink-0"
          style={{
            background: item.priority === 'hot' ? 'var(--red)' : 'var(--amber)',
          }}
        />
      )}

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <p
          className={`text-sm font-semibold break-words ${
            done ? 'text-[var(--text-3)] line-through' : 'text-[var(--text)]'
          }`}
        >
          {item.text}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {item.priority === 'hot' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--red)]/10 text-[var(--red)] border border-[var(--red)]/30">
              <Flame size={10} strokeWidth={2.5} />
              Hot
            </span>
          )}
          {item.priority === 'elevated' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--amber)]/10 text-[var(--amber)] border border-[var(--amber)]/30">
              <AlertCircle size={10} strokeWidth={2.5} />
              Elevated
            </span>
          )}
          {item.location && (
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--card-2)] text-[var(--text-2)] border border-[var(--border)]">
              {item.location}
            </span>
          )}
          {item.assignee && (
            <span className="text-[10px] text-[var(--text-3)] italic">@{item.assignee}</span>
          )}
          {item.notes && (
            <span className="text-[10px] text-[var(--text-3)] italic truncate max-w-[180px]">{item.notes}</span>
          )}
        </div>
      </div>

      <button
        onClick={onDelete}
        aria-label="Delete item"
        className="text-[var(--text-4)] hover:text-[var(--red)] transition-colors p-1 shrink-0"
      >
        <X size={16} strokeWidth={2} />
      </button>
      </div>

      {/* Photo attachments strip */}
      <div className="mt-3 ml-9 overflow-x-auto">
        <PhotoAttachments itemId={item.id} projectId={projectId} compact />
      </div>
    </div>
  );
}

function FilesCollapse({
  files,
  open,
  onToggle,
}: {
  files: NonNullable<ProjectType['files']>;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--card-2)] border-2 border-[var(--border)] hover:border-[var(--accent-glow)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-[var(--accent)]" strokeWidth={2} />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
            Uploaded Files
          </span>
          <span className="font-mono text-[10px] text-[var(--text-3)] bg-[var(--card)] px-1.5 py-0.5 rounded-full border border-[var(--border)]">
            {files.length}
          </span>
        </div>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`text-[var(--text-3)] transition-transform ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-2.5 bg-[var(--card-2)] rounded-lg border border-[var(--border)]">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--text)] truncate">{f.originalName}</p>
                <p className="text-[10px] text-[var(--text-3)] font-mono uppercase tracking-wider">
                  {(f.sizeBytes / 1024).toFixed(0)} KB
                  {f.pageCount ? ` · ${f.pageCount}P` : ''}
                  {f.extractedItemCount ? ` · ${f.extractedItemCount} ITEMS` : ''}
                </p>
              </div>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ml-2 shrink-0 ${
                  f.extractionStatus === 'done'
                    ? 'bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/30'
                    : f.extractionStatus === 'processing'
                      ? 'bg-[var(--amber)]/10 text-[var(--amber)] border-[var(--amber)]/30'
                      : f.extractionStatus === 'failed'
                        ? 'bg-[var(--red)]/10 text-[var(--red)] border-[var(--red)]/30'
                        : 'bg-[var(--card)] text-[var(--text-3)] border-[var(--border)]'
                }`}
              >
                {f.extractionStatus}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditItemModal({
  item,
  projectId,
  onChange,
  onSave,
  onClose,
}: {
  item: PunchItem;
  projectId: string;
  onChange: (next: PunchItem) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-3 bg-[var(--card)] border-2 border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--text)]">
            Edit Item
          </h3>
          <button onClick={onClose} className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors">
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <Field label="Description">
          <textarea
            className="w-full px-3 py-2.5 rounded-lg border-2 border-[var(--border)] bg-[var(--card-2)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none resize-none transition-colors text-sm"
            rows={3}
            value={item.text}
            onChange={(e) => onChange({ ...item, text: e.target.value })}
            autoFocus
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Trade">
            <select
              className="w-full px-3 py-2.5 rounded-lg border-2 border-[var(--border)] bg-[var(--card-2)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none text-sm transition-colors"
              value={item.trade}
              onChange={(e) => onChange({ ...item, trade: e.target.value })}
            >
              {TRADES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              className="w-full px-3 py-2.5 rounded-lg border-2 border-[var(--border)] bg-[var(--card-2)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none text-sm transition-colors"
              value={item.priority}
              onChange={(e) => onChange({ ...item, priority: e.target.value as PunchItem['priority'] })}
            >
              <option value="normal">Normal</option>
              <option value="elevated">Elevated</option>
              <option value="hot">Hot</option>
            </select>
          </Field>
        </div>

        <Field label="Location">
          <input
            className="w-full px-3 py-2.5 rounded-lg border-2 border-[var(--border)] bg-[var(--card-2)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none text-sm transition-colors"
            placeholder="e.g. Kitchen"
            value={item.location}
            onChange={(e) => onChange({ ...item, location: e.target.value })}
          />
        </Field>
        <Field label="Assignee">
          <input
            className="w-full px-3 py-2.5 rounded-lg border-2 border-[var(--border)] bg-[var(--card-2)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none text-sm transition-colors"
            placeholder="Trade partner name"
            value={item.assignee}
            onChange={(e) => onChange({ ...item, assignee: e.target.value })}
          />
        </Field>
        <Field label="Notes">
          <textarea
            className="w-full px-3 py-2.5 rounded-lg border-2 border-[var(--border)] bg-[var(--card-2)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none resize-none transition-colors text-sm"
            rows={2}
            value={item.notes}
            onChange={(e) => onChange({ ...item, notes: e.target.value })}
          />
        </Field>

        <Field label="Photos">
          <PhotoAttachments itemId={item.id} projectId={projectId} />
        </Field>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="app-btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={onSave} className="app-btn-primary flex-1">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}
