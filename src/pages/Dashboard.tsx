import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { config } from '../config/builder';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function Dashboard() {
  const allLots = useLiveQuery(() => db.lots.toArray()) ?? [];
  const flaggedEmails = useLiveQuery(() => db.emails.where('flagged').equals(1).toArray()) ?? [];
  const [showAll, setShowAll] = useState(false);
  const nav = useNavigate();

  const lots = showAll ? allLots : allLots.filter(l => l.fieldContact === 'Beltran, Paige');

  // Group by SCAR stage
  const byStage: Record<string, number> = {};
  config.scarStages.forEach(s => { byStage[s] = 0; });
  lots.forEach(l => { byStage[l.scarStage] = (byStage[l.scarStage] ?? 0) + 1; });

  const behind = lots.filter(l => l.taskDays < 0);
  const onTrack = lots.filter(l => l.taskDays >= 0);
  const activeLots = lots.filter(l => !l.currentTask.toLowerCase().includes('celebration'));
  void lots.filter(l => l.currentTask.toLowerCase().includes('celebration'));

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cblack">
          {greeting()}, {config.user.name.split(' ')[0]}
        </h1>
        <p className="text-g400 text-xs mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          {' · '}{config.user.community} ({config.user.communityId})
        </p>
      </div>

      {/* CM Filter */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setShowAll(false)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!showAll ? 'bg-mar text-white' : 'bg-surface text-g500'}`}
        >
          My Lots ({allLots.filter(l => l.fieldContact === 'Beltran, Paige').length})
        </button>
        <button
          onClick={() => setShowAll(true)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showAll ? 'bg-mar text-white' : 'bg-surface text-g500'}`}
        >
          All ({allLots.length})
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Total" value={lots.length} color="mar" />
        <StatCard label="Active" value={activeLots.length} color="blue" />
        <StatCard label="On Track" value={onTrack.length} color="green" />
        <StatCard label="Behind" value={behind.length} color="red" />
      </div>

      {/* SCAR Pipeline */}
      {lots.length > 0 && (
        <div className="bg-white rounded-xl border-[1.5px] border-g200 p-4 mb-5">
          <h2 className="text-sm font-semibold text-cblack mb-3">SCAR Pipeline</h2>
          <div className="grid grid-cols-4 gap-2">
            {config.scarStages.map(stage => {
              const count = byStage[stage] ?? 0;
              const pct = lots.length > 0 ? (count / lots.length) * 100 : 0;
              return (
                <div key={stage} className="bg-surface rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-cblack">{count}</div>
                  <div className="text-xs text-g400 mt-0.5">{stage}</div>
                  <div className="mt-2 h-1.5 bg-g200 rounded-full overflow-hidden">
                    <div className="h-full bg-mar rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Lots */}
      {activeLots.length > 0 && (
        <div className="bg-white rounded-xl border-[1.5px] border-g200 p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-cblack">Active Lots</h2>
            <Link to="/lots" className="text-xs text-mar hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {activeLots.sort((a, b) => a.taskDays - b.taskDays).slice(0, 10).map(lot => (
              <Link
                key={lot.id}
                to={`/lots/${lot.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-surface-2 transition-colors"
              >
                <DaysBadge days={lot.taskDays} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cblack truncate">{lot.currentTask}</p>
                  <p className="text-xs text-g400 truncate">{lot.address} · Lot {lot.lotBlock}</p>
                </div>
                <StageBadge stage={lot.scarStage} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Flagged Emails */}
      {flaggedEmails.length > 0 && (
        <div className="bg-white rounded-xl border-[1.5px] border-g200 p-4 mb-5">
          <h2 className="text-sm font-semibold text-cblack mb-3">Flagged Emails</h2>
          <div className="space-y-2">
            {flaggedEmails.slice(0, 5).map(email => (
              <div key={email.id} className="p-3 rounded-lg bg-surface">
                <p className="text-xs text-mar font-medium">{email.from}</p>
                <p className="text-sm font-medium text-cblack mt-0.5 truncate">{email.subject}</p>
                <p className="text-xs text-g400 mt-1 line-clamp-2">{email.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border-[1.5px] border-g200 p-4 mb-5">
        <h2 className="text-sm font-semibold text-cblack mb-3">Quick Actions</h2>
        <div className="space-y-2">
          <button onClick={() => nav('/lots')} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-g600 bg-surface hover:bg-mar-l hover:text-mar transition-colors">
            View All Lots
          </button>
          <a href={config.builder.portalUrl} target="_blank" rel="noopener" className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-g600 bg-surface hover:bg-mar-l hover:text-mar transition-colors">
            Open {config.builder.portalName}
          </a>
          <a href="https://outlook.cloud.microsoft/mail/" target="_blank" rel="noopener" className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-g600 bg-surface hover:bg-mar-l hover:text-mar transition-colors">
            Open Outlook
          </a>
        </div>
      </div>

      {/* Empty state */}
      {allLots.length === 0 && (
        <div className="text-center py-12 text-g400 text-sm">
          <p>No lots loaded yet.</p>
          <p className="mt-1">Go to <Link to="/lots" className="text-mar hover:underline">Lots</Link> to add lot data from PCP.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    mar: 'text-mar bg-mar-l',
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
  };
  return (
    <div className={`rounded-xl p-3 text-center ${colors[color] ?? colors.mar}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs mt-0.5 opacity-70">{label}</div>
    </div>
  );
}

function DaysBadge({ days }: { days: number }) {
  if (days < 0) return <span className="text-xs font-bold px-2 py-1 rounded bg-red-50 text-red-600 shrink-0">{days}d</span>;
  if (days === 0) return <span className="text-xs font-bold px-2 py-1 rounded bg-amber-50 text-amber-600 shrink-0">Today</span>;
  return <span className="text-xs font-bold px-2 py-1 rounded bg-green-50 text-green-600 shrink-0">+{days}d</span>;
}

function StageBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    Start: 'bg-blue-50 text-blue-600',
    Frame: 'bg-amber-50 text-amber-600',
    Second: 'bg-mar-l text-mar',
    Final: 'bg-green-50 text-green-600',
  };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors[stage] ?? 'bg-surface text-g400'}`}>{stage}</span>;
}
