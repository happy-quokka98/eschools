import { NextRequest, NextResponse } from "next/server";
import { getDb, getGradesCollectionName } from "@/lib/db";
import { ObjectId } from "mongodb";

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
  const teacherCollection = db.collection("teachers");
  const teacher = await teacherCollection.findOne({ _id: grade.teacher_id });

  if (!teacher) {
    return NextResponse.json({ message: "მასწავლებელი ვერ მოიძებნა" }, { status: 404 });
  }

  // Date validation
  if (grade.isAdmin !== true && teacher.gradeEntryStartDate) {
    const allowed = new Date(teacher.gradeEntryStartDate);
    const gradeDate = new Date(grade.date);
    if (gradeDate < allowed) {
      return NextResponse.json({ message: "ამ თარიღისთვის ნიშნების შეტანა არ შეგიძლიათ" }, { status: 403 });
    }
  }

  // Clean up isAdmin property before saving
  if (grade && typeof grade === "object" && "isAdmin" in grade) {
    delete grade.isAdmin;
  }

  // Add timestamp
  grade.time = new Date().toTimeString().split(" ")[0];

  const collectionName = getGradesCollectionName(grade.date);
  const insertResult = await db.collection(collectionName).insertOne(grade);

  if (insertResult.insertedId && grade.student_id) {
    await db.collection("students").updateOne(
      { _id: grade.student_id },
      { $addToSet: { points: insertResult.insertedId } }
    );
  }

  return NextResponse.json({ message: "ნიშანი წარმატებით დაემატა ან განახლდა!" });
}
