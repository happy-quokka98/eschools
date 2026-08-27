import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const startDate = req.nextUrl.searchParams.get("startDate") || req.nextUrl.searchParams.get("date");
    const endDate = req.nextUrl.searchParams.get("endDate") || startDate;
    const classId = req.nextUrl.searchParams.get("classId") || req.nextUrl.searchParams.get("class_id");
    const onlyDiscrepancies = req.nextUrl.searchParams.get("onlyDiscrepancies") === "true";

    if (!startDate) {
      return NextResponse.json({ message: "თარიღი აუცილებელია" }, { status: 400 });
    }

    const db = await getDb();

    // Fetch metadata in parallel
    const [classes, students, subjects, teachers] = await Promise.all([
      db.collection("class").find({}).toArray(),
      db.collection("students").find({}).toArray(),
      db.collection("subjects").find({}).toArray(),
      db.collection("teachers").find({}).toArray(),
    ]);

    const classMap = new Map<string, string>();
    classes.forEach((c) => classMap.set(c._id.toString(), c.classname || c.ID || c.name || ""));

    const studentMap = new Map<string, string>();
    students.forEach((s) => studentMap.set(s._id.toString(), `${s.name || ""} ${s.surname || ""}`.trim()));

    const subjectMap = new Map<string, string>();
    subjects.forEach((s) => subjectMap.set(s._id.toString(), s.name || ""));

    const teacherMap = new Map<string, string>();
    teachers.forEach((t) => teacherMap.set(t._id.toString(), `${t.name || ""} ${t.surname || ""}`.trim()));

    const queryFilter: any = {
      date: { $gte: startDate, $lte: endDate || startDate },
      checked: { $in: [true, false] },
    };

    if (classId && classId !== "all" && ObjectId.isValid(classId)) {
      queryFilter.class_id = new ObjectId(classId);
    }

    const pipeline: any[] = [
      { $match: queryFilter },
      {
        $group: {
          _id: { class_id: "$class_id", date: "$date", subject_id: "$subject_id" },
          teacher_id: { $first: "$teacher_id" },
          grades: {
            $push: {
              student_id: "$student_id",
              checked: "$checked",
              point: "$point",
              pointType: "$pointType",
              time: "$time",
            },
          },
        },
      },
    ];

    const groupedByLesson = await db.collection("grades").aggregate(pipeline, { allowDiskUse: true }).toArray();

    // Group by (class_id + date)
    const classDateMap = new Map<string, any[]>();
    for (const item of groupedByLesson) {
      const key = `${item._id.class_id?.toString()}_${item._id.date}`;
      let list = classDateMap.get(key);
      if (!list) {
        list = [];
        classDateMap.set(key, list);
      }
      list.push(item);
    }

    const results: any[] = [];

    for (const [key, lessons] of classDateMap.entries()) {
      const [cIdStr, dateStr] = key.split("_");
      const className = classMap.get(cIdStr) || "უცნობი კლასი";

      const evaluations = lessons.map((les) => {
        const subjId = les._id.subject_id?.toString();
        const subjectName = subjectMap.get(subjId) || "უცნობი საგანი";
        const teacherName = teacherMap.get(les.teacher_id?.toString()) || "უცნობი მასწავლებელი";

        const studentCheckedMap: Record<string, boolean> = {};
        const gradesList = les.grades.map((g: any) => {
          const sIdStr = g.student_id ? g.student_id.toString() : "";
          if (sIdStr) studentCheckedMap[sIdStr] = g.checked;
          const studentName = studentMap.get(sIdStr) || "უცნობი მოსწავლე";
          return {
            studentId: sIdStr,
            studentName,
            point: g.point,
            pointType: g.pointType,
            checked: g.checked,
            time: g.time,
          };
        }).sort((a: any, b: any) => a.studentName.localeCompare(b.studentName, "ka"));

        const presentCount = Object.values(studentCheckedMap).filter((c) => c === true).length;
        const absentCount = Object.values(studentCheckedMap).filter((c) => c === false).length;
        const total = presentCount + absentCount;
        const rate = total > 0 ? (presentCount / total) * 100 : 0;

        const absentStudentIds = Object.entries(studentCheckedMap)
          .filter(([_, c]) => c === false)
          .map(([sid]) => sid);

        const absentStudentNames = absentStudentIds.map((sid) => studentMap.get(sid) || "უცნობი მოსწავლე");
        const absentKey = [...absentStudentIds].sort().join(",");

        return {
          subjectId: subjId,
          subjectName,
          teacherName,
          presentCount,
          absentCount,
          total,
          rate,
          absentStudentIds,
          absentStudentNames,
          absentKey,
          gradesList,
        };
      });

      let majorityKey = "";
      if (evaluations.length >= 2) {
        const keyFrequencies: Record<string, number> = {};
        evaluations.forEach((ev) => {
          keyFrequencies[ev.absentKey] = (keyFrequencies[ev.absentKey] || 0) + 1;
        });

        let maxFreq = 0;
        Object.entries(keyFrequencies).forEach(([k, freq]) => {
          if (freq > maxFreq) {
            maxFreq = freq;
            majorityKey = k;
          }
        });
      }

      const lessonEvaluations = evaluations.map((ev) => ({
        ...ev,
        isDiscrepancy: evaluations.length >= 2 && ev.absentKey !== majorityKey,
      }));

      const hasDiscrepancy = lessonEvaluations.some((e) => e.isDiscrepancy);
      const discrepantCount = lessonEvaluations.filter((e) => e.isDiscrepancy).length;

      if (!onlyDiscrepancies || hasDiscrepancy) {
        results.push({
          classId: cIdStr,
          className,
          date: dateStr,
          totalLessons: evaluations.length,
          hasDiscrepancy,
          discrepantCount,
          evaluations: lessonEvaluations,
        });
      }
    }

    results.sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({
      startDate,
      endDate,
      totalEntries: results.length,
      discrepancyEntriesCount: results.filter((r) => r.hasDiscrepancy).length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
