import { api } from './client';
import { cacheProjects, cacheItems, getCachedProjects, getCachedProject } from '../db';
import type { Project } from '../types';

export async function listProjects() {
  try {
    const result = await api<{ projects: Project[] }>('/api/projects');
    // Cache for offline use
    cacheProjects(result.projects).catch(() => {});
    return result;
  } catch (err) {
    // Offline fallback
    const cached = await getCachedProjects();
    if (cached.length > 0) return { projects: cached };
    throw err;
  }
}

export async function getProject(id: string) {
  try {
    const result = await api<{ project: Project }>(`/api/projects/${id}`);
    // Cache project and its items
    cacheProjects([result.project]).catch(() => {});
    if (result.project.items) cacheItems(result.project.items).catch(() => {});
    return result;
  } catch (err) {
    // Offline fallback
    const cached = await getCachedProject(id);
    if (cached) return { project: cached };
    throw err;
  }
}

export function createProject(data: { address: string; community?: string; lot?: string; date?: string }) {
  return api<{ project: Project }>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateProject(id: string, data: Partial<Project>) {
  return api<{ project: Project }>(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteProject(id: string) {
  return api<{ ok: boolean }>(`/api/projects/${id}`, { method: 'DELETE' });
}
