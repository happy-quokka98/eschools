import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { Announcement } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    const { title, content, author_id, author_name, class_id } = await req.json();

    if (!title || !content || !author_id || !author_name) {
      return NextResponse.json({ message: "ყველა ველი აუცილებელია" }, { status: 400 });
    }

    const db = await getDb();
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toTimeString().split(' ')[0];

    const announcement: Announcement = {
      title,
      content,
      author_id,
      author_name,
      class_id: class_id ? new ObjectId(class_id) : null,
      date: dateStr,
      time: timeStr
    };

    await db.collection("announcements").insertOne(announcement);

    return NextResponse.json({ message: "განცხადება წარმატებით გამოქვეყნდა" });
  } catch (error) {
    console.error("Error in POST announcements API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const role = req.nextUrl.searchParams.get("role");
    const classId = req.nextUrl.searchParams.get("class_id");

    const db = await getDb();
    const filter: Record<string, any> = {};

    if (role === "student" || role === "teacher") {
      const orConditions: any[] = [
        { class_id: null },
        { class_id: { $exists: false } }
      ];
      if (classId && ObjectId.isValid(classId)) {
        orConditions.push({ class_id: new ObjectId(classId) });
      }
      filter.$or = orConditions;
    }

    const announcements = await db.collection("announcements")
      .find(filter)
      .sort({ date: -1, time: -1 })
      .toArray();

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error in GET announcements API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: "არასწორი განცხადების ID" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("announcements").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: "განცხადება წარმატებით წაიშალა" });
  } catch (error) {
    console.error("Error in DELETE announcements API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}
