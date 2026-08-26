import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { CalendarEvent } from "@/lib/models";

function computeAcademicYear(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "2025-2026";
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  const startYear = month >= 8 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear}-${endYear}`;
}

export async function GET(req: NextRequest) {
  try {
    const academicYearParam = req.nextUrl.searchParams.get("academic_year");
    const db = await getDb();
    
    const filter: Record<string, any> = {};
    if (academicYearParam) {
      filter.academicYear = academicYearParam.trim();
    }

    const events = await db
      .collection<CalendarEvent>("calendar_events")
      .find(filter)
      .sort({ date: 1 })
      .toArray();

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error in GET calendar-events API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { date, type, title, replacementDayOfWeek, academicYear } = await req.json();

    if (!date || !type || !title) {
      return NextResponse.json({ message: "თარიღი, ტიპი და დასახელება აუცილებელია" }, { status: 400 });
    }

    if (type !== 'holiday' && type !== 'makeup') {
      return NextResponse.json({ message: "ტიპი უნდა იყოს 'holiday' ან 'makeup'" }, { status: 400 });
    }

    if (type === 'makeup' && (replacementDayOfWeek === undefined || replacementDayOfWeek === null || replacementDayOfWeek < 0 || replacementDayOfWeek > 4)) {
      return NextResponse.json({ message: "აღდგენის დღისთვის აუცილებელია შესაბამისი დღის (0-4) მითითება" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("calendar_events");

    const resolvedAcademicYear = academicYear && academicYear.trim() !== '' 
      ? academicYear.trim() 
      : computeAcademicYear(date);

    const eventDoc: Partial<CalendarEvent> = {
      date: date.trim(),
      type,
      title: title.trim(),
      replacementDayOfWeek: type === 'makeup' ? Number(replacementDayOfWeek) : undefined,
      academicYear: resolvedAcademicYear
    };

    // Upsert by date
    await collection.updateOne(
      { date: date.trim() },
      { $set: eventDoc },
      { upsert: true }
    );

    return NextResponse.json({ message: "კალენდრის მოვლენა წარმატებით შეინახა", academicYear: resolvedAcademicYear });
  } catch (error) {
    console.error("Error in POST calendar-events API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const date = req.nextUrl.searchParams.get("date");

    const db = await getDb();
    const collection = db.collection("calendar_events");

    if (id && ObjectId.isValid(id)) {
      await collection.deleteOne({ _id: new ObjectId(id) });
      return NextResponse.json({ message: "მოვლენა წარმატებით წაიშალა" });
    }

    if (date) {
      await collection.deleteOne({ date: date.trim() });
      return NextResponse.json({ message: "მოვლენა წარმატებით წაიშალა" });
    }

    return NextResponse.json({ message: "არასწორი პარამეტრები წაშლისთვის" }, { status: 400 });
  } catch (error) {
    console.error("Error in DELETE calendar-events API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}
