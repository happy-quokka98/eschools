import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ grade: string }> }
) {
  const { grade: gradeParam } = await params;
  const grade = parseInt(gradeParam, 10);
  if (Number.isNaN(grade)) {
    return NextResponse.json({ message: "Invalid grade" }, { status: 400 });
  }

  const parallel = req.nextUrl.searchParams.get("parallel");
  const classnameRegex = parallel
    ? `^${grade}${parallel}$`
    : `^${grade}[ა-ჰ]$`;

  const db = await getDb();

  // 1. Fetch matching classes first
  const classes = await db.collection("class")
    .find({ classname: { $regex: classnameRegex } })
    .toArray();
  const classIds = classes.map(c => c._id);

  // 2. Query students belonging to these class IDs (uses index on class_id)
  const students = await db.collection("students")
    .find({ class_id: { $in: classIds } }, { projection: { password: 0 } })
    .toArray();

  // 3. Attach classInfo in JS memory
  const classMap = new Map(classes.map(c => [c._id.toString(), c]));
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
