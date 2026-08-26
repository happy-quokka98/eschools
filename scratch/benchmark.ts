import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/";

async function benchmark() {
  const client = new MongoClient(uri);
  const start = Date.now();
  await client.connect();
  console.log(`Connected in ${Date.now() - start}ms`);
  const db = client.db("school");

  const t1 = Date.now();
  const studentsWithPoints = await db.collection("students").find({}, { projection: { password: 0 } }).toArray();
  console.log(`Full students count: ${studentsWithPoints.length}, fetched in ${Date.now() - t1}ms`);

  const t2 = Date.now();
  const studentsLite = await db.collection("students").find({}, { projection: { password: 0, points: 0 } }).toArray();
  console.log(`Lite students count: ${studentsLite.length}, fetched in ${Date.now() - t2}ms`);

  if (studentsWithPoints.length > 0) {
    const sample = studentsWithPoints[0];
    console.log("Sample student keys:", Object.keys(sample));
    if (sample.points) {
      console.log("Sample points array length:", sample.points.length);
    }
  }

  await client.close();
}

benchmark();
