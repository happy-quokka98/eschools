import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/?appName=gimnazia";

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  const [students, classes] = await Promise.all([
    db.collection("students").find({}).toArray(),
    db.collection("class").find({}).toArray(),
  ]);

  console.log(`Fetched ${students.length} students and ${classes.length} classes`);

  const classMap: Record<string, string> = {};
  classes.forEach((c) => {
    classMap[c._id.toString()] = c.classname || c.ID || c.name || "";
  });

  const studentMap = new Map<string, any>();
  students.forEach((s) => {
    studentMap.set(s._id.toString(), s);
  });

  const pipeline: any[] = [
    {
      $match: {
        date: { $gte: "2024-09-01" },
        pointType: { $ne: 0 },
        is_formative: { $ne: true },
        point: { $nin: [-3, -1, "N/A", null, ""] },
      },
    },
    {
      $project: {
        student_id: 1,
        subject_id: 1,
        numericPoint: {
          $cond: {
            if: { $eq: [{ $type: "$point" }, "number"] },
            then: "$point",
            else: { $convert: { input: "$point", to: "double", onError: null, onNull: null } },
          },
        },
      },
    },
    {
      $match: {
        numericPoint: { $gte: 0, $lte: 10 },
      },
    },
    {
      $group: {
        _id: { student_id: "$student_id", subject_id: "$subject_id" },
        subjectAvg: { $avg: "$numericPoint" },
      },
    },
    {
      $group: {
        _id: "$_id.student_id",
        studentAvg: { $avg: "$subjectAvg" },
      },
    },
  ];

  const studentResults = await db.collection("grades").aggregate(pipeline).toArray();
  console.log(`Student averages calculated: ${studentResults.length}`);

  // Now group by class using studentMap!
  const classStats: Record<string, { totalAvg: number; studentCount: number; honorCount: number; tenCount: number }> = {};

  for (const sr of studentResults) {
    const studentIdStr = sr._id.toString();
    const student = studentMap.get(studentIdStr);
    if (!student || !student.class_id) continue;

    const classIdStr = student.class_id.toString();
    if (!classStats[classIdStr]) {
      classStats[classIdStr] = { totalAvg: 0, studentCount: 0, honorCount: 0, tenCount: 0 };
    }

    classStats[classIdStr].totalAvg += sr.studentAvg;
    classStats[classIdStr].studentCount += 1;
    if (sr.studentAvg >= 9.0) classStats[classIdStr].honorCount += 1;
    if (sr.studentAvg >= 9.8) classStats[classIdStr].tenCount += 1;
  }

  const classList: any[] = [];
  for (const [classId, stats] of Object.entries(classStats)) {
    const className = classMap[classId];
    if (!className) continue;

    const avg = Math.round((stats.totalAvg / stats.studentCount) * 100) / 100;
    classList.push({
      class_id: classId,
      classname: className,
      average: avg,
      student_count: stats.studentCount,
      honor_students_count: stats.honorCount,
      ten_students_count: stats.tenCount,
    });
  }

  classList.sort((a, b) => b.average - a.average);

  console.log(`\n=== TOP CLASSES (Total ${classList.length}) ===`);
  console.log(classList.slice(0, 15));

  await client.close();
}

run().catch(console.error);
