import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCachedOrFetch } from "@/lib/cache";

export async function GET() {
  const results = await getCachedOrFetch("all_subjects_formatted", 60000, async () => {
    const db = await getDb();
    const raw = await db.collection("subjects").find({}).toArray();
    return raw.map(s => {
      const nameStr = s.name || s.subject_name || s.ID || "";
      return {
        ...s,
        _id: s._id.toString(),
        name: nameStr,
        subject_name: nameStr,
      };
    });
  });

  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
    }
  });
}
