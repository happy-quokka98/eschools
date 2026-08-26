import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { name, surname, user_ID, password, class_id } = await req.json();

  if (!ObjectId.isValid(class_id)) {
    return NextResponse.json({ message: "კლასის ID-ის ფორმატი არასწორია" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password || user_ID, 10);

  const student = {
    name,
    surname,
    user_ID,
    password: hashedPassword,
    class_id: new ObjectId(class_id),
  };

  const db = await getDb();
  await db.collection("students").insertOne(student);
  return NextResponse.json({ message: "მოსწავლე წარმატებით დაემატა", user_ID });
}
