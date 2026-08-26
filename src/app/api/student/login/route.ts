import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { user_ID, password } = await req.json();
  const db = await getDb();
  const result = await db.collection("students").findOne({ user_ID });
  if (!result) {
    return NextResponse.json({ message: "მონაცემები არასწორია" }, { status: 401 });
  }
  const match = await bcrypt.compare(password, result.password);
  if (match) {
    const response: { message: string; user_ID: string; class_id?: string } = {
      message: "ავტორიზაცია წარმატებით დასრულდა",
      user_ID,
    };
    if (result.class_id) {
      response.class_id = result.class_id.toString();
    }
    return NextResponse.json(response);
  }
  return NextResponse.json({ message: "მონაცემები არასწორია" }, { status: 401 });
}
