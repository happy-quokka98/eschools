import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/?appName=gimnazia";

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  const students = await db.collection("students").find({
    $or: [
      { surname: { $regex: "ენდელ", $options: "i" } },
      { surname: { $regex: "ენდენ", $options: "i" } },
      { name: { $regex: "ნიკოლოზ", $options: "i" } }
    ]
  }).toArray();

  console.log("Matching students count:", students.length);
  for (const s of students) {
    console.log("Student:", s._id, s.name, s.surname, "ClassID:", s.class_id);
    const classDoc = await db.collection("class").findOne({ _id: s.class_id });
    console.log(" Current ClassName:", classDoc?.classname || classDoc?.ID);

    const grades = await db.collection("grades").find({
      student_id: s._id,
      date: { $gte: "2024-09-01", $lt: "2025-07-01" }
    }).toArray();

    console.log(` 2024-2025 Grades count in 'grades': ${grades.length}`);

    const subjects = await db.collection("subjects").find({}).toArray();
    const subjMap: Record<string, string> = {};
    subjects.forEach(sub => {
      subjMap[sub._id.toString()] = sub.name || sub.subject_name || sub.ID;
    });

    const bySubj: Record<string, any[]> = {};
    grades.forEach(g => {
      const sName = subjMap[g.subject_id?.toString()] || g.subject_id?.toString();
      if (!bySubj[sName]) bySubj[sName] = [];
      bySubj[sName].push(g);
    });

    for (const [subName, gList] of Object.entries(bySubj)) {
      console.log(`   Subject [${subName}]: ${gList.length} grades`);
      gList.forEach((g, idx) => {
        console.log(`     #${idx+1}: point=${g.point}, pointType=${g.pointType}, date=${g.date}, comment=${g.comment}, class_id=${g.class_id}`);
      });
    }
  }

  await client.close();
}

run();
