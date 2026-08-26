import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const { class_id, calendar } = await req.json();

  if (!ObjectId.isValid(class_id)) {
    return NextResponse.json({ message: "კლასის ID-ის ფორმატი არასწორია" }, { status: 400 });
  }

  if (!calendar || calendar.length !== 5) {
    return NextResponse.json({ message: "კალენდარი უნდა შეიცავდეს 5 დღეს (ორშაბათი-პარასკევი)" }, { status: 400 });
  }

  for (const day of calendar) {
    if (day.length > 7) {
      return NextResponse.json({ message: "თითოეულ დღეს მაქსიმუმ 7 გაკვეთილი შეიძლება იყოს" }, { status: 400 });
    }
  }

  // Normalize ObjectIDs in calendar entries
  for (let d = 0; d < calendar.length; d++) {
    for (let l = 0; l < calendar[d].length; l++) {
      const entry = calendar[d][l];
      if (entry.teacher_id && ObjectId.isValid(entry.teacher_id)) {
        calendar[d][l].teacher_id = new ObjectId(entry.teacher_id);
      }
      if (entry.subject_id && ObjectId.isValid(entry.subject_id)) {
        calendar[d][l].subject_id = new ObjectId(entry.subject_id);
      }
    }
  }

  const db = await getDb();
  const objID = new ObjectId(class_id);

  // Retrieve the old class document before update to check teachers and class name
  const oldClass = await db.collection("class").findOne({ _id: objID });
  if (!oldClass) {
    return NextResponse.json({ message: "კლასი ვერ მოიძებნა" }, { status: 404 });
  }

  const result = await db.collection("class").updateOne(
    { _id: objID },
    { $set: { calendar } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ message: "კლასი ვერ მოიძებნა" }, { status: 404 });
  }

  // Find all students in this class
  const students = await db.collection("students").find({ class_id: objID }).toArray();

  // Find all teachers associated with the class calendar (either in the old calendar or the new one)
  const teacherIdsSet = new Set<string>();
  const collectTeachers = (cal: any) => {
    if (!cal || !Array.isArray(cal)) return;
    for (const day of cal) {
      if (!Array.isArray(day)) continue;
      for (const entry of day) {
        if (entry && entry.teacher_id && entry.teacher_id.toString() !== "000000000000000000000000") {
          teacherIdsSet.add(entry.teacher_id.toString());
        }
      }
    }
  };

  collectTeachers(oldClass.calendar);
  collectTeachers(calendar);
  teacherIdsSet.delete("");

  const teacherObjectIds = Array.from(teacherIdsSet).map(id => new ObjectId(id));
  const teachers = await db.collection("teachers").find({ _id: { $in: teacherObjectIds } }).toArray();

  // Send system message to each student and teacher
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const timeStr = today.toTimeString().split(' ')[0];

  const systemMessages: any[] = [];
  const addMessage = (receiverId: string, receiverName: string, receiverRole: string) => {
    systemMessages.push({
      sender_id: "admin",
      sender_name: "ადმინისტრაცია",
      sender_role: "admin",
      receiver_id: receiverId,
      receiver_name: receiverName,
      receiver_role: receiverRole,
      content: `კლასის (${oldClass.classname}) ცხრილი განახლდა. ახალი განრიგი უკვე ხელმისაწვდომია!`,
      date: dateStr,
      time: timeStr
    });
  };

  for (const student of students) {
    addMessage(student.user_ID, `${student.name} ${student.surname}`, "student");
  }
  for (const teacher of teachers) {
    addMessage(teacher.user_ID, `${teacher.name} ${teacher.surname}`, "teacher");
  }

  if (systemMessages.length > 0) {
    await db.collection("messages").insertMany(systemMessages);
  }

  // Rebuild teacher calendars from all classes
  const allClasses = await db.collection("class").find({}).toArray();
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
              Array.from({ length: 7 }, () => ({ teacher_id: new ObjectId("000000000000000000000000"), subject_id: new ObjectId("000000000000000000000000") }))
            );
          }
          teacherSchedules[tid][dayIdx][lessonIdx] = {
            teacher_id: entry.teacher_id,
            subject_id: entry.subject_id,
          };
        }
      }
    }
  }

  const teacherCollection = db.collection("teachers");
  for (const [teacherID, cal] of Object.entries(teacherSchedules)) {
    await teacherCollection.updateOne(
      { _id: new ObjectId(teacherID) },
      { $set: { calendar: cal } }
    );
  }

  return NextResponse.json({ message: "კალენდარი წარმატებით განახლდა" });
}
