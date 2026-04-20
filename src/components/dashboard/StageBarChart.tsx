import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  data: { stage: string; count: number }[];
}

export function StageBarChart({ data }: Props) {
  const { theme } = useTheme();
  const accent = theme === 'dark' ? '#C93D54' : '#7A1028';
  const accentDeep = theme === 'dark' ? '#8B1429' : '#500000';
  const text2 = theme === 'dark' ? '#A8ABB2' : '#555560';
  const text = theme === 'dark' ? '#F2F3F5' : '#1A1A22';
  const cardBg = theme === 'dark' ? '#1A1C1F' : '#FFFFFF';
  const border = theme === 'dark' ? '#2D2F34' : '#E4E1DD';

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id="stageBarFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accentDeep} stopOpacity={0.6} />
            <stop offset="100%" stopColor={accent} stopOpacity={1} />
          </linearGradient>
        </defs>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="stage"
          tick={{ fill: text2, fontSize: 13, fontWeight: 600 }}
          width={110}
          axisLine={false}
          tickLine={false}
        />
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
          formatter={(v) => [`${v} homes`, '']}
          separator=""
        />
        <Bar
          dataKey="count"
          radius={[0, 6, 6, 0]}
          label={{ position: 'right', fill: text, fontSize: 13, fontWeight: 700 }}
        >
          {data.map((_, i) => (
            <Cell key={i} fill="url(#stageBarFill)" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
