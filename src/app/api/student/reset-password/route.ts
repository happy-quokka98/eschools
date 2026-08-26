import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawId = body?.id || body?.studentId || body?.ID || body?.user_ID;

    if (!rawId || typeof rawId !== "string") {
      return NextResponse.json({ message: "ID აუცილებელია" }, { status: 400 });
    }

    const trimmedId = rawId.trim();
    const db = await getDb();
    const collection = db.collection("students");

    // Find student by various ID formats
    let student = null;
    if (ObjectId.isValid(trimmedId)) {
      student = await collection.findOne({ _id: new ObjectId(trimmedId) });
    }
    if (!student) {
      student = await collection.findOne({ _id: trimmedId as any });
    }
    if (!student) {
      student = await collection.findOne({ ID: trimmedId });
    }
    if (!student) {
      student = await collection.findOne({ user_ID: trimmedId });
    }

    if (!student) {
      return NextResponse.json({ message: "მოსწავლე ვერ მოიძებნა" }, { status: 404 });
    }

    const defaultPassword = student.ID || student.user_ID || "123456";
    const newHashedPassword = await bcrypt.hash(defaultPassword, 10);

    await collection.updateOne({ _id: student._id }, { $set: { password: newHashedPassword } });

    return NextResponse.json({ message: "პაროლი წარმატებით განახლდა" });
  } catch (err: any) {
    console.error("Error in student reset-password:", err);
    return NextResponse.json({ message: err.message || "შეცდომა პაროლის აღდგენისას" }, { status: 500 });
  }
}
