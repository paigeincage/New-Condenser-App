import { TopBar } from '../../components/layout/TopBar';
import { useProfile, saveProfile } from '../../hooks/useProfile';
import { Toggle, Section } from '../../components/settings/SettingsField';

export function NotificationsSettings() {
  const profile = useProfile();

  return (
    <div>
      <TopBar title="Notifications" back />

      <Section title="Alerts">
        <Toggle
          label="Send confirmations"
          hint="Tell me when an email or text is delivered"
          checked={profile.notifySendConfirmations}
          onChange={(v) => saveProfile({ notifySendConfirmations: v })}
        />
        <Toggle
          label="Daily summary"
          hint='e.g. "You sent 5 punch lists today"'
          checked={profile.notifyDailySummary}
          onChange={(v) => saveProfile({ notifyDailySummary: v })}
        />
        <Toggle
          label="Weekly summary"
          hint='e.g. "This week: 22 punch lists across 9 homes"'
          checked={profile.notifyWeeklySummary}
          onChange={(v) => saveProfile({ notifyWeeklySummary: v })}
        />
        <Toggle
          label="Stage change alerts"
          hint="Notify when a home moves to a new build stage"
          checked={profile.notifyStageChanges}
          onChange={(v) => saveProfile({ notifyStageChanges: v })}
        />
      </Section>

      <Section title="Quiet hours" description="Texts won't be sent during this window.">
        <Toggle
          label="Enable quiet hours"
          checked={profile.quietHoursEnabled}
          onChange={(v) => saveProfile({ quietHoursEnabled: v })}
        />
        {profile.quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-sm font-semibold text-cblack mb-1.5">Start</div>
              <input
                type="time"
                value={profile.quietHoursStart}
                onChange={(e) => saveProfile({ quietHoursStart: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-g200 bg-[var(--card-2)] text-cblack focus:border-mar focus:outline-none"
              />
            </label>
            <label className="block">
              <div className="text-sm font-semibold text-cblack mb-1.5">End</div>
              <input
                type="time"
                value={profile.quietHoursEnd}
                onChange={(e) => saveProfile({ quietHoursEnd: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-g200 bg-[var(--card-2)] text-cblack focus:border-mar focus:outline-none"
              />
            </label>
          </div>
        )}
      </Section>
    </div>
  );
}
