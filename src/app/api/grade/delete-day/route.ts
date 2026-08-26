import { NextRequest, NextResponse } from "next/server";
import { getDb, getGradesCollectionName } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const { date, class_id, subject_id } = await req.json();

    if (!date) {
      return NextResponse.json({ message: "date ველი აუცილებელია" }, { status: 400 });
    }

    const db = await getDb();
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

    return NextResponse.json({
      message: `${date} თარიღის მონაცემები წარმატებით წაიშალა!`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error("Error deleting day grades:", error);
    return NextResponse.json({ message: error.message || "სერვერის შეცდომა" }, { status: 500 });
  }
}
