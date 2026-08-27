import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

const getAcademicYearString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  // Transitions to next academic year starting September 1st
  let startYear = month >= 9 ? year : year - 1;
  let endYear = startYear + 1;
  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
};

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const currentYear = getAcademicYearString();

    const classes = await db.collection("class").find({}).toArray();

    for (const cls of classes) {
      // Calculate promoted name
      let promotedClassname = cls.classname;
      let isGraduated = false;
      const match = cls.classname.match(/^(\d+)(.*)$/);
      if (match) {
        const gradeNum = parseInt(match[1], 10);
        const suffix = match[2];
        if (gradeNum >= 12) {
          promotedClassname = `კურსდამთავრებული - ${cls.classname}`;
          isGraduated = true;
        } else {
          promotedClassname = `${gradeNum + 1}${suffix}`;
        }
      }

      // Save class history
      const historyEntry = {
        year: currentYear,
        classname: cls.classname,
        subjects: cls.subjects || [],
        calendar: cls.calendar || null
      };

      const updateFields: any = {
        classname: promotedClassname,
        calendar: null // Reset calendar for the new academic year
      };

      if (isGraduated) {
        updateFields.subjects = [];
      } else {
        updateFields.subjects = cls.subjects || []; // Keep existing subjects!
      }

      await db.collection("class").updateOne(
        { _id: cls._id },
        {
          $set: updateFields,
          $push: {
            history: historyEntry
          }
        } as any
      );
    }

    // Update settings in database to mark this year as promoted
    await db.collection("settings").updateOne(
      { key: "class_promotion" },
      { $set: { lastPromotedYear: currentYear } },
      { upsert: true }
    );

    return NextResponse.json({ message: "კლასები წარმატებით დაწინაურდა" });
  } catch (error) {
    console.error("Error in promote-classes route:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}
