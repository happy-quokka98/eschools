import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, surname, user_ID } = body;

  let classID = body.class_id;
  if (!classID && body.classInfo && body.classInfo._id) {
    classID = body.classInfo._id;
  }

  if (!name || !surname || !user_ID || !classID) {
    return NextResponse.json({ message: "ყველა ველი აუცილებელია (name, surname, user_ID, class_id)" }, { status: 400 });
  }

  if (!ObjectId.isValid(classID.trim())) {
    return NextResponse.json({ message: "კლასის ID-ის ფორმატი არასწორია" }, { status: 400 });
  }

  const classObjID = new ObjectId(classID.trim());
  const db = await getDb();
  const collection = db.collection("students");
  const update = { $set: { name, surname, user_ID, class_id: classObjID } };

  // Try string _id
  let result = await collection.updateOne({ _id: id as never }, update);
  if (result.matchedCount > 0) {
    return NextResponse.json({ message: "მოსწავლის მონაცემები წარმატებით განახლდა" });
  }

  // Try user_ID
  result = await collection.updateOne({ user_ID: id }, update);
  if (result.matchedCount > 0) {
    return NextResponse.json({ message: "მოსწავლის მონაცემები წარმატებით განახლდა" });
  }

  // Try name+surname
  if (name && surname) {
    result = await collection.updateOne({ name, surname }, update);
    if (result.matchedCount > 0) {
      return NextResponse.json({ message: "მოსწავლის მონაცემები წარმატებით განახლდა" });
    }
  }

  return NextResponse.json({ message: "მოსწავლე ვერ მოიძებნა" }, { status: 404 });
}
