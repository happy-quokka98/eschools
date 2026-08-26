import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:i800rknocMNgOOoS@saqme.xinjxxm.mongodb.net/";
const dbName = "school";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const admins = db.collection("admins");
    const users = db.collection("users");

    const all = await admins.find({}, { projection: { _id: 1, user_ID: 1 } }).toArray();

    for (const a of all) {
      if (!a.user_ID) {
        console.log(`skip ${a._id}: no user_ID`);
        continue;
      }
      const hashed = await bcrypt.hash(`${a.user_ID}123`, 10);
      const ra = await admins.updateOne({ _id: a._id }, { $set: { password: hashed } });
      const ru = await users.updateOne({ user_ID: a.user_ID }, { $set: { password: hashed } });
      console.log(`${a.user_ID}: admins modified=${ra.modifiedCount}, users modified=${ru.modifiedCount}`);
    }
  } finally {
    await client.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
