import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:i800rknocMNgOOoS@saqme.xinjxxm.mongodb.net/";
const dbName = "school";

async function createIndexes() {
  const client = new MongoClient(uri);

  try {
    console.log("🚀 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected successfully.");
    const db = client.db(dbName);

    console.log("⚡ Creating indexes on classes...");
    await db.collection("classes").createIndex({ classname: 1 });

    console.log("⚡ Creating indexes on students...");
    await db.collection("students").createIndex({ class_id: 1 });
    await db.collection("students").createIndex({ user_ID: 1 }, { unique: true });

    console.log("⚡ Creating indexes on grades...");
    await db.collection("grades").createIndex({ student_id: 1 });
    await db.collection("grades").createIndex({ class_id: 1 });
    await db.collection("grades").createIndex({ subject_id: 1 });
    await db.collection("grades").createIndex({ teacher_id: 1 });

    console.log("⚡ Creating indexes on teachers...");
    await db.collection("teachers").createIndex({ user_ID: 1 }, { unique: true });

    console.log("⚡ Creating indexes on admins...");
    await db.collection("admins").createIndex({ user_ID: 1 }, { unique: true });

    console.log("⚡ Creating indexes on users...");
    await db.collection("users").createIndex({ user_ID: 1 }, { unique: true });

    console.log("✅ Indexes created successfully!");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
  } finally {
    await client.close();
    console.log("🚀 Connection closed.");
  }
}

createIndexes();
