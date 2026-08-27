import { NextRequest, NextResponse } from "next/server";
import { getDb, getGradesCollectionName } from "@/lib/db";
import { ObjectId } from "mongodb";
import { invalidateCache } from "@/lib/cache";

export async function POST(req: NextRequest) {
  try {
    const { id, date, isAdmin, teacher_id } = await req.json();

    if (!id || !date) {
      return NextResponse.json({ message: "id და date საჭიროა" }, { status: 400 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "არასწორი id ფორმატი" }, { status: 400 });
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
          { message: "მასწავლებელს ნიშნის წაშლა შეუძლია მხოლოდ 2 კვირის (14 დღის) ვადით. ჩასასწორებლად მიმართეთ ადმინისტრაციას." },
          { status: 403 }
        );
      }
    }
    const collectionName = getGradesCollectionName(date);

    const result = await db.collection(collectionName).deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "ნიშანი ვერ მოიძებნა" }, { status: 404 });
    }

    invalidateCache(["student_grades_", "top_students_api", "class_stats_"]);

    return NextResponse.json({ message: "ნიშანი წარმატებით წაიშალა!" });
  } catch (error) {
    console.error("Error deleting grade:", error);
    return NextResponse.json({ message: "სერვერის შეცდომა" }, { status: 500 });
  }
}
