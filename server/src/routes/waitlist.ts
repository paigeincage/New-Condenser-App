import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const waitlistRouter = Router();

// POST /api/waitlist — collect email for founding user waitlist
// This is a PUBLIC endpoint (no auth required)
waitlistRouter.post('/', async (req, res) => {
  const { email, source } = req.body;
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'A valid email is required' });
    return;
  }

  try {
    const entry = await prisma.waitlistEntry.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {},  // If already exists, do nothing (idempotent)
      create: {
        email: email.toLowerCase().trim(),
        source: source || 'founding_user_cta',
      },
    });
    res.json({ ok: true, id: entry.id });
  } catch (err) {
    console.error('[Waitlist] Error:', err);
    res.status(500).json({ error: 'Failed to save email' });
  }
});

// GET /api/waitlist/count — public count for social proof (optional)
waitlistRouter.get('/count', async (_req, res) => {
  const count = await prisma.waitlistEntry.count();
  res.json({ count });
});
