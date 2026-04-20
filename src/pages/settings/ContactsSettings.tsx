import { useEffect, useRef, useState } from 'react';
import { TopBar } from '../../components/layout/TopBar';
import { useProfile, saveProfile } from '../../hooks/useProfile';
import { listContacts, createContact, updateContact, deleteContact } from '../../api/contacts';
import { SelectField, Section } from '../../components/settings/SettingsField';
import { useUI } from '../../stores/ui';
import type { Contact } from '../../types';
import type { SendPreference } from '../../db';

const CSV_HEADERS = ['Name', 'Company', 'Trade', 'Phone', 'Email', 'Send Preference'];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (ch === '\r') {
      i++;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function toCsv(rows: string[][]): string {
  return rows
    .map((r) =>
      r
        .map((c) => {
          if (c.includes(',') || c.includes('"') || c.includes('\n')) {
            return `"${c.replace(/"/g, '""')}"`;
          }
          return c;
        })
        .join(',')
    )
    .join('\n');
}

function normalizePref(raw: string): SendPreference {
  const v = raw.trim().toLowerCase();
  if (v.startsWith('both')) return 'both';
  if (v.startsWith('email')) return 'email';
  return 'text';
}

export function ContactsSettings() {
  const profile = useProfile();
  const addToast = useUI((s) => s.addToast);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    company: '',
    trade: '',
    phone: '',
    email: '',
    preferredChannel: 'text' as SendPreference,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    listContacts().then((r) => setContacts(r.contacts)).catch(() => {});
  };
  useEffect(load, []);

  const resetForm = () => {
    setForm({ name: '', company: '', trade: '', phone: '', email: '', preferredChannel: 'text' });
    setEditing(null);
    setShowForm(false);
  };

  const saveForm = async () => {
    if (!form.name.trim()) {
      addToast('Name is required', 'error');
      return;
    }
    try {
      if (editing) {
        await updateContact(editing.id, form);
        addToast('Contact updated', 'success');
      } else {
        await createContact(form);
        addToast('Contact added', 'success');
      }
      resetForm();
      load();
    } catch (err) {
      addToast(String(err), 'error');
    }
  };

  const edit = (c: Contact) => {
    setEditing(c);
    setForm({
      name: c.name,
      company: c.company,
      trade: c.trade,
      phone: c.phone,
      email: c.email,
      preferredChannel: (c.preferredChannel as SendPreference) ?? 'text',
    });
    setShowForm(true);
  };

  const remove = async (c: Contact) => {
    if (!confirm(`Remove ${c.name}?`)) return;
    try {
      await deleteContact(c.id);
      addToast('Deleted', 'success');
      load();
    } catch (err) {
      addToast(String(err), 'error');
    }
  };

  const downloadTemplate = () => {
    const csv = toCsv([CSV_HEADERS, ['John Smith', 'ABC Drywall', 'Drywall', '555-1234', 'john@abc.com', 'Text']]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    if (!rows.length) {
      addToast('CSV is empty', 'error');
      return;
    }
    const [header, ...data] = rows;
    if (!header) {
      addToast('CSV missing header row', 'error');
      e.target.value = '';
      return;
    }
    const headerNorm = header.map((h) => h.trim().toLowerCase());
    const col = (k: string) => headerNorm.indexOf(k);

    const idx = {
      name: col('name'),
      company: col('company'),
      trade: col('trade'),
      phone: col('phone'),
      email: col('email'),
      pref: col('send preference'),
    };

    if (idx.name === -1) {
      addToast('CSV must include a Name column', 'error');
      e.target.value = '';
      return;
    }

    let imported = 0;
    for (const r of data) {
      const name = r[idx.name]?.trim();
      if (!name) continue;
      try {
        await createContact({
          name,
          company: idx.company !== -1 ? r[idx.company]?.trim() ?? '' : '',
          trade: idx.trade !== -1 ? r[idx.trade]?.trim() ?? '' : '',
          phone: idx.phone !== -1 ? r[idx.phone]?.trim() ?? '' : '',
          email: idx.email !== -1 ? r[idx.email]?.trim() ?? '' : '',
          preferredChannel: idx.pref !== -1 ? normalizePref(r[idx.pref] ?? '') : profile.defaultSendPreference,
        });
        imported++;
      } catch {}
    }
    addToast(`Imported ${imported} contacts`, 'success');
    e.target.value = '';
    load();
  };

  return (
    <div>
      <TopBar title="Contacts" back />

      <Section title="Default send preference" description="Used when a contact has no preference set.">
        <SelectField
          label="Default channel"
          value={profile.defaultSendPreference}
          onChange={(v) => saveProfile({ defaultSendPreference: v as SendPreference })}
          options={[
            { value: 'text', label: 'Text only' },
            { value: 'email', label: 'Email only' },
            { value: 'both', label: 'Both (text + email)' },
          ]}
        />
      </Section>

      <Section title="Import / Export">
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 bg-surface-2 border-[1.5px] border-g200 text-cblack font-semibold py-2.5 rounded-lg hover:bg-mar-l hover:border-mar/30 transition-colors text-sm"
          >
            Import CSV
          </button>
          <button
            onClick={downloadTemplate}
            className="flex-1 bg-surface-2 border-[1.5px] border-g200 text-cblack font-semibold py-2.5 rounded-lg hover:bg-mar-l hover:border-mar/30 transition-colors text-sm"
          >
            Download template
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={importCsv} className="hidden" />
        </div>
        <div className="text-xs text-g400">
          Columns: {CSV_HEADERS.join(', ')}
        </div>
      </Section>

      <Section title={`Contacts (${contacts.length})`}>
        {contacts.length === 0 ? (
          <div className="text-sm text-g400 text-center py-4">No contacts yet.</div>
        ) : (
          contacts.map((c) => (
            <div key={c.id} className="bg-[var(--card-2)] rounded-lg p-3 border-[1.5px] border-g200">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-cblack truncate">{c.name}</div>
                  <div className="text-xs text-g500 truncate">
                    {c.company}{c.trade ? ` · ${c.trade}` : ''}
                  </div>
                  <div className="text-xs text-g400 truncate mt-0.5">
                    {c.phone || '—'} · {c.email || '—'}
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-mar bg-mar-l px-2 py-1 rounded shrink-0">
                  {c.preferredChannel === 'both' ? 'Both' : c.preferredChannel === 'email' ? 'Email' : 'Text'}
                </span>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => edit(c)} className="text-xs font-semibold text-mar hover:underline">
                  Edit
                </button>
                <button onClick={() => remove(c)} className="text-xs font-semibold text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-mar text-white font-bold py-3 rounded-lg hover:bg-mar-light transition-colors"
        >
          + Add contact
        </button>
      </Section>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={resetForm}
        >
          <div
            className="bg-[var(--card)] border-2 border-[var(--border)] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-cblack">{editing ? 'Edit contact' : 'Add contact'}</h2>
              <button onClick={resetForm} className="text-g400 hover:text-cblack text-xl">×</button>
            </div>
            {(['name', 'company', 'trade', 'phone', 'email'] as const).map((k) => (
              <input
                key={k}
                placeholder={k.charAt(0).toUpperCase() + k.slice(1)}
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-g200 bg-[var(--card-2)] text-cblack focus:border-mar focus:outline-none"
              />
            ))}
            <select
              value={form.preferredChannel}
              onChange={(e) => setForm({ ...form, preferredChannel: e.target.value as SendPreference })}
              className="w-full px-3 py-2.5 rounded-lg border-[1.5px] border-g200 bg-[var(--card-2)] text-cblack focus:border-mar focus:outline-none"
            >
              <option value="text">Text only</option>
              <option value="email">Email only</option>
              <option value="both">Both (text + email)</option>
            </select>
            <div className="flex gap-2 pt-2">
              <button
                onClick={resetForm}
                className="flex-1 bg-surface-2 text-cblack font-semibold py-2.5 rounded-lg hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveForm}
                className="flex-1 bg-mar text-white font-semibold py-2.5 rounded-lg hover:bg-mar-light transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
