import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawId = body?.id || body?.teacherId || body?.ID || body?.user_ID;

    if (!rawId || typeof rawId !== "string") {
      return NextResponse.json({ message: "ID აუცილებელია" }, { status: 400 });
    }

    const trimmedId = rawId.trim();
    const db = await getDb();
    const collection = db.collection("teachers");

    // Find teacher by various ID formats
    let teacher = null;
    if (ObjectId.isValid(trimmedId)) {
      teacher = await collection.findOne({ _id: new ObjectId(trimmedId) });
    }
    if (!teacher) {
      teacher = await collection.findOne({ _id: trimmedId as any });
    }
    if (!teacher) {
      teacher = await collection.findOne({ ID: trimmedId });
    }
    if (!teacher) {
      teacher = await collection.findOne({ user_ID: trimmedId });
    }

    if (!teacher) {
      return NextResponse.json({ message: "მასწავლებელი ვერ მოიძებნა" }, { status: 404 });
    }

    const defaultPassword = teacher.ID || teacher.user_ID || "123456";
    const newHashedPassword = await bcrypt.hash(defaultPassword, 10);

    await collection.updateOne({ _id: teacher._id }, { $set: { password: newHashedPassword } });

    return NextResponse.json({ message: "პაროლი წარმატებით განახლდა" });
  } catch (err: any) {
    console.error("Error in teacher reset-password:", err);
    return NextResponse.json({ message: err.message || "შეცდომა პაროლის აღდგენისას" }, { status: 500 });
  }
}
