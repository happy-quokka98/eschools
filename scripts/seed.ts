import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:i800rknocMNgOOoS@saqme.xinjxxm.mongodb.net/";
const dbName = "school";

async function seed() {
  const client = new MongoClient(uri);

  try {
    console.log("🚀 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected successfully.");
    const db = client.db(dbName);

    // Collections
    const adminsColl = db.collection("admins");
    const teachersColl = db.collection("teachers");
    const studentsColl = db.collection("students");
    const classesColl = db.collection("classes");
    const subjectsColl = db.collection("subjects");
    const gradesColl = db.collection("grades");
    const usersColl = db.collection("users");

    const saltRounds = 10;
    const commonPassword = await bcrypt.hash("admin123", saltRounds);
    const teacherPassword = await bcrypt.hash("teacher123", saltRounds);
    const studentPassword = await bcrypt.hash("student123", saltRounds);

    // 1. Clear existing data (optional, but good for a fresh start)
    // console.log("Cleaning collections...");
    // await Promise.all([
    //   subjectsColl.deleteMany({}),
    //   adminsColl.deleteMany({}),
    //   teachersColl.deleteMany({}),
    //   studentsColl.deleteMany({}),
    //   classesColl.deleteMany({}),
    //   gradesColl.deleteMany({}),
    //   usersColl.deleteMany({})
    // ]);

    // 2. Seed Subjects
    console.log("📚 Seeding Subjects...");
    const subjectsList = [
      { name: "Mathematics" },
      { name: "Physics" },
      { name: "History" },
      { name: "Biology" },
      { name: "Chemistry" },
      { name: "English" },
      { name: "Geography" },
      { name: "Computer Science" }
    ];

    for (const s of subjectsList) {
      await subjectsColl.updateOne(
        { name: s.name },
        { $set: s },
        { upsert: true }
      );
    }

    const allSubjects = await subjectsColl.find().toArray();
    const subMap = Object.fromEntries(allSubjects.map(s => [s.name, s._id]));

    // 3. Seed Admin
    console.log("👑 Seeding Admin...");
    const adminDoc = {
      name: "System",
      surname: "Admin",
      password: commonPassword,
      user_ID: "admin",
      role: "admin"
    };

    await adminsColl.updateOne({ user_ID: "admin" }, { $set: adminDoc }, { upsert: true });
    await usersColl.updateOne({ user_ID: "admin" }, { $set: adminDoc }, { upsert: true });

    // 4. Seed Teachers
    console.log("👨‍🏫 Seeding Teachers...");
    const teachersList = [
      { name: "John", surname: "Doe", user_ID: "teacher01", subjects: ["Mathematics", "Physics"] },
      { name: "Emma", surname: "Stone", user_ID: "teacher02", subjects: ["English", "History"] },
      { name: "Robert", surname: "Brown", user_ID: "teacher03", subjects: ["Biology", "Chemistry"] },
      { name: "Sarah", surname: "Wilson", user_ID: "teacher04", subjects: ["Geography", "Computer Science"] },
    ];

    for (const t of teachersList) {
      const doc = {
        name: t.name,
        surname: t.surname,
        password: teacherPassword,
        user_ID: t.user_ID,
        role: "teacher",
        classes: [],
        calendar: Array(10).fill([]).map(() => []) // Initialize grid
      };
      await teachersColl.updateOne({ user_ID: t.user_ID }, { $set: doc }, { upsert: true });
      await usersColl.updateOne({ user_ID: t.user_ID }, { $set: doc }, { upsert: true });
    }

    const allTeachers = await teachersColl.find().toArray();
    const teachMap = Object.fromEntries(allTeachers.map(t => [t.user_ID, t._id]));

    // 5. Seed Classes
    console.log("🏫 Seeding Classes...");
    const classesList = [
      { classname: "10-A", tutor_id: teachMap["teacher01"] },
      { classname: "11-B", tutor_id: teachMap["teacher02"] },
      { classname: "9-C", tutor_id: teachMap["teacher03"] },
    ];

    for (const c of classesList) {
      const doc = {
        classname: c.classname,
        tutor_id: c.tutor_id,
        subjects: allSubjects.map(s => ({
          subject_id: s._id,
          teacher_id: allTeachers[Math.floor(Math.random() * allTeachers.length)]._id
        })),
        calendar: Array(10).fill([]).map(() => [])
      };
      await classesColl.updateOne({ classname: c.classname }, { $set: doc }, { upsert: true });
    }

    const allClasses = await classesColl.find().toArray();
    const classMap = Object.fromEntries(allClasses.map(c => [c.classname, c._id]));

    // 6. Seed Students
    console.log("🎓 Seeding Students...");
    const studentsData = [
      { name: "Alice", surname: "Smith", user_ID: "student01", classname: "10-A" },
      { name: "Bob", surname: "Johnson", user_ID: "student02", classname: "10-A" },
      { name: "Charlie", surname: "Davis", user_ID: "student03", classname: "11-B" },
      { name: "Diana", surname: "Evans", user_ID: "student04", classname: "11-B" },
      { name: "Ethan", surname: "Miller", user_ID: "student05", classname: "9-C" },
      { name: "Fiona", surname: "White", user_ID: "student06", classname: "9-C" },
    ];

    for (const s of studentsData) {
      const doc = {
        name: s.name,
        surname: s.surname,
        password: studentPassword,
        user_ID: s.user_ID,
        role: "student",
        class_id: classMap[s.classname]
      };
      await studentsColl.updateOne({ user_ID: s.user_ID }, { $set: doc }, { upsert: true });
      await usersColl.updateOne({ user_ID: s.user_ID }, { $set: doc }, { upsert: true });
    }

    const allStudents = await studentsColl.find().toArray();

    // 7. Seed Sample Grades
    console.log("📝 Seeding Sample Grades...");
    const pointTypes = [1, 2, 3]; // e.g., classwork, homework, exam
    const today = new Date().toISOString().split('T')[0];

    for (const student of allStudents) {
      // Add 5-8 random grades per student
      const gradeCount = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < gradeCount; i++) {
        const randomSubject = allSubjects[Math.floor(Math.random() * allSubjects.length)];
        const randomTeacher = allTeachers[Math.floor(Math.random() * allTeachers.length)];
        const point = 6 + Math.floor(Math.random() * 5); // 6-10 scale

        const gradeDoc = {
          teacher_id: randomTeacher._id,
          student_id: student._id,
          subject_id: randomSubject._id,
          class_id: student.class_id,
          pointType: pointTypes[Math.floor(Math.random() * pointTypes.length)],
          point: point,
          date: today,
          time: new Date().toTimeString().split(" ")[0],
          comment: "ავტომატურად გენერირებული ნიშანი",
          checked: true
        };
        await gradesColl.insertOne(gradeDoc);
      }
    }

    console.log("\n✅ Comprehensive database seeding completed successfully!");
    console.log("-------------------------------------------------------");
    console.log(`Admins: 1 (admin/admin123)`);
    console.log(`Teachers: ${allTeachers.length} (teacher01/teacher123, etc.)`);
    console.log(`Students: ${allStudents.length} (student01/student123, etc.)`);
    console.log(`Classes: ${allClasses.length}`);
    console.log(`Subjects: ${allSubjects.length}`);
    console.log(`Generated Grades: ~${allStudents.length * 6}`);
    console.log("-------------------------------------------------------");

  } catch (error) {
    console.error("❌ Error during seeding:", error);
  } finally {
    await client.close();
    console.log("🚀 Connection closed.");
  }
}

seed();
