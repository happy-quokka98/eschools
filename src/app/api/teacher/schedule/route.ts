import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  const teacherID = req.nextUrl.searchParams.get("teacher_id");
  const userID = req.nextUrl.searchParams.get("user_ID");

  if (!teacherID && !userID) {
    return NextResponse.json({ message: "teacher_id ან user_ID აუცილებელია" }, { status: 400 });
  }

  const db = await getDb();
  const teacherCollection = db.collection("teachers");
  let teacherObjID: ObjectId;

  if (teacherID) {
    if (!ObjectId.isValid(teacherID)) {
      return NextResponse.json({ message: "teacher_id ფორმატი არასწორია" }, { status: 400 });
    }
    teacherObjID = new ObjectId(teacherID);
    const teacher = await teacherCollection.findOne({ _id: teacherObjID });
    if (!teacher) {
      return NextResponse.json({ message: "მასწავლებელი ვერ მოიძებნა" }, { status: 404 });
    }
  } else {
    const teacher = await teacherCollection.findOne({ user_ID: userID });
    if (!teacher) {
      return NextResponse.json({ message: "მასწავლებელი ვერ მოიძებნა" }, { status: 404 });
    }
    teacherObjID = teacher._id;
  }

  // Fetch all classes
  const classes = await db.collection("class").find({}).toArray();

  // Fetch all subjects
  const subjects = await db.collection("subjects").find({}).toArray();
  const subjectMap: Record<string, string> = {};
  for (const subj of subjects) {
    subjectMap[subj._id.toString()] = subj.name;
  }

  // Build 5x7 schedule
  interface Slot {
    className: string;
    subjectName: string;
  }
  const schedule: (Slot | null)[][] = Array.from({ length: 5 }, () => Array(7).fill(null));

  for (const cls of classes) {
    if (!cls.calendar) continue;
    for (let day = 0; day < cls.calendar.length; day++) {
      for (let lesson = 0; lesson < cls.calendar[day].length; lesson++) {
        const entry = cls.calendar[day][lesson];
        if (entry && entry.teacher_id && entry.teacher_id.toString() === teacherObjID.toString()) {
          const subjName = entry.subject_id ? subjectMap[entry.subject_id.toString()] || "" : "";
          schedule[day][lesson] = { className: cls.classname, subjectName: subjName };
        }
      }
    }
  }

  return NextResponse.json(schedule);
}
