import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  const trimmedId = id.trim();

  const db = await getDb();
  const collection = db.collection("teachers");

  // Find teacher by various ID formats
  let teacher = await collection.findOne({ _id: trimmedId as unknown as ObjectId });
  if (!teacher && ObjectId.isValid(trimmedId)) {
    teacher = await collection.findOne({ _id: new ObjectId(trimmedId) });
  }
  if (!teacher) {
    teacher = await collection.findOne({ user_ID: trimmedId });
  }
  if (!teacher) {
    return NextResponse.json({ message: "მასწავლებელი ვერ მოიძებნა" }, { status: 404 });
  }

  const newHashedPassword = await bcrypt.hash(teacher.user_ID, 10);
  const update = { $set: { password: newHashedPassword } };

  // Update by the filter that found it
  await collection.updateOne({ _id: teacher._id }, update);

  return NextResponse.json({ message: "პაროლი წარმატებით განახლდა" });
}
