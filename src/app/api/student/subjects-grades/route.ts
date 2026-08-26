import { NextRequest, NextResponse } from "next/server";
import { getDb, findGrades } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { Grade } from "@/lib/models";
import { calculateSemesterStats, calculateAnnualStatsWithRawData, calculateStatistics, isFifthGradeClassname } from "@/lib/statistics";

export async function GET(req: NextRequest) {
  const studentID = req.nextUrl.searchParams.get("student_id");
  const classID = req.nextUrl.searchParams.get("class_id");
  const year = req.nextUrl.searchParams.get("year");
  const date = req.nextUrl.searchParams.get("date");

  if (!studentID || !classID) {
    return NextResponse.json({ message: "student_id და class_id საჭიროა" }, { status: 400 });
  }

  const db = await getDb();

  // Get student info
  const student = await db.collection("students").findOne({ user_ID: studentID });
  if (!student) {
    return NextResponse.json({ message: "მოსწავლე ვერ მოიძებნა" }, { status: 404 });
  }

  // Get class info
  if (!ObjectId.isValid(classID)) {
    return NextResponse.json({ message: "კლასის ID-ის ფორმატი არასწორია" }, { status: 400 });
  }
  const classDoc = await db.collection("class").findOne({ _id: new ObjectId(classID) });
  if (!classDoc) {
    return NextResponse.json({ message: "კლასი ვერ მოიძებნა" }, { status: 404 });
  }

  // Get all subjects and teachers
  const subjects = await db.collection("subjects").find({}).toArray();
  const teachers = await db.collection("teachers").find({}).toArray();

  // Get grades for this student
  const studentObjID = student._id;
  const classObjID = new ObjectId(classID);

  const grades = (await findGrades(db, {
    student_id: studentObjID,
    class_id: classObjID,
  }, { year, date })) as unknown as Grade[];

  // Create maps
  const subjectMap: Record<string, { name: string }> = {};
  for (const s of subjects) {
    subjectMap[s._id.toString()] = { name: s.name };
  }

  // Group grades by subject
  const subjectGrades: Record<string, Grade[]> = {};
  for (const grade of grades) {
    const sid = grade.subject_id.toString();
    if (!subjectGrades[sid]) subjectGrades[sid] = [];
    subjectGrades[sid].push(grade);
  }

  const isFifthGrade = isFifthGradeClassname(classDoc.classname);
  const overallStats = calculateStatistics(grades, isFifthGrade);

  // Build response
  const responseSubjects = [];
  for (const classSubject of classDoc.subjects || []) {
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
      if (g.point >= 0) validGrades++;
    }

    responseSubjects.push({
      subject_id: subjectIDStr,
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

  return NextResponse.json({
    student_name: student.name,
    student_surname: student.surname,
    class_name: classDoc.classname,
    subjects: responseSubjects,
    overall: {
      first_semester_average: overallStats.first_semester.average,
      second_semester_average: overallStats.second_semester.average,
      annual_average: overallStats.annual.average,
      annual_attendance: overallStats.annual.attendance,
    },
  });
}
