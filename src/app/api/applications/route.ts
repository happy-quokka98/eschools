import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("eschools");
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacher_id");
    const status = searchParams.get("status");

    let query: any = {};
    if (teacherId) query.teacher_id = teacherId;
    if (status) query.status = status;

    const applications = await db.collection("applications").find(query).sort({ _id: -1 }).toArray();
    return NextResponse.json(applications);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      teacher_id,
      teacher_name,
      student_id,
      student_name,
      class_id,
      subject_id,
      grade_id,
      request_type,
      current_point,
      new_point,
      current_pointType,
      new_pointType,
      reason
    } = body;

    if (!teacher_id || !student_id || !reason) {
      return NextResponse.json({ error: "აუცილებელი ველები შევსებული არ არის" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("eschools");

    const newRequest = {
      teacher_id,
      teacher_name: teacher_name || "მასწავლებელი",
      student_id,
      student_name: student_name || "მოსწავლე",
      class_id,
      subject_id,
      grade_id,
      request_type: request_type || "grade_correction",
      current_point,
      new_point,
      current_pointType,
      new_pointType,
      reason,
      status: "pending",
      created_at: new Date().toISOString()
    };

    const res = await db.collection("applications").insertOne(newRequest);
    return NextResponse.json({ success: true, id: res.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, status } = body; // status: 'approved' | 'rejected'

    if (!requestId || !status) {
      return NextResponse.json({ error: "არასწორი პარამეტრები" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("eschools");

    const appObj = await db.collection("applications").findOne({ _id: new ObjectId(requestId) });
    if (!appObj) {
      return NextResponse.json({ error: "მოთხოვნა ვერ მოიძებნა" }, { status: 404 });
    }

    await db.collection("applications").updateOne(
      { _id: new ObjectId(requestId) },
      { $set: { status, updated_at: new Date().toISOString() } }
    );

    // If approved and has grade_id, mutate the grade in DB
    if (status === "approved" && appObj.grade_id) {
      if (appObj.request_type === "grade_deletion") {
        await db.collection("grades").deleteOne({ _id: new ObjectId(appObj.grade_id) });
      } else if (appObj.request_type === "grade_correction") {
        const updateFields: any = {};
        if (appObj.new_point !== undefined) updateFields.point = appObj.new_point;
        if (appObj.new_pointType !== undefined) updateFields.pointType = appObj.new_pointType;

        await db.collection("grades").updateOne(
          { _id: new ObjectId(appObj.grade_id) },
          { $set: updateFields }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
