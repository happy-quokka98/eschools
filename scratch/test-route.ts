import { MongoClient, ObjectId } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/?appName=gimnazia";

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  const grade = 7;
  const parallel = "ბ";
  const classnameRegex = `^${grade}[\\s\\-_]*${parallel}$`;

  const classes = await db.collection("class")
    .find({
      $or: [
        { ID: { $regex: classnameRegex, $options: "i" } },
        { classname: { $regex: classnameRegex, $options: "i" } }
      ]
    })
    .toArray();

  console.log("Matching classes count:", classes.length);

  const classIds = classes.flatMap(c => [c._id, c._id.toString()]);
  console.log("Class IDs:", classIds);

  const students = await db.collection("students")
    .find({ class_id: { $in: classIds } })
    .toArray();

  console.log("Matching students count:", students.length);

  // Check subjects for class 7ბ
  const class7b = classes[0];
  const allSubjects = await db.collection("subjects").find({}).toArray();
  console.log("All subjects count:", allSubjects.length);

  if (class7b && class7b.subjects) {
    console.log("Sample class7b subject raw item:", class7b.subjects[0]);
    console.log("Sample allSubjects item _id type:", typeof allSubjects[0]._id, allSubjects[0]._id);
    const filtered = allSubjects.filter(s =>
      class7b.subjects.some((cs: any) => {
        const csSubId = cs.subject_id ? cs.subject_id.toString() : (cs._id ? cs._id.toString() : cs.toString());
        const sId = s._id.toString();
        return csSubId === sId;
      })
    );
    console.log("Filtered subjects count (with .toString()):", filtered.length);

    const oldFiltered = allSubjects.filter(s =>
      class7b.subjects.some((cs: any) => cs.subject_id === s._id)
    );
    console.log("Old Filtered subjects count (cs.subject_id === s._id):", oldFiltered.length);
  }

  await client.close();
}

run().catch(console.error);
