import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const studentId = (body.ID || body.user_ID || body.username || "").toString().trim();
  const password = body.password;

  if (!studentId || !password) {
    return NextResponse.json({ message: "მონაცემები არასწორია" }, { status: 401 });
  }

  const db = await getDb();
  const result = await db.collection("students").findOne({
    $or: [{ ID: studentId }, { user_ID: studentId }]
  });

  if (!result) {
    return NextResponse.json({ message: "მონაცემები არასწორია" }, { status: 401 });
  }

  const match = await bcrypt.compare(password, result.password);
  if (match) {
    const returnId = result.ID || result.user_ID || studentId;
    const response: { message: string; user_ID: string; ID: string; class_id?: string } = {
      message: "ავტორიზაცია წარმატებით დასრულდა",
      user_ID: returnId,
      ID: returnId,
    };
    if (result.class_id) {
      response.class_id = result.class_id.toString();
    }
    return NextResponse.json(response);
  }
  return NextResponse.json({ message: "მონაცემები არასწორია" }, { status: 401 });
}
