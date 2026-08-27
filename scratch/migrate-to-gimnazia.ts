import { MongoClient } from "mongodb";

const OLD_URI = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/school";
const NEW_URI = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/school?appName=gimnazia";

async function migrateData() {
  console.log("🚀 Starting data migration to new cluster (gimnazia)...");

  const oldClient = new MongoClient(OLD_URI);
  const newClient = new MongoClient(NEW_URI);

  try {
    await oldClient.connect();
    await newClient.connect();
    console.log("✅ Connected to both MongoDB clusters.");

    const oldDb = oldClient.db("school");
    const newDb = newClient.db("school");

    const collections = await oldDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections in old cluster.`);

    for (const collInfo of collections) {
      const collName = collInfo.name;
      const totalDocs = await oldDb.collection(collName).countDocuments();
      console.log(`\n📦 Processing collection '${collName}' (${totalDocs} documents)...`);

      if (totalDocs === 0) {
        console.log(`Skipping empty collection '${collName}'.`);
        continue;
      }

      // Drop target collection if it exists in new DB to avoid duplicate key conflicts during initial migration
      try {
        await newDb.collection(collName).drop();
        console.log(`  Cleared target collection '${collName}'.`);
      } catch (e) {
        // Collection didn't exist yet, ignore
      }

      const cursor = oldDb.collection(collName).find({});
      const BATCH_SIZE = 5000;
      let batch: any[] = [];
      let migratedCount = 0;

      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        if (doc) {
          batch.push(doc);
        }

        if (batch.length >= BATCH_SIZE) {
          await newDb.collection(collName).insertMany(batch, { ordered: false });
          migratedCount += batch.length;
          console.log(`  Migrated ${migratedCount} / ${totalDocs} documents into '${collName}'...`);
          batch = [];
        }
      }

      if (batch.length > 0) {
        await newDb.collection(collName).insertMany(batch, { ordered: false });
        migratedCount += batch.length;
        console.log(`  Migrated ${migratedCount} / ${totalDocs} documents into '${collName}'...`);
      }

      console.log(`✅ Collection '${collName}' migration complete! Total: ${migratedCount}`);
    }

    console.log("\n⚡ Creating database indexes on new cluster...");
    // 1. Sparse unique indexes
    await newDb.collection("students").createIndex({ class_id: 1 });
    await newDb.collection("students").createIndex({ user_ID: 1 }, { unique: true, sparse: true });
    await newDb.collection("teachers").createIndex({ user_ID: 1 }, { unique: true, sparse: true });
    await newDb.collection("admins").createIndex({ user_ID: 1 }, { unique: true, sparse: true });
    await newDb.collection("users").createIndex({ user_ID: 1 }, { unique: true, sparse: true });
    await newDb.collection("class").createIndex({ classname: 1 });

    // 2. Grade compound indexes
    const newCollections = await newDb.listCollections().toArray();
    const gradeColls = newCollections
      .map(c => c.name)
      .filter(name => name === "grades" || /^\d{4}year$/.test(name));

    for (const gColl of gradeColls) {
      console.log(`  Creating compound indexes on '${gColl}'...`);
      await newDb.collection(gColl).createIndex({ student_id: 1, class_id: 1, subject_id: 1, date: 1, lesson_num: 1 });
      await newDb.collection(gColl).createIndex({ class_id: 1, subject_id: 1, date: 1 });
      await newDb.collection(gColl).createIndex({ student_id: 1, date: 1 });
      await newDb.collection(gColl).createIndex({ teacher_id: 1, date: 1 });
    }

    console.log("\n🎉 ALL DATA AND INDEXES SUCCESSFULLY MIGRATED TO GIMNAZIA CLUSTER!");
  } catch (error) {
    console.error("❌ Migration error:", error);
  } finally {
    await oldClient.close();
    await newClient.close();
    console.log("Connections closed.");
  }
}

migrateData();
