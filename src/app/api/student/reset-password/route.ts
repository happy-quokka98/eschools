import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  const trimmedId = id.trim();

  const db = await getDb();
  const collection = db.collection("students");

  let student = await collection.findOne({ _id: trimmedId as unknown as ObjectId });
  if (!student && ObjectId.isValid(trimmedId)) {
    student = await collection.findOne({ _id: new ObjectId(trimmedId) });
  }
  if (!student) {
    student = await collection.findOne({ user_ID: trimmedId });
  }
  if (!student) {
    return NextResponse.json({ message: "მოსწავლე ვერ მოიძებნა" }, { status: 404 });
  }

  const newHashedPassword = await bcrypt.hash(student.user_ID, 10);
  await collection.updateOne({ _id: student._id }, { $set: { password: newHashedPassword } });

  return NextResponse.json({ message: "პაროლი წარმატებით განახლდა" });
}
