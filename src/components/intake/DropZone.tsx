import { useState, useRef, useCallback } from 'react';

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

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter(
      (f) => ACCEPT_TYPES.has(f.type) || f.name.match(/\.(pdf|docx?|xlsx?|csv|txt|jpe?g|png|webp)$/i)
    );
    onFilesChange([...files, ...valid]);
  }, [files, onFilesChange]);

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
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
          ${dragging ? 'border-mar bg-mar-l scale-[1.01]' : 'border-g200 hover:border-mar/50 hover:bg-mar-l/50'}
          ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
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
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${dragging ? 'bg-mar/20' : 'bg-surface'}`}>
            <svg className={`w-7 h-7 ${dragging ? 'text-mar' : 'text-g400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16l.586.586A2 2 0 005.828 17H18.172a2 2 0 001.242-.414L20 16M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-g700">
              {dragging ? 'Drop files here' : 'Drop files or tap to browse'}
            </p>
            <p className="text-sm text-g400 mt-1">
              PDF, DOCX, XLSX, images — we'll extract the punch items
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="flex items-center justify-between bg-surface rounded-lg px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-g400 uppercase w-10 shrink-0">
                  {f.name.split('.').pop()}
                </span>
                <span className="text-sm font-medium text-g700 truncate">{f.name}</span>
                <span className="text-xs text-g400 shrink-0">{formatSize(f.size)}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="text-g400 hover:text-red-500 p-1 shrink-0"
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
}
