import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, surname, user_ID, ID } = body;
  const teacherId = ID || user_ID;

  if (!name || !surname || !teacherId) {
    return NextResponse.json({ message: "ყველა ველი აუცილებელია (name, surname, ID)" }, { status: 400 });
  }

  const db = await getDb();
  const collection = db.collection("teachers");
  const update = { $set: { name, surname, ID: teacherId, user_ID: teacherId } };

  if (ObjectId.isValid(id)) {
    const res = await collection.updateOne({ _id: new ObjectId(id) }, update);
    if (res.matchedCount > 0) {
      return NextResponse.json({ message: "მასწავლებლის მონაცემები წარმატებით განახლდა" });
    }
  }

  // Try ID or user_ID
  let result = await collection.updateOne({ $or: [{ ID: id }, { user_ID: id }] }, update);
  if (result.matchedCount > 0) {
    return NextResponse.json({ message: "მასწავლებლის მონაცემები წარმატებით განახლდა" });
  }

  // Try name+surname
  result = await collection.updateOne({ name, surname }, update);
  if (result.matchedCount > 0) {
    return NextResponse.json({ message: "მასწავლებლის მონაცემები წარმატებით განახლდა" });
  }

  return NextResponse.json({ message: "მასწავლებელი ვერ მოიძებნა" }, { status: 404 });
}
