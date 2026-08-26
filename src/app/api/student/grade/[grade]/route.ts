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
    ? `^${grade}[\\s\\-_]*${parallel}$`
    : `^${grade}`;

  const db = await getDb();

  // 1. Fetch matching classes first (checks both ID and classname fields in MongoDB)
  const classes = await db.collection("class")
    .find({
      $or: [
        { ID: { $regex: classnameRegex, $options: "i" } },
        { classname: { $regex: classnameRegex, $options: "i" } }
      ]
    })
    .toArray();
  const classIds = classes.flatMap(c => [c._id, c._id.toString()]);

  // 2. Query students belonging to these class IDs (handles both ObjectId and string representation)
  const students = await db.collection("students")
    .find({ class_id: { $in: classIds } }, { projection: { password: 0, points: 0 } })
    .toArray();

  // 3. Attach classInfo in JS memory
  const classMap = new Map(classes.map(c => [c._id.toString(), c]));
  const results = students.map(student => {
    const cidStr = student.class_id ? student.class_id.toString() : null;
    const cObj = cidStr ? classMap.get(cidStr) : null;
    const classNameStr = cObj ? (cObj.ID || cObj.classname || "") : "";
    return {
      ...student,
      _id: student._id.toString(),
      ID: student.ID || student.user_ID || "",
      user_ID: student.user_ID || student.ID || "",
      role: student.role || "student",
      image: student.image || "",
      class_id: cidStr,
      classInfo: cObj ? {
        ...cObj,
        _id: cObj._id.toString(),
        ID: classNameStr,
        classname: classNameStr
      } : null
    };
  });

  return NextResponse.json(results);
}
