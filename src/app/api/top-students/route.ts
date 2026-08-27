import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCachedOrFetch } from "@/lib/cache";

// Two-step rounding function as requested:
// e.g. 9.45 -> first rounds to 9.5 -> then rounds to 10
function roundGradeCustom(avg: number): number {
  const roundedTenths = Math.round(avg * 10) / 10;
  return Math.round(roundedTenths);
}

export async function GET(req: NextRequest) {
  try {
    const topStudents = await getCachedOrFetch("top_students_api_medals_two_step_v4", 60000, async () => {
      const db = await getDb();

      // Fetch active students and classes in parallel
      const [students, classes] = await Promise.all([
        db.collection("students").find({}).toArray(),
        db.collection("class").find({}).toArray(),
      ]);

      const classMap: Record<string, string> = {};
      classes.forEach((c) => {
        classMap[c._id.toString()] = c.classname || c.ID || c.name || "";
      });

      const studentMap = new Map<string, any>();
      students.forEach((s) => {
        studentMap.set(s._id.toString(), s);
      });

      // Pipeline 1: Calculate per-student overall grades stats
      const pipeline: any[] = [
        {
          $match: {
            date: { $gte: "2024-09-01" },
            pointType: { $ne: 0 },
            is_formative: { $ne: true },
            point: { $nin: [-3, -1, "N/A", null, ""] },
          },
        },
        {
          $project: {
            student_id: 1,
            subject_id: 1,
            numericPoint: {
              $cond: {
                if: { $eq: [{ $type: "$point" }, "number"] },
                then: "$point",
                else: { $convert: { input: "$point", to: "double", onError: null, onNull: null } },
              },
            },
          },
        },
        {
          $match: {
            numericPoint: { $gte: 0, $lte: 10 },
          },
        },
        {
          $group: {
            _id: { student_id: "$student_id", subject_id: "$subject_id" },
            subjectAvg: { $avg: "$numericPoint" },
            totalGrades: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.student_id",
            subjectAverages: { $push: { subject_id: "$_id.subject_id", avg: "$subjectAvg" } },
            overallAvg: { $avg: "$subjectAvg" },
            minSubjectAvg: { $min: "$subjectAvg" },
            maxSubjectAvg: { $max: "$subjectAvg" },
            totalSubjects: { $sum: 1 },
            totalGradesCount: { $sum: "$totalGrades" },
          },
        },
        {
          $match: {
            overallAvg: { $gte: 9.0 },
          },
        },
        {
          $sort: { overallAvg: -1 },
        },
      ];

      const results = await db.collection("grades").aggregate(pipeline, { allowDiskUse: true }).toArray();

      const list: any[] = [];

      for (const item of results) {
        const studentIdStr = item._id.toString();
        const student = studentMap.get(studentIdStr);
        if (!student) continue;

        const classname = classMap[student.class_id?.toString()] || "";
        const match = classname.match(/\d+/);
        const numericLevel = match ? parseInt(match[0], 10) : 0;

        let stage = "დაწყებითი";
        if (numericLevel >= 7 && numericLevel <= 9) stage = "საბაზო";
        else if (numericLevel >= 10 && numericLevel <= 12) stage = "საშუალო";

        const avg = Math.round(item.overallAvg * 100) / 100;
        const minSubAvg = Math.round(item.minSubjectAvg * 100) / 100;

        // Two-step rounded subject grades: 9.45 -> 9.5 -> 10
        const roundedSubjectGrades = item.subjectAverages.map((sub: any) => roundGradeCustom(sub.avg));

        const hasNine = roundedSubjectGrades.some((g: number) => g === 9);
        const hasBelowNine = roundedSubjectGrades.some((g: number) => g < 9);
        const allTens = roundedSubjectGrades.length > 0 && roundedSubjectGrades.every((g: number) => g === 10);

        let medal: "gold" | "silver" | "none" = "none";

        if (stage === "საშუალო") {
          if (allTens) {
            medal = "gold";
          } else if (hasNine && !hasBelowNine) {
            medal = "silver";
          }
        }

        list.push({
          student_id: studentIdStr,
          name: `${student.name || ""} ${student.surname || ""}`.trim(),
          user_ID: student.user_ID || student.userID || student.id || "",
          class_name: classname,
          numeric_level: numericLevel,
          stage,
          average: avg,
          min_subject_avg: minSubAvg,
          total_subjects: item.totalSubjects,
          medal,
          total_grades_count: item.totalGradesCount,
          is_perfect_10: medal === "gold" || avg === 10,
        });
      }

      return list;
    });

    return NextResponse.json(topStudents, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}





