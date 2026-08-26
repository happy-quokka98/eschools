import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/";

async function inspectGrades() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  const formativeGrades = await db.collection("grades").find({
    $or: [
      { is_formative: true },
      { comment: { $exists: true, $ne: "" } },
      { point: "განმავითარებელი" },
      { point: { $type: "string" } }
    ]
  }).limit(20).toArray();

  console.log("Formative grades count sample:", formativeGrades.length);
  formativeGrades.forEach(g => {
    console.log("Grade sample:", {
      _id: g._id.toString(),
      point: g.point,
      comment: g.comment,
      is_formative: g.is_formative,
      date: g.date,
      keys: Object.keys(g)
    });
  });

  await client.close();
}

inspectGrades();
