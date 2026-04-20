import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CommunityHome } from '../db';
import { useProfile } from '../hooks/useProfile';
import { HeroMetric } from '../components/dashboard/HeroMetric';
import { StageBarChart } from '../components/dashboard/StageBarChart';
import { VelocityLineChart } from '../components/dashboard/VelocityLineChart';
import { PunchActivityChart } from '../components/dashboard/PunchActivityChart';
import { TradeResponseList } from '../components/dashboard/TradeResponseList';
import { ActionFeed } from '../components/dashboard/ActionFeed';

// Phase 2 — flagged, not built
// - Budget tracking per home + variance graphs
// - Inferred stage tracking (app guesses stage from punch list activity)
// - Mobile home-screen widget (Quick Punch, Today's Homes, Send Last List)

const STAGES: CommunityHome['stage'][] = [
  'Pre-construction',
  'Framing',
  'Drywall',
  'Paint',
  'Trim',
  'Tile',
  'Punch',
  'Complete',
];

const MOCK_STAGE_DATA = [
  { stage: 'Framing', count: 6 },
  { stage: 'Drywall', count: 4 },
  { stage: 'Paint', count: 3 },
  { stage: 'Trim', count: 5 },
  { stage: 'Tile', count: 2 },
  { stage: 'Punch', count: 4 },
  { stage: 'Complete', count: 8 },
];

const MOCK_VELOCITY = [
  { month: 'Nov', avgDays: 128 },
  { month: 'Dec', avgDays: 121 },
  { month: 'Jan', avgDays: 115 },
  { month: 'Feb', avgDays: 118 },
  { month: 'Mar', avgDays: 109 },
  { month: 'Apr', avgDays: 104 },
];

const MOCK_PUNCH_ACTIVITY = [
  { week: 'W1', count: 12 },
  { week: 'W2', count: 18 },
  { week: 'W3', count: 9 },
  { week: 'W4', count: 22 },
  { week: 'W5', count: 15 },
  { week: 'W6', count: 27 },
  { week: 'W7', count: 19 },
  { week: 'W8', count: 31 },
];

const MOCK_TRADES = [
  { name: 'Steadfast Drywall', avgHours: 6, count: 12 },
  { name: 'Olvin & Fugon Painting', avgHours: 14, count: 8 },
  { name: 'O&V Carpentry', avgHours: 18, count: 14 },
  { name: 'In Charge Electrical', avgHours: 24, count: 5 },
  { name: 'Victory Plumbing', avgHours: 36, count: 7 },
];

const MOCK_ATTENTION = [
  { id: 'a1', title: '1307 Live Oak', subtitle: '3 overdue punch items · Drywall', timestamp: '2d', accent: 'warn' as const },
  { id: 'a2', title: '114 Whispering Pines', subtitle: 'Stalled in Paint — 6 days', timestamp: '6d', accent: 'warn' as const },
  { id: 'a3', title: '909 Cedar Crest', subtitle: '2 overdue punch items · Trim', timestamp: '1d', accent: 'warn' as const },
];

const MOCK_UPCOMING = [
  { id: 'u1', title: '202 Magnolia Ave', subtitle: 'Target close: 4 days', timestamp: 'Apr 22', accent: 'info' as const },
  { id: 'u2', title: '56 Bluebonnet Ln', subtitle: 'Target close: 9 days', timestamp: 'Apr 27', accent: 'info' as const },
  { id: 'u3', title: '703 Post Oak', subtitle: 'Target close: 14 days', timestamp: 'May 2', accent: 'info' as const },
];

const MOCK_ACTIVITY = [
  { id: 'r1', title: 'Punch list sent · 1307 Live Oak', subtitle: 'Drywall · 5 items', timestamp: '12m' },
  { id: 'r2', title: 'Stage → Paint', subtitle: '114 Whispering Pines', timestamp: '1h' },
  { id: 'r3', title: 'Punch list sent · 909 Cedar Crest', subtitle: 'Trim · 3 items', timestamp: '3h' },
  { id: 'r4', title: 'Home completed', subtitle: '12 Bayou Bend closed out', timestamp: '5h', accent: 'success' as const },
  { id: 'r5', title: 'Punch list sent · 202 Magnolia', subtitle: 'Electrical · 2 items', timestamp: 'yest' },
];

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function isSameQuarter(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && Math.floor(a.getMonth() / 3) === Math.floor(b.getMonth() / 3);
}
function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// Icon set — simple inline SVGs
const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <path d="M9 22V12h6v10" />
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IconZap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="M7 16l4-4 4 4 5-8" />
  </svg>
);
const IconActivity = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const IconFlag = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);
const IconPulse = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12h4l3-9 4 18 3-9h4" />
  </svg>
);

export function Dashboard() {
  const profile = useProfile();
  const homes = useLiveQuery(() => db.communityHomes.toArray()) ?? [];

  // Theme is handled globally via useTheme; no per-page override needed.

  const metrics = useMemo(() => {
    const now = new Date();
    const active = homes.filter((h) => h.stage !== 'Complete');
    const completed = homes.filter((h) => h.stage === 'Complete');

    const thisMonth = completed.filter((h) =>
      h.targetCompletionDate ? isSameMonth(new Date(h.targetCompletionDate), now) : false
    );
    const thisQuarter = completed.filter((h) =>
      h.targetCompletionDate ? isSameQuarter(new Date(h.targetCompletionDate), now) : false
    );
    const durations = completed
      .filter((h) => h.startDate && h.targetCompletionDate)
      .map((h) => daysBetween(new Date(h.startDate!), new Date(h.targetCompletionDate!)))
      .filter((d) => d > 0);
    const avgDays = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;

    const hasRealData = homes.length > 0;
    const stageData = hasRealData
      ? STAGES.map((s) => ({ stage: s, count: homes.filter((h) => h.stage === s).length })).filter(
          (d) => d.count > 0
        )
      : MOCK_STAGE_DATA;

    return {
      active: active.length,
      thisMonth: thisMonth.length,
      thisQuarter: thisQuarter.length,
      avgDays,
      stageData,
      hasRealData,
    };
  }, [homes]);

  const heroTotal = metrics.hasRealData ? metrics.active : 32;
  const heroMonth = metrics.hasRealData ? metrics.thisMonth : 6;
  const heroQuarter = metrics.hasRealData ? metrics.thisQuarter : 14;
  const heroAvgDays = metrics.avgDays ?? 112;

  return (
    <div className="dash-root -mx-5 -mt-0 px-5 lg:-mx-8 lg:px-8 pt-8 pb-16 min-h-dvh">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 mb-8 lg:mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="dash-chip">Live · {new Date().toLocaleDateString('en-US', { weekday: 'short' })}</span>
            {!metrics.hasRealData && <span className="dash-chip">Preview mode</span>}
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--dash-text)]">
            {profile.firstName ? `${profile.firstName}'s` : ''} Dashboard
          </h1>
          <p className="text-sm text-[var(--dash-text-2)] mt-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right hidden lg:block">
          <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--dash-text-3)]">Last updated</div>
          <div className="text-sm text-[var(--dash-text-2)] mt-1">Just now</div>
        </div>
      </header>

      {/* TOP ROW — Hero Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6 lg:mb-8">
        <HeroMetric
          label="Active Homes"
          value={heroTotal}
          sublabel="Under management"
          icon={<IconHome />}
        />
        <HeroMetric
          label={`Completed · ${new Date().toLocaleDateString('en-US', { month: 'short' })}`}
          value={heroMonth}
          sublabel="This month"
          icon={<IconCheck />}
          trend={{ direction: 'up', text: '+2 vs last' }}
        />
        <HeroMetric
          label="Completed · Quarter"
          value={heroQuarter}
          sublabel="Current quarter"
          icon={<IconCalendar />}
          trend={{ direction: 'up', text: '+5 vs last' }}
        />
        <HeroMetric
          label="Avg Build Days"
          value={heroAvgDays}
          sublabel="Start → complete"
          icon={<IconZap />}
          trend={{ direction: 'down', text: '-8 vs 6mo' }}
        />
      </div>

      {/* Desktop-only: middle + bottom rows */}
      <div className="hidden lg:block">
        {/* MIDDLE ROW */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          <ChartCard
            title="Homes by Stage"
            subtitle="Where every lot stands right now"
            icon={<IconChart />}
          >
            <StageBarChart data={metrics.stageData} />
          </ChartCard>

          <ChartCard
            title="Build Velocity"
            subtitle="Average days from start to complete · trending down is good"
            icon={<IconActivity />}
            badge="6 months"
          >
            <VelocityLineChart data={MOCK_VELOCITY} />
          </ChartCard>

          <ChartCard
            title="Punch Items / Week"
            subtitle="How active is your list engine"
            icon={<IconPulse />}
            badge="Last 8 weeks"
          >
            <PunchActivityChart data={MOCK_PUNCH_ACTIVITY} />
          </ChartCard>

          <ChartCard
            title="Trade Response Time"
            subtitle="Fastest to close out items · shorter bar = faster"
            icon={<IconClock />}
          >
            <TradeResponseList data={MOCK_TRADES} />
          </ChartCard>
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-3 gap-5">
          <ActionFeed
            title="Needs Attention"
            icon={<IconAlert />}
            items={MOCK_ATTENTION}
            emptyLabel="Nothing overdue — nice work"
          />
          <ActionFeed
            title="Upcoming Closes"
            icon={<IconFlag />}
            items={MOCK_UPCOMING}
            emptyLabel="No closes scheduled"
          />
          <ActionFeed
            title="Recent Activity"
            icon={<IconPulse />}
            items={MOCK_ACTIVITY}
            emptyLabel="No recent activity"
          />
        </div>
      </div>

      {/* Mobile-only notice */}
      <div className="lg:hidden mt-6 dash-card text-center">
        <div className="text-base font-bold text-[var(--dash-text)] mb-1.5">Full dashboard on desktop</div>
        <div className="text-xs text-[var(--dash-text-2)]">
          Charts and activity feeds open up at 1024px+. Open this on your laptop to see the full view.
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dash-card">
      <div className="flex items-start justify-between mb-5 gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-[var(--dash-card-2)] border border-[var(--dash-border)] flex items-center justify-center text-[var(--dash-cyan)] shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold text-[var(--dash-text)] tracking-tight truncate">{title}</h3>
            {subtitle && (
              <p className="text-xs text-[var(--dash-text-2)] mt-1 leading-relaxed">{subtitle}</p>
            )}
          </div>
        </div>
        {badge && (
          <span className="dash-chip shrink-0">{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}
