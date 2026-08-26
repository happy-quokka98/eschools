import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/";

async function inspectYearCollections() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  const collections = await db.listCollections().toArray();
  console.log("All collection names:", collections.map(c => c.name));

  for (const c of collections) {
    if (c.name.includes("year")) {
      const count = await db.collection(c.name).countDocuments();
      console.log(`Collection ${c.name} has ${count} documents`);
      const sample = await db.collection(c.name).find({
        $or: [
          { is_formative: true },
          { comment: { $exists: true, $ne: "" } },
          { point: "განმავითარებელი" },
          { point: { $type: "string" } }
        ]
      }).limit(5).toArray();
      console.log(`Sample formative from ${c.name}:`, sample);
    }
  }

  await client.close();
}

inspectYearCollections();
