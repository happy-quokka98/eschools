import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function PUT(req: NextRequest) {
  const classData = await req.json();
  const db = await getDb();

  await db.collection("class").updateOne(
    { _id: new ObjectId(classData._id) },
    {
      $set: {
        tutor_id: classData.tutor_id ? new ObjectId(classData.tutor_id) : null,
        subjects: classData.subjects,
      },
    }
  );

  return NextResponse.json({ message: "Class updated successfully" });
}
