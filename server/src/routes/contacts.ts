import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const contactsRouter = Router();

// List all contacts for authenticated user
contactsRouter.get('/', async (req, res) => {
  const userId = req.user!.userId;
  const search = (req.query.search as string) || '';
  const where = search
    ? {
        userId,
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { trade: { contains: search, mode: 'insensitive' as const } },
          { company: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : { userId };
  const contacts = await prisma.contact.findMany({ where, orderBy: { name: 'asc' } });
  res.json({ contacts });
});

// Create contact (auto-assign to authenticated user)
contactsRouter.post('/', async (req, res) => {
  const userId = req.user!.userId;
  const { name, email, phone, company, trade, notes, preferredChannel } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const contact = await prisma.contact.create({
    data: {
      userId,
      name,
      email: email || '',
      phone: phone || '',
      company: company || '',
      trade: trade || '',
      notes: notes || '',
      preferredChannel: preferredChannel || 'email',
    },
  });
  res.json({ contact });
});

// Update contact (verify ownership)
contactsRouter.put('/:id', async (req, res) => {
  const userId = req.user!.userId;
  const existing = await prisma.contact.findFirst({ where: { id: req.params.id, userId } });
  if (!existing) { res.status(404).json({ error: 'Contact not found' }); return; }
  const { name, email, phone, company, trade, notes, preferredChannel, channelOverrideUntil } = req.body;
  const contact = await prisma.contact.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(company !== undefined && { company }),
      ...(trade !== undefined && { trade }),
      ...(notes !== undefined && { notes }),
      ...(preferredChannel !== undefined && { preferredChannel }),
      ...(channelOverrideUntil !== undefined && { channelOverrideUntil: channelOverrideUntil ? new Date(channelOverrideUntil) : null }),
    },
  });
  res.json({ contact });
});

// Delete contact (verify ownership)
contactsRouter.delete('/:id', async (req, res) => {
  const userId = req.user!.userId;
  const existing = await prisma.contact.findFirst({ where: { id: req.params.id, userId } });
  if (!existing) { res.status(404).json({ error: 'Contact not found' }); return; }
  await prisma.contact.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
