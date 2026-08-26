import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const db = await getDb();
  const user = await db.collection("users").findOne({ user_ID: username });

  if (user && await bcrypt.compare(password, user.password)) {
    return NextResponse.json({ message: "ავტორიზაცია წარმატებით დასრულდა" });
  }

  return NextResponse.json({ message: "მომხმარებლის სახელი ან პაროლი არასწორია" }, { status: 401 });
}
