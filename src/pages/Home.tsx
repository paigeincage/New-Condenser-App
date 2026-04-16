import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listProjects } from '../api/projects';
import { TopBar } from '../components/layout/TopBar';
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

  // Overall stats across all active projects
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
    <div>
      <TopBar
        title="The Condenser"
        right={
          <button
            onClick={() => nav('/new')}
            className="bg-mar text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-mar-light transition-colors"
          >
            + New Project
          </button>
        }
      />

      {loading ? (
        <div className="text-center py-20 text-g400 text-sm">Loading projects...</div>
      ) : active.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface flex items-center justify-center">
            <svg className="w-8 h-8 text-g300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-g600 font-medium mb-1">No projects yet</p>
          <p className="text-g400 text-sm mb-6">Create your first project to start organizing punch items</p>
          <Link
            to="/new"
            className="inline-block bg-mar text-white font-semibold px-6 py-3 rounded-xl hover:bg-mar-light transition-colors"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <>
          {/* Overall progress summary */}
          {totals.total > 0 && (
            <div className="mb-5 bg-surface rounded-xl p-4">
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

          {/* Project cards */}
          <div className="space-y-3">
            {active.map((p) => {
              const s = p.statusCounts || { pending: 0, wip: 0, done: 0 };
              const total = p._count?.items || 0;
              const pct = total > 0 ? Math.round((s.done / total) * 100) : 0;

              return (
                <Link
                  key={p.id}
                  to={`/project/${p.id}`}
                  className="block bg-white border border-g100 rounded-xl p-4 hover:border-mar/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-g700">{p.address}</h3>
                      {p.community && <p className="text-sm text-g400 mt-0.5">{p.community}{p.lot ? ` · Lot ${p.lot}` : ''}</p>}
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
        </>
      )}
    </div>
  );
}
