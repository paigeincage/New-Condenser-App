import { useRef } from 'react';
import { TopBar } from '../../components/layout/TopBar';
import { useProfile, saveProfile } from '../../hooks/useProfile';
import { useCurrentMonthUsage } from '../../hooks/useAiUsage';
import { TextField, Toggle, SelectField, Section } from '../../components/settings/SettingsField';
import type { GreetingWord } from '../../db';

const GREETINGS: GreetingWord[] = ['Howdy', 'Hey', 'Welcome', "Mornin'", 'Hola'];

export function ProfileSettings() {
  const profile = useProfile();
  const usage = useCurrentMonthUsage();
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      saveProfile({ photoDataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const costDollars = (usage.estimatedCostCents / 100).toFixed(2);
  const monthLabel = new Date(usage.month + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      <TopBar title="Profile" back />

      <Section title="Your info">
        <div className="flex items-center gap-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden cursor-pointer border-[1.5px] border-g200 hover:border-mar transition-colors shrink-0"
          >
            {profile.photoDataUrl ? (
              <img src={profile.photoDataUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl text-g400">📷</span>
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-cblack">Profile photo</div>
            <div className="text-xs text-g400">Tap to upload (max 2MB)</div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            {profile.photoDataUrl && (
              <button
                onClick={() => saveProfile({ photoDataUrl: undefined })}
                className="text-xs text-mar font-semibold mt-1 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <TextField
          label="First name"
          value={profile.firstName}
          onChange={(e) => saveProfile({ firstName: e.target.value })}
        />
        <TextField
          label="Last name"
          value={profile.lastName}
          onChange={(e) => saveProfile({ lastName: e.target.value })}
        />
        <TextField
          label="Phone"
          type="tel"
          value={profile.phone}
          onChange={(e) => saveProfile({ phone: e.target.value })}
        />
        <TextField
          label="Email"
          type="email"
          value={profile.email}
          onChange={(e) => saveProfile({ email: e.target.value })}
        />
        <TextField
          label="Company"
          value={profile.companyName}
          onChange={(e) => saveProfile({ companyName: e.target.value })}
        />
        <TextField
          label="Sign-off name"
          hint="The name at the end of your sent messages"
          value={profile.signOff}
          onChange={(e) => saveProfile({ signOff: e.target.value })}
        />
      </Section>

      <Section title="Welcome greeting" description="Shows briefly when the app opens.">
        <Toggle
          label="Show greeting on app open"
          checked={profile.greetingEnabled}
          onChange={(v) => saveProfile({ greetingEnabled: v })}
        />
        <SelectField
          label="Greeting word"
          value={profile.greetingWord}
          onChange={(v) => saveProfile({ greetingWord: v as GreetingWord })}
          options={GREETINGS.map((g) => ({ value: g, label: g }))}
        />
        <div className="bg-[var(--card-2)] rounded-lg p-4 border-[1.5px] border-g200">
          <div className="text-xs font-semibold text-g500 uppercase tracking-wider mb-2">Preview</div>
          <div className="text-2xl font-extrabold text-cblack">
            {profile.greetingEnabled
              ? `${profile.greetingWord}, ${profile.firstName || 'there'}`
              : `Welcome back${profile.firstName ? `, ${profile.firstName}` : ''}`}
          </div>
        </div>
      </Section>

      <Section title={`AI Usage — ${monthLabel}`} description="Monthly cost for voice transcription and vision OCR.">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[var(--card-2)] rounded-lg p-3 border-[1.5px] border-g200">
            <div className="text-[10px] uppercase tracking-wider text-g400 font-semibold">Voice</div>
            <div className="text-xl font-bold text-cblack mt-1 tabular-nums">
              {Math.round(usage.voiceSeconds / 60)}m
            </div>
          </div>
          <div className="bg-[var(--card-2)] rounded-lg p-3 border-[1.5px] border-g200">
            <div className="text-[10px] uppercase tracking-wider text-g400 font-semibold">Vision</div>
            <div className="text-xl font-bold text-cblack mt-1 tabular-nums">{usage.visionCalls}</div>
          </div>
          <div className="bg-[var(--card-2)] rounded-lg p-3 border-[1.5px] border-g200">
            <div className="text-[10px] uppercase tracking-wider text-g400 font-semibold">Est. Cost</div>
            <div className="text-xl font-bold text-mar mt-1 tabular-nums">${costDollars}</div>
          </div>
        </div>
      </Section>
    </div>
  );
}
