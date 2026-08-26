import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("eschools");

    const registrations = await db.collection("extern_registrations").find({}).sort({ _id: -1 }).toArray();
    return NextResponse.json(registrations);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student_name, student_surname, personal_id, phone, email, subjects } = body;

    if (!student_name || !student_surname || !personal_id || !subjects || subjects.length === 0) {
      return NextResponse.json({ error: "გთხოვთ შეავსოთ სავალდებულო ველები" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("eschools");

    const newReg = {
      student_name,
      student_surname,
      personal_id,
      phone: phone || "",
      email: email || "",
      subjects,
      status: "pending",
      created_at: new Date().toISOString()
    };

    const res = await db.collection("extern_registrations").insertOne(newReg);
    return NextResponse.json({ success: true, id: res.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body; // status: 'approved' | 'rejected'

    if (!id || !status) {
      return NextResponse.json({ error: "არასწორი პარამეტრები" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("eschools");

    await db.collection("extern_registrations").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updated_at: new Date().toISOString() } }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
