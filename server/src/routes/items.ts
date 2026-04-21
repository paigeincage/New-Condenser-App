import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { filterOwnedProjectIds, getOwnedPunchItem } from '../lib/ownership.js';

export const itemsRouter = Router();

// Create items (bulk — used after extraction review)
itemsRouter.post('/bulk', async (req, res) => {
  const { items } = req.body as {
    items: {
      projectId: string;
      text: string;
      trade?: string;
      priority?: string;
      source?: string;
      sourceFileId?: string;
      location?: string;
      assignee?: string;
    }[];
  };

  if (!items || !items.length) {
    res.status(400).json({ error: 'items array is required' });
    return;
  }

  const projectIds = [...new Set(items.map((i) => i.projectId))];
  const ownedIds = new Set(await filterOwnedProjectIds(req.userId!, projectIds));
  const rejectedCount = projectIds.filter((id) => !ownedIds.has(id)).length;
  if (rejectedCount > 0) {
    res.status(403).json({ error: 'Some items reference projects you do not own' });
    return;
  }

  const created = await prisma.punchItem.createMany({
    data: items.map((item) => ({
      projectId: item.projectId,
      text: item.text,
      trade: item.trade || 'Uncategorized',
      priority: item.priority || 'normal',
      source: item.source || 'Manual',
      sourceFileId: item.sourceFileId || null,
      location: item.location || '',
      assignee: item.assignee || '',
    })),
  });

  // Update extracted item count on source files
  const fileIds = [...new Set(items.filter((i) => i.sourceFileId).map((i) => i.sourceFileId!))];
  for (const fileId of fileIds) {
    const count = items.filter((i) => i.sourceFileId === fileId).length;
    await prisma.sourceFile.update({
      where: { id: fileId },
      data: { extractedItemCount: { increment: count } },
    });
  }

  res.json({ count: created.count });
});

// Update single item (ownership-checked via project)
itemsRouter.patch('/:id', async (req, res) => {
  const owned = await getOwnedPunchItem(req.userId!, req.params.id);
  if (!owned) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  const { text, trade, assignee, status, priority, notes, location } = req.body;
  const item = await prisma.punchItem.update({
    where: { id: req.params.id },
    data: {
      ...(text !== undefined && { text }),
      ...(trade !== undefined && { trade }),
      ...(assignee !== undefined && { assignee }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(notes !== undefined && { notes }),
      ...(location !== undefined && { location }),
    },
  });
  res.json({ item });
});

// Delete item (ownership-checked)
itemsRouter.delete('/:id', async (req, res) => {
  const owned = await getOwnedPunchItem(req.userId!, req.params.id);
  if (!owned) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  await prisma.punchItem.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
