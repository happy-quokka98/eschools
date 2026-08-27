import { NextRequest, NextResponse } from "next/server";
import { getDb, getGradesCollectionName } from "@/lib/db";
import { ObjectId } from "mongodb";
import { invalidateCache } from "@/lib/cache";

export async function POST(req: NextRequest) {
  try {
    const { date, class_id, subject_id, isAdmin, teacher_id } = await req.json();

    if (!date) {
      return NextResponse.json({ message: "date ველი აუცილებელია" }, { status: 400 });
    }

    const db = await getDb();

    if (!isAdmin) {
      const gDate = new Date(date);
      gDate.setHours(0, 0, 0, 0);

      let minAllowedDate: Date;
      if (teacher_id && ObjectId.isValid(teacher_id)) {
        const teacher = await db.collection("teachers").findOne({ _id: new ObjectId(teacher_id) });
        if (teacher && teacher.gradeEntryStartDate) {
          minAllowedDate = new Date(teacher.gradeEntryStartDate);
          minAllowedDate.setHours(0, 0, 0, 0);
        } else {
          minAllowedDate = new Date();
          minAllowedDate.setDate(minAllowedDate.getDate() - 14);
          minAllowedDate.setHours(0, 0, 0, 0);
        }
      } else {
        minAllowedDate = new Date();
        minAllowedDate.setDate(minAllowedDate.getDate() - 14);
        minAllowedDate.setHours(0, 0, 0, 0);
      }

      if (gDate < minAllowedDate) {
        return NextResponse.json(
          { message: "მასწავლებელს დღის მონაცემების წაშლა შეუძლია მხოლოდ 2 კვირის (14 დღის) ვადით." },
          { status: 403 }
        );
      }
    }
    const collectionName = getGradesCollectionName(date);
    const collection = db.collection(collectionName);

    const filter: any = { date };

    if (class_id) {
      if (ObjectId.isValid(class_id)) {
        filter.class_id = new ObjectId(class_id);
      } else {
        filter.class_id = class_id;
      }
    }

    if (subject_id && subject_id !== "all") {
      if (ObjectId.isValid(subject_id)) {
        filter.subject_id = new ObjectId(subject_id);
      } else {
        filter.subject_id = subject_id;
      }
    }

    const result = await collection.deleteMany(filter);

    invalidateCache(["student_grades_", "top_students_api", "class_stats_"]);

    return NextResponse.json({
      message: `${date} თარიღის მონაცემები წარმატებით წაიშალა!`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error("Error deleting day grades:", error);
    return NextResponse.json({ message: error.message || "სერვერის შეცდომა" }, { status: 500 });
  }
}
