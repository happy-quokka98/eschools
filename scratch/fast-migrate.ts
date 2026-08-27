import { MongoClient } from "mongodb";

const OLD_URI = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/school";
const NEW_URI = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/school?appName=gimnazia";

async function fastMigrate() {
  console.log("🚀 Starting fast migration...");
  const oldClient = new MongoClient(OLD_URI);
  const newClient = new MongoClient(NEW_URI);

  await oldClient.connect();
  await newClient.connect();

  const oldDb = oldClient.db("school");
  const newDb = newClient.db("school");

  const colls = await oldDb.listCollections().toArray();

  for (const c of colls) {
    const name = c.name;
    const count = await oldDb.collection(name).countDocuments();
    if (count === 0) continue;

    console.log(`\nProcessing '${name}' (${count} docs)...`);
    
    // Clear destination
    try {
      await newDb.collection(name).drop();
    } catch {}

    const BATCH_SIZE = 10000;
    let processed = 0;

    if (count <= BATCH_SIZE) {
      const docs = await oldDb.collection(name).find({}).toArray();
      if (docs.length > 0) {
        await newDb.collection(name).insertMany(docs, { ordered: false });
      }
      processed = docs.length;
      console.log(`  ✅ '${name}' done: ${processed}/${count}`);
    } else {
      // Chunked by batchSize cursor stream
      const cursor = oldDb.collection(name).find({}).batchSize(BATCH_SIZE);
      let batch: any[] = [];
      
      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        if (doc) batch.push(doc);
        
        if (batch.length >= BATCH_SIZE) {
          await newDb.collection(name).insertMany(batch, { ordered: false });
          processed += batch.length;
          console.log(`  Progress '${name}': ${processed}/${count}`);
          batch = [];
        }
      }

      if (batch.length > 0) {
        await newDb.collection(name).insertMany(batch, { ordered: false });
        processed += batch.length;
        console.log(`  Progress '${name}': ${processed}/${count}`);
      }
      console.log(`  ✅ '${name}' complete!`);
    }
  }

  console.log("\n⚡ Creating Indexes...");
  await newDb.collection("students").createIndex({ class_id: 1 });
  await newDb.collection("students").createIndex({ user_ID: 1 }, { unique: true, sparse: true });
  await newDb.collection("teachers").createIndex({ user_ID: 1 }, { unique: true, sparse: true });
  await newDb.collection("admins").createIndex({ user_ID: 1 }, { unique: true, sparse: true });
  await newDb.collection("users").createIndex({ user_ID: 1 }, { unique: true, sparse: true });
  await newDb.collection("class").createIndex({ classname: 1 });

  const yearColls = (await newDb.listCollections().toArray())
    .map(c => c.name)
    .filter(n => n === "grades" || /^\d{4}year$/.test(n));

  for (const yc of yearColls) {
    await newDb.collection(yc).createIndex({ student_id: 1, class_id: 1, subject_id: 1, date: 1 });
    await newDb.collection(yc).createIndex({ class_id: 1, subject_id: 1, date: 1 });
    await newDb.collection(yc).createIndex({ student_id: 1, date: 1 });
    await newDb.collection(yc).createIndex({ teacher_id: 1, date: 1 });
  }

  console.log("🎉 Fast migration completed successfully!");
  await oldClient.close();
  await newClient.close();
}

fastMigrate().catch(console.error);
