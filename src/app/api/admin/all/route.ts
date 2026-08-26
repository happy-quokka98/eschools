import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();
  const results = await db.collection("admins").find({}, { projection: { password: 0 } }).toArray();
  const formatted = results.map(a => ({
    ...a,
    _id: a._id.toString(),
  }));
  return NextResponse.json(formatted);
}
