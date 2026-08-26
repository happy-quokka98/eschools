import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const collection = db.collection("students");

  // Try string _id
  let result = await collection.deleteOne({ _id: id as unknown as ObjectId });
  if (result.deletedCount > 0) {
    return NextResponse.json({ message: "მოსწავლე წარმატებით წაიშალა" });
  }

  // Try ObjectId
  if (ObjectId.isValid(id)) {
    result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount > 0) {
      return NextResponse.json({ message: "მოსწავლე წარმატებით წაიშალა" });
    }
  }

  // Try user_ID
  result = await collection.deleteOne({ user_ID: id });
  if (result.deletedCount > 0) {
    return NextResponse.json({ message: "მოსწავლე წარმატებით წაიშალა" });
  }

  return NextResponse.json({ message: "მოსწავლე ვერ მოიძებნა" }, { status: 404 });
}
