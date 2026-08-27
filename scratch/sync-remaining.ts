import { MongoClient } from "mongodb";

const OLD_URI = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/school";
const NEW_URI = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/school?appName=gimnazia";

async function syncRemaining() {
  console.log("🚀 Syncing remaining collections...");
  const oldClient = new MongoClient(OLD_URI);
  const newClient = new MongoClient(NEW_URI);

  await oldClient.connect();
  await newClient.connect();

  const oldDb = oldClient.db("school");
  const newDb = newClient.db("school");

  const collectionsToSync = [
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

  for (const name of collectionsToSync) {
    console.log(`Processing '${name}'...`);
    try { await newDb.collection(name).drop(); } catch {}

    const docs = await oldDb.collection(name).find({}).toArray();
    console.log(`  Found ${docs.length} docs in old '${name}'.`);

    if (docs.length > 0) {
      try {
        await newDb.collection(name).insertMany(docs, { ordered: false });
        console.log(`  ✅ Inserted ${docs.length} docs into '${name}'.`);
      } catch (err: any) {
        console.log(`  ⚠️ Insert warning on '${name}':`, err.message);
      }
    } else {
      await newDb.createCollection(name);
      console.log(`  ✅ Created empty '${name}'.`);
    }
  }

  console.log("\n⚡ Creating Indexes...");
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
    await newDb.collection(gc).createIndex({ student_id: 1, class_id: 1, subject_id: 1, date: 1 });
    await newDb.collection(gc).createIndex({ class_id: 1, subject_id: 1, date: 1 });
    await newDb.collection(gc).createIndex({ student_id: 1, date: 1 });
    await newDb.collection(gc).createIndex({ teacher_id: 1, date: 1 });
  }

  console.log("\n📊 FULL GIMNAZIA DATABASE STATUS:");
  const finalColls = await newDb.listCollections().toArray();
  for (const fc of finalColls) {
    const docCount = await newDb.collection(fc.name).countDocuments();
    console.log(` - Collection '${fc.name}': ${docCount} docs`);
  }

  console.log("\n🎉 ALL NON-GRADE DATA & INDEXES FULLY SEEDED!");
  await oldClient.close();
  await newClient.close();
}

syncRemaining().catch(console.error);
