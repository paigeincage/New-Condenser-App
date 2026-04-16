import { useEffect, useState } from 'react';
import { listContacts, createContact, updateContact, deleteContact } from '../api/contacts';
import { TopBar } from '../components/layout/TopBar';
import { ImportModal } from '../components/contacts/ImportModal';
import { useUI } from '../stores/ui';
import type { Contact } from '../types';

export function Contacts() {
  const addToast = useUI((s) => s.addToast);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; phone: string; company: string; trade: string; preferredChannel: 'email' | 'text' }>({ name: '', email: '', phone: '', company: '', trade: '', preferredChannel: 'email' });

  const load = () => {
    listContacts(search || undefined).then((r) => setContacts(r.contacts)).catch(() => {});
  };

  useEffect(load, [search]);

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', company: '', trade: '', preferredChannel: 'email' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSave = async () => {
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

  const handleEdit = (c: Contact) => {
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      trade: c.trade,
      preferredChannel: c.preferredChannel,
    });
    setEditing(c);
    setShowForm(true);
  };

  const handleDelete = async (c: Contact) => {
    try {
      await deleteContact(c.id);
      addToast('Contact deleted', 'success');
      load();
    } catch (err) {
      addToast(String(err), 'error');
    }
  };

  return (
    <div>
      <TopBar
        title="Contacts"
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="border border-mar text-mar text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-mar hover:text-white transition-colors"
            >
              Import
            </button>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-mar text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-mar-light transition-colors"
            >
              + Add
            </button>
          </div>
        }
      />

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search contacts..."
        className="w-full px-4 py-2.5 border border-g200 rounded-xl text-sm text-g700 focus:outline-none focus:border-mar mb-4"
      />

      {/* Form */}
      {showForm && (
        <div className="bg-surface rounded-xl p-4 mb-4 space-y-3">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name *"
            className="w-full px-3 py-2.5 border border-g200 rounded-lg text-sm focus:outline-none focus:border-mar"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="px-3 py-2.5 border border-g200 rounded-lg text-sm focus:outline-none focus:border-mar"
            />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone"
              className="px-3 py-2.5 border border-g200 rounded-lg text-sm focus:outline-none focus:border-mar"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Company"
              className="px-3 py-2.5 border border-g200 rounded-lg text-sm focus:outline-none focus:border-mar"
            />
            <input
              type="text"
              value={form.trade}
              onChange={(e) => setForm({ ...form, trade: e.target.value })}
              placeholder="Trade"
              className="px-3 py-2.5 border border-g200 rounded-lg text-sm focus:outline-none focus:border-mar"
            />
          </div>

          {/* Channel preference */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-g600">Preferred:</span>
            <button
              onClick={() => setForm({ ...form, preferredChannel: 'email' })}
              className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                form.preferredChannel === 'email' ? 'bg-mar text-white' : 'bg-white border border-g200 text-g600'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setForm({ ...form, preferredChannel: 'text' })}
              className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                form.preferredChannel === 'text' ? 'bg-mar text-white' : 'bg-white border border-g200 text-g600'
              }`}
            >
              Text
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={resetForm} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-g600 bg-white border border-g200">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-mar hover:bg-mar-light disabled:opacity-40 transition-colors"
            >
              {editing ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {contacts.length === 0 ? (
          <p className="text-center text-g400 text-sm py-8">No contacts yet</p>
        ) : (
          contacts.map((c) => (
            <div key={c.id} className="bg-white border border-g100 rounded-xl p-4 hover:border-mar/20 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-g700">{c.name}</p>
                  <p className="text-sm text-g400">{c.company}{c.trade ? ` · ${c.trade}` : ''}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {c.email && <span className="text-xs text-g400">{c.email}</span>}
                    {c.phone && <span className="text-xs text-g400">{c.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.preferredChannel === 'text' ? 'bg-blue-100 text-blue-700' : 'bg-surface text-g500'
                  }`}>
                    {c.preferredChannel}
                  </span>
                  <button onClick={() => handleEdit(c)} className="text-g400 hover:text-mar p-1" title="Edit">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(c)} className="text-g400 hover:text-red-500 p-1" title="Delete">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Import Modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={load}
        />
      )}
    </div>
  );
}
