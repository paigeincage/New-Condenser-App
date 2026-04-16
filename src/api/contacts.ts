import { api } from './client';
import { cacheContacts, getCachedContacts } from '../db';
import type { Contact } from '../types';

export async function listContacts(search?: string) {
  const q = search ? `?search=${encodeURIComponent(search)}` : '';
  try {
    const result = await api<{ contacts: Contact[] }>(`/api/contacts${q}`);
    if (!search) cacheContacts(result.contacts).catch(() => {});
    return result;
  } catch (err) {
    const cached = await getCachedContacts();
    if (cached.length > 0) {
      const filtered = search
        ? cached.filter((c) => {
            const s = search.toLowerCase();
            return c.name.toLowerCase().includes(s) || c.trade.toLowerCase().includes(s) || c.company.toLowerCase().includes(s);
          })
        : cached;
      return { contacts: filtered };
    }
    throw err;
  }
}

export function createContact(data: Partial<Contact>) {
  return api<{ contact: Contact }>('/api/contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateContact(id: string, data: Partial<Contact>) {
  return api<{ contact: Contact }>(`/api/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteContact(id: string) {
  return api<{ ok: boolean }>(`/api/contacts/${id}`, { method: 'DELETE' });
}
