import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/";

async function inspectTeacher() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  const teacher = await db.collection("teachers").findOne({
    $or: [{ ID: "61001036269" }, { user_ID: "61001036269" }]
  });

  console.log("Teacher 61001036269 doc:", teacher ? {
    _id: teacher._id.toString(),
    ID: teacher.ID,
    user_ID: teacher.user_ID,
    name: teacher.name,
    surname: teacher.surname,
    role: teacher.role,
    classes: teacher.classes,
    hasPassword: Boolean(teacher.password)
  } : "NOT FOUND");

  await client.close();
}

inspectTeacher();
