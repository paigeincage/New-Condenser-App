interface FeedItem {
  id: string;
  title: string;
  subtitle?: string;
  timestamp?: string;
  accent?: 'warn' | 'info' | 'success';
}

interface Props {
  title: string;
  icon?: React.ReactNode;
  items: FeedItem[];
  emptyLabel?: string;
}

export function ActionFeed({ title, icon, items, emptyLabel = 'Nothing here' }: Props) {
  return (
    <div className="dash-card">
      <div className="flex items-center gap-3 mb-5">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-[var(--dash-card-2)] border border-[var(--dash-border)] flex items-center justify-center text-[var(--dash-cyan)]">
            {icon}
          </div>
        )}
        <h3 className="text-xl font-extrabold text-[var(--dash-text)] tracking-tight">{title}</h3>
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-[var(--dash-text-3)] text-center py-8">{emptyLabel}</div>
      ) : (
        <ul className="space-y-3.5">
          {items.map((item) => {
            const dotColor =
              item.accent === 'warn'
                ? 'text-[var(--dash-red)] bg-[var(--dash-red)]'
                : item.accent === 'success'
                ? 'text-[var(--dash-green)] bg-[var(--dash-green)]'
                : 'text-[var(--dash-cyan)] bg-[var(--dash-cyan)]';
            return (
              <li
                key={item.id}
                className="flex items-start gap-4 p-2.5 -mx-2.5 rounded-xl transition-colors hover:bg-[var(--accent-tint)]"
              >
                <span className={`dash-bullet mt-1.5 ${dotColor}`} aria-hidden />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-[var(--dash-text)] leading-tight break-words">
                    {item.title}
                  </div>
                  {item.subtitle && (
                    <div className="text-xs text-[var(--dash-text-2)] mt-1 break-words">
                      {item.subtitle}
                    </div>
                  )}
                </div>
                {item.timestamp && (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--dash-text-3)] shrink-0 bg-[var(--dash-card-2)] px-2 py-1 rounded-md border border-[var(--dash-border)]">
                    {item.timestamp}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
