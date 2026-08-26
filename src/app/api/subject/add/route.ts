import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const nameStr = body.name || body.subject_name || body.ID;
  if (!nameStr) {
    return NextResponse.json({ message: "Subject name is required" }, { status: 400 });
  }

  const db = await getDb();
  const collection = db.collection("subjects");

  const existing = await collection.findOne({
    $or: [{ name: nameStr }, { subject_name: nameStr }]
  });
  if (existing) {
    return NextResponse.json({ message: "Subject already exists" }, { status: 409 });
  }

  const doc = {
    ...body,
    name: nameStr,
    subject_name: nameStr,
  };

  await collection.insertOne(doc);
  return NextResponse.json({ message: "Subject added successfully" }, { status: 201 });
}
