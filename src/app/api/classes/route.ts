import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = await getDb();
  const rawResults = await db.collection("class").find({}).toArray();
  const results = rawResults.map((cls: any) => {
    const classname = cls.ID || cls.classname || "";
    return {
      ...cls,
      _id: cls._id.toString(),
      ID: classname,
      classname: classname,
    };
  });
  return NextResponse.json(results || []);
}
