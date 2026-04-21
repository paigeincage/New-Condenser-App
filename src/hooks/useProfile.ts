import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Profile } from '../db';

const DEFAULT_PROFILE: Profile = {
  id: 'main',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  companyName: '',
  signOff: '',
  greetingEnabled: true,
  greetingWord: 'Howdy',

  emailSubject: 'Punch list — {project}',
  emailIntro: 'Hi {trade}, please review the items below for {project}.',
  emailSignOff: 'Thanks,\n{signoff}',
  textIntro: 'Hi {trade} — punch list for {project}:',
  textSignOff: '— {signoff}',

  notifySendConfirmations: true,
  notifyDailySummary: false,
  notifyWeeklySummary: true,
  notifyStageChanges: true,
  quietHoursEnabled: true,
  quietHoursStart: '19:00',
  quietHoursEnd: '07:00',

  defaultSendPreference: 'text',

  fontChoice: 'default',
  fontScale: 1.0,
  highContrast: false,

  updatedAt: new Date().toISOString(),
};

export function useProfile(): Profile {
  const profile = useLiveQuery(() => db.profile.get('main'), []);
  return profile ?? DEFAULT_PROFILE;
}

export async function saveProfile(patch: Partial<Profile>): Promise<void> {
  const current = (await db.profile.get('main')) ?? DEFAULT_PROFILE;
  const next: Profile = {
    ...current,
    ...patch,
    id: 'main',
    updatedAt: new Date().toISOString(),
  };
  await db.profile.put(next);
}
