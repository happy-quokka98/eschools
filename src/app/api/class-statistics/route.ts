import { NextRequest, NextResponse } from "next/server";
import { getDb, findGrades } from "@/lib/db";
import { ObjectId } from "mongodb";
import { calculateStatistics } from "@/lib/statistics";
import type { Grade } from "@/lib/models";

export async function GET(req: NextRequest) {
  const classID = req.nextUrl.searchParams.get("class_id");
  const subjectID = req.nextUrl.searchParams.get("subject_id");
  const studentID = req.nextUrl.searchParams.get("student_id");
  const year = req.nextUrl.searchParams.get("year");
  const date = req.nextUrl.searchParams.get("date");

  if (!classID) {
    return NextResponse.json({ message: "class_id საჭიროა" }, { status: 400 });
  }

  const db = await getDb();
  const filter: Record<string, ObjectId | string> = {};

  if (ObjectId.isValid(classID)) {
    filter.class_id = new ObjectId(classID);
  } else {
    filter.class_id = classID;
  }

  if (subjectID) {
    filter.subject_id = ObjectId.isValid(subjectID) ? new ObjectId(subjectID) : subjectID;
  }

  if (studentID) {
    filter.student_id = ObjectId.isValid(studentID) ? new ObjectId(studentID) : studentID;
  }

  const grades = (await findGrades(db, filter, { year, date })) as unknown as Grade[];

  // Group grades by student
  const studentGrades: Record<string, Grade[]> = {};
  for (const grade of grades) {
    const sid = grade.student_id.toString();
    if (!studentGrades[sid]) studentGrades[sid] = [];
    studentGrades[sid].push(grade);
  }

  // Calculate statistics for each student
  const classStatistics: Record<string, ReturnType<typeof calculateStatistics>> = {};
  for (const [sid, gradeList] of Object.entries(studentGrades)) {
    classStatistics[sid] = calculateStatistics(gradeList);
  }

  return NextResponse.json(classStatistics);
}
