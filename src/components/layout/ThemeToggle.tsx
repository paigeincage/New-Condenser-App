import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const Icon = theme === 'dark' ? Sun : Moon;
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`w-10 h-10 rounded-xl bg-[var(--card-2)] border-2 border-[var(--border)] flex items-center justify-center text-[var(--text-2)] hover:text-[var(--accent)] hover:border-[var(--accent-glow)] transition-colors ${className}`}
    >
      <Icon size={18} strokeWidth={2} />
    </button>
  );
}
