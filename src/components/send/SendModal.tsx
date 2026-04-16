import { useEffect, useState } from 'react';
import { listContacts } from '../../api/contacts';
import { sendEmail, sendText, copyToClipboard, downloadAsFile, nativeShare } from '../../services/communication';
import { useUI } from '../../stores/ui';
import type { PunchItem, Contact } from '../../types';

interface SendModalProps {
  items: PunchItem[];
  projectAddress: string;
  onClose: () => void;
}

function formatPunchList(items: PunchItem[], trade: string, address: string): string {
  const lines: string[] = [
    `PUNCH LIST — ${trade}`,
    `Project: ${address}`,
    `Date: ${new Date().toLocaleDateString()}`,
    `Items: ${items.length}`,
    '',
    '─'.repeat(40),
    '',
  ];

  items.forEach((item, i) => {
    const priority = item.priority !== 'normal' ? ` [${item.priority.toUpperCase()}]` : '';
    const location = item.location ? ` (${item.location})` : '';
    lines.push(`${i + 1}. ${item.text}${location}${priority}`);
    if (item.notes) lines.push(`   Note: ${item.notes}`);
  });

  lines.push('', '─'.repeat(40));
  lines.push('', 'Please confirm completion or reply with questions.');
  return lines.join('\n');
}

export function SendModal({ items, projectAddress, onClose }: SendModalProps) {
  const addToast = useUI((s) => s.addToast);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [preview, setPreview] = useState('');

  // Get unique trades from items
  const trades = [...new Set(items.map((i) => i.trade || 'Uncategorized'))].sort();

  useEffect(() => {
    listContacts().then((r) => setContacts(r.contacts)).catch(() => {});
  }, []);

  // Auto-select first trade
  useEffect(() => {
    if (trades.length > 0 && !selectedTrade) setSelectedTrade(trades[0]!);
  }, [trades]);

  // Auto-match contact when trade changes
  useEffect(() => {
    if (!selectedTrade) return;
    const match = contacts.find(
      (c) => c.trade.toLowerCase() === selectedTrade.toLowerCase()
    );
    setSelectedContact(match || null);
  }, [selectedTrade, contacts]);

  // Update preview when trade changes
  useEffect(() => {
    if (!selectedTrade) return;
    const tradeItems = items.filter((i) => (i.trade || 'Uncategorized') === selectedTrade);
    setPreview(formatPunchList(tradeItems, selectedTrade, projectAddress));
  }, [selectedTrade, items, projectAddress]);

  const tradeItems = items.filter((i) => (i.trade || 'Uncategorized') === selectedTrade);
  const subject = `Punch List — ${selectedTrade} — ${projectAddress}`;

  const handleSendEmail = () => {
    const to = selectedContact?.email || '';
    sendEmail(to, subject, preview);
    addToast(`Opening email for ${selectedTrade}`, 'success');
  };

  const handleSendText = () => {
    const phone = selectedContact?.phone || '';
    sendText(phone, preview);
    addToast(`Opening text for ${selectedTrade}`, 'success');
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(preview);
    addToast(ok ? 'Copied to clipboard' : 'Copy failed', ok ? 'success' : 'error');
  };

  const handleDownload = () => {
    const filename = `punch-list-${selectedTrade.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`;
    downloadAsFile(preview, filename);
    addToast('Downloaded', 'success');
  };

  const handleShare = async () => {
    const ok = await nativeShare(subject, preview);
    if (!ok) handleCopy();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 pb-3 border-b border-g100">
          <h3 className="text-lg font-bold text-g700">Send Punch List</h3>
          <p className="text-sm text-g400 mt-0.5">{projectAddress}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Trade selector */}
          <div>
            <label className="text-xs font-medium text-g500 mb-1.5 block">Select Trade</label>
            <div className="flex flex-wrap gap-2">
              {trades.map((trade) => {
                const count = items.filter((i) => (i.trade || 'Uncategorized') === trade).length;
                return (
                  <button
                    key={trade}
                    onClick={() => setSelectedTrade(trade)}
                    className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      selectedTrade === trade
                        ? 'bg-mar text-white'
                        : 'bg-surface border border-g200 text-g600 hover:border-mar'
                    }`}
                  >
                    {trade} <span className="opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact match */}
          <div>
            <label className="text-xs font-medium text-g500 mb-1.5 block">Send To</label>
            {selectedContact ? (
              <div className="bg-surface rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-g700">{selectedContact.name}</p>
                  <p className="text-xs text-g400">
                    {selectedContact.company}{selectedContact.company && ' · '}
                    {selectedContact.preferredChannel === 'text' ? selectedContact.phone : selectedContact.email}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedContact.preferredChannel === 'text' ? 'bg-blue-100 text-blue-700' : 'bg-surface text-g500 border border-g200'
                }`}>
                  {selectedContact.preferredChannel}
                </span>
              </div>
            ) : (
              <div className="bg-surface rounded-lg p-3">
                <p className="text-sm text-g400">No contact matched for "{selectedTrade}"</p>
                <p className="text-xs text-g400 mt-1">You can still send — just enter the recipient manually.</p>
              </div>
            )}

            {/* Contact override */}
            {contacts.length > 0 && (
              <select
                className="mt-2 w-full border border-g200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:border-mar"
                value={selectedContact?.id || ''}
                onChange={(e) => {
                  const c = contacts.find((c) => c.id === e.target.value);
                  setSelectedContact(c || null);
                }}
              >
                <option value="">Choose a different contact...</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.trade || 'No trade'}</option>
                ))}
              </select>
            )}
          </div>

          {/* Preview */}
          <div>
            <label className="text-xs font-medium text-g500 mb-1.5 block">
              Preview ({tradeItems.length} items)
            </label>
            <pre className="bg-surface rounded-lg p-3 text-xs text-g600 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono leading-relaxed">
              {preview}
            </pre>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-5 pt-3 border-t border-g100 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSendEmail}
              className="py-3 rounded-xl bg-mar text-white font-semibold text-sm hover:bg-mar-light transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </button>
            <button
              onClick={handleSendText}
              className="py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Text
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleCopy}
              className="py-2.5 rounded-xl border border-g200 text-g600 font-medium text-sm hover:bg-g50 transition-colors"
            >
              Copy
            </button>
            <button
              onClick={handleDownload}
              className="py-2.5 rounded-xl border border-g200 text-g600 font-medium text-sm hover:bg-g50 transition-colors"
            >
              Download
            </button>
            <button
              onClick={handleShare}
              className="py-2.5 rounded-xl border border-g200 text-g600 font-medium text-sm hover:bg-g50 transition-colors"
            >
              Share
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm text-g400 hover:text-g600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
