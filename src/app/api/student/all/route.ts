import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

import { getCachedOrFetch } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const gradeParam = req.nextUrl.searchParams.get("grade");
  const db = await getDb();

  if (!gradeParam) {
    const [classes, students] = await Promise.all([
      db.collection("class").find({}).toArray(),
      db.collection("students").find({}, { projection: { password: 0, points: 0 } }).toArray(),
    ]);
    const classMap = new Map(classes.map(c => [c._id.toString(), c]));
    const results = students.map(student => {
      const cidStr = student.class_id ? student.class_id.toString() : null;
      const cObj = cidStr ? classMap.get(cidStr) : null;
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
          ID: cObj.ID || cObj.classname || "",
          classname: cObj.classname || cObj.ID || ""
        } : null
      };
    });
    return NextResponse.json(results);
  }

  let students: any[] = [];
  let classes: any[] = [];
  const grade = parseInt(gradeParam, 10);

  if (!Number.isNaN(grade)) {
    classes = await db.collection("class")
      .find({ $or: [{ classname: { $regex: `^${grade}[ა-ჰ]$` } }, { ID: { $regex: `^${grade}[ა-ჰ]$` } }] })
      .toArray();
    const classIds = classes.map(c => c._id);
    students = await db.collection("students")
      .find({ class_id: { $in: classIds } }, { projection: { password: 0, points: 0 } })
      .toArray();
  }

  const allClassList = await db.collection("class").find({}).toArray();
  const classMap = new Map(allClassList.map(c => [c._id.toString(), c]));

  const results = students.map(student => {
    const cidStr = student.class_id ? student.class_id.toString() : null;
    const cObj = cidStr ? classMap.get(cidStr) : null;
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
        ID: cObj.ID || cObj.classname || "",
        classname: cObj.classname || cObj.ID || ""
      } : null
    };
  });

  return NextResponse.json(results);
}

