import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../api/projects';
import { uploadFiles, extractFile } from '../api/files';
import { createItemsBulk } from '../api/items';
import { TopBar } from '../components/layout/TopBar';
import { DropZone } from '../components/intake/DropZone';
import { ExtractionReview, type ReviewItem } from '../components/intake/ExtractionReview';
import { useUI } from '../stores/ui';

type Step = 'info' | 'upload' | 'review' | 'done';

// Temp user ID until auth is built
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

export function NewProject() {
  const nav = useNavigate();
  const addToast = useUI((s) => s.addToast);

  const [step, setStep] = useState<Step>('info');
  const [address, setAddress] = useState('');
  const [community, setCommunity] = useState('');
  const [lot, setLot] = useState('');
  const [projectId, setProjectId] = useState('');

  const [files, setFiles] = useState<File[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState('');
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [committing, setCommitting] = useState(false);

  const handleCreateProject = async () => {
    if (!address.trim()) return;
    try {
      const { project } = await createProject({
        address: address.trim(),
        community: community.trim(),
        lot: lot.trim(),
        userId: TEMP_USER_ID,
      });
      setProjectId(project.id);
      setStep('upload');
      addToast('Project created', 'success');
    } catch (err) {
      addToast(String(err), 'error');
    }
  };

  const handleExtract = async () => {
    if (!files.length) return;
    setExtracting(true);
    setExtractProgress('Uploading files...');

    try {
      const { files: uploaded } = await uploadFiles(projectId, files);
      const allItems: ReviewItem[] = [];

      for (const uf of uploaded) {
        setExtractProgress(`Extracting: ${uf.originalName}...`);
        try {
          const result = await extractFile(uf.id);
          const items: ReviewItem[] = result.items.map((item) => ({
            ...item,
            selected: !item.repaired,
            fileId: uf.id,
            fileName: uf.originalName,
          }));
          allItems.push(...items);
        } catch (err) {
          addToast(`Failed to extract ${uf.originalName}: ${err}`, 'error');
        }
      }

      setReviewItems(allItems);
      setStep('review');
      addToast(`Extracted ${allItems.length} items from ${uploaded.length} file(s)`, 'success');
    } catch (err) {
      addToast(`Upload failed: ${err}`, 'error');
    } finally {
      setExtracting(false);
      setExtractProgress('');
    }
  };

  const handleCommit = async (selected: ReviewItem[]) => {
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
      <TopBar title="New Project" back />

      {step === 'info' && (
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-g600 mb-1.5 block">Address *</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street"
              className="w-full px-4 py-3 border border-g200 rounded-xl text-g700 focus:outline-none focus:border-mar text-base"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-g600 mb-1.5 block">Community</label>
              <input
                type="text"
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
                placeholder="Patterson Ranch"
                className="w-full px-4 py-3 border border-g200 rounded-xl text-g700 focus:outline-none focus:border-mar text-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-g600 mb-1.5 block">Lot</label>
              <input
                type="text"
                value={lot}
                onChange={(e) => setLot(e.target.value)}
                placeholder="42"
                className="w-full px-4 py-3 border border-g200 rounded-xl text-g700 focus:outline-none focus:border-mar text-base"
              />
            </div>
          </div>
          <button
            onClick={handleCreateProject}
            disabled={!address.trim()}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-mar hover:bg-mar-light disabled:opacity-40 transition-colors text-base mt-4"
          >
            Continue
          </button>
        </div>
      )}

      {step === 'upload' && (
        <div className="space-y-4 mt-2">
          <p className="text-sm text-g400">
            Upload your inspection reports, punch lists, photos, or any documents.
            We'll extract and categorize the punch items automatically.
          </p>

          <DropZone files={files} onFilesChange={setFiles} disabled={extracting} />

          {extracting ? (
            <div className="text-center py-4">
              <div className="w-8 h-8 border-2 border-mar border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-g600 font-medium">{extractProgress}</p>
              <p className="text-xs text-g400 mt-1">Claude is reading your documents...</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => { nav(`/project/${projectId}`); }}
                className="flex-1 py-3 rounded-xl font-semibold text-g600 bg-surface hover:bg-g100 transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={handleExtract}
                disabled={!files.length}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-mar hover:bg-mar-light disabled:opacity-40 transition-colors"
              >
                Extract Items
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'review' && (
        <div className="mt-2">
          <p className="text-sm text-g400 mb-4">
            Review the extracted items below. Edit text, change trades, or deselect items you don't need.
          </p>
          <ExtractionReview
            items={reviewItems}
            onItemsChange={setReviewItems}
            onCommit={handleCommit}
            loading={committing}
          />
        </div>
      )}
    </div>
  );
}
