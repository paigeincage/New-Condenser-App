import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from 'recharts';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  data: { week: string; count: number }[];
}

export function PunchActivityChart({ data }: Props) {
  const { theme } = useTheme();
  const accent = theme === 'dark' ? '#C93D54' : '#7A1028';
  const text2 = theme === 'dark' ? '#A8ABB2' : '#555560';
  const text = theme === 'dark' ? '#F2F3F5' : '#1A1A22';
  const cardBg = theme === 'dark' ? '#1A1C1F' : '#FFFFFF';
  const border = theme === 'dark' ? '#2D2F34' : '#E4E1DD';
  const grid = theme === 'dark' ? '#262930' : '#E4E1DD';

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -20 }}>
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={1} />
            <stop offset="100%" stopColor={accent} stopOpacity={0.35} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="week" tick={{ fill: text2, fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: text2, fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: theme === 'dark' ? 'rgba(201, 61, 84, 0.08)' : 'rgba(80, 0, 0, 0.06)' }}
          contentStyle={{
            background: cardBg,
            border: `1.5px solid ${border}`,
            borderRadius: 10,
            fontSize: 13,
            color: text,
            padding: '8px 12px',
          }}
          labelStyle={{ color: text2, fontWeight: 600, marginBottom: 2 }}
          itemStyle={{ color: accent }}
          formatter={(v) => [`${v} items`, 'Sent']}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill="url(#activityFill)" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
