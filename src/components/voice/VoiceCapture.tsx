import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Loader2, X, Check } from 'lucide-react';
import { api } from '../../api/client';
import { createItemsBulk } from '../../api/items';
import { useUI } from '../../stores/ui';
import type { ExtractedItem } from '../../types';
import { ExtractionReview, type ReviewItem } from '../intake/ExtractionReview';

interface Props {
  projectId: string;
  onClose: () => void;
  onCommitted?: () => void;
}

// Minimal typing for Web Speech API (not in lib.dom by default)
type SpeechRecognitionAny = any;

function getRecognitionCtor(): SpeechRecognitionAny | null {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function VoiceCapture({ projectId, onClose, onCommitted }: Props) {
  const addToast = useUI((s) => s.addToast);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [processing, setProcessing] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [committing, setCommitting] = useState(false);
  const [step, setStep] = useState<'record' | 'review'>('record');
  const recognitionRef = useRef<SpeechRecognitionAny>(null);

  const supported = !!getRecognitionCtor();

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
    };
  }, []);

  const startRecording = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      addToast('Voice capture not supported in this browser', 'error');
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript + ' ';
        else interimText += r[0].transcript;
      }
      if (finalText) {
        setTranscript((t) => (t + ' ' + finalText).trim());
        setInterim('');
      } else {
        setInterim(interimText);
      }
    };

    rec.onerror = (e: any) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        addToast(`Voice error: ${e.error}`, 'error');
      }
    };

    rec.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const processText = async () => {
    const text = transcript.trim();
    if (text.length < 3) {
      addToast('Transcript is too short', 'error');
      return;
    }
    setProcessing(true);
    try {
      const result = await api<{ items: ExtractedItem[] }>('/api/voice/extract', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      const reviewed: ReviewItem[] = result.items.map((it) => ({
        ...it,
        selected: true,
        fileId: 'voice',
        fileName: 'Voice Capture',
      }));
      setReviewItems(reviewed);
      setStep('review');
      if (reviewed.length === 0) addToast('No punch items found in transcript', 'info');
    } catch (err) {
      addToast(`Failed: ${err}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const commit = async (selected: ReviewItem[]) => {
    setCommitting(true);
    try {
      await createItemsBulk(
        selected.map((item) => ({
          projectId,
          text: item.text,
          trade: item.trade,
          priority: item.priority,
          source: 'Voice',
          location: item.location || '',
        }))
      );
      addToast(`Added ${selected.length} items from voice`, 'success');
      onCommitted?.();
      onClose();
    } catch (err) {
      addToast(`Failed: ${err}`, 'error');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[var(--card)] border-2 border-[var(--border)] w-full sm:max-w-lg max-h-[92vh] rounded-t-2xl sm:rounded-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 pb-4 border-b border-[var(--border)] flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--text)] flex items-center gap-2">
              <Mic size={18} className="text-[var(--accent)]" strokeWidth={2.5} />
              Voice Capture
            </h3>
            <p className="text-xs text-[var(--text-3)] mt-1">
              {step === 'record'
                ? 'Talk naturally. Claude organizes it into punch items.'
                : 'Review and commit.'}
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors">
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 'record' && (
            <>
              {!supported ? (
                <div className="app-card text-center py-6">
                  <p className="text-sm font-semibold text-[var(--text)]">
                    Voice capture isn't supported here
                  </p>
                  <p className="text-xs text-[var(--text-3)] mt-1">
                    Use Chrome or Safari on desktop, or a recent iOS/Android browser.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-4 py-6">
                    <button
                      onClick={recording ? stopRecording : startRecording}
                      disabled={processing}
                      className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all ${
                        recording
                          ? 'bg-[var(--red)] border-[var(--red)]/40 animate-pulse shadow-[0_0_24px_rgba(220,42,60,0.5)]'
                          : 'bg-[var(--accent)] border-[var(--accent-tint-2)] hover:scale-105 shadow-[0_0_24px_var(--accent-glow)]'
                      }`}
                    >
                      {recording ? (
                        <Square size={32} strokeWidth={2.5} className="text-white" fill="white" />
                      ) : (
                        <Mic size={36} strokeWidth={2} className="text-white" />
                      )}
                    </button>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-3)]">
                      {recording ? 'Listening… tap to stop' : 'Tap to start'}
                    </div>
                  </div>

                  {(transcript || interim) && (
                    <div className="app-card !p-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-3)] mb-2">
                        Transcript
                      </div>
                      <p className="text-sm text-[var(--text)] whitespace-pre-wrap">
                        {transcript}
                        {interim && <span className="text-[var(--text-3)] italic"> {interim}</span>}
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {step === 'review' && (
            <ExtractionReview
              items={reviewItems}
              onItemsChange={setReviewItems}
              onCommit={commit}
              loading={committing}
            />
          )}
        </div>

        {step === 'record' && (
          <div className="p-5 pt-3 border-t border-[var(--border)] space-y-2">
            {transcript && !recording && !processing && (
              <button onClick={processText} className="app-btn-primary w-full">
                <Check size={16} strokeWidth={2.5} />
                Extract punch items
              </button>
            )}
            {processing && (
              <div className="app-card text-center py-3">
                <Loader2
                  size={20}
                  className="animate-spin mx-auto mb-2 text-[var(--accent)]"
                  strokeWidth={2}
                />
                <p className="text-xs font-semibold text-[var(--text-2)]">
                  Claude is extracting punch items…
                </p>
              </div>
            )}
            {transcript && !processing && (
              <button
                onClick={() => {
                  setTranscript('');
                  setInterim('');
                }}
                className="app-btn-ghost w-full text-xs"
              >
                Clear and start over
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
