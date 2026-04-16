import { useState, useRef } from 'react';
import { apiUpload, api } from '../../api/client';
import { useUI } from '../../stores/ui';

interface ParsedContact {
  name: string;
  email: string;
  phone: string;
  company: string;
  trade: string;
}

interface ImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

export function ImportModal({ onClose, onImported }: ImportModalProps) {
  const addToast = useUI((s) => s.addToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [parsed, setParsed] = useState<ParsedContact[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const result = await apiUpload<{ contacts: ParsedContact[]; count: number }>(
        '/api/contacts/import',
        form
      );
      setParsed(result.contacts);
      addToast(`Found ${result.count} contacts`, 'success');
    } catch (err) {
      addToast(`Import failed: ${err}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    setImporting(true);
    try {
      const result = await api<{ imported: number }>('/api/contacts/import/confirm', {
        method: 'POST',
        body: JSON.stringify({ contacts: parsed }),
      });
      addToast(`Imported ${result.imported} contacts`, 'success');
      onImported();
      onClose();
    } catch (err) {
      addToast(`Save failed: ${err}`, 'error');
    } finally {
      setImporting(false);
    }
  };

  const removeContact = (index: number) => {
    setParsed((p) => p.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof ParsedContact, value: string) => {
    setParsed((p) => p.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 pb-3 border-b border-g100">
          <h3 className="text-lg font-bold text-g700">Import Contacts</h3>
          <p className="text-sm text-g400 mt-0.5">
            Upload a file to bulk-import contacts
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {parsed.length === 0 ? (
            <>
              {/* File picker */}
              <div
                className="border-2 border-dashed border-g200 rounded-xl p-8 text-center cursor-pointer hover:border-mar transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <div>
                    <div className="w-8 h-8 border-2 border-mar border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-g400">Reading file...</p>
                  </div>
                ) : (
                  <>
                    <svg className="w-10 h-10 text-g300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-semibold text-g700 mb-1">Tap to select file</p>
                    <p className="text-xs text-g400">Supports .vcf, .csv, .xlsx, .xls</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".vcf,.csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />

              {/* Tips */}
              <div className="bg-surface rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-g600">Quick ways to get contacts here:</p>
                <div className="space-y-1.5 text-xs text-g500">
                  <p><strong>From your phone:</strong> Open a contact → Share → Save as .vcf file → Upload here. You can share multiple contacts into one .vcf file.</p>
                  <p><strong>From Outlook:</strong> Select contacts → Export to CSV → Upload here.</p>
                  <p><strong>From a spreadsheet:</strong> Make sure columns include Name, Email, Phone, Company, Trade → Save as .xlsx or .csv → Upload.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Preview list */}
              <p className="text-sm font-semibold text-g700">{parsed.length} contacts ready to import</p>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {parsed.map((c, i) => (
                  <div key={i} className="bg-surface rounded-lg p-3 relative">
                    <button
                      onClick={() => removeContact(i)}
                      className="absolute top-2 right-2 text-g300 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <input
                      className="text-sm font-semibold text-g700 bg-transparent w-full focus:outline-none focus:border-b focus:border-mar"
                      value={c.name}
                      onChange={(e) => updateContact(i, 'name', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <input
                        className="text-xs text-g500 bg-transparent focus:outline-none focus:border-b focus:border-mar"
                        value={c.email}
                        onChange={(e) => updateContact(i, 'email', e.target.value)}
                        placeholder="email"
                      />
                      <input
                        className="text-xs text-g500 bg-transparent focus:outline-none focus:border-b focus:border-mar"
                        value={c.phone}
                        onChange={(e) => updateContact(i, 'phone', e.target.value)}
                        placeholder="phone"
                      />
                      <input
                        className="text-xs text-g500 bg-transparent focus:outline-none focus:border-b focus:border-mar"
                        value={c.company}
                        onChange={(e) => updateContact(i, 'company', e.target.value)}
                        placeholder="company"
                      />
                      <input
                        className="text-xs text-g500 bg-transparent focus:outline-none focus:border-b focus:border-mar"
                        value={c.trade}
                        onChange={(e) => updateContact(i, 'trade', e.target.value)}
                        placeholder="trade"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 pt-3 border-t border-g100 space-y-2">
          {parsed.length > 0 ? (
            <div className="flex gap-3">
              <button
                onClick={() => setParsed([])}
                className="flex-1 py-3 rounded-xl border border-g200 text-g600 font-semibold text-sm hover:bg-g50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={importing || parsed.length === 0}
                className="flex-1 py-3 rounded-xl bg-mar text-white font-semibold text-sm hover:bg-mar-light disabled:opacity-40 transition-colors"
              >
                {importing ? 'Importing...' : `Import ${parsed.length} Contacts`}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm text-g400 hover:text-g600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
