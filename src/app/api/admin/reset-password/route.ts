import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { id, newPassword } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "ადმინისტრატორის ID აუცილებელია" }, { status: 400 });
    }

    const db = await getDb();
    let admin = null;
    const trimmed = id.toString().trim();

    if (ObjectId.isValid(trimmed)) {
      admin = await db.collection("admins").findOne({ _id: new ObjectId(trimmed) });
    }
    if (!admin) {
      admin = await db.collection("admins").findOne({ user_ID: trimmed });
    }

    if (!admin) {
      return NextResponse.json({ message: "ადმინისტრატორი ვერ მოიძებნა" }, { status: 404 });
    }

    const passwordToSet = newPassword || "123456";
    const hashedPassword = await bcrypt.hash(passwordToSet, 10);

    await db.collection("admins").updateOne(
      { _id: admin._id },
      { $set: { password: hashedPassword } }
    );

    return NextResponse.json({ message: "პაროლი წარმატებით განახლდა" });
  } catch (error) {
    console.error("Error resetting admin password:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}
