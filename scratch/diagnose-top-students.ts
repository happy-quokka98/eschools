import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/?appName=gimnazia";

async function diagnose() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  console.log("=== Collections in DB ===");
  const collections = await db.listCollections().toArray();
  const colNames = collections.map(c => c.name);
  console.log("Collections:", colNames);

  const yearCollections = colNames.filter((name) => /^\d{4}year$/.test(name));
  console.log("Year collections:", yearCollections);

  const studentsCount = await db.collection("students").countDocuments();
  console.log("Total students count:", studentsCount);

  const classesCount = await db.collection("class").countDocuments();
  console.log("Total classes count:", classesCount);

  console.log("\n=== Grade counts in collections ===");
  if (colNames.includes("grades")) {
    const count = await db.collection("grades").countDocuments();
    console.log(`"grades" collection count:`, count);
    const sample = await db.collection("grades").findOne({});
    console.log(`"grades" sample document:`, sample);
  }
  for (const yc of yearCollections) {
    const count = await db.collection(yc).countDocuments();
    console.log(`"${yc}" collection count:`, count);
    const sample = await db.collection(yc).findOne({});
    console.log(`"${yc}" sample document:`, sample);
  }

  // Test current top-students logic:
  const students = await db.collection("students").find({}).toArray();
  const classes = await db.collection("class").find({}).toArray();
  
  // Fetch from all grade collections or 'grades'
  const gradesInGradesCol = colNames.includes("grades") ? await db.collection("grades").find({}).toArray() : [];
  
  console.log(`\nGrades in 'grades' col: ${gradesInGradesCol.length}`);

  // Check how student_ids are stored in grades
  if (gradesInGradesCol.length > 0) {
    const gradeStudentIdTypes = new Set(gradesInGradesCol.slice(0, 100).map(g => typeof g.student_id + " / " + (g.student_id?.constructor?.name)));
    console.log("Grade student_id types:", Array.from(gradeStudentIdTypes));
  }

  // Calculate averages across grades
  let countOver9_8 = 0;
  let countWithGrades = 0;

  for (const student of students) {
    const studentIdStr = student._id.toString();
    const studentGrades = gradesInGradesCol.filter((g) => {
      if (g.student_id?.toString() !== studentIdStr || g.pointType === 0) return false;
      const pt =
        typeof g.point === "number"
          ? g.point
          : typeof g.point === "string" && !isNaN(parseInt(g.point, 10))
          ? parseInt(g.point, 10)
          : -1;
      return pt >= 0 && pt <= 10 && !g.is_formative && g.point !== -3;
    });

    if (studentGrades.length > 0) {
      countWithGrades++;
      const totalPoint = studentGrades.reduce((sum, g) => {
        const pt = typeof g.point === "number" ? g.point : parseInt(g.point, 10);
        return sum + pt;
      }, 0);
      const avg = totalPoint / studentGrades.length;
      if (avg >= 9.8) {
        countOver9_8++;
        console.log(`Student top: ${student.name} ${student.surname}, avg: ${avg.toFixed(2)}, grades count: ${studentGrades.length}`);
      }
    }
  }

  console.log(`\nStudents with grades in 'grades': ${countWithGrades}`);
  console.log(`Students with avg >= 9.8: ${countOver9_8}`);

  // Now check year collections as well!
  for (const yc of yearCollections) {
    const ycGrades = await db.collection(yc).find({}).toArray();
    let ycStudentsWithGrades = 0;
    let ycOver9_8 = 0;
    for (const student of students) {
      const studentIdStr = student._id.toString();
      const studentGrades = ycGrades.filter((g) => {
        if (g.student_id?.toString() !== studentIdStr || g.pointType === 0) return false;
        const pt =
          typeof g.point === "number"
            ? g.point
            : typeof g.point === "string" && !isNaN(parseInt(g.point, 10))
            ? parseInt(g.point, 10)
            : -1;
        return pt >= 0 && pt <= 10 && !g.is_formative && g.point !== -3;
      });

      if (studentGrades.length > 0) {
        ycStudentsWithGrades++;
        const totalPoint = studentGrades.reduce((sum, g) => {
          const pt = typeof g.point === "number" ? g.point : parseInt(g.point, 10);
          return sum + pt;
        }, 0);
        const avg = totalPoint / studentGrades.length;
        if (avg >= 9.8) {
          ycOver9_8++;
          console.log(`[${yc}] Top Student: ${student.name} ${student.surname}, avg: ${avg.toFixed(2)}, grades count: ${studentGrades.length}`);
        }
      }
    }
    console.log(`[${yc}] Students with grades: ${ycStudentsWithGrades}, avg >= 9.8: ${ycOver9_8}`);
  }

  await client.close();
}

diagnose();
