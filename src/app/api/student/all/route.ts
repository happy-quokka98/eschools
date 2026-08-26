import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const gradeParam = req.nextUrl.searchParams.get("grade");
  const db = await getDb();

  let students: any[] = [];
  let classes: any[] = [];

  if (gradeParam) {
    const grade = parseInt(gradeParam, 10);
    if (!Number.isNaN(grade)) {
      classes = await db.collection("class")
        .find({ classname: { $regex: `^${grade}[ა-ჰ]$` } })
        .toArray();
      const classIds = classes.map(c => c._id);

      students = await db.collection("students")
        .find({ class_id: { $in: classIds } }, { projection: { password: 0 } })
        .toArray();
    } else {
      students = [];
      classes = [];
    }
  } else {
    classes = await db.collection("class").find({}).toArray();
    students = await db.collection("students").find({}, { projection: { password: 0 } }).toArray();
  }

  const allClassList = gradeParam ? await db.collection("class").find({}).toArray() : classes;
  const classMap = new Map(allClassList.map(c => [c._id.toString(), c]));

  const results = students.map(student => ({
    ...student,
    _id: student._id.toString(),
    class_id: student.class_id ? student.class_id.toString() : null,
    classInfo: student.class_id ? {
      ...classMap.get(student.class_id.toString()),
      _id: student.class_id.toString()
    } : null
  }));

  return NextResponse.json(results);
}
