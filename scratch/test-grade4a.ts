import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/";

async function testGrade4A() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  const grade = 4;
  const parallel = "ა";
  const classnameRegex = `^${grade}[\\s\\-_]*${parallel}$`;

  const classes = await db.collection("class")
    .find({
      $or: [
        { ID: { $regex: classnameRegex, $options: "i" } },
        { classname: { $regex: classnameRegex, $options: "i" } }
      ]
    })
    .toArray();

  console.log("Matching classes for 4ა:", classes.map(c => ({ id: c._id.toString(), ID: c.ID })));

  const classIds = classes.flatMap(c => [c._id, c._id.toString()]);
  const students = await db.collection("students")
    .find({ class_id: { $in: classIds } }, { projection: { password: 0, points: 0 } })
    .toArray();

  console.log(`Found ${students.length} students in Class 4ა:`);
  students.forEach(s => console.log(`- ${s.name} ${s.surname} (ID: ${s.ID || s.user_ID})`));

  await client.close();
}

testGrade4A();
