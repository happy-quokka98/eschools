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
  const filter: Record<string, ObjectId> = { class_id: new ObjectId(classID) };

  if (subjectID) {
    if (!ObjectId.isValid(subjectID)) {
      return NextResponse.json({ error: "Invalid subject_id format" }, { status: 400 });
    }
    filter.subject_id = new ObjectId(subjectID);
  }

  const year = req.nextUrl.searchParams.get("year");
  const date = req.nextUrl.searchParams.get("date");

  const grades = await findGrades(db, filter, { year, date });
  return NextResponse.json(grades);
}
