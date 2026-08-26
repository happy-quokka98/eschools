import { NextRequest, NextResponse } from "next/server";
import { getDb, getGradesCollectionName } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const { id, date } = await req.json();

    if (!id || !date) {
      return NextResponse.json({ message: "id და date საჭიროა" }, { status: 400 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "არასწორი id ფორმატი" }, { status: 400 });
    }

    const db = await getDb();
    const collectionName = getGradesCollectionName(date);

    const result = await db.collection(collectionName).deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "ნიშანი ვერ მოიძებნა" }, { status: 404 });
    }

    return NextResponse.json({ message: "ნიშანი წარმატებით წაიშალა!" });
  } catch (error) {
    console.error("Error deleting grade:", error);
    return NextResponse.json({ message: "სერვერის შეცდომა" }, { status: 500 });
  }
}
