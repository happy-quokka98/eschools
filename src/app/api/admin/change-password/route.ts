import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { admin_id, user_ID, oldPassword, newPassword } = await req.json();

    if ((!admin_id && !user_ID) || !oldPassword || !newPassword) {
      return NextResponse.json({ message: "ყველა ველი აუცილებელია" }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ message: "ახალი პაროლი უნდა იყოს სულ მცირე 4 სიმბოლო" }, { status: 400 });
    }

    const db = await getDb();
    let admin = null;

    const targetId = (admin_id || user_ID || "").toString().trim();
    if (ObjectId.isValid(targetId)) {
      admin = await db.collection("admins").findOne({ _id: new ObjectId(targetId) });
    }
    if (!admin) {
      admin = await db.collection("admins").findOne({ user_ID: targetId });
    }

    if (!admin) {
      return NextResponse.json({ message: "ადმინისტრატორი ვერ მოიძებნა" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return NextResponse.json({ message: "ძველი პაროლი არასწორია" }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.collection("admins").updateOne(
      { _id: admin._id },
      { $set: { password: hashedNewPassword } }
    );

    return NextResponse.json({ message: "პაროლი წარმატებით შეიცვალა" });
  } catch (error) {
    console.error("Error in admin change-password API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}
