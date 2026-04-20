import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import { useItemPhotos, addItemPhoto, deleteItemPhoto } from '../../hooks/useItemPhotos';
import { useUI } from '../../stores/ui';

interface Props {
  itemId: string;
  projectId: string;
  compact?: boolean; // inline strip vs full gallery
}

export function PhotoAttachments({ itemId, projectId, compact = false }: Props) {
  const photos = useItemPhotos(itemId);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const addToast = useUI((s) => s.addToast);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        await addItemPhoto(itemId, projectId, file);
      }
      addToast(`Added ${files.length} photo${files.length > 1 ? 's' : ''}`, 'success');
    } catch (err) {
      addToast(`Upload failed: ${err}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this photo?')) return;
    await deleteItemPhoto(id);
  };

  const thumbSize = compact ? 'w-14 h-14' : 'w-20 h-20';

  return (
    <>
      <div className={`flex items-center gap-2 ${compact ? '' : 'flex-wrap'}`}>
        {/* Add photo buttons */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            cameraRef.current?.click();
          }}
          disabled={uploading}
          aria-label="Take photo"
          className={`${thumbSize} shrink-0 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--card-2)] text-[var(--text-3)] hover:text-[var(--accent)] hover:border-[var(--accent-glow)] flex items-center justify-center transition-colors`}
        >
          <Camera size={compact ? 16 : 22} strokeWidth={2} />
        </button>
        {!compact && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              galleryRef.current?.click();
            }}
            disabled={uploading}
            aria-label="Choose from gallery"
            className={`${thumbSize} shrink-0 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--card-2)] text-[var(--text-3)] hover:text-[var(--accent)] hover:border-[var(--accent-glow)] flex items-center justify-center transition-colors`}
          >
            <ImageIcon size={22} strokeWidth={2} />
          </button>
        )}

        {/* Existing photos */}
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreview(p.dataUrl);
            }}
            className={`${thumbSize} shrink-0 rounded-lg overflow-hidden border-2 border-[var(--border)] hover:border-[var(--accent)] transition-colors bg-[var(--card-2)] relative group`}
          >
            <img src={p.dataUrl} alt="Attached" className="w-full h-full object-cover" />
            {!compact && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(p.id);
                }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--red)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} strokeWidth={3} />
              </span>
            )}
          </button>
        ))}

        {compact && photos.length === 0 && (
          <span className="text-[10px] text-[var(--text-4)] italic">no photos</span>
        )}
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Full-screen preview */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPreview(null);
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={20} strokeWidth={2} />
          </button>
          <img src={preview} alt="" className="max-w-full max-h-full rounded-2xl" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              const photo = photos.find((p) => p.dataUrl === preview);
              if (photo) {
                handleDelete(photo.id);
                setPreview(null);
              }
            }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[var(--red)] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Trash2 size={14} strokeWidth={2.5} />
            Delete
          </button>
        </div>
      )}
    </>
  );
}
