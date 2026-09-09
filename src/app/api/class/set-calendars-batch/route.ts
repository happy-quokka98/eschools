import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { invalidateCache } from "@/lib/cache";

export async function POST(req: NextRequest) {
  try {
    const { calendars, updatedSubjectsMap } = await req.json();

    if (!calendars || typeof calendars !== "object") {
      return NextResponse.json({ message: "Calendars dictionary is required" }, { status: 400 });
    }

    const db = await getDb();
    const classCollection = db.collection("class");
    const bulkOps: any[] = [];

    // Fetch all classes first to map subjects if needed
    const allClasses = await classCollection.find({}).toArray();
    const classMap = new Map(allClasses.map(c => [c._id.toString(), c]));

    for (const [classId, calData] of Object.entries(calendars)) {
      if (!ObjectId.isValid(classId) || !Array.isArray(calData)) continue;

      const objID = new ObjectId(classId);
      const targetClass = classMap.get(classId);
      const calendar: any[] = calData as any[];

      // Normalize ObjectIDs & Auto-fill missing teacher_id from class subjects
      for (let d = 0; d < calendar.length; d++) {
        if (!Array.isArray(calendar[d])) continue;
        for (let l = 0; l < calendar[d].length; l++) {
          const entry = calendar[d][l];
          if (entry && entry.subject_id && (!entry.teacher_id || entry.teacher_id === "" || entry.teacher_id.toString() === "000000000000000000000000")) {
            if (targetClass && targetClass.subjects && Array.isArray(targetClass.subjects)) {
              const matchSubj = targetClass.subjects.find((s: any) => s.subject_id && s.subject_id.toString() === entry.subject_id.toString());
              if (matchSubj && matchSubj.teacher_id) {
                calendar[d][l].teacher_id = matchSubj.teacher_id;
              }
            }
          }
          if (calendar[d][l].teacher_id && ObjectId.isValid(calendar[d][l].teacher_id)) {
            calendar[d][l].teacher_id = new ObjectId(calendar[d][l].teacher_id);
          }
          if (calendar[d][l].subject_id && ObjectId.isValid(calendar[d][l].subject_id)) {
            calendar[d][l].subject_id = new ObjectId(calendar[d][l].subject_id);
          }
        }
      }

      const updatePayload: any = { calendar };
      if (updatedSubjectsMap && Array.isArray(updatedSubjectsMap[classId])) {
        updatePayload.subjects = updatedSubjectsMap[classId].map((s: any) => ({
          subject_id: ObjectId.isValid(s.subject_id) ? new ObjectId(s.subject_id) : s.subject_id,
          teacher_id: ObjectId.isValid(s.teacher_id) ? new ObjectId(s.teacher_id) : s.teacher_id,
          hours_per_week: s.hours_per_week
        }));
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: objID },
          update: { $set: updatePayload }
        }
      });
    }

    if (bulkOps.length > 0) {
      await classCollection.bulkWrite(bulkOps);
    }

    // Rebuild teacher schedules across all classes in 1 pass
    const updatedAllClasses = await classCollection.find({}).toArray();
    const teacherSchedules: Record<string, { teacher_id: ObjectId; subject_id: ObjectId }[][]> = {};

    for (const cls of updatedAllClasses) {
      if (!cls.calendar) continue;
      for (let dayIdx = 0; dayIdx < cls.calendar.length; dayIdx++) {
        if (!Array.isArray(cls.calendar[dayIdx])) continue;
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
    const teacherBulkOps: any[] = [];
    for (const [teacherID, cal] of Object.entries(teacherSchedules)) {
      if (ObjectId.isValid(teacherID)) {
        teacherBulkOps.push({
          updateOne: {
            filter: { _id: new ObjectId(teacherID) },
            update: { $set: { calendar: cal } }
          }
        });
      }
    }

    if (teacherBulkOps.length > 0) {
      await teacherCollection.bulkWrite(teacherBulkOps);
    }

    invalidateCache("all_classes_formatted");
    return NextResponse.json({ message: "ყველა კლასის კალენდარი წარმატებით განახლდა" });
  } catch (error: any) {
    console.error("Error setting calendars batch:", error);
    return NextResponse.json({ message: error.message || "Failed to set calendars batch" }, { status: 500 });
  }
}
