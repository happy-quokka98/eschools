import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/?appName=gimnazia";

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  const classes = await db.collection("class").find({
    $or: [
      { classname: { $regex: "7", $options: "i" } },
      { ID: { $regex: "7", $options: "i" } }
    ]
  }).toArray();

  console.log("Classes found matching '7':", classes.map(c => ({
    _id: c._id.toString(),
    classname: c.classname,
    ID: c.ID,
    subjectsCount: c.subjects ? c.subjects.length : 0,
    subjects: c.subjects
  })));

  for (const c of classes) {
    const studentsByObjectId = await db.collection("students").countDocuments({ class_id: c._id });
    const studentsByStringId = await db.collection("students").countDocuments({ class_id: c._id.toString() });
    console.log(`Class ${c.classname || c.ID} (_id: ${c._id.toString()}): ${studentsByObjectId} students by ObjectId, ${studentsByStringId} students by String ID`);
  }

  await client.close();
}

run().catch(console.error);
