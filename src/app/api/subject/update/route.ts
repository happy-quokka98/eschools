import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { invalidateCache } from "@/lib/cache";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id, id, name, is_project, is_pass_fail } = body;
    const targetId = _id || id;
    if (!targetId) {
      return NextResponse.json({ message: "Subject ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("subjects");

    let query: any;
    try {
      query = { _id: new ObjectId(targetId) };
    } catch {
      query = { _id: targetId };
    }

    const updateFields: any = {};
    if (typeof name === "string" && name.trim()) {
      updateFields.name = name.trim();
      updateFields.subject_name = name.trim();
    }
    if (typeof is_project === "boolean") {
      updateFields.is_project = is_project;
      updateFields.is_pass_fail = is_project;
    } else if (typeof is_pass_fail === "boolean") {
      updateFields.is_project = is_pass_fail;
      updateFields.is_pass_fail = is_pass_fail;
    }

    const result = await collection.updateOne(query, { $set: updateFields });
    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Subject not found" }, { status: 404 });
    }

    invalidateCache(["all_subjects"]);

    return NextResponse.json({ message: "Subject updated successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update subject" }, { status: 500 });
  }
}
