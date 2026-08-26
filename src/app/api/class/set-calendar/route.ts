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
  const result = await db.collection("class").updateOne(
    { _id: objID },
    { $set: { calendar } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ message: "კლასი ვერ მოიძებნა" }, { status: 404 });
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
