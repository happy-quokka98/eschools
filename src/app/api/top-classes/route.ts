import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCachedOrFetch } from "@/lib/cache";

export interface TopClass {
  class_id: string;
  classname: string;
  numeric_level: number;
  stage: string;
  average: number;
  student_count: number;
  honor_students_count: number;
  ten_students_count: number;
  rank: number;
}

export async function GET(req: NextRequest) {
  try {
    const topClasses = await getCachedOrFetch("top_classes_api_v3", 60000, async () => {
      const db = await getDb();

      const [students, classes] = await Promise.all([
        db.collection("students").find({}).toArray(),
        db.collection("class").find({}).toArray(),
      ]);

      const classMap: Record<string, { classname: string; numericLevel: number; stage: string }> = {};

      classes.forEach((c) => {
        const classname = c.classname || c.ID || c.name || "";
        const match = classname.match(/\d+/);
        const numericLevel = match ? parseInt(match[0], 10) : 0;
        let stage = "დაწყებითი";
        if (numericLevel >= 7 && numericLevel <= 9) stage = "საბაზო";
        else if (numericLevel >= 10 && numericLevel <= 12) stage = "საშუალო";

        classMap[c._id.toString()] = {
          classname,
          numericLevel,
          stage,
        };
      });

      const studentMap = new Map<string, any>();
      students.forEach((s) => {
        studentMap.set(s._id.toString(), s);
      });

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
          },
        },
        {
          $group: {
            _id: "$_id.student_id",
            studentAvg: { $avg: "$subjectAvg" },
          },
        },
      ];

      const studentResults = await db.collection("grades").aggregate(pipeline, { allowDiskUse: true }).toArray();

      const classAccumulator: Record<string, { totalAvg: number; studentCount: number; honorCount: number; tenCount: number }> = {};

      for (const sr of studentResults) {
        if (!sr._id) continue;
        const studentIdStr = sr._id.toString();
        const student = studentMap.get(studentIdStr);
        if (!student) continue;

        const rawClassId = student.class_id || student.classInfo?._id;
        if (!rawClassId) continue;
        const classIdStr = rawClassId.toString();

        if (!classAccumulator[classIdStr]) {
          classAccumulator[classIdStr] = { totalAvg: 0, studentCount: 0, honorCount: 0, tenCount: 0 };
        }

        classAccumulator[classIdStr].totalAvg += sr.studentAvg;
        classAccumulator[classIdStr].studentCount += 1;
        if (sr.studentAvg >= 9.0) classAccumulator[classIdStr].honorCount += 1;
        if (sr.studentAvg >= 9.8) classAccumulator[classIdStr].tenCount += 1;
      }

      const list: TopClass[] = [];

      for (const [classIdStr, stats] of Object.entries(classAccumulator)) {
        const meta = classMap[classIdStr];
        if (!meta || !meta.classname || stats.studentCount === 0) continue;

        const avg = Math.round((stats.totalAvg / stats.studentCount) * 100) / 100;

        list.push({
          class_id: classIdStr,
          classname: meta.classname,
          numeric_level: meta.numericLevel,
          stage: meta.stage,
          average: avg,
          student_count: stats.studentCount,
          honor_students_count: stats.honorCount,
          ten_students_count: stats.tenCount,
          rank: 0,
        });
      }

      list.sort((a, b) => b.average - a.average);

      list.forEach((item, index) => {
        item.rank = index + 1;
      });

      return list;
    });

    return NextResponse.json(topClasses, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
