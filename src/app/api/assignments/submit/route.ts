import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("eschools");
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignment_id");
    const studentId = searchParams.get("student_id");

    let query: any = {};
    if (assignmentId) query.assignment_id = assignmentId;
    if (studentId) query.student_id = studentId;

    const submissions = await db.collection("assignment_submissions").find(query).sort({ _id: -1 }).toArray();
    return NextResponse.json(submissions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assignment_id, student_id, student_name, file_name, file_url, comment } = body;

    if (!assignment_id || !student_id) {
      return NextResponse.json({ error: "არასწორი პარამეტრები" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("eschools");

    const submission = {
      assignment_id,
      student_id,
      student_name: student_name || "მოსწავლე",
      file_name: file_name || "",
      file_url: file_url || "",
      comment: comment || "",
      status: "submitted",
      submitted_at: new Date().toISOString()
    };

    const res = await db.collection("assignment_submissions").insertOne(submission);
    return NextResponse.json({ success: true, id: res.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { submissionId, status, feedback } = body; // status: 'approved' | 'needs_resubmission'

    if (!submissionId || !status) {
      return NextResponse.json({ error: "არასწორი პარამეტრები" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("eschools");

    await db.collection("assignment_submissions").updateOne(
      { _id: new ObjectId(submissionId) },
      { $set: { status, feedback: feedback || "", reviewed_at: new Date().toISOString() } }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
