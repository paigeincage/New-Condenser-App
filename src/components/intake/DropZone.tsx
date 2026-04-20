import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText } from 'lucide-react';

const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp';
const ACCEPT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

interface DropZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export function DropZone({ files, onFilesChange, disabled }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const valid = Array.from(incoming).filter(
        (f) => ACCEPT_TYPES.has(f.type) || f.name.match(/\.(pdf|docx?|xlsx?|csv|txt|jpe?g|png|webp)$/i)
      );
      onFilesChange([...files, ...valid]);
    },
    [files, onFilesChange]
  );

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          dragging
            ? 'border-[var(--accent)] bg-[var(--accent-tint)] scale-[1.01]'
            : 'border-[var(--border)] hover:border-[var(--accent-glow)] hover:bg-[var(--accent-tint)]'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />

        <div className="flex flex-col items-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-colors ${
              dragging
                ? 'bg-[var(--accent-tint-2)] border-[var(--accent)] text-[var(--accent)]'
                : 'bg-[var(--card-2)] border-[var(--border)] text-[var(--text-3)]'
            }`}
          >
            <Upload size={22} strokeWidth={2} />
          </div>
          <div>
            <p className="font-display text-base font-bold uppercase tracking-tight text-[var(--text)]">
              {dragging ? 'Drop files here' : 'Drop files or tap to browse'}
            </p>
            <p className="text-xs text-[var(--text-3)] mt-1">
              PDF, DOCX, XLSX, images — we'll extract the punch items
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="flex items-center justify-between bg-[var(--card-2)] border border-[var(--border)] rounded-xl px-3 py-2.5"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileText size={16} className="text-[var(--accent)] shrink-0" strokeWidth={2} />
                <span className="font-mono text-[10px] font-bold uppercase text-[var(--text-3)] w-10 shrink-0">
                  {f.name.split('.').pop()}
                </span>
                <span className="text-sm font-semibold text-[var(--text)] truncate">{f.name}</span>
                <span className="text-[10px] text-[var(--text-3)] shrink-0 font-mono tabular-nums">
                  {formatSize(f.size)}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                aria-label="Remove file"
                className="text-[var(--text-4)] hover:text-[var(--red)] transition-colors p-1 shrink-0"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
