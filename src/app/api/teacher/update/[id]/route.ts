import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, surname, user_ID } = body;

  if (!name || !surname || !user_ID) {
    return NextResponse.json({ message: "ყველა ველი აუცილებელია (name, surname, user_ID)" }, { status: 400 });
  }

  const db = await getDb();
  const collection = db.collection("teachers");
  const update = { $set: { name, surname, user_ID } };

  // Try string _id
  let result = await collection.updateOne({ _id: id as never }, update);
  if (result.matchedCount > 0) {
    return NextResponse.json({ message: "მასწავლებლის მონაცემები წარმატებით განახლდა" });
  }

  // Try user_ID
  result = await collection.updateOne({ user_ID: id }, update);
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
