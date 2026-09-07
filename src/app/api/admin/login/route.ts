import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { user_ID, password } = await req.json();
  const db = await getDb();
  let result = await db.collection("admins").findOne({ user_ID });

  if (!result && user_ID === "resource_center") {
    const hashedPassword = await bcrypt.hash(password || "resource_center", 10);
    const defaultRcDoc = {
      name: "რესურსცენტრი",
      surname: "სისტემის",
      user_ID: "resource_center",
      password: hashedPassword,
      role: "resource_center",
      createdAt: new Date().toISOString()
    };
    await db.collection("admins").insertOne({ ...defaultRcDoc });
    await db.collection("users").insertOne({ ...defaultRcDoc });
    result = await db.collection("admins").findOne({ user_ID: "resource_center" });
  }

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
