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
    const teachersColl = db.collection("teachers");
    const subjectsColl = db.collection("subjects");
    const studentsColl = db.collection("students");
    const gradesColl = db.collection("grades");

    const classes = await classesColl.find({}).toArray();
    const teachers = await teachersColl.find({}).toArray();
    const subjects = await subjectsColl.find({}).toArray();
    const students = await studentsColl.find({}).toArray();

    console.log(`Found:`);
    console.log(`- ${classes.length} classes`);
    console.log(`- ${teachers.length} teachers`);
    console.log(`- ${subjects.length} subjects`);
    console.log(`- ${students.length} students`);

    if (teachers.length === 0 || subjects.length === 0) {
      console.log("❌ Cannot proceed without teachers or subjects in database.");
      return;
    }

    // 1. Create calendars and subject mappings for all classes
    console.log("📅 Seeding class calendars and subjects...");
    for (const cls of classes) {
      // Keep existing class subjects if non-empty; otherwise, generate fallback mappings
      let classSubjects = cls.subjects || [];
      if (classSubjects.length === 0) {
        classSubjects = subjects.map(s => {
          const subjectTeachers = teachers.filter(t => t.subjects && t.subjects.includes(s.name));
          const assignedTeacher = subjectTeachers.length > 0 
            ? subjectTeachers[Math.floor(Math.random() * subjectTeachers.length)] 
            : teachers[Math.floor(Math.random() * teachers.length)];
          
          return {
            subject_id: s._id,
            teacher_id: assignedTeacher._id
          };
        });
      }

      // Generate a 5-day calendar with exactly 7 lessons per day
      // Pulling subjects directly from the class's subjects list (no null / placeholder entries)
      const calendar = Array.from({ length: 5 }, () => {
        return Array.from({ length: 7 }, () => {
          const randomSubj = classSubjects[Math.floor(Math.random() * classSubjects.length)];
          return {
            subject_id: new ObjectId(randomSubj.subject_id),
            teacher_id: new ObjectId(randomSubj.teacher_id)
          };
        });
      });

      // Update class
      await classesColl.updateOne(
        { _id: cls._id },
        { $set: { subjects: classSubjects, calendar } }
      );
    }
    console.log("✅ Calendars and subjects set for all classes.");

    // 2. Rebuild teacher schedules
    console.log("👨‍🏫 Rebuilding teacher schedules...");
    const allClasses = await classesColl.find({}).toArray();
    const teacherSchedules: Record<string, { teacher_id: ObjectId; subject_id: ObjectId }[][]> = {};

    for (const cls of allClasses) {
      if (!cls.calendar) continue;
      for (let dayIdx = 0; dayIdx < cls.calendar.length; dayIdx++) {
        for (let lessonIdx = 0; lessonIdx < cls.calendar[dayIdx].length; lessonIdx++) {
          const entry = cls.calendar[dayIdx][lessonIdx];
          if (entry && entry.teacher_id && entry.teacher_id.toString() !== "000000000000000000000000") {
            const tid = entry.teacher_id.toString();
            if (!teacherSchedules[tid]) {
              teacherSchedules[tid] = Array.from({ length: 5 }, () =>
                Array.from({ length: 7 }, () => ({
                  teacher_id: new ObjectId("000000000000000000000000"),
                  subject_id: new ObjectId("000000000000000000000000")
                }))
              );
            }
            teacherSchedules[tid][dayIdx][lessonIdx] = {
              teacher_id: new ObjectId(entry.teacher_id),
              subject_id: new ObjectId(entry.subject_id),
            };
          }
        }
      }
    }

    // Reset all teacher calendars first
    await teachersColl.updateMany({}, {
      $set: {
        calendar: Array.from({ length: 5 }, () =>
          Array(7).fill({
            teacher_id: new ObjectId("000000000000000000000000"),
            subject_id: new ObjectId("000000000000000000000000")
          })
        )
      }
    });

    for (const [teacherID, cal] of Object.entries(teacherSchedules)) {
      await teachersColl.updateOne(
        { _id: new ObjectId(teacherID) },
        { $set: { calendar: cal } }
      );
    }
    console.log("✅ Teacher schedules rebuilt successfully.");

    // 3. Seed grades based on grade rules (starting from 5th grade)
    console.log("📝 Seeding student grades...");
    let studentGradesGenerated = 0;

    // Helper to get random weekday date strings from 2026-01-01 to 2026-06-01
    // Helper to get random weekday date strings from 2026-01-01 to 2026-06-01
    const getRandomDates = (count: number) => {
      const dates: string[] = [];
      const startDate = new Date("2026-01-01").getTime();
      const endDate = new Date("2026-06-01").getTime();
      const timeRange = endDate - startDate;
      let attempts = 0;
      while (dates.length < count && attempts < 1000) {
        attempts++;
        const randomTime = startDate + Math.random() * timeRange;
        const targetDate = new Date(randomTime);
        const day = targetDate.getDay();
        if (day !== 0 && day !== 6) { // Monday-Friday
          const dateStr = targetDate.toISOString().split('T')[0];
          if (!dates.includes(dateStr)) {
            dates.push(dateStr);
          }
        }
      }
      return dates;
    };

    console.log("🧹 Clearing existing grades...");
    await gradesColl.deleteMany({});

    const gradesToInsert: any[] = [];

    for (const student of students) {
      // Find class info
      const studentClass = allClasses.find(c => c._id.toString() === student.class_id?.toString());
      if (!studentClass) continue;

      const gradeNum = parseInt(studentClass.classname.match(/\d+/)?.[0] || '0', 10);

      // Grades are only written for 5th grade and above
      if (gradeNum >= 5) {
        const classSubjects = studentClass.subjects || [];
        if (classSubjects.length === 0) continue;

        // Generate 6-10 random grades for this student
        const gradeCount = 6 + Math.floor(Math.random() * 5);
        const randomDates = getRandomDates(gradeCount);

        for (let i = 0; i < gradeCount; i++) {
          const randomSubj = classSubjects[Math.floor(Math.random() * classSubjects.length)];
          const point = 5 + Math.floor(Math.random() * 6); // grades 5-10
          const pointType = Math.floor(1 + Math.random() * 3); // 1 = Homework, 2 = Classwork, 3 = Exam

          const gradeDoc = {
            student_id: student._id,
            teacher_id: new ObjectId(randomSubj.teacher_id),
            class_id: studentClass._id,
            subject_id: new ObjectId(randomSubj.subject_id),
            pointType,
            point,
            date: randomDates[i],
            time: "11:30:00",
            comment: "ავტომატურად გენერირებული ნიშანი (ტესტირება)",
            checked: true
          };

          gradesToInsert.push(gradeDoc);
          studentGradesGenerated++;
        }
      }
    }

    if (gradesToInsert.length > 0) {
      console.log(`📥 Inserting ${gradesToInsert.length} grades in batches...`);
      const batchSize = 1000;
      for (let i = 0; i < gradesToInsert.length; i += batchSize) {
        const batch = gradesToInsert.slice(i, i + batchSize);
        await gradesColl.insertMany(batch);
      }
    }

    console.log("\n-------------------------------------------------------");
    console.log("✅ Seed completed successfully!");
    console.log(`- Calendars set for: ${allClasses.length} classes`);
    console.log(`- Teacher calendars updated`);
    console.log(`- Generated grades for: ${students.filter(s => {
      const cls = allClasses.find(c => c._id.toString() === s.class_id?.toString());
      const g = parseInt(cls?.classname.match(/\d+/)?.[0] || '0', 10);
      return g >= 5;
    }).length} students (grades 5-12)`);
    console.log(`- Total new grades created: ${studentGradesGenerated}`);
    console.log("-------------------------------------------------------");

  } catch (error) {
    console.error("❌ Error during seed:", error);
  } finally {
    await client.close();
    console.log("🚀 Connection closed.");
  }
}

run();
