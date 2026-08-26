import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const userID = req.nextUrl.searchParams.get("user_ID");
  if (!userID) {
    return NextResponse.json({ message: "Missing user_ID parameter" }, { status: 400 });
  }
  const db = await getDb();
  const result = await db.collection("students").findOne({ user_ID: userID });
  if (result) {
    return NextResponse.json(result);
  }
  return NextResponse.json({ message: "User not found" }, { status: 404 });
}
