import { apiUpload, api } from './client';
import type { SourceFile, ExtractedItem } from '../types';

export function uploadFiles(projectId: string, files: File[], projectFolder?: string) {
  const form = new FormData();
  form.append('projectId', projectId);
  if (projectFolder) form.append('projectFolder', projectFolder);
  for (const f of files) form.append('files', f);
  return apiUpload<{ files: SourceFile[] }>('/api/files/upload', form);
}

export function extractFile(fileId: string) {
  return api<{ fileId: string; fileName: string; itemCount: number; items: ExtractedItem[] }>(
    `/api/extract/${fileId}`,
    { method: 'POST' }
  );
}

export function listFiles(projectId: string) {
  return api<{ files: SourceFile[] }>(`/api/files/project/${projectId}`);
}
