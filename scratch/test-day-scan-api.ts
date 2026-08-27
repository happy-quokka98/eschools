import { MongoClient, ObjectId } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/?appName=gimnazia";

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  console.time("day-scan-api-test");

  const startDate = "2026-06-01";
  const endDate = "2026-06-16";
  const classId = "all"; // or specific class_id

  const [classes, students, subjects, teachers] = await Promise.all([
    db.collection("class").find({}).toArray(),
    db.collection("students").find({}).toArray(),
    db.collection("subjects").find({}).toArray(),
    db.collection("teachers").find({}).toArray(),
  ]);

  const classMap = new Map<string, string>();
  classes.forEach(c => classMap.set(c._id.toString(), c.classname || c.ID || c.name || ""));

  const studentMap = new Map<string, string>();
  students.forEach(s => studentMap.set(s._id.toString(), `${s.name || ""} ${s.surname || ""}`.trim()));

  const subjectMap = new Map<string, string>();
  subjects.forEach(s => subjectMap.set(s._id.toString(), s.name || ""));

  const teacherMap = new Map<string, string>();
  teachers.forEach(t => teacherMap.set(t._id.toString(), `${t.name || ""} ${t.surname || ""}`.trim()));

  const queryFilter: any = {
    date: { $gte: startDate, $lte: endDate },
    checked: { $in: [true, false] }
  };

  if (classId && classId !== "all" && ObjectId.isValid(classId)) {
    queryFilter.class_id = new ObjectId(classId);
  }

  const pipeline: any[] = [
    { $match: queryFilter },
    {
      $group: {
        _id: { class_id: "$class_id", date: "$date", subject_id: "$subject_id" },
        teacher_id: { $first: "$teacher_id" },
        grades: {
          $push: {
            student_id: "$student_id",
            checked: "$checked",
            point: "$point",
            pointType: "$pointType",
            time: "$time"
          }
        }
      }
    }
  ];

  const groupedByLesson = await db.collection("grades").aggregate(pipeline, { allowDiskUse: true }).toArray();

  // Group by (class_id + date)
  const classDateMap = new Map<string, any[]>();
  for (const item of groupedByLesson) {
    const key = `${item._id.class_id?.toString()}_${item._id.date}`;
    let list = classDateMap.get(key);
    if (!list) {
      list = [];
      classDateMap.set(key, list);
    }
    list.push(item);
  }

  const results: any[] = [];

  for (const [key, lessons] of classDateMap.entries()) {
    const [cIdStr, dateStr] = key.split("_");
    const className = classMap.get(cIdStr) || "უცნობი კლასი";

    const evaluations = lessons.map(les => {
      const subjId = les._id.subject_id?.toString();
      const subjectName = subjectMap.get(subjId) || "უცნობი საგანი";
      const teacherName = teacherMap.get(les.teacher_id?.toString()) || "უცნობი მასწავლებელი";

      const studentCheckedMap: Record<string, boolean> = {};
      les.grades.forEach((g: any) => {
        if (g.student_id) studentCheckedMap[g.student_id.toString()] = g.checked;
      });

      const presentCount = Object.values(studentCheckedMap).filter(c => c === true).length;
      const absentCount = Object.values(studentCheckedMap).filter(c => c === false).length;
      const total = presentCount + absentCount;
      const rate = total > 0 ? (presentCount / total) * 100 : 0;

      const absentStudentIds = Object.entries(studentCheckedMap)
        .filter(([_, c]) => c === false)
        .map(([sid]) => sid);

      const absentStudentNames = absentStudentIds.map(sid => studentMap.get(sid) || "უცნობი მოსწავლე");
      const absentKey = [...absentStudentIds].sort().join(",");

      return {
        subjectId: subjId,
        subjectName,
        teacherName,
        presentCount,
        absentCount,
        total,
        rate,
        absentStudentIds,
        absentStudentNames,
        absentKey
      };
    });

    let majorityKey = "";
    if (evaluations.length >= 2) {
      const keyFrequencies: Record<string, number> = {};
      evaluations.forEach(ev => {
        keyFrequencies[ev.absentKey] = (keyFrequencies[ev.absentKey] || 0) + 1;
      });

      let maxFreq = 0;
      Object.entries(keyFrequencies).forEach(([k, freq]) => {
        if (freq > maxFreq) {
          maxFreq = freq;
          majorityKey = k;
        }
      });
    }

    const lessonEvaluations = evaluations.map(ev => ({
      ...ev,
      isDiscrepancy: evaluations.length >= 2 && ev.absentKey !== majorityKey
    }));

    const hasDiscrepancy = lessonEvaluations.some(e => e.isDiscrepancy);

    results.push({
      classId: cIdStr,
      className,
      date: dateStr,
      totalLessons: evaluations.length,
      hasDiscrepancy,
      discrepantCount: lessonEvaluations.filter(e => e.isDiscrepancy).length,
      evaluations: lessonEvaluations
    });
  }

  results.sort((a, b) => b.date.localeCompare(a.date));

  console.timeEnd("day-scan-api-test");

  console.log(`Scan completed for range ${startDate} to ${endDate}. Total class-date entries: ${results.length}`);
  console.log(`Entries with discrepancies: ${results.filter(r => r.hasDiscrepancy).length}`);

  if (results.length > 0) {
    console.log("Sample discrepancy entry:", results.find(r => r.hasDiscrepancy));
  }

  await client.close();
}

run().catch(console.error);
