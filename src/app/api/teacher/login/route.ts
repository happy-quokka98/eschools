import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { user_ID, password } = await req.json();
  const db = await getDb();
  const result = await db.collection("teachers").findOne({ user_ID });
  if (!result) {
    return NextResponse.json({ message: "მონაცემები არასწორია" }, { status: 401 });
  }
  const match = await bcrypt.compare(password, result.password);
  if (match) {
    return NextResponse.json({ message: "ავტორიზაცია წარმატებით დასრულდა", user_ID });
  }
  return NextResponse.json({ message: "მონაცემები არასწორია" }, { status: 401 });
}
