import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCachedOrFetch } from "@/lib/cache";

export async function GET() {
  const results = await getCachedOrFetch("all_classes_formatted", 60000, async () => {
    const db = await getDb();
    const rawResults = await db.collection("class").find({}).toArray();
    return rawResults.map((cls: any) => {
      const classname = cls.ID || cls.classname || "";
      return {
        ...cls,
        _id: cls._id.toString(),
        ID: classname,
        classname: classname,
      };
    });
  });

  return NextResponse.json(results || [], {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
    }
  });
}
