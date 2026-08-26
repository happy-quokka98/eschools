import { NextRequest, NextResponse } from "next/server";
import { getDb, findGrades } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  const classID = req.nextUrl.searchParams.get("class_id");
  const subjectID = req.nextUrl.searchParams.get("subject_id");

  if (!classID) {
    return NextResponse.json({ error: "class_id is required" }, { status: 400 });
  }

  if (!ObjectId.isValid(classID)) {
    return NextResponse.json({ error: "Invalid class_id format" }, { status: 400 });
  }

  const db = await getDb();
  const filter: Record<string, any> = { class_id: new ObjectId(classID) };

  if (subjectID) {
    if (!ObjectId.isValid(subjectID)) {
      return NextResponse.json({ error: "Invalid subject_id format" }, { status: 400 });
    }
    filter.subject_id = new ObjectId(subjectID);
  }

  const year = req.nextUrl.searchParams.get("year");
  const date = req.nextUrl.searchParams.get("date");
  if (date) {
    filter.date = date;
  }

  const pointType = req.nextUrl.searchParams.get("pointType");
  if (pointType) {
    filter.pointType = parseInt(pointType, 10);
  }

  const lessonNum = req.nextUrl.searchParams.get("lesson_num");
  if (lessonNum) {
    const num = parseInt(lessonNum, 10);
    if (num === 1) {
      filter.lesson_num = { $in: [1, null, undefined] };
    } else {
      filter.lesson_num = num;
    }
  }

  const grades = await findGrades(db, filter, { year, date });
  return NextResponse.json(grades);
}
