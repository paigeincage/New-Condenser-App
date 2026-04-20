import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface TopBarProps {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
}

export function TopBar({ title, back, right }: TopBarProps) {
  const nav = useNavigate();

  return (
    <header className="flex items-center justify-between py-4 mb-5 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {back && (
          <button
            onClick={() => nav(-1)}
            aria-label="Go back"
            className="w-9 h-9 rounded-lg bg-[var(--card-2)] border-2 border-[var(--border)] flex items-center justify-center text-[var(--text-2)] hover:text-[var(--accent)] hover:border-[var(--accent-glow)] transition-colors shrink-0"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
        )}
        <h1 className="font-display text-xl font-extrabold uppercase tracking-tight text-[var(--text)] truncate">
          {title}
        </h1>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
