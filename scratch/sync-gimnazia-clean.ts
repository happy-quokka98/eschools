import { MongoClient } from "mongodb";

const OLD_URI = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/school";
const NEW_URI = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/school?appName=gimnazia";

const options = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 5,
};

async function syncGimnaziaClean() {
  console.log("🚀 Starting resilient non-grade database sync...");
  let oldClient: MongoClient | null = null;
  let newClient: MongoClient | null = null;

  try {
    oldClient = new MongoClient(OLD_URI, options);
    newClient = new MongoClient(NEW_URI, options);

    await oldClient.connect();
    await newClient.connect();
    console.log("✅ Connected successfully to both clusters.");

    const oldDb = oldClient.db("school");
    const newDb = newClient.db("school");

    const nonGradeCollections = [
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

    // Ensure empty grades collection
    try { await newDb.collection("grades").drop(); } catch {}
    await newDb.createCollection("grades");
    console.log("✅ 'grades' collection initialized (empty).");

    for (const name of nonGradeCollections) {
      console.log(`\nProcessing '${name}'...`);
      try { await newDb.collection(name).drop(); } catch {}

      const count = await oldDb.collection(name).countDocuments();
      if (count === 0) {
        await newDb.createCollection(name);
        console.log(`  ✅ '${name}' created (0 docs).`);
        continue;
      }

      const docs = await oldDb.collection(name).find({}).toArray();
      await newDb.collection(name).insertMany(docs, { ordered: false });
      console.log(`  ✅ '${name}' copied (${docs.length} docs).`);
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

    console.log("\n📊 FULL GIMNAZIA DATABASE SUMMARY:");
    const finalColls = await newDb.listCollections().toArray();
    for (const fc of finalColls) {
      const docCount = await newDb.collection(fc.name).countDocuments();
      console.log(` - Collection '${fc.name}': ${docCount} documents`);
    }

    console.log("\n🎉 ALL NON-GRADE COLLECTIONS & INDEXES FULLY CREATED!");
  } catch (err: any) {
    console.error("❌ Sync Error:", err);
  } finally {
    if (oldClient) await oldClient.close();
    if (newClient) await newClient.close();
  }
}

syncGimnaziaClean();
