import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();
  const raw = await db.collection("subjects").find({}).toArray();
  const results = raw.map(s => {
    const nameStr = s.name || s.subject_name || s.ID || "";
    return {
      ...s,
      _id: s._id.toString(),
      name: nameStr,
      subject_name: nameStr,
    };
  });
  return NextResponse.json(results);
}
