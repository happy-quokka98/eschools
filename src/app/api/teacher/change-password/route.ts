import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { teacher_id, oldPassword, newPassword } = await req.json();

    if (!teacher_id || !oldPassword || !newPassword) {
      return NextResponse.json({ message: "ყველა ველი აუცილებელია" }, { status: 400 });
    }

    const trimmed = teacher_id.toString().trim();
    const db = await getDb();
    let teacher = null;
    if (ObjectId.isValid(trimmed)) {
      teacher = await db.collection("teachers").findOne({ _id: new ObjectId(trimmed) });
    }
    if (!teacher) {
      teacher = await db.collection("teachers").findOne({
        $or: [{ ID: trimmed }, { user_ID: trimmed }]
      });
    }

    if (!teacher) {
      return NextResponse.json({ message: "მასწავლებელი ვერ მოიძებნა" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(oldPassword, teacher.password);
    if (!isMatch) {
      return NextResponse.json({ message: "ძველი პაროლი არასწორია" }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.collection("teachers").updateOne(
      { _id: teacher._id },
      { $set: { password: hashedNewPassword } }
    );

    return NextResponse.json({ message: "პაროლი წარმატებით შეიცვალა" });
  } catch (error) {
    console.error("Error in teacher change-password API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}
