import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/";

async function inspect() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  const classes = await db.collection("class").find({}).toArray();
  console.log("All Classes count:", classes.length);
  classes.forEach(c => {
    console.log("Class item:", { _id: c._id.toString(), ID: c.ID, classname: c.classname });
  });

  const students = await db.collection("students").find({}, { projection: { password: 0, points: 0 } }).toArray();
  console.log("Total students count:", students.length);
  if (students.length > 0) {
    const sampleWithClass = students.filter(s => s.class_id);
    console.log("Students with class_id:", sampleWithClass.length);
    if (sampleWithClass.length > 0) {
      console.log("Sample student class_id type:", typeof sampleWithClass[0].class_id, sampleWithClass[0].class_id);
    }
  }

  await client.close();
}

inspect();
