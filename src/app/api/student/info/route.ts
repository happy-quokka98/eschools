import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  const userID = req.nextUrl.searchParams.get("user_ID") || req.nextUrl.searchParams.get("ID") || req.nextUrl.searchParams.get("id");
  if (!userID) {
    return NextResponse.json({ message: "Missing user_ID parameter" }, { status: 400 });
  }

  const trimmed = userID.trim();
  const db = await getDb();

  let result = null;
  if (ObjectId.isValid(trimmed)) {
    result = await db.collection("students").findOne({ _id: new ObjectId(trimmed) });
  }
  if (!result) {
    result = await db.collection("students").findOne({
      $or: [{ ID: trimmed }, { user_ID: trimmed }]
    });
  }

  if (result) {
    const idVal = result.ID || result.user_ID || "";
    return NextResponse.json({
      ...result,
      _id: result._id.toString(),
      ID: idVal,
      user_ID: idVal,
      role: result.role || "student",
      image: result.image || "",
      points: result.points || []
    });
  }
  return NextResponse.json({ message: "User not found" }, { status: 404 });
}
