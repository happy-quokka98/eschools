import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, findGrades } from "@/lib/db";
import { calculateStatistics, isFifthGradeClassname } from "@/lib/statistics";
import type { Grade } from "@/lib/models";

export async function GET(req: NextRequest) {
  const studentID = req.nextUrl.searchParams.get("student_id");
  const classID = req.nextUrl.searchParams.get("class_id");
  const subjectID = req.nextUrl.searchParams.get("subject_id");
  const year = req.nextUrl.searchParams.get("year");
  const date = req.nextUrl.searchParams.get("date");

  if (!studentID || !classID) {
    return NextResponse.json({ message: "student_id და class_id საჭიროა" }, { status: 400 });
  }

  const db = await getDb();
  const filter: Record<string, any> = {};

  if (ObjectId.isValid(studentID)) {
    filter.student_id = new ObjectId(studentID);
  } else {
    filter.student_id = studentID;
  }

  if (ObjectId.isValid(classID)) {
    filter.class_id = new ObjectId(classID);
  } else {
    filter.class_id = classID;
  }

  if (subjectID) {
    filter.subject_id = ObjectId.isValid(subjectID) ? new ObjectId(subjectID) : subjectID;
  }

  const grades = (await findGrades(db, filter, { year, date })) as unknown as Grade[];

  let isFifthGrade = false;
  if (ObjectId.isValid(classID)) {
    const classDoc = await db.collection("class").findOne({ _id: new ObjectId(classID) });
    isFifthGrade = isFifthGradeClassname(classDoc?.classname);
  }

  const statistics = calculateStatistics(grades, isFifthGrade);

  return NextResponse.json(statistics);
}
