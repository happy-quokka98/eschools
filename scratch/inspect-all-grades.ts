import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/?appName=gimnazia";

async function inspectAllGrades() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  const sampleGrades = await db.collection("grades").find({}).limit(20).toArray();

  console.log("Total grades sample count:", sampleGrades.length);
  sampleGrades.forEach(g => {
    console.log("Grade sample:", g);
  });

  await client.close();
}

inspectAllGrades();
