import Dexie, { type Table } from 'dexie';
import type { Project, PunchItem, Contact } from '../types';

export class CondenserDB extends Dexie {
  projects!: Table<Project>;
  items!: Table<PunchItem>;
  contacts!: Table<Contact>;

  constructor() {
    super('CondenserExperimentalDB');
    this.version(1).stores({
      projects: 'id, address, community, status',
      items: 'id, projectId, trade, status',
      contacts: 'id, name, trade',
    });
  }
}

export const db = new CondenserDB();

/** Cache projects from the server into Dexie */
export async function cacheProjects(projects: Project[]) {
  await db.projects.bulkPut(projects);
}

/** Cache items for a project */
export async function cacheItems(items: PunchItem[]) {
  if (!items.length) return;
  await db.items.bulkPut(items);
}

/** Cache contacts */
export async function cacheContacts(contacts: Contact[]) {
  await db.contacts.bulkPut(contacts);
}

/** Get cached projects (offline fallback) */
export async function getCachedProjects(): Promise<Project[]> {
  return db.projects.where('status').equals('active').toArray();
}

/** Get a cached project with its items */
export async function getCachedProject(id: string): Promise<Project | undefined> {
  const project = await db.projects.get(id);
  if (!project) return undefined;
  const items = await db.items.where('projectId').equals(id).toArray();
  return { ...project, items };
}

/** Get cached contacts */
export async function getCachedContacts(): Promise<Contact[]> {
  return db.contacts.orderBy('name').toArray();
}
