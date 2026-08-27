import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/?appName=gimnazia";

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  const student = await db.collection("students").findOne({});
  if (!student) return;

  const filter = {
    student_id: student._id,
    class_id: student.class_id,
    date: { $gte: "2023-09-01", $lt: "2024-07-01" }
  };

  const year2324Grades = await db.collection("grades").find(filter).sort({ date: 1 }).toArray();
  console.log("23-24 Academic Year grades count:", year2324Grades.length);
  if (year2324Grades.length > 0) {
    console.log("First date:", year2324Grades[0].date, "Last date:", year2324Grades[year2324Grades.length - 1].date);
  }

  await client.close();
}

run();
