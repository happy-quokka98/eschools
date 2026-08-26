import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();
  const results = await db.collection("class").find({}).toArray();
  return NextResponse.json(results || []);
}
