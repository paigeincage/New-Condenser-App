import { api } from './client';
import type { Contact } from '../types';

export function listContacts(search?: string) {
  const q = search ? `?search=${encodeURIComponent(search)}` : '';
  return api<{ contacts: Contact[] }>(`/api/contacts${q}`);
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
