import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// GET: Load pedagogical council meetings (accessible by teachers and ped_council)
export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const meetings = await db.collection("ped_meetings")
      .find({})
      .sort({ date: -1, time: -1 })
      .toArray();

    const formatted = meetings.map(m => ({
      ...m,
      _id: m._id.toString()
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error in GET ped-council API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}

// POST: Schedule a new pedagogical council meeting (by ped_council head)
export async function POST(req: NextRequest) {
  try {
    const { title, date, time, agenda, scheduledBy } = await req.json();

    if (!title || !date || !time || !scheduledBy) {
      return NextResponse.json({ message: "ყველა ძირითადი ველი საჭიროა" }, { status: 400 });
    }

    const db = await getDb();
    const admin = await db.collection("admins").findOne({ user_ID: scheduledBy });
    
    const meeting = {
      title,
      date,
      time,
      agenda: agenda || "",
      scheduledBy,
      scheduledByName: admin ? `${admin.name} ${admin.surname}` : "პედსაბჭოს ხელმძღვანელი",
      createdAt: new Date().toISOString()
    };

    await db.collection("ped_meetings").insertOne(meeting);

    return NextResponse.json({ message: "პედსაბჭოს სხდომა წარმატებით ჩაინიშნა" });
  } catch (error) {
    console.error("Error in POST ped-council API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}
