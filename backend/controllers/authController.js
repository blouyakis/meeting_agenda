import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../config/database.js';
import { createUser } from '../models/userModel.js';

export async function register(req, res) {
  const { email, password } = req.body;
  const db = getDB();
  const existing = await db.collection('users').findOne({ email });
  if (existing) return res.status(400).json({ error: 'Email already registered' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({ email, passwordHash });
  await db.collection('users').insertOne(user);
  res.status(201).json({ message: 'Account created' });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const db = getDB();
  const user = await db.collection('users').findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
}
