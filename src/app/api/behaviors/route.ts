import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Behavior } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    const { student_id, teacher_id, teacher_name, class_id, type, points, category, comment } = await req.json();

    if (!student_id || !teacher_id || !class_id || !type || !points || !category) {
      return NextResponse.json({ message: "აუცილებელი ველები შევსებული არ არის" }, { status: 400 });
    }

    const db = await getDb();
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toTimeString().split(' ')[0];

    const behavior: Behavior = {
      student_id,
      teacher_id,
      teacher_name: teacher_name || "მასწავლებელი",
      class_id,
      type,
      points: Number(points),
      category,
      comment: comment || "",
      date: dateStr,
      time: timeStr
    };

    await db.collection("behaviors").insertOne(behavior);

    return NextResponse.json({ message: "ქცევა წარმატებით ჩაიწერა" });
  } catch (error) {
    console.error("Error in POST behavior API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const student_id = req.nextUrl.searchParams.get("student_id");
    const class_id = req.nextUrl.searchParams.get("class_id");

    const db = await getDb();
    const query: Record<string, any> = {};

    if (student_id) {
      query.student_id = student_id;
    }
    if (class_id) {
      query.class_id = class_id;
    }

    const behaviors = await db.collection("behaviors")
      .find(query)
      .sort({ date: -1, time: -1 })
      .toArray();

    return NextResponse.json(behaviors);
  } catch (error) {
    console.error("Error in GET behaviors API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}
