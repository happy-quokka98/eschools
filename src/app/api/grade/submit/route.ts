import { NextRequest, NextResponse } from "next/server";
import { getDb, getGradesCollectionName } from "@/lib/db";
import { ObjectId } from "mongodb";
import { invalidateCache } from "@/lib/cache";

export async function POST(req: NextRequest) {
  const grade = await req.json();

  // Convert string IDs to ObjectId
  if (grade.teacher_id && ObjectId.isValid(grade.teacher_id)) {
    grade.teacher_id = new ObjectId(grade.teacher_id);
  }
  if (grade.student_id && ObjectId.isValid(grade.student_id)) {
    grade.student_id = new ObjectId(grade.student_id);
  }
  if (grade.subject_id && ObjectId.isValid(grade.subject_id)) {
    grade.subject_id = new ObjectId(grade.subject_id);
  }
  if (grade.class_id && ObjectId.isValid(grade.class_id)) {
    grade.class_id = new ObjectId(grade.class_id);
  }

  const db = await getDb();
  let teacher = null;
  if (grade.teacher_id) {
    const teacherCollection = db.collection("teachers");
    teacher = await teacherCollection.findOne({ _id: grade.teacher_id });
  }

  // Date validation: Admin has no date limit; Teachers restricted to 2 weeks (14 days) or gradeEntryStartDate
  if (grade.isAdmin !== true) {
    const gradeDate = new Date(grade.date);
    gradeDate.setHours(0, 0, 0, 0);

    let minAllowedDate: Date;
    if (teacher && teacher.gradeEntryStartDate) {
      minAllowedDate = new Date(teacher.gradeEntryStartDate);
      minAllowedDate.setHours(0, 0, 0, 0);
    } else {
      minAllowedDate = new Date();
      minAllowedDate.setDate(minAllowedDate.getDate() - 14);
      minAllowedDate.setHours(0, 0, 0, 0);
    }

    if (gradeDate < minAllowedDate) {
      return NextResponse.json(
        { message: "მასწავლებელს ნიშნის შეტანა/ჩასწორება შეუძლია მხოლოდ 2 კვირის (14 დღის) ვადით. ჩასასწორებლად მიმართეთ ადმინისტრაციას." },
        { status: 403 }
      );
    }
  }

  // Clean up isAdmin property before saving
  if (grade && typeof grade === "object" && "isAdmin" in grade) {
    delete grade.isAdmin;
  }

  // Add timestamp
  grade.time = new Date().toTimeString().split(" ")[0];

  const targetId = grade.id || grade._id;
  delete grade.id;
  delete grade._id;

  const collectionName = getGradesCollectionName(grade.date);
  
  if (targetId && ObjectId.isValid(targetId)) {
    const objectId = new ObjectId(targetId);
    const updateResult = await db.collection(collectionName).updateOne(
      { _id: objectId },
      { $set: grade }
    );

    if (updateResult.matchedCount > 0) {
      if (grade.student_id) {
        await db.collection("students").updateOne(
          { _id: grade.student_id },
          { $addToSet: { points: objectId } }
        );
      }
      invalidateCache(["student_grades_", "top_students_api", "class_stats_"]);
      return NextResponse.json({ message: "ნიშანი წარმატებით განახლდა!" });
    }
  }

  const insertResult = await db.collection(collectionName).insertOne(grade);

  if (insertResult.insertedId && grade.student_id) {
    await db.collection("students").updateOne(
      { _id: grade.student_id },
      { $addToSet: { points: insertResult.insertedId } }
    );
  }

  invalidateCache(["student_grades_", "top_students_api", "class_stats_"]);

  return NextResponse.json({ message: "ნიშანი წარმატებით დაემატა ან განახლდა!" });
}
