import { NextRequest, NextResponse } from "next/server";
import { getDb, findGrades } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { Grade } from "@/lib/models";
import { calculateSemesterStats, calculateAnnualStatsWithRawData, calculateStatistics, isFifthGradeClassname } from "@/lib/statistics";

import { getCachedOrFetch } from "@/lib/cache";

const getPromotionAcademicYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  let startYear = month >= 9 ? year : year - 1;
  let endYear = startYear + 1;
  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
};

export async function GET(req: NextRequest) {
  const studentID = req.nextUrl.searchParams.get("student_id");
  const classID = req.nextUrl.searchParams.get("class_id");
  const year = req.nextUrl.searchParams.get("year");
  const date = req.nextUrl.searchParams.get("date");

  if (!studentID || !classID) {
    return NextResponse.json({ message: "student_id და class_id საჭიროა" }, { status: 400 });
  }

  if (!ObjectId.isValid(classID)) {
    return NextResponse.json({ message: "კლასის ID-ის ფორმატი არასწორია" }, { status: 400 });
  }

  const db = await getDb();
  const trimmedStudentId = studentID.trim();

  // Find student supporting ObjectId, ID, and user_ID
  let student = null;
  if (ObjectId.isValid(trimmedStudentId)) {
    student = await db.collection("students").findOne({ _id: new ObjectId(trimmedStudentId) });
  }
  if (!student) {
    student = await db.collection("students").findOne({
      $or: [{ ID: trimmedStudentId }, { user_ID: trimmedStudentId }]
    });
  }

  const [classDoc, subjects, teachers] = await Promise.all([
    db.collection("class").findOne({ _id: new ObjectId(classID) }),
    getCachedOrFetch("all_subjects", 60000, () => db.collection("subjects").find({}).toArray()),
    getCachedOrFetch("all_teachers", 60000, () => db.collection("teachers").find({}).toArray()),
  ]);

  if (!student) {
    return NextResponse.json({ message: "მოსწავლე ვერ მოიძებნა" }, { status: 404 });
  }
  if (!classDoc) {
    return NextResponse.json({ message: "კლასი ვერ მოიძებნა" }, { status: 404 });
  }

  // Get grades for this student
  const studentObjID = student._id;
  const classObjID = new ObjectId(classID);

  const cacheKey = `student_grades_${studentObjID.toString()}_${classID}_${year || ""}_${date || ""}`;

  const grades = (await getCachedOrFetch(cacheKey, 60000, async () => {
    return findGrades(db, {
      student_id: studentObjID,
      class_id: classObjID,
    }, { year, date });
  })) as unknown as Grade[];

  // Create maps supporting name, subject_name, ID
  const subjectMap: Record<string, { name: string }> = {};
  for (const s of subjects) {
    const nameStr = s.name || s.subject_name || s.ID || "";
    subjectMap[s._id.toString()] = { name: nameStr };
  }

  // Group grades by subject
  const subjectGrades: Record<string, Grade[]> = {};
  for (const grade of grades) {
    const sid = grade.subject_id.toString();
    if (!subjectGrades[sid]) subjectGrades[sid] = [];
    subjectGrades[sid].push(grade);
  }

  // Determine subjects and classname to use based on the selected year
  let subjectsToUse = classDoc.subjects || [];
  let classnameToUse = classDoc.ID || classDoc.classname;
  
  if (year) {
    const historyEntry = classDoc.history?.find((h: any) => h.year === year);
    if (historyEntry) {
      subjectsToUse = historyEntry.subjects || [];
      classnameToUse = historyEntry.ID || historyEntry.classname;
    }
  }

  const isFifthGrade = isFifthGradeClassname(classnameToUse);
  const overallStats = calculateStatistics(grades, isFifthGrade);

  // Build response
  const responseSubjects = [];
  for (const classSubject of subjectsToUse) {
    const subjectIDStr = classSubject.subject_id.toString();
    const teacherIDStr = classSubject.teacher_id.toString();

    const subject = subjectMap[subjectIDStr];
    if (!subject) continue;

    let teacherName = "უცნობი მასწავლებელი";
    for (const t of teachers) {
      if (t._id.toString() === teacherIDStr) {
        teacherName = t.name + " " + t.surname;
        break;
      }
    }

    const gradesList = subjectGrades[subjectIDStr] || [];

    const firstSemester = calculateSemesterStats(gradesList, 9, 12);
    const secondSemester = calculateSemesterStats(gradesList, 1, 6);
    const annual = calculateAnnualStatsWithRawData(gradesList, firstSemester, secondSemester, isFifthGrade);

    let validGrades = 0;
    for (const g of gradesList) {
      const pt = typeof g.point === 'number' ? g.point : (typeof g.point === 'string' && !isNaN(parseInt(g.point, 10)) ? parseInt(g.point, 10) : -1);
      if (pt >= 0 && pt <= 10 && !g.is_formative && g.point !== -3) validGrades++;
    }

    responseSubjects.push({
      subject_id: subjectIDStr,
      name: subject.name,
      subject_name: subject.name,
      teacher_id: teacherIDStr,
      teacher_name: teacherName,
      grades: gradesList,
      average: annual.average,
      first_semester_average: firstSemester.average,
      second_semester_average: secondSemester.average,
      annual_attendance: annual.attendance,
      total_grades: validGrades,
    });
  }

  const currentYearStr = getPromotionAcademicYear(new Date());
  const availableYears = [currentYearStr];
  if (classDoc.history) {
    for (const h of classDoc.history) {
      if (h.year && !availableYears.includes(h.year)) {
        availableYears.push(h.year);
      }
    }
  }

  return NextResponse.json({
    student_name: student.name,
    student_surname: student.surname,
    class_name: classnameToUse,
    subjects: responseSubjects,
    available_years: availableYears,
    overall: {
      first_semester_average: overallStats.first_semester.average,
      second_semester_average: overallStats.second_semester.average,
      annual_average: overallStats.annual.average,
      annual_attendance: overallStats.annual.attendance,
    },
  });
}
