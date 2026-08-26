import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { user_ID, password } = await req.json();
  const db = await getDb();
  const result = await db.collection("admins").findOne({ user_ID });
  if (!result) {
    return NextResponse.json({ message: "მონაცემები არასწორია" }, { status: 401 });
  }
  const match = await bcrypt.compare(password, result.password);
  if (match) {
    const role = result.role || (result.user_ID === "kakhi-kakhidze" ? "superadmin" : "admin");
    return NextResponse.json({
      message: "ავტორიზაცია წარმატებით დასრულდა",
      user_ID: result.user_ID,
      role,
      name: result.name,
      surname: result.surname
    });
  }
  return NextResponse.json({ message: "მონაცემები არასწორია" }, { status: 401 });
}
