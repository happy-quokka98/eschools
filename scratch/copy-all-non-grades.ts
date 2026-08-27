import { MongoClient } from "mongodb";

const OLD_URI = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/school";
const NEW_URI = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/school?appName=gimnazia";

async function copyAllNonGrades() {
  console.log("🚀 Starting complete non-grade database sync...");

  const oldClient = new MongoClient(OLD_URI);
  const newClient = new MongoClient(NEW_URI);

  await oldClient.connect();
  await newClient.connect();

  const oldDb = oldClient.db("school");
  const newDb = newClient.db("school");

  const targetCollections = [
    'class',
    'classes',
    'users',
    'admins',
    '2526year',
    'students',
    'teachers',
    'subjects',
    'messages',
    'calendar_events',
    'settings',
    'announcements',
    'assignments',
    'ped_meetings',
    'assignment_submissions',
    'schools'
  ];

  // Reset grades to empty
  try { await newDb.collection("grades").drop(); } catch {}
  await newDb.createCollection("grades");
  console.log("✅ 'grades' collection created (empty).");

  for (const collName of targetCollections) {
    try { await newDb.collection(collName).drop(); } catch {}

    const count = await oldDb.collection(collName).countDocuments();
    console.log(`\n📦 Syncing collection '${collName}' (${count} docs)...`);

    if (count === 0) {
      await newDb.createCollection(collName);
      console.log(`  ✅ Created empty '${collName}'.`);
      continue;
    }

    const cursor = oldDb.collection(collName).find({});
    let batch: any[] = [];
    let synced = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (doc) batch.push(doc);

      if (batch.length >= 250) {
        await newDb.collection(collName).insertMany(batch, { ordered: false });
        synced += batch.length;
        console.log(`  Synced ${synced} / ${count} docs into '${collName}'...`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await newDb.collection(collName).insertMany(batch, { ordered: false });
      synced += batch.length;
      console.log(`  Synced ${synced} / ${count} docs into '${collName}'...`);
    }

    console.log(`  ✅ Successfully synced '${collName}' (${synced} docs).`);
  }

  console.log("\n⚡ Creating Indexes...");
  const indexedColls = ["students", "teachers", "admins", "users", "class", "classes", "subjects"];
  for (const collName of indexedColls) {
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
    await newDb.collection(gc).createIndex({ student_id: 1, class_id: 1, subject_id: 1, date: 1 });
    await newDb.collection(gc).createIndex({ class_id: 1, subject_id: 1, date: 1 });
    await newDb.collection(gc).createIndex({ student_id: 1, date: 1 });
    await newDb.collection(gc).createIndex({ teacher_id: 1, date: 1 });
  }

  console.log("\n📊 VERIFYING GIMNAZIA DATABASE COLLECTIONS:");
  const finalColls = await newDb.listCollections().toArray();
  for (const fc of finalColls) {
    const docCount = await newDb.collection(fc.name).countDocuments();
    console.log(` - ${fc.name}: ${docCount} documents`);
  }

  console.log("\n🎉 ALL NON-GRADE COLLECTIONS & INDEXES SUCCESSFULLY SEEDED TO GIMNAZIA!");
  await oldClient.close();
  await newClient.close();
}

copyAllNonGrades().catch(console.error);
