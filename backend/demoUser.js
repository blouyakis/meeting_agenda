// backend/demoUser.js
// Generated with assistance from Claude Sonnet 4.6 (Anthropic)
// https://claude.ai — June 2026
//
// Hybrid seed script — imports Mockaroo-generated employees.json,
// creates a demo user, and generates 20 sample meetings with attendees.
//
// Run with: node backend/demoUser.js
// Requires: backend/employees.json downloaded from Mockaroo
//
// Demo login after running:
//   Email:    demo@neu.edu
//   Password: Northeastern

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const DEMO_EMAIL = 'demo@neu.edu';
const DEMO_PASSWORD = 'Northeastern';

const meetingTitles = [
  'Q3 Planning Session', 'Weekly Standup', 'Product Roadmap Review',
  'Budget Review', 'Team Retrospective', 'All Hands Meeting',
  'Sprint Planning', 'Department Sync', 'Strategy Session', 'Client Review',
  'Onboarding Meeting', 'Performance Reviews', 'Annual Planning', 'OKR Review',
  'Design Critique', 'Sales Pipeline Review', 'Engineering Sync', 'HR Update',
  'Marketing Campaign Review', 'Operations Check-in',
];

const topicTexts = [
  'Review project status', 'Discuss budget allocation', 'Team updates',
  'Customer feedback review', 'Roadmap priorities', 'Hiring updates',
  'Quarterly goals', 'Process improvements', 'Risk assessment',
  'Action item review', 'Upcoming deadlines', 'Resource planning',
];

const locations = [
  'Conference Room A', 'Conference Room B', 'Main Boardroom',
  'Zoom', 'Google Meet', 'Teams Call', 'Office 201',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDatetime(daysOffset = 0) {
  const base = new Date();
  base.setDate(base.getDate() + daysOffset);
  base.setHours(8 + Math.floor(Math.random() * 9));
  base.setMinutes(pick([0, 15, 30, 45]));
  base.setSeconds(0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}T${pad(base.getHours())}:${pad(base.getMinutes())}`;
}

async function seed() {
  // ── connect ───────────────────────────────────────────────────────────────
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  console.log(`Connected to: ${process.env.DB_NAME}`);

  // ── clear previous seed data ──────────────────────────────────────────────
  await db.collection('users').deleteMany({ email: DEMO_EMAIL });
  await db.collection('employees').deleteMany({ seeded: true });
  await db.collection('meetings').deleteMany({ seeded: true });
  console.log('Cleared existing seed data');

  // ── create demo user ──────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const userResult = await db.collection('users').insertOne({
    email: DEMO_EMAIL,
    passwordHash,
    createdAt: new Date(),
  });
  const userId = userResult.insertedId.toString();
  console.log(`Demo user created: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  // ── import Mockaroo employees ─────────────────────────────────────────────
  // Mockaroo exports first_name and last_name with underscores —
  // map them to firstName and lastName to match your employeeModel.js
  let raw;
  try {
    raw = readFileSync('./backend/employees.json', 'utf-8');
  } catch {
    console.error('ERROR: backend/employees.json not found.');
    console.error('Download it from Mockaroo and place it in your backend/ folder.');
    await client.close();
    process.exit(1);
  }

  const mockarooData = JSON.parse(raw);
  const employees = mockarooData.map((e) => ({
    userId,
    firstName: e.first_name,   // Mockaroo uses snake_case
    lastName: e.last_name,     // Mockaroo uses snake_case
    email: e.email || '',
    phone: e.phone || '',
    department: e.department || '',
    seeded: true,
  }));

  const empResult = await db.collection('employees').insertMany(employees);
  console.log(`Inserted ${employees.length} employees from Mockaroo`);

  // ── generate 20 meetings using real employee IDs ──────────────────────────
  const allEmployeeIds = Object.values(empResult.insertedIds).map((id) => id.toString());

  const meetings = Array.from({ length: 20 }, (_, i) => {
    const startTime = randomDatetime(i - 10);
    const [datePart, timePart] = startTime.split('T');
    const endHour = String(parseInt(timePart.split(':')[0]) + 1).padStart(2, '0');
    const endTime = `${datePart}T${endHour}:${timePart.split(':')[1]}`;

    const shuffled = [...allEmployeeIds].sort(() => Math.random() - 0.5);
    const attendeeIds = shuffled.slice(0, Math.floor(Math.random() * 6) + 3);

    const topicCount = Math.floor(Math.random() * 4) + 2;
    const topics = Array.from({ length: topicCount }, () => ({
      text: pick(topicTexts),
      priority: Math.floor(Math.random() * 3) + 1,
      notes: '',
      actionItems: [],
    }));

    return {
      userId,
      title: pick(meetingTitles),
      location: pick(locations),
      startTime,
      endTime,
      topics,
      attendeeIds,
      createdAt: new Date(),
      seeded: true,
    };
  });

  await db.collection('meetings').insertMany(meetings);
  console.log(`Inserted ${meetings.length} meetings`);

  // ── summary ───────────────────────────────────────────────────────────────
  const empCount = await db.collection('employees').countDocuments();
  const meetCount = await db.collection('meetings').countDocuments();
  const userCount = await db.collection('users').countDocuments();

  console.log('\n── Database summary ──────────────────────');
  console.log(`  users:     ${userCount}`);
  console.log(`  employees: ${empCount}`);
  console.log(`  meetings:  ${meetCount}`);
  console.log(`  total:     ${empCount + meetCount + userCount}`);
  console.log('\nSeed complete. Share these credentials:');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);

  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});