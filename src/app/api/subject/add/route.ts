import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const subject = await req.json();
  const db = await getDb();
  const collection = db.collection("subjects");

  const existing = await collection.findOne({ name: subject.name });
  if (existing) {
    return NextResponse.json({ message: "Subject already exists" }, { status: 409 });
  }

  await collection.insertOne(subject);
  return NextResponse.json({ message: "Subject added successfully" }, { status: 201 });
}
