import { MongoClient } from "mongodb";

const OLD_URI = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/school";
const NEW_URI = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/school?appName=gimnazia";

async function seedWithoutGrades() {
  console.log("🚀 Starting fast schema & data seeding to gimnazia (excluding 'grades')...\n");
  const oldClient = new MongoClient(OLD_URI);
  const newClient = new MongoClient(NEW_URI);

  await oldClient.connect();
  await newClient.connect();

  const oldDb = oldClient.db("school");
  const newDb = newClient.db("school");

  const collectionsToCopy = [
    'class',
    'classes',
    'users',
    'admins',
    '2526year',
    'students',
    'settings',
    'announcements',
    'messages',
    'teachers',
    'assignments',
    'ped_meetings',
    'assignment_submissions',
    'subjects',
    'calendar_events',
    'schools'
  ];

  // 1. Reset / Create empty 'grades' collection
  try { await newDb.collection("grades").drop(); } catch {}
  await newDb.createCollection("grades");
  console.log("✅ Created empty 'grades' collection.");

  // 2. Copy all non-grade collections in 500-doc batches
  for (const name of collectionsToCopy) {
    try { await newDb.collection(name).drop(); } catch {}

    const count = await oldDb.collection(name).countDocuments();
    if (count === 0) {
      await newDb.createCollection(name);
      console.log(`✅ Collection '${name}' created (0 docs).`);
      continue;
    }

    const docs = await oldDb.collection(name).find({}).toArray();
    const BATCH_SIZE = 500;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const chunk = docs.slice(i, i + BATCH_SIZE);
      await newDb.collection(name).insertMany(chunk, { ordered: false });
    }
    console.log(`✅ Collection '${name}' synced (${docs.length} docs).`);
  }

  console.log("\n⚡ Creating all indexes on new cluster...");

  // Clean null user_IDs
  const targetCollections = ["students", "teachers", "admins", "users", "class", "classes", "subjects"];
  for (const collName of targetCollections) {
    await newDb.collection(collName).updateMany({ user_ID: null }, { $unset: { user_ID: "" } });
    try { await newDb.collection(collName).dropIndex("user_ID_1"); } catch {}
  }

  await newDb.collection("class").createIndex({ classname: 1 });
  await newDb.collection("classes").createIndex({ classname: 1 });

  await newDb.collection("students").createIndex({ class_id: 1 });
  await newDb.collection("students").createIndex({ user_ID: 1 }, { unique: true, sparse: true });
  await newDb.collection("teachers").createIndex({ user_ID: 1 }, { unique: true, sparse: true });
  await newDb.collection("admins").createIndex({ user_ID: 1 }, { unique: true, sparse: true });
  await newDb.collection("users").createIndex({ user_ID: 1 }, { unique: true, sparse: true });

  const yearColls = (await newDb.listCollections().toArray())
    .map(c => c.name)
    .filter(n => n === "grades" || /^\d{4}year$/.test(n));

  for (const gc of yearColls) {
    await newDb.collection(gc).createIndex({ student_id: 1, class_id: 1, subject_id: 1, date: 1, lesson_num: 1 });
    await newDb.collection(gc).createIndex({ class_id: 1, subject_id: 1, date: 1 });
    await newDb.collection(gc).createIndex({ student_id: 1, date: 1 });
    await newDb.collection(gc).createIndex({ teacher_id: 1, date: 1 });
  }

  console.log("\n📊 VERIFICATION OF GIMNAZIA CLUSTER COLLECTIONS:");
  const finalColls = await newDb.listCollections().toArray();
  for (const fc of finalColls) {
    const docCount = await newDb.collection(fc.name).countDocuments();
    console.log(` - Collection '${fc.name}': ${docCount} docs`);
  }

  console.log("\n🎉 ALL COLLECTIONS AND INDEXES SUCCESSFULLY SEEDED!");
  await oldClient.close();
  await newClient.close();
}

seedWithoutGrades().catch(console.error);
