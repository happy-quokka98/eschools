import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function PUT(req: NextRequest) {
  const classData = await req.json();
  const db = await getDb();

  const tutorId = classData.damrigebeli || classData.tutor_id;
  const updateDoc: any = {
    damrigebeli: tutorId && ObjectId.isValid(tutorId) ? new ObjectId(tutorId) : tutorId || null,
    tutor_id: tutorId && ObjectId.isValid(tutorId) ? new ObjectId(tutorId) : tutorId || null,
    subjects: classData.subjects || [],
  };
  if (Array.isArray(classData.students)) {
    updateDoc.students = classData.students.map((s: string) => ObjectId.isValid(s) ? new ObjectId(s) : s);
  }

  await db.collection("class").updateOne(
    { _id: new ObjectId(classData._id) },
    { $set: updateDoc }
  );

  return NextResponse.json({ message: "Class updated successfully" });
}
