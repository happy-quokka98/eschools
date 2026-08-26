import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/";

async function inspectSubjects() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  const subjects = await db.collection("subjects").find({}).toArray();
  console.log("Subjects count:", subjects.length);
  subjects.forEach(s => {
    console.log("Subject item:", { _id: s._id.toString(), name: s.name, ID: s.ID, subject_name: s.subject_name, keys: Object.keys(s) });
  });

  await client.close();
}

inspectSubjects();
