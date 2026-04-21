import { prisma } from './prisma.js';

/**
 * Returns true if the given user owns the given project.
 */
export async function ownsProject(userId: string, projectId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });
  return !!project && project.userId === userId;
}

/**
 * Given a set of projectIds, returns the ones owned by this user. Used to
 * guard bulk operations.
 */
export async function filterOwnedProjectIds(userId: string, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.project.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/**
 * Returns the source-file row if the user owns its parent project; null otherwise.
 */
export async function getOwnedSourceFile(userId: string, fileId: string) {
  const file = await prisma.sourceFile.findUnique({
    where: { id: fileId },
    include: { project: { select: { userId: true } } },
  });
  if (!file || file.project.userId !== userId) return null;
  return file;
}

/**
 * Returns the punch-item row if the user owns its parent project; null otherwise.
 */
export async function getOwnedPunchItem(userId: string, itemId: string) {
  const item = await prisma.punchItem.findUnique({
    where: { id: itemId },
    include: { project: { select: { userId: true } } },
  });
  if (!item || item.project.userId !== userId) return null;
  return item;
}
