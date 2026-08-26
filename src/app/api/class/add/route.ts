import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const classData = await req.json();
  const db = await getDb();
  const collection = db.collection("class");

  const existing = await collection.findOne({ classname: classData.classname });
  if (existing) {
    return NextResponse.json({ message: "Class already exists" }, { status: 409 });
  }

  await collection.insertOne(classData);
  return NextResponse.json({ message: "Class added successfully" }, { status: 201 });
}
