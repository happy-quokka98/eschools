import { NextRequest, NextResponse } from "next/server";
import { getDb, findGrades } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  const teacherID = req.nextUrl.searchParams.get("teacher_id");

  if (!teacherID) {
    return NextResponse.json({ error: "teacher_id is required" }, { status: 400 });
  }

  if (!ObjectId.isValid(teacherID)) {
    return NextResponse.json({ error: "Invalid teacher_id format" }, { status: 400 });
  }

  const year = req.nextUrl.searchParams.get("year");
  const date = req.nextUrl.searchParams.get("date");

  const db = await getDb();
  const grades = await findGrades(db, {
    teacher_id: new ObjectId(teacherID),
  }, { year, date });

  return NextResponse.json(grades);
}
