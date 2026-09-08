import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("eschools");
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");
    const subjectId = searchParams.get("subject_id");
    const type = searchParams.get("type");

    let query: any = {};
    if (classId) {
      if (classId.includes(",")) {
        query.class_id = { $in: classId.split(",").map((s) => s.trim()) };
      } else {
        query.class_id = classId;
      }
    }
    if (subjectId) query.subject_id = subjectId;
    if (type) query.type = type;

    const exams = await db.collection("exams").find(query).sort({ date: 1 }).toArray();

    // Attach className and subjectName for UI display
    const classes = await db.collection("class").find({}).toArray();
    const subjects = await db.collection("subjects").find({}).toArray();

    const classMap: Record<string, string> = {};
    for (const c of classes) {
      classMap[c._id.toString()] = c.classname || c.ID || "";
    }

    const subjectMap: Record<string, string> = {};
    for (const s of subjects) {
      subjectMap[s._id.toString()] = s.name || "";
    }

    const enrichedExams = exams.map((ex: any) => ({
      ...ex,
      _id: ex._id.toString(),
      className: classMap[ex.class_id] || ex.className || "",
      subjectName: subjectMap[ex.subject_id] || ex.subjectName || "",
    }));

    return NextResponse.json(enrichedExams);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, title, class_id, subject_id, date, time, location, student_ids } = body;

    if (!type || !title || !class_id || !date) {
      return NextResponse.json({ error: "აუცილებელი ველები შევსებული არ არის" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("eschools");

    const newExam = {
      type, // 'annual' | 'semester' | 'autumn' | 'extern_30' | 'make_up'
      title,
      class_id,
      subject_id,
      date,
      time: time || "10:00",
      location: location || "საგამოცდო ოთახი",
      student_ids: student_ids || [],
      results: {},
      created_at: new Date().toISOString()
    };

    const res = await db.collection("exams").insertOne(newExam);
    return NextResponse.json({ success: true, id: res.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { examId, results } = body;

    if (!examId || !results) {
      return NextResponse.json({ error: "არასწორი პარამეტრები" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("eschools");

    await db.collection("exams").updateOne(
      { _id: new ObjectId(examId) },
      { $set: { results, updated_at: new Date().toISOString() } }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
