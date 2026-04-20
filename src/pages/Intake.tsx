import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { uploadFiles, extractFile } from '../api/files';
import { getProject } from '../api/projects';
import { createItemsBulk } from '../api/items';
import { TopBar } from '../components/layout/TopBar';
import { DropZone } from '../components/intake/DropZone';
import { ExtractionReview, type ReviewItem } from '../components/intake/ExtractionReview';
import { useUI } from '../stores/ui';

export function Intake() {
  const { id: projectId } = useParams<{ id: string }>();
  const nav = useNavigate();
  const addToast = useUI((s) => s.addToast);

  const [projectAddress, setProjectAddress] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (projectId) {
      getProject(projectId).then((r) => setProjectAddress(r.project.address)).catch(() => {});
    }
  }, [projectId]);
  const [extractProgress, setExtractProgress] = useState('');
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [committing, setCommitting] = useState(false);

  const handleExtract = async () => {
    if (!files.length || !projectId) return;
    setExtracting(true);
    setExtractProgress('Uploading files...');

    try {
      const { files: uploaded } = await uploadFiles(projectId, files, projectAddress);
      const allItems: ReviewItem[] = [];

      for (const uf of uploaded) {
        setExtractProgress(`Extracting: ${uf.originalName}...`);
        try {
          const result = await extractFile(uf.id);
          allItems.push(
            ...result.items.map((item) => ({
              ...item,
              selected: !item.repaired,
              fileId: uf.id,
              fileName: uf.originalName,
            }))
          );
        } catch (err) {
          addToast(`Failed: ${uf.originalName} — ${err}`, 'error');
        }
      }

      setReviewItems(allItems);
      setShowReview(true);
      addToast(`Extracted ${allItems.length} items`, 'success');
    } catch (err) {
      addToast(`Upload failed: ${err}`, 'error');
    } finally {
      setExtracting(false);
    }
  };

  const handleCommit = async (selected: ReviewItem[]) => {
    if (!projectId) return;
    setCommitting(true);
    try {
      await createItemsBulk(
        selected.map((item) => ({
          projectId,
          text: item.text,
          trade: item.trade,
          priority: item.priority,
          source: item.fileName,
          sourceFileId: item.fileId,
          location: item.location || '',
        }))
      );
      addToast(`Added ${selected.length} items`, 'success');
      nav(`/project/${projectId}`);
    } catch (err) {
      addToast(`Failed: ${err}`, 'error');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div>
      <TopBar title="Add Files" back />

      {!showReview ? (
        <div className="space-y-4">
          <DropZone files={files} onFilesChange={setFiles} disabled={extracting} />
          {extracting ? (
            <div className="app-card text-center py-6">
              <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[var(--text)] font-semibold">{extractProgress}</p>
              <p className="text-xs text-[var(--text-3)] mt-1">Claude is reading your documents…</p>
            </div>
          ) : (
            <button
              onClick={handleExtract}
              disabled={!files.length}
              className="app-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Extract Items
            </button>
          )}
        </div>
      ) : (
        <ExtractionReview
          items={reviewItems}
          onItemsChange={setReviewItems}
          onCommit={handleCommit}
          loading={committing}
        />
      )}
    </div>
  );
}
