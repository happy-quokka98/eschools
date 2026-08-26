import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { student_id, oldPassword, newPassword } = await req.json();

    if (!student_id || !oldPassword || !newPassword) {
      return NextResponse.json({ message: "ყველა ველი აუცილებელია" }, { status: 400 });
    }

    const trimmed = student_id.toString().trim();
    const db = await getDb();
    let student = null;
    if (ObjectId.isValid(trimmed)) {
      student = await db.collection("students").findOne({ _id: new ObjectId(trimmed) });
    }
    if (!student) {
      student = await db.collection("students").findOne({
        $or: [{ ID: trimmed }, { user_ID: trimmed }]
      });
    }

    if (!student) {
      return NextResponse.json({ message: "მოსწავლე ვერ მოიძებნა" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(oldPassword, student.password);
    if (!isMatch) {
      return NextResponse.json({ message: "ძველი პაროლი არასწორია" }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.collection("students").updateOne(
      { _id: student._id },
      { $set: { password: hashedNewPassword } }
    );

    return NextResponse.json({ message: "პაროლი წარმატებით შეიცვალა" });
  } catch (error) {
    console.error("Error in change-password API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}
