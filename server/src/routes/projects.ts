import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const projectsRouter = Router();

// List projects (scoped to current user)
projectsRouter.get('/', async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { items: true, files: true } },
      items: { select: { status: true } },
    },
  });

  const result = projects.map((p) => {
    const statusCounts = { pending: 0, wip: 0, done: 0 };
    for (const item of p.items) {
      if (item.status in statusCounts) statusCounts[item.status as keyof typeof statusCounts]++;
    }
    const { items: _items, ...rest } = p;
    return { ...rest, statusCounts };
  });

  res.json({ projects: result });
});

// Get single project (ownership-checked)
projectsRouter.get('/:id', async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: {
      items: { orderBy: [{ trade: 'asc' }, { createdAt: 'asc' }], include: { tradeSteps: true } },
      files: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json({ project });
});

// Create project
projectsRouter.post('/', async (req, res) => {
  const { address, community, lot, date } = req.body;
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (!address) {
    res.status(400).json({ error: 'address is required' });
    return;
  }
  const project = await prisma.project.create({
    data: { address, community: community || '', lot: lot || '', date: date || '', userId },
  });
  res.json({ project });
});

// Update project (ownership-checked)
projectsRouter.patch('/:id', async (req, res) => {
  const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.userId) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  const { address, community, lot, date, status } = req.body;
  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: {
      ...(address !== undefined && { address }),
      ...(community !== undefined && { community }),
      ...(lot !== undefined && { lot }),
      ...(date !== undefined && { date }),
      ...(status !== undefined && { status }),
    },
  });
  res.json({ project });
});

// Delete project (ownership-checked)
projectsRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.userId) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
