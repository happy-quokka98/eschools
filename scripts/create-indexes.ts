import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/";
const dbName = "school";

async function createIndexes() {
  const client = new MongoClient(uri);

  try {
    console.log("🚀 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected successfully.");
    const db = client.db(dbName);

    const targetCollections = ["students", "teachers", "admins", "users", "class", "classes", "subjects"];

    // 1. Unset null user_ID values across all collections
    for (const collName of targetCollections) {
      await db.collection(collName).updateMany({ user_ID: null }, { $unset: { user_ID: "" } });
      // Try to drop existing user_ID index if present so options can be updated
      try {
        await db.collection(collName).dropIndex("user_ID_1");
        console.log(`🧹 Dropped existing user_ID_1 index on '${collName}'`);
      } catch (err) {
        // Index didn't exist or already dropped
      }
    }

    console.log("⚡ Creating indexes on class/classes...");
    await db.collection("class").createIndex({ classname: 1 });
    await db.collection("classes").createIndex({ classname: 1 });

    console.log("⚡ Creating sparse unique indexes on user_ID...");
    await db.collection("students").createIndex({ class_id: 1 });
    await db.collection("students").createIndex({ user_ID: 1 }, { unique: true, sparse: true });
    await db.collection("teachers").createIndex({ user_ID: 1 }, { unique: true, sparse: true });
    await db.collection("admins").createIndex({ user_ID: 1 }, { unique: true, sparse: true });
    await db.collection("users").createIndex({ user_ID: 1 }, { unique: true, sparse: true });

    // Find all grade collections (legacy 'grades' and dynamic 'XXyear' collections)
    const collections = await db.listCollections().toArray();
    const gradeCollections = collections
      .map((c) => c.name)
      .filter((name) => name === "grades" || /^\d{4}year$/.test(name));

    for (const collName of gradeCollections) {
      console.log(`⚡ Creating compound indexes on '${collName}'...`);
      await db.collection(collName).createIndex({ student_id: 1, class_id: 1 });
      await db.collection(collName).createIndex({ class_id: 1, subject_id: 1 });
      await db.collection(collName).createIndex({ student_id: 1, date: 1 });
      await db.collection(collName).createIndex({ teacher_id: 1, date: 1 });
    }

    console.log("✅ All database indexes created successfully!");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
  } finally {
    await client.close();
    console.log("🚀 Connection closed.");
  }
}

createIndexes();

