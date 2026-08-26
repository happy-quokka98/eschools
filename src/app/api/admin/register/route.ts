import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const admin = await req.json();
  const hashedPassword = await bcrypt.hash(admin.password, 10);
  admin.password = hashedPassword;

  const db = await getDb();
  await db.collection("admins").insertOne(admin);
  return NextResponse.json({ message: "ადმინისტრატორი წარმატებით დარეგისტრირდა", user_ID: admin.user_ID });
}
