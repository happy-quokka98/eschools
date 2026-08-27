import { MongoClient } from "mongodb";

const OLD_URI = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/school";

async function testStudents() {
  const client = new MongoClient(OLD_URI);
  await client.connect();
  const db = client.db("school");
  const count = await db.collection("students").countDocuments();
  console.log("Students total count:", count);
  const sample = await db.collection("students").find({}).limit(3).toArray();
  console.log("Sample student 1:", JSON.stringify(sample[0]).slice(0, 300));
  await client.close();
}

testStudents().catch(console.error);
