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

  // Build query to find teacher flexibly
  const teacherOrConditions: any[] = [];
  if (userID) {
    teacherOrConditions.push({ user_ID: userID });
    teacherOrConditions.push({ user_ID: String(userID) });
    if (!isNaN(Number(userID))) {
      teacherOrConditions.push({ user_ID: Number(userID) });
    }
    if (ObjectId.isValid(userID)) {
      teacherOrConditions.push({ _id: new ObjectId(userID) });
    }
  }
  if (teacherID) {
    teacherOrConditions.push({ user_ID: teacherID });
    teacherOrConditions.push({ user_ID: String(teacherID) });
    if (ObjectId.isValid(teacherID)) {
      teacherOrConditions.push({ _id: new ObjectId(teacherID) });
    }
  }

  const teacher = await teacherCollection.findOne({ $or: teacherOrConditions });

  let teacherObjID: ObjectId | null = null;
  let teacherUserIDs: string[] = [];

  if (teacher) {
    if (teacher._id) {
      teacherObjID = teacher._id;
      teacherUserIDs.push(teacher._id.toString());
    }
    if (teacher.user_ID) {
      teacherUserIDs.push(String(teacher.user_ID));
    }
  }

  if (teacherID) teacherUserIDs.push(String(teacherID));
  if (userID) teacherUserIDs.push(String(userID));

  // Deduplicate teacherUserIDs
  teacherUserIDs = Array.from(new Set(teacherUserIDs.filter(Boolean)));

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
    class_id?: string;
    subject_id?: string;
  }
  const schedule: (Slot | null)[][] = Array.from({ length: 5 }, () => Array(7).fill(null));

  for (const cls of classes) {
    if (!cls.calendar || !Array.isArray(cls.calendar)) continue;
    const classSubjects = Array.isArray(cls.subjects) ? cls.subjects : [];

    for (let day = 0; day < cls.calendar.length && day < 5; day++) {
      if (!Array.isArray(cls.calendar[day])) continue;
      for (let lesson = 0; lesson < cls.calendar[day].length && lesson < 7; lesson++) {
        const entry = cls.calendar[day][lesson];
        if (entry && (entry.teacher_id || entry.subject_id)) {
          const entryTid = entry.teacher_id ? entry.teacher_id.toString() : "";
          let matches = (entryTid !== "" && entryTid !== "000000000000000000000000") &&
            (teacherUserIDs.includes(entryTid) || (teacherObjID && entryTid === teacherObjID.toString()));

          // Fallback: If entry.teacher_id is missing or doesn't match, check if this teacher teaches entry.subject_id in this class
          if (!matches && entry.subject_id && classSubjects.length > 0) {
            const matchInClassSubjs = classSubjects.find((s: any) =>
              s.subject_id && s.subject_id.toString() === entry.subject_id.toString() &&
              s.teacher_id && (
                teacherUserIDs.includes(s.teacher_id.toString()) ||
                (teacherObjID && s.teacher_id.toString() === teacherObjID.toString())
              ) && (s.hours_per_week === undefined || s.hours_per_week > 0)
            );
            if (matchInClassSubjs) {
              matches = true;
            }
          }

          // If the matching subject in this class has 0 hours (not taught per ESG), exclude it
          if (matches && entry.subject_id && classSubjects.length > 0) {
            const zeroHourMatch = classSubjects.find((s: any) =>
              s.subject_id && s.subject_id.toString() === entry.subject_id.toString() && s.hours_per_week === 0
            );
            if (zeroHourMatch) {
              matches = false;
            }
          }

          if (matches) {
            const subjName = entry.subject_id ? subjectMap[entry.subject_id.toString()] || "" : "";
            schedule[day][lesson] = {
              className: cls.classname || cls.ID || "",
              subjectName: subjName,
              class_id: cls._id ? cls._id.toString() : "",
              subject_id: entry.subject_id ? entry.subject_id.toString() : ""
            };
          }
        }
      }
    }
  }

  return NextResponse.json(schedule);
}
