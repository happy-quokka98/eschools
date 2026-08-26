import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("eschools");
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");
    const teacherId = searchParams.get("teacher_id");

    let query: any = {};
    if (classId) query.class_id = classId;
    if (teacherId) query.teacher_id = teacherId;

    const assignments = await db.collection("assignments").find(query).sort({ _id: -1 }).toArray();
    return NextResponse.json(assignments);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { class_id, subject_id, teacher_id, teacher_name, title, description, deadline } = body;

    if (!class_id || !title || !deadline) {
      return NextResponse.json({ error: "გთხოვთ შეავსოთ სავალდებულო ველები" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("eschools");

    const newAssignment = {
      class_id,
      subject_id,
      teacher_id,
      teacher_name: teacher_name || "მასწავლებელი",
      title,
      description: description || "",
      deadline,
      created_at: new Date().toISOString()
    };

    const res = await db.collection("assignments").insertOne(newAssignment);
    return NextResponse.json({ success: true, id: res.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
