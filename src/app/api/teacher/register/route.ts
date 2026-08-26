import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const teacher = await req.json();
  const teacherId = teacher.ID || teacher.user_ID;
  const rawPassword = teacher.password || teacherId;
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  const teacherDoc = {
    ...teacher,
    ID: teacherId,
    user_ID: teacherId,
    role: teacher.role || "teacher",
    phone: teacher.phone || "",
    classes: teacher.classes || [],
    password: hashedPassword,
  };

  const db = await getDb();
  await db.collection("teachers").insertOne(teacherDoc);
  return NextResponse.json({ message: "მასწავლებელი წარმატებით დარეგისტრირდა", ID: teacherId, user_ID: teacherId });
}
