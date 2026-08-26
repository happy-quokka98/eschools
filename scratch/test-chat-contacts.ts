import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/";

async function testChatContacts() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("school");

  const teacherId = "61001036269";
  const teacher = await db.collection("teachers").findOne({
    $or: [{ ID: teacherId }, { user_ID: teacherId }]
  });

  console.log("Teacher found:", teacher?.name, teacher?.surname);

  if (teacher) {
    const teacherStrId = teacher._id.toString();
    const teacherPersonalId = teacher.ID || teacher.user_ID;

    const allClasses = await db.collection("class").find({}).toArray();

    const assignedClassIdStrings = new Set<string>();
    if (Array.isArray(teacher.classes)) {
      teacher.classes.forEach((tc: any) => {
        if (tc.class_id) assignedClassIdStrings.add(tc.class_id.toString());
      });
    }

    const myClasses = allClasses.filter((c: any) => {
      const cIdStr = c._id.toString();
      if (assignedClassIdStrings.has(cIdStr)) return true;
      const damrigebeliStr = c.damrigebeli ? c.damrigebeli.toString() : (c.tutor_id ? c.tutor_id.toString() : null);
      if (damrigebeliStr && (damrigebeliStr === teacherStrId || damrigebeliStr === teacherPersonalId)) return true;
      if (Array.isArray(c.subjects)) {
        return c.subjects.some((s: any) => {
          const tid = s.teacher_id ? s.teacher_id.toString() : null;
          return tid && (tid === teacherStrId || tid === teacherPersonalId);
        });
      }
      return false;
    });

    console.log(`Teacher ${teacher.name} ${teacher.surname} has ${myClasses.length} assigned classes:`, myClasses.map(c => c.ID || c.classname));

    const myClassIdStrings = new Set(myClasses.map(c => c._id.toString()));

    const allStudents = await db.collection("students").find({}, { projection: { password: 0, points: 0 } }).toArray();
    const myStudents = allStudents.filter(s => s.class_id && myClassIdStrings.has(s.class_id.toString()));

    console.log(`Found ${myStudents.length} students in these classes`);

    const colleagueTeacherIds = new Set<string>();
    myClasses.forEach((c: any) => {
      if (c.damrigebeli) colleagueTeacherIds.add(c.damrigebeli.toString());
      if (c.tutor_id) colleagueTeacherIds.add(c.tutor_id.toString());
      if (Array.isArray(c.subjects)) {
        c.subjects.forEach((s: any) => {
          if (s.teacher_id) colleagueTeacherIds.add(s.teacher_id.toString());
        });
      }
    });

    const allTeachers = await db.collection("teachers").find({}, { projection: { password: 0 } }).toArray();
    const myColleagues = allTeachers.filter(t => {
      const tIdStr = t._id.toString();
      const tPersonalId = t.ID || t.user_ID;
      if (tIdStr === teacherStrId || tPersonalId === teacherPersonalId) return false;
      return colleagueTeacherIds.has(tIdStr) || (tPersonalId && colleagueTeacherIds.has(tPersonalId));
    });

    console.log(`Found ${myColleagues.length} colleague teachers for these classes:`, myColleagues.map(t => `${t.name} ${t.surname}`));
  }

  await client.close();
}

testChatContacts();
