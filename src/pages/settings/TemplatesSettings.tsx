import { TopBar } from '../../components/layout/TopBar';
import { useProfile, saveProfile } from '../../hooks/useProfile';
import { TextField, TextAreaField, Section } from '../../components/settings/SettingsField';

function tplReplace(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

export function TemplatesSettings() {
  const profile = useProfile();

  const vars = {
    project: '1307 Live Oak',
    trade: 'Drywall',
    signoff: profile.signOff || profile.firstName || 'CM',
  };

  const emailPreview = [
    `Subject: ${tplReplace(profile.emailSubject, vars)}`,
    '',
    `Hi ${vars.trade},`,
    '',
    tplReplace(profile.emailIntro, vars),
    '',
    '1. Replace baseboard at living room',
    '2. Missing caulking under stairs',
    '',
    tplReplace(profile.emailSignOff, vars),
  ].join('\n');

  const textPreview = [
    tplReplace(profile.textIntro, vars),
    '1. Replace baseboard at living room',
    '2. Missing caulking under stairs',
    tplReplace(profile.textSignOff, vars),
  ].join('\n');

  return (
    <div>
      <TopBar title="Message Templates" back />

      <div className="text-xs text-g400 mb-4">
        Variables: <code className="bg-surface px-1 rounded">{'{project}'}</code>{' '}
        <code className="bg-surface px-1 rounded">{'{trade}'}</code>{' '}
        <code className="bg-surface px-1 rounded">{'{signoff}'}</code>
      </div>

      <Section title="Email template">
        <TextField
          label="Subject line"
          value={profile.emailSubject}
          onChange={(e) => saveProfile({ emailSubject: e.target.value })}
        />
        <TextAreaField
          label="Intro"
          rows={3}
          value={profile.emailIntro}
          onChange={(e) => saveProfile({ emailIntro: e.target.value })}
        />
        <TextAreaField
          label="Sign-off"
          rows={2}
          value={profile.emailSignOff}
          onChange={(e) => saveProfile({ emailSignOff: e.target.value })}
        />
        <div className="bg-[var(--card-2)] rounded-lg p-3 border-[1.5px] border-g200">
          <div className="text-[10px] uppercase tracking-wider text-g400 font-semibold mb-2">Preview</div>
          <pre className="text-xs text-cblack whitespace-pre-wrap font-sans">{emailPreview}</pre>
        </div>
      </Section>

      <Section title="Text template">
        <TextAreaField
          label="Intro"
          rows={2}
          value={profile.textIntro}
          onChange={(e) => saveProfile({ textIntro: e.target.value })}
        />
        <TextAreaField
          label="Sign-off"
          rows={2}
          value={profile.textSignOff}
          onChange={(e) => saveProfile({ textSignOff: e.target.value })}
        />
        <div className="bg-[var(--card-2)] rounded-lg p-3 border-[1.5px] border-g200">
          <div className="text-[10px] uppercase tracking-wider text-g400 font-semibold mb-2">Preview</div>
          <pre className="text-xs text-cblack whitespace-pre-wrap font-sans">{textPreview}</pre>
        </div>
      </Section>
    </div>
  );
}
