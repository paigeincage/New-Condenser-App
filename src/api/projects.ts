import { api } from './client';
import type { Project } from '../types';

export function listProjects() {
  return api<{ projects: Project[] }>('/api/projects');
}

export function getProject(id: string) {
  return api<{ project: Project }>(`/api/projects/${id}`);
}

export function createProject(data: { address: string; community?: string; lot?: string; date?: string; userId: string }) {
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
