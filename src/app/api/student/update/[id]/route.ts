import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, surname, user_ID, ID, image, role } = body;
  const studentId = ID || user_ID;

  let classID = body.class_id;
  if (!classID && body.classInfo && body.classInfo._id) {
    classID = body.classInfo._id;
  }

  if (!name || !surname || !studentId || !classID) {
    return NextResponse.json({ message: "ყველა ველი აუცილებელია (name, surname, ID, class_id)" }, { status: 400 });
  }

  if (!ObjectId.isValid(classID.toString().trim())) {
    return NextResponse.json({ message: "კლასის ID-ის ფორმატი არასწორია" }, { status: 400 });
  }

  const classObjID = new ObjectId(classID.toString().trim());
  const db = await getDb();
  const collection = db.collection("students");
  const updateFields: any = {
    name,
    surname,
    ID: studentId,
    user_ID: studentId,
    role: role || "student",
    class_id: classObjID,
  };
  if (image !== undefined) updateFields.image = image;
  const update = { $set: updateFields };

  if (ObjectId.isValid(id)) {
    const res = await collection.updateOne({ _id: new ObjectId(id) }, update);
    if (res.matchedCount > 0) {
      return NextResponse.json({ message: "მოსწავლის მონაცემები წარმატებით განახლდა" });
    }
  }

  let result = await collection.updateOne({ $or: [{ ID: id }, { user_ID: id }] }, update);
  if (result.matchedCount > 0) {
    return NextResponse.json({ message: "მოსწავლის მონაცემები წარმატებით განახლდა" });
  }

  if (name && surname) {
    result = await collection.updateOne({ name, surname }, update);
    if (result.matchedCount > 0) {
      return NextResponse.json({ message: "მოსწავლის მონაცემები წარმატებით განახლდა" });
    }
  }

  return NextResponse.json({ message: "მოსწავლე ვერ მოიძებნა" }, { status: 404 });
}
