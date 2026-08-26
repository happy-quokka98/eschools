import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/";

async function testStudent() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  const student = await db.collection("students").findOne({
    $or: [{ ID: "01950060691" }, { user_ID: "01950060691" }]
  });

  console.log("Student 01950060691 doc:", student ? {
    _id: student._id.toString(),
    ID: student.ID,
    user_ID: student.user_ID,
    name: student.name,
    surname: student.surname,
    class_id: student.class_id ? student.class_id.toString() : null,
  } : "NOT FOUND");

  await client.close();
}

testStudent();
