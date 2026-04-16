import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listProjects } from '../api/projects';
import type { Project } from '../types';

export function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    listProjects()
      .then((r) => setProjects(r.projects))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = projects.filter((p) => p.status === 'active');

  // Overall stats
  const totals = active.reduce(
    (acc, p) => {
      const s = p.statusCounts || { pending: 0, wip: 0, done: 0 };
      acc.pending += s.pending;
      acc.wip += s.wip;
      acc.done += s.done;
      acc.total += (p._count?.items || 0);
      return acc;
    },
    { pending: 0, wip: 0, done: 0, total: 0 }
  );
  const overallPct = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0;

  return (
    <div className="pt-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-extrabold text-cblack leading-tight font-display uppercase tracking-wide">
            The Condenser
          </h1>
          <p className="text-xs text-g400 mt-1">Built for construction managers, by a construction manager</p>
        </div>
        <button
          onClick={() => nav('/settings')}
          className="text-lg text-g400 hover:text-mar p-2 -mr-2 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Navigation buttons */}
      <div className="flex flex-col gap-3 max-w-[360px] mx-auto mb-8">
        <button
          onClick={() => nav('/new')}
          className="w-full py-[18px] rounded-[10px] bg-mar text-white font-bold text-[15px] hover:bg-mar-light transition-colors"
        >
          + New Project
        </button>

        {active.length > 0 && (
          <button
            onClick={() => {
              // Go to first active project, or show list
              if (active.length === 1) nav(`/project/${active[0]!.id}`);
              else nav('/'); // already home, scroll to projects
              document.getElementById('projects-list')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full py-[18px] rounded-[10px] bg-surface-2 text-cblack font-semibold text-[15px] hover:bg-mar-l hover:text-mar transition-colors border-[1.5px] border-g200"
          >
            Active Projects
          </button>
        )}

        <button
          onClick={() => nav('/contacts')}
          className="w-full py-[18px] rounded-[10px] bg-surface-2 text-cblack font-semibold text-[15px] hover:bg-mar-l hover:text-mar transition-colors border-[1.5px] border-g200"
        >
          Contacts
        </button>
      </div>

      {/* Overall progress */}
      {totals.total > 0 && (
        <div className="mb-6 bg-surface rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-g700">All Projects</span>
            <span className="text-sm font-bold text-mar">{overallPct}% Complete</span>
          </div>
          <div className="w-full h-3 bg-g200 rounded-full overflow-hidden">
            <div
              className="h-full bg-mar rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-g400">
            <span>{totals.total} total items</span>
            <div className="flex gap-3">
              <span>{totals.pending} pending</span>
              <span>{totals.wip} in progress</span>
              <span className="text-green-600 font-medium">{totals.done} done</span>
            </div>
          </div>
        </div>
      )}

      {/* Active projects list */}
      {loading ? (
        <div className="text-center py-12 text-g400 text-sm">Loading projects...</div>
      ) : active.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-g400 text-sm">No active projects. Create one to get started.</p>
        </div>
      ) : (
        <div id="projects-list" className="space-y-3">
          <h2 className="text-xs font-semibold text-g500 uppercase tracking-wider mb-2">Active Projects</h2>
          {active.map((p) => {
            const s = p.statusCounts || { pending: 0, wip: 0, done: 0 };
            const total = p._count?.items || 0;
            const pct = total > 0 ? Math.round((s.done / total) * 100) : 0;

            return (
              <Link
                key={p.id}
                to={`/project/${p.id}`}
                className="block bg-white border-[1.5px] border-g200 rounded-[10px] p-4 hover:border-mar/30 hover:bg-mar-l transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-cblack">{p.address}</h3>
                    {p.community && <p className="text-xs text-g400 mt-0.5">{p.community}{p.lot ? ` · Lot ${p.lot}` : ''}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="text-lg font-bold text-mar">{pct}%</span>
                  </div>
                </div>

                {total > 0 && (
                  <div className="mt-3">
                    <div className="w-full h-2 bg-g200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-mar rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-g400">
                      <span>{s.done}/{total} done</span>
                      {s.wip > 0 && <span>{s.wip} in progress</span>}
                      <span className="ml-auto">{p._count?.files || 0} files</span>
                    </div>
                  </div>
                )}

                {total === 0 && (
                  <p className="text-xs text-g400 mt-2">No items yet · {p._count?.files || 0} files</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
