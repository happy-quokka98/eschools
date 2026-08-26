import { MongoClient, ObjectId } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:i800rknocMNgOOoS@saqme.xinjxxm.mongodb.net/";
const dbName = "school";

async function run() {
  const client = new MongoClient(uri);

  try {
    console.log("🚀 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected successfully.");
    const db = client.db(dbName);

    const classesColl = db.collection("class");
    const studentsColl = db.collection("students");
    const gradesColl = db.collection("grades");

    const classes = await classesColl.find({}).toArray();
    console.log(`Found ${classes.length} classes to process.`);

    // Semester range: January 1, 2026 to today minus 7 days (June 6 - 7 days = May 30)
    const startDate = new Date("2026-01-01");
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 7); // 7 days ago

    console.log(`Scanning semester dates from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}...`);

    // Helper to generate all dates between startDate and endDate
    const getDates = (start: Date, end: Date) => {
      const dates: string[] = [];
      let current = new Date(start);
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      return dates;
    };

    const allDates = getDates(startDate, endDate);
    console.log(`Generated ${allDates.length} date slots.`);

    let insertedCount = 0;
    let checkedLessons = 0;
    let missedLessons = 0;

    console.log("📥 Loading existing grades from database...");
    const existingGradesList = await gradesColl.find({
      date: { $gte: "2026-01-01", $lte: endDate.toISOString().split('T')[0] }
    }).toArray();

    // Create a Set of keys for checking exists in-memory: "class_id_subject_id_date"
    const existingGradesSet = new Set<string>();
    for (const grade of existingGradesList) {
      if (grade.class_id && grade.subject_id && grade.date) {
        existingGradesSet.add(`${grade.class_id.toString()}_${grade.subject_id.toString()}_${grade.date}`);
      }
    }
    console.log(`Loaded ${existingGradesList.length} existing grades.`);

    const docsToInsert: any[] = [];

    // Pre-fetch all students grouped by class_id to avoid calling DB in the loop
    console.log("📥 Loading all students...");
    const allStudents = await studentsColl.find({}).toArray();
    const studentsByClass: Record<string, typeof allStudents> = {};
    for (const student of allStudents) {
      if (student.class_id) {
        const cid = student.class_id.toString();
        if (!studentsByClass[cid]) {
          studentsByClass[cid] = [];
        }
        studentsByClass[cid].push(student);
      }
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];

    for (const cls of classes) {
      if (!cls.calendar || !Array.isArray(cls.calendar) || cls.calendar.length !== 5) {
        console.log(`⚠️ Class ${cls.classname} has no calendar or invalid calendar length.`);
        continue;
      }

      const classStudents = studentsByClass[cls._id.toString()] || [];
      if (classStudents.length === 0) {
        console.log(`⚠️ Class ${cls.classname} has no students.`);
        continue;
      }

      for (const dateStr of allDates) {
        const dateObj = new Date(dateStr);
        const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
        const dayOfWeekIdx = dayOfWeek - 1; // 0 is Monday, ..., 4 is Friday

        // Only process Monday to Friday
        if (dayOfWeekIdx < 0 || dayOfWeekIdx > 4) continue;

        const dayCalendar = cls.calendar[dayOfWeekIdx];
        if (!dayCalendar || !Array.isArray(dayCalendar)) continue;

        // Group calendar by subject to find unique lessons taught on this day
        const activeLessons: { subject_id: ObjectId; teacher_id: ObjectId }[] = [];
        const seen = new Set<string>();

        for (const entry of dayCalendar) {
          if (entry && entry.subject_id && entry.teacher_id && entry.subject_id.toString() !== "000000000000000000000000") {
            const key = `${entry.subject_id.toString()}_${entry.teacher_id.toString()}`;
            if (!seen.has(key)) {
              seen.add(key);
              activeLessons.push({
                subject_id: new ObjectId(entry.subject_id),
                teacher_id: new ObjectId(entry.teacher_id)
              });
            }
          }
        }

        for (const lesson of activeLessons) {
          checkedLessons++;

          // Check if there are any grades/attendance entered for this class, subject, and date in-memory
          const key = `${cls._id.toString()}_${lesson.subject_id.toString()}_${dateStr}`;
          if (!existingGradesSet.has(key)) {
            missedLessons++;

            // Automatically insert attendance for all students of this class
            for (const student of classStudents) {
              docsToInsert.push({
                student_id: student._id,
                teacher_id: lesson.teacher_id,
                class_id: cls._id,
                subject_id: lesson.subject_id,
                pointType: 2, // Default to classwork
                point: -1, // Present / Attendance-only
                date: dateStr,
                time: timeStr,
                comment: "ავტომატური სწრებადობა (ნიშნის არარსებობის გამო)",
                checked: true // default present
              });
              insertedCount++;
            }
          }
        }
      }
    }

    if (docsToInsert.length > 0) {
      console.log(`📥 Inserting ${docsToInsert.length} auto-attendance records in batches...`);
      const batchSize = 1000;
      for (let i = 0; i < docsToInsert.length; i += batchSize) {
        const batch = docsToInsert.slice(i, i + batchSize);
        await gradesColl.insertMany(batch);
      }
    }

    console.log("\n-------------------------------------------------------");
    console.log("✅ Auto-fill migration completed successfully!");
    console.log(`Total checked lesson instances: ${checkedLessons}`);
    console.log(`Missing lesson instances found (over 1 week old): ${missedLessons}`);
    console.log(`Total student attendance records generated: ${insertedCount}`);
    console.log("-------------------------------------------------------");

  } catch (error) {
    console.error("❌ Error during auto-fill operation:", error);
  } finally {
    await client.close();
    console.log("🚀 Connection closed.");
  }
}

run();
