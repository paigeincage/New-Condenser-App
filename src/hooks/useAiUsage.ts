import { useLiveQuery } from 'dexie-react-hooks';
import { db, type AiUsageRecord } from '../db';

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const EMPTY: AiUsageRecord = {
  month: currentMonthKey(),
  voiceSeconds: 0,
  visionCalls: 0,
  estimatedCostCents: 0,
  updatedAt: new Date().toISOString(),
};

export function useCurrentMonthUsage(): AiUsageRecord {
  const key = currentMonthKey();
  const rec = useLiveQuery(() => db.aiUsage.get(key), [key]);
  return rec ?? { ...EMPTY, month: key };
}

export async function recordVoiceUsage(seconds: number, costCents: number) {
  const key = currentMonthKey();
  const current = (await db.aiUsage.get(key)) ?? { ...EMPTY, month: key };
  await db.aiUsage.put({
    ...current,
    voiceSeconds: current.voiceSeconds + seconds,
    estimatedCostCents: current.estimatedCostCents + costCents,
    updatedAt: new Date().toISOString(),
  });
}

export async function recordVisionUsage(calls: number, costCents: number) {
  const key = currentMonthKey();
  const current = (await db.aiUsage.get(key)) ?? { ...EMPTY, month: key };
  await db.aiUsage.put({
    ...current,
    visionCalls: current.visionCalls + calls,
    estimatedCostCents: current.estimatedCostCents + costCents,
    updatedAt: new Date().toISOString(),
  });
}
