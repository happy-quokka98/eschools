import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, findGrades } from "@/lib/db";
import { calculateStatistics, isFifthGradeClassname } from "@/lib/statistics";
import type { Grade } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    const student_id = req.nextUrl.searchParams.get("student_id");
    const class_id = req.nextUrl.searchParams.get("class_id");

    if (!student_id || !class_id) {
      return NextResponse.json({ message: "student_id და class_id საჭიროა" }, { status: 400 });
    }

    const db = await getDb();

    // 1. Fetch all students in the class
    let parsedClassId: ObjectId;
    try {
      parsedClassId = new ObjectId(class_id);
    } catch {
      return NextResponse.json({ message: "არასწორი კლასის ID" }, { status: 400 });
    }

    const students = await db.collection("students")
      .find({ class_id: parsedClassId })
      .toArray();

    if (students.length === 0) {
      return NextResponse.json({ rank: 1, totalStudents: 0, studentAverage: 0, classAverage: 0, subjectComparisons: {} });
    }

    // 2. Fetch all grades for this class to compute everyone's stats
    const allGrades = (await findGrades(db, { class_id: parsedClassId })) as unknown as Grade[];

    // Check if it is a 5th grade class (affects grading statistics)
    const classDoc = await db.collection("class").findOne({ _id: parsedClassId });
    const isFifthGrade = isFifthGradeClassname(classDoc?.classname);

    // Group grades by student (supporting both _id and user_ID)
    const gradesByStudent: Record<string, Grade[]> = {};
    for (const s of students) {
      gradesByStudent[s._id.toString()] = [];
      if (s.user_ID) gradesByStudent[s.user_ID] = gradesByStudent[s._id.toString()];
    }
    for (const g of allGrades) {
      const sId = g.student_id ? g.student_id.toString() : "";
      if (gradesByStudent[sId] !== undefined) {
        gradesByStudent[sId].push(g);
      }
    }

    // 3. Compute stats for each student in the class
    const studentAveragesList: { studentId: string; average: number }[] = [];
    const studentStatsMap: Record<string, any> = {};

    for (const s of students) {
      const sIdStr = s._id.toString();
      const sGrades = gradesByStudent[sIdStr] || (s.user_ID ? gradesByStudent[s.user_ID] : []) || [];
      const stats = calculateStatistics(sGrades, isFifthGrade);
      const avg = stats.annual?.average || 0;
      studentAveragesList.push({ studentId: sIdStr, average: avg });
      if (s.user_ID) studentAveragesList.push({ studentId: s.user_ID, average: avg });
      studentStatsMap[sIdStr] = stats;
      if (s.user_ID) studentStatsMap[s.user_ID] = stats;
    }

    // 4. Sort students by average descending to determine rank
    studentAveragesList.sort((a, b) => b.average - a.average);

    const rankIndex = studentAveragesList.findIndex(x => x.studentId === student_id);
    const rank = rankIndex !== -1 ? rankIndex + 1 : students.length;

    // 5. Calculate class overall average
    const validAverages = studentAveragesList.filter(x => x.average > 0);
    const classAverage = validAverages.length > 0 
      ? validAverages.reduce((acc, curr) => acc + curr.average, 0) / validAverages.length 
      : 0;

    // 6. Compute class averages per subject
    const subjectGrades: Record<string, Grade[]> = {};
    for (const g of allGrades) {
      const subId = g.subject_id.toString();
      if (!subjectGrades[subId]) subjectGrades[subId] = [];
      subjectGrades[subId].push(g);
    }

    const classSubjectAverages: Record<string, number> = {};
    for (const subId in subjectGrades) {
      const grades = subjectGrades[subId];
      // Compute averages only for non-CT grades, grouped by student first
      const studentSubAverages: Record<string, { total: number; count: number }> = {};
      for (const g of grades) {
        if (g.point >= 0 && g.point <= 10 && g.pointType !== 4) {
          const sId = g.student_id.toString();
          if (!studentSubAverages[sId]) studentSubAverages[sId] = { total: 0, count: 0 };
          studentSubAverages[sId].total += g.point;
          studentSubAverages[sId].count += 1;
        }
      }
      const studentAverages = Object.values(studentSubAverages).map(x => x.total / x.count);
      const subAvg = studentAverages.length > 0 
        ? studentAverages.reduce((acc, curr) => acc + curr, 0) / studentAverages.length 
        : 0;
      classSubjectAverages[subId] = subAvg;
    }

    // Compare this student's averages with the class averages
    const currentStudentStats = studentStatsMap[student_id];
    const subjectComparisons: Record<string, { studentAvg: number; classAvg: number }> = {};

    if (currentStudentStats && currentStudentStats.subject_breakdown) {
      for (const subId in currentStudentStats.subject_breakdown) {
        const studentAvg = currentStudentStats.subject_breakdown[subId].annual?.average || 0;
        const classAvg = classSubjectAverages[subId] || 0;
        subjectComparisons[subId] = { studentAvg, classAvg };
      }
    }

    return NextResponse.json({
      rank,
      totalStudents: students.length,
      studentAverage: currentStudentStats?.annual?.average || 0,
      classAverage,
      subjectComparisons
    });
  } catch (error) {
    console.error("Error in GET student rank API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}
