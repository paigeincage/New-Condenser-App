import Dexie, { type Table } from 'dexie';
import type { Project, PunchItem, Contact } from '../types';

export interface Lot {
  id?: number;
  lotBlock: string;
  address: string;
  plan: string;
  elevation: string;
  scarStage: string;
  productType: string;
  fieldContact: string;
  buyer?: string;
  vfdDate: string;
  estFinish: string;
  currentTask: string;
  taskDays: number;
  updatedAt: string;
  notes?: string;
  createdAt: number;
}

export interface EmailRef {
  id?: number;
  lotId?: number;
  trade?: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  flagged: number; // 0 or 1 for indexing
}

export class CondenserDB extends Dexie {
  projects!: Table<Project>;
  items!: Table<PunchItem>;
  contacts!: Table<Contact>;
  lots!: Table<Lot>;
  emails!: Table<EmailRef>;

  constructor() {
    super('CondenserExperimentalDB');
    this.version(2).stores({
      projects: 'id, address, community, status',
      items: 'id, projectId, trade, status',
      contacts: 'id, name, trade',
      lots: '++id, lotBlock, address, scarStage, vfdDate, fieldContact',
      emails: '++id, lotId, trade, date, flagged',
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
