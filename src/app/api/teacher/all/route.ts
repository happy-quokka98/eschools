import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();
  const results = await db.collection("teachers").find({}, { projection: { password: 0 } }).toArray();
  const formatted = results.map(t => ({
    ...t,
    _id: t._id.toString(),
  }));
  return NextResponse.json(formatted);
}
