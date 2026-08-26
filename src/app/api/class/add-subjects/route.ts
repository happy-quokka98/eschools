import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const { class_id, subjects } = await req.json();

  if (!ObjectId.isValid(class_id)) {
    return NextResponse.json({ message: "Invalid Class ID" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("class").updateOne(
    { _id: new ObjectId(class_id) },
    { $addToSet: { subjects: { $each: subjects } } }
  );

  return NextResponse.json({ message: "Subjects added successfully" });
}
