import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const authRouter = Router();

const SECRET = process.env.JWT_SECRET || '';
const TOKEN_TTL = '30d';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sign(userId: string): string {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: TOKEN_TTL });
}

function ensureConfigured(res: any): boolean {
  if (!SECRET) {
    res.status(500).json({ error: 'Server auth not configured (JWT_SECRET missing)' });
    return false;
  }
  return true;
}

authRouter.post('/signup', async (req, res) => {
  if (!ensureConfigured(res)) return;
  const { email, password, name } = req.body ?? {};
  if (!email || !EMAIL_RE.test(String(email))) {
    res.status(400).json({ error: 'Valid email required' });
    return;
  }
  if (!password || String(password).length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }
  if (!name || !String(name).trim()) {
    res.status(400).json({ error: 'Name required' });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hash, name: String(name).trim() },
    select: { id: true, email: true, name: true },
  });
  const token = sign(user.id);
  res.json({ token, user });
});

authRouter.post('/login', async (req, res) => {
  if (!ensureConfigured(res)) return;
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = sign(user.id);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true, phone: true, company: true, signOff: true },
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});
