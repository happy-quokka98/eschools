import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/";

async function testTeacherReset() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  const teachers = await db.collection("teachers").find({}).toArray();
  console.log("Teachers count:", teachers.length);
  if (teachers.length > 0) {
    const t = teachers[0];
    console.log("Testing teacher:", { _id: t._id.toString(), ID: t.ID, user_ID: t.user_ID });
    const defaultPassword = t.ID || t.user_ID || "123456";
    const hashed = await bcrypt.hash(defaultPassword, 10);
    console.log("Hashed password successfully for ID:", defaultPassword);
  }

  await client.close();
}

testTeacherReset();
