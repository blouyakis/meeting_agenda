import { Router } from 'express';
import { requireAuth } from '../utils/auth.js';
import { getDB } from '../config/database.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const db = getDB();
  const items = await db.collection('actionItems')
    .find({ userId: req.userId })
    .sort({ createdAt: 1 })
    .toArray();
  res.json(items.map((i) => i.label));
});

router.post('/', async (req, res) => {
  const { label } = req.body;
  if (!label?.trim()) return res.status(400).json({ error: 'Label required' });
  const db = getDB();
  const exists = await db.collection('actionItems').findOne({ userId: req.userId, label: label.trim() });
  if (exists) return res.status(409).json({ error: 'Already exists' });
  await db.collection('actionItems').insertOne({ userId: req.userId, label: label.trim(), createdAt: new Date() });
  res.status(201).json({ label: label.trim() });
});

export default router;
