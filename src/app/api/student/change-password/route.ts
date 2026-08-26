import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { student_id, oldPassword, newPassword } = await req.json();

    if (!student_id || !oldPassword || !newPassword) {
      return NextResponse.json({ message: "ყველა ველი აუცილებელია" }, { status: 400 });
    }

    const db = await getDb();
    const student = await db.collection("students").findOne({ user_ID: student_id });

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
