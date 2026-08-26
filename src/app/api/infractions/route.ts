import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("eschools");
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("student_id");

    let query: any = {};
    if (studentId) query.student_id = studentId;

    const infractions = await db.collection("infractions").find(query).sort({ _id: -1 }).toArray();
    return NextResponse.json(infractions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student_id, student_name, class_id, mandaturi_ref_id, category, description, infraction_date } = body;

    if (!student_id || !mandaturi_ref_id || !description) {
      return NextResponse.json({ error: "გთხოვთ შეავსოთ სავალდებულო ველები" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("eschools");

    const newInfraction = {
      student_id,
      student_name: student_name || "მოსწავლე",
      class_id,
      mandaturi_ref_id,
      category: category || "დისციპლინური",
      description,
      infraction_date: infraction_date || new Date().toISOString().split("T")[0],
      principal_response_doc: "",
      principal_response_notes: "",
      status: "pending",
      created_at: new Date().toISOString()
    };

    const res = await db.collection("infractions").insertOne(newInfraction);
    return NextResponse.json({ success: true, id: res.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, principal_response_doc, principal_response_notes, status } = body;

    if (!id) {
      return NextResponse.json({ error: "არასწორი ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("eschools");

    const updateFields: any = {
      updated_at: new Date().toISOString()
    };
    if (principal_response_doc !== undefined) updateFields.principal_response_doc = principal_response_doc;
    if (principal_response_notes !== undefined) updateFields.principal_response_notes = principal_response_notes;
    if (status !== undefined) updateFields.status = status;

    await db.collection("infractions").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
