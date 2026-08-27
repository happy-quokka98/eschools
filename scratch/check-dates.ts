import { MongoClient } from 'mongodb';

async function main() {
  const client = new MongoClient('mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/?appName=gimnazia');
  await client.connect();
  const db = client.db('school');

  const c2425 = await db.collection('grades').countDocuments({ date: { $gte: '2024-09-01', $lt: '2025-07-01' } });
  const c2526 = await db.collection('grades').countDocuments({ date: { $gte: '2025-09-01', $lt: '2026-07-01' } });
  const latestGrades = await db.collection('grades').find().sort({ date: -1 }).limit(10).toArray();

  console.log('2024-2025 grade count:', c2425);
  console.log('2025-2026 grade count:', c2526);
  console.log('Latest 10 grade dates:', latestGrades.map(g => ({ date: g.date, point: g.point })));

  await client.close();
}

main().catch(console.error);
