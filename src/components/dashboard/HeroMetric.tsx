interface Props {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  trend?: { direction: 'up' | 'down' | 'flat'; text: string };
}

export function HeroMetric({ label, value, sublabel, icon, trend }: Props) {
  const trendColor =
    trend?.direction === 'up'
      ? 'text-[var(--dash-green)]'
      : trend?.direction === 'down'
      ? 'text-[var(--dash-red)]'
      : 'text-[var(--dash-text-3)]';
  const trendIcon = trend?.direction === 'up' ? '↗' : trend?.direction === 'down' ? '↘' : '→';

  return (
    <div className="dash-card dash-hero group">
      <div className="flex items-start justify-between mb-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--dash-text-2)]">
          {label}
        </div>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-[var(--dash-card-2)] border border-[var(--dash-border)] flex items-center justify-center text-[var(--dash-cyan)] group-hover:border-[var(--dash-cyan)]/40 transition-colors">
            {icon}
          </div>
        )}
      </div>

      <div className="dash-hero-number text-5xl font-extrabold tabular-nums leading-none text-[var(--dash-text)] transition-all duration-300">
        {value}
      </div>

      <div className="flex items-center gap-2 mt-4 min-h-[20px]">
        {sublabel && <div className="text-xs text-[var(--dash-text-3)] truncate">{sublabel}</div>}
        {trend && (
          <div className={`text-xs font-bold ${trendColor} flex items-center gap-1 ml-auto shrink-0`}>
            <span>{trendIcon}</span>
            <span>{trend.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
