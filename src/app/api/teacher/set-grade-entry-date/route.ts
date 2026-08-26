import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const { teacherId, date } = await req.json();

  if (!ObjectId.isValid(teacherId)) {
    return NextResponse.json({ message: "მასწავლებლის ID-ის ფორმატი არასწორია" }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.collection("teachers").updateOne(
    { _id: new ObjectId(teacherId) },
    { $set: { gradeEntryStartDate: date } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ message: "მასწავლებელი ვერ მოიძებნა" }, { status: 404 });
  }
  return NextResponse.json({ message: "თარიღი წარმატებით განახლდა" });
}
