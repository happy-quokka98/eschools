import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const teacher = await req.json();
  const hashedPassword = await bcrypt.hash(teacher.password || teacher.user_ID, 10);
  teacher.password = hashedPassword;

  const db = await getDb();
  await db.collection("teachers").insertOne(teacher);
  return NextResponse.json({ message: "მასწავლებელი წარმატებით დარეგისტრირდა", user_ID: teacher.user_ID });
}
