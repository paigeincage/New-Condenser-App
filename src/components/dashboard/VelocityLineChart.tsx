import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  data: { month: string; avgDays: number }[];
}

export function VelocityLineChart({ data }: Props) {
  const { theme } = useTheme();
  const accent = theme === 'dark' ? '#C93D54' : '#7A1028';
  const text2 = theme === 'dark' ? '#A8ABB2' : '#555560';
  const text = theme === 'dark' ? '#F2F3F5' : '#1A1A22';
  const cardBg = theme === 'dark' ? '#1A1C1F' : '#FFFFFF';
  const border = theme === 'dark' ? '#2D2F34' : '#E4E1DD';
  const grid = theme === 'dark' ? '#262930' : '#E4E1DD';
  const dotBg = theme === 'dark' ? '#17191D' : '#FFFFFF';
  const activeDotStroke = theme === 'dark' ? '#0F1114' : '#FAFAF8';

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
        <defs>
          <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: text2, fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: text2, fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
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
          formatter={(v) => [`${v} days`, 'Avg build time']}
        />
        <Area
          type="monotone"
          dataKey="avgDays"
          stroke={accent}
          strokeWidth={3}
          fill="url(#velocityFill)"
          dot={{ r: 4, fill: dotBg, stroke: accent, strokeWidth: 2 }}
          activeDot={{ r: 7, fill: accent, stroke: activeDotStroke, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
