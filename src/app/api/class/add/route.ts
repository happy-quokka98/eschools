import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const classData = await req.json();
  const db = await getDb();
  const collection = db.collection("class");

  const classname = classData.ID || classData.classname;
  const existing = await collection.findOne({ $or: [{ ID: classname }, { classname: classname }] });
  if (existing) {
    return NextResponse.json({ message: "Class already exists" }, { status: 409 });
  }

  const tutorId = classData.damrigebeli || classData.tutor_id;
  const doc: any = {
    ...classData,
    ID: classname,
    classname: classname,
    damrigebeli: tutorId ? (typeof tutorId === "string" ? tutorId : tutorId) : null,
    tutor_id: tutorId ? (typeof tutorId === "string" ? tutorId : tutorId) : null,
    subjects: classData.subjects || [],
    students: classData.students || [],
  };

  if (doc.user_ID === null || doc.user_ID === undefined || doc.user_ID === "") {
    delete doc.user_ID;
  }

  await collection.insertOne(doc);
  return NextResponse.json({ message: "Class added successfully" }, { status: 201 });
}
