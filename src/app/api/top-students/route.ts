import { NextRequest, NextResponse } from "next/server";
import { getDb, findGrades } from "@/lib/db";
import { getCachedOrFetch } from "@/lib/cache";

export async function GET(req: NextRequest) {
  try {
    const topStudents = await getCachedOrFetch("top_students_api", 60000, async () => {
      const db = await getDb();

      // Fetch students, classes, and grades in parallel
      const [students, classes, grades] = await Promise.all([
        db.collection("students").find({}).toArray(),
        db.collection("class").find({}).toArray(),
        findGrades(db, {}),
      ]);

      const classMap: Record<string, string> = {};
      classes.forEach((c) => {
        classMap[c._id.toString()] = c.classname;
      });

      const list: any[] = [];

      for (const student of students) {
        const studentIdStr = student._id.toString();
        const studentGrades = grades.filter((g) => {
          if (g.student_id?.toString() !== studentIdStr || g.pointType === 0) return false;
          const pt =
            typeof g.point === "number"
              ? g.point
              : typeof g.point === "string" && !isNaN(parseInt(g.point, 10))
              ? parseInt(g.point, 10)
              : -1;
          return pt >= 0 && pt <= 10 && !g.is_formative && g.point !== -3;
        });

        if (studentGrades.length === 0) continue;

        const totalPoint = studentGrades.reduce((sum, g) => {
          const pt = typeof g.point === "number" ? g.point : parseInt(g.point, 10);
          return sum + pt;
        }, 0);
        const average = totalPoint / studentGrades.length;

        const classname = classMap[student.class_id?.toString()] || "";
        const match = classname.match(/\d+/);
        const numericLevel = match ? parseInt(match[0], 10) : 0;

        let stage = "დაწყებითი";
        if (numericLevel >= 7 && numericLevel <= 9) stage = "საბაზო";
        else if (numericLevel >= 10 && numericLevel <= 12) stage = "საშუალო";

        if (average >= 9.8) {
          list.push({
            student_id: studentIdStr,
            name: `${student.name} ${student.surname}`,
            user_ID: student.user_ID,
            class_name: classname,
            stage,
            average: Math.round(average * 100) / 100,
            total_grades_count: studentGrades.length,
            is_perfect_10: average === 10,
          });
        }
      }

      list.sort((a, b) => b.average - a.average);
      return list;
    });

    return NextResponse.json(topStudents, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

