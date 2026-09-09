import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { invalidateCache } from "@/lib/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subjectName, oldSubjectName, workloads } = body;

    if (!subjectName || typeof subjectName !== "string") {
      return NextResponse.json({ message: "Subject name is required" }, { status: 400 });
    }

    if (!Array.isArray(workloads)) {
      return NextResponse.json({ message: "Workloads must be an array" }, { status: 400 });
    }

    const db = await getDb();
    const classCollection = db.collection("class");

    const nameToMatch = (oldSubjectName || subjectName).trim().toLowerCase();
    const newName = subjectName.trim();

    for (const item of workloads) {
      const { classId, hours_per_week } = item;
      if (!classId) continue;

      let query: any;
      try {
        query = { _id: new ObjectId(classId) };
      } catch {
        query = { _id: classId };
      }

      const cls = await classCollection.findOne(query);
      if (!cls) continue;

      const subjectsArr: any[] = cls.subjects || [];
      const numHours = Math.max(0, parseInt(hours_per_week, 10) || 0);

      const existingIndex = subjectsArr.findIndex(
        (s: any) =>
          (typeof s === "string" && s.trim().toLowerCase() === nameToMatch) ||
          (typeof s === "object" && s && (s.subject_name || s.name || "").trim().toLowerCase() === nameToMatch)
      );

      let updatedSubjects = [...subjectsArr];

      if (existingIndex >= 0) {
        const existing = updatedSubjects[existingIndex];
        if (typeof existing === "string") {
          updatedSubjects[existingIndex] = {
            subject_name: newName,
            hours_per_week: numHours
          };
        } else {
          updatedSubjects[existingIndex] = {
            ...existing,
            subject_name: newName,
            hours_per_week: numHours
          };
        }
      } else if (numHours > 0) {
        updatedSubjects.push({
          subject_name: newName,
          hours_per_week: numHours
        });
      }

      await classCollection.updateOne(query, {
        $set: { subjects: updatedSubjects }
      });
    }

    invalidateCache(["all_classes_formatted", "all_classes"]);

    return NextResponse.json({ message: "Workload updated successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating subject workload:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update workload" },
      { status: 500 }
    );
  }
}
