import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings as SettingsIcon,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { listProjects } from '../api/projects';
import { useProfile } from '../hooks/useProfile';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import type { Project } from '../types';

export function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const profile = useProfile();
  const nav = useNavigate();

  useEffect(() => {
    listProjects()
      .then((r) => setProjects(r.projects))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = projects.filter((p) => p.status === 'active');

  const totals = active.reduce(
    (acc, p) => {
      const s = p.statusCounts || { pending: 0, wip: 0, done: 0 };
      acc.pending += s.pending;
      acc.wip += s.wip;
      acc.done += s.done;
      acc.total += p._count?.items || 0;
      return acc;
    },
    { pending: 0, wip: 0, done: 0, total: 0 }
  );
  const overallPct = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0;

  const quickActions = [
    {
      to: '/new',
      icon: <Plus size={22} strokeWidth={2.5} />,
      title: 'New Project',
      desc: 'Start a new punch list or walk',
      primary: true,
    },
    {
      to: '/dashboard',
      icon: <LayoutDashboard size={22} strokeWidth={2} />,
      title: 'Dashboard',
      desc: 'Metrics, velocity, action items',
    },
    {
      to: '/contacts',
      icon: <Users size={22} strokeWidth={2} />,
      title: 'Contacts',
      desc: 'Trade partners and routing',
    },
    {
      to: '/settings',
      icon: <SettingsIcon size={22} strokeWidth={2} />,
      title: 'Settings',
      desc: 'Profile, templates, and more',
    },
  ];

  return (
    <div className="pt-6 pb-10">
      {/* Header */}
      <header className="flex items-start justify-between mb-8 animate-fade-up">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="app-chip">
              <Sparkles size={10} strokeWidth={2.5} />
              The Condenser
            </span>
          </div>
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-[var(--text)] leading-none">
            {profile.firstName ? `Hey, ${profile.firstName}` : 'Welcome back'}
          </h1>
          <p className="text-xs text-[var(--text-3)] mt-2">
            Built for construction managers, by a construction manager
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        {quickActions.map((a) => (
          <button
            key={a.to}
            onClick={() => nav(a.to)}
            className={`app-card app-card--interactive text-left group ${a.primary ? 'col-span-2' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  a.primary
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--card-2)] border border-[var(--border)] text-[var(--accent)] group-hover:border-[var(--accent-glow)]'
                }`}
              >
                {a.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-display uppercase font-bold text-[17px] tracking-tight text-[var(--text)]">
                    {a.title}
                  </h3>
                  <ArrowRight
                    size={16}
                    className="text-[var(--text-3)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all"
                  />
                </div>
                <p className="text-xs text-[var(--text-3)] mt-1 leading-relaxed">{a.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Overall progress */}
      {totals.total > 0 && (
        <div className="app-card mb-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-3)] mb-1">
                All Projects
              </div>
              <div className="font-display text-2xl font-extrabold text-[var(--text)] uppercase">
                {overallPct}% Complete
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-3)]">
                Items
              </div>
              <div className="font-mono text-2xl font-bold text-[var(--text)] tabular-nums">
                {totals.done}/{totals.total}
              </div>
            </div>
          </div>
          <div className="w-full h-3 bg-[var(--card-2)] rounded-full overflow-hidden border border-[var(--border)]">
            <div
              className="h-full bg-gradient-to-r from-[var(--accent-deep)] to-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <StatDot color="var(--text-3)" label="Pending" value={totals.pending} />
            <StatDot color="var(--amber)" label="WIP" value={totals.wip} />
            <StatDot color="var(--green)" label="Done" value={totals.done} />
          </div>
        </div>
      )}

      {/* Active projects list */}
      <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-3)]">
            Active Projects
          </h2>
          {active.length > 0 && (
            <span className="font-mono text-xs text-[var(--text-3)] tabular-nums">
              {active.length} {active.length === 1 ? 'home' : 'homes'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-[var(--text-3)] text-sm">Loading…</div>
        ) : active.length === 0 ? (
          <div className="app-card text-center py-10">
            <FolderOpen size={32} className="mx-auto text-[var(--text-4)] mb-3" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-[var(--text-2)]">No projects yet</p>
            <p className="text-xs text-[var(--text-3)] mt-1 mb-4">
              Start a walkthrough — take photos, capture voice notes, or paste in a punch list.
            </p>
            <button onClick={() => nav('/new')} className="app-btn-primary inline-flex text-sm py-2 px-4">
              <Plus size={14} strokeWidth={2.5} />
              Create your first project
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((p) => {
              const s = p.statusCounts || { pending: 0, wip: 0, done: 0 };
              const total = p._count?.items || 0;
              const pct = total > 0 ? Math.round((s.done / total) * 100) : 0;
              return (
                <Link
                  key={p.id}
                  to={`/project/${p.id}`}
                  className="app-card app-card--interactive block group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display uppercase font-bold text-[17px] tracking-tight text-[var(--text)] truncate">
                        {p.address}
                      </h3>
                      {p.community && (
                        <p className="text-[11px] text-[var(--text-3)] mt-0.5 truncate">
                          {p.community}
                          {p.lot ? ` · Lot ${p.lot}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-xl font-extrabold text-[var(--accent)] tabular-nums">
                        {pct}%
                      </div>
                    </div>
                  </div>

                  {total > 0 && (
                    <div className="mt-3">
                      <div className="w-full h-1.5 bg-[var(--card-2)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--accent-deep)] to-[var(--accent)] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--text-3)]">
                        <span className="font-mono tabular-nums">
                          {s.done}/{total} done
                        </span>
                        {s.wip > 0 && (
                          <span className="font-mono tabular-nums">{s.wip} wip</span>
                        )}
                        <span className="ml-auto font-mono tabular-nums">
                          {p._count?.files || 0} files
                        </span>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatDot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="app-bullet" style={{ color, background: color, width: 8, height: 8 }} />
      <span className="text-[var(--text-3)] uppercase tracking-wider text-[10px] font-bold">
        {label}
      </span>
      <span className="font-mono text-[var(--text)] tabular-nums font-semibold">{value}</span>
    </div>
  );
}
