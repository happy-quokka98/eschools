import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const { teacher_id, availability } = await req.json();

    if (!teacher_id || !Array.isArray(availability)) {
      return NextResponse.json({ message: "არასწორი პარამეტრები" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("teachers");

    let query: any = {};
    if (ObjectId.isValid(teacher_id)) {
      query = { $or: [{ _id: new ObjectId(teacher_id) }, { user_ID: teacher_id }, { ID: teacher_id }] };
    } else {
      query = { $or: [{ user_ID: teacher_id }, { ID: teacher_id }] };
    }

    const res = await collection.updateOne(query, { $set: { availability } });
    if (res.matchedCount === 0) {
      return NextResponse.json({ message: "მასწავლებელი ვერ მოიძებნა" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "მასწავლებლის ხელმისაწვდომობა განახლდა" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
