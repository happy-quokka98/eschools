import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const { teacher_id, calendar } = await req.json();

  if (!ObjectId.isValid(teacher_id)) {
    return NextResponse.json({ message: "მასწავლებლის ID-ის ფორმატი არასწორია" }, { status: 400 });
  }

  if (!calendar || calendar.length !== 5) {
    return NextResponse.json({ message: "კალენდარი უნდა შეიცავდეს 5 დღეს (ორშაბათი-პარასკევი)" }, { status: 400 });
  }

  for (const day of calendar) {
    if (day.length > 7) {
      return NextResponse.json({ message: "თითოეულ დღეს მაქსიმუმ 7 გაკვეთილი შეიძლება იყოს" }, { status: 400 });
    }
  }

  const db = await getDb();
  const result = await db.collection("teachers").updateOne(
    { _id: new ObjectId(teacher_id) },
    { $set: { calendar } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ message: "მასწავლებელი ვერ მოიძებნა" }, { status: 404 });
  }
  return NextResponse.json({ message: "კალენდარი წარმატებით განახლდა" });
}
