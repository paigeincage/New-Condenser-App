import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const feedbackRouter = Router();

// Record a trade correction
feedbackRouter.post('/', async (req, res) => {
  const { originalText, originalTrade, correctedTrade } = req.body;
  if (!originalText || !originalTrade || !correctedTrade) {
    res.status(400).json({ error: 'originalText, originalTrade, and correctedTrade are required' });
    return;
  }
  const feedback = await prisma.classificationFeedback.create({
    data: { originalText, originalTrade, correctedTrade },
  });
  res.json({ feedback });
});
