import type { Grade, SemesterStats, AnnualStats, SubjectStats, Statistics } from "./models";

export function customRoundGrade(val: number): number {
  if (isNaN(val) || val <= 0) return 0;
  const floor = Math.floor(val);
  const decimal = val - floor;
  return decimal >= (0.45 - 0.0001) ? floor + 1 : floor;
}

export function calculateSemesterStats(grades: Grade[], startMonth: number, endMonth: number): SemesterStats {
  let totalPoints = 0;
  let count = 0;
  let validGrades = 0;

  const lessonAttendance: Record<string, boolean> = {};

  for (const grade of grades) {
    if (grade.pointType === 4) continue;

    const date = new Date(grade.date);
    if (isNaN(date.getTime())) continue;

    const month = date.getMonth() + 1;
    if (month >= startMonth && month <= endMonth) {
      const pt = typeof grade.point === "number" ? grade.point : (typeof grade.point === "string" && !isNaN(parseInt(grade.point, 10)) ? parseInt(grade.point, 10) : -1);
      // Strictly include only valid 0-10 numeric marks (excluding comments, formative grades, and pass/fail -3)
      if (pt >= 0 && pt <= 10 && !grade.is_formative && grade.point !== -3) {
        totalPoints += pt;
        validGrades++;
      }

      if (lessonAttendance[grade.date] !== undefined) {
        if (grade.checked) {
          lessonAttendance[grade.date] = true;
        }
      } else {
        lessonAttendance[grade.date] = grade.checked;
      }
    }
  }

  const average = validGrades > 0 ? totalPoints / validGrades : 0;

  let attendedLessons = 0;
  for (const date in lessonAttendance) {
    count++;
    if (lessonAttendance[date]) {
      attendedLessons++;
    }
  }

  const attendance = count > 0 ? (attendedLessons / count) * 100.0 : 0;

  return { average, total_points: totalPoints, count, valid_grades: validGrades, attendance };
}

export function calculateAnnualStatsWithRawData(
  grades: Grade[],
  firstSemester: SemesterStats,
  secondSemester: SemesterStats,
  isFifthGrade: boolean = false
): AnnualStats {
  const totalPoints = firstSemester.total_points + secondSemester.total_points;
  const totalValidGrades = firstSemester.valid_grades + secondSemester.valid_grades;
  const totalCount = firstSemester.count + secondSemester.count;

  let externalGrade: Grade | null = null;
  for (const grade of grades) {
    if (grade.pointType === 4 && typeof grade.point === "number" && grade.point >= 0) {
      externalGrade = grade;
      break;
    }
  }

  let average = 0;
  if (externalGrade) {
    average = externalGrade.point;
  } else if (isFifthGrade) {
    // 5th Grade 1st semester is comments only, 2nd semester is numeric marks
    average = secondSemester.valid_grades > 0 ? secondSemester.average : (firstSemester.valid_grades > 0 ? firstSemester.average : 0);
  } else if (firstSemester.valid_grades > 0 && secondSemester.valid_grades > 0) {
    average = (firstSemester.average + secondSemester.average) / 2.0;
  } else if (firstSemester.valid_grades > 0) {
    average = firstSemester.average;
  } else if (secondSemester.valid_grades > 0) {
    average = secondSemester.average;
  }

  const lessonAttendance: Record<string, boolean> = {};
  for (const grade of grades) {
    const date = new Date(grade.date);
    if (isNaN(date.getTime())) continue;
    const month = date.getMonth() + 1;
    if ((month >= 9 && month <= 12) || (month >= 1 && month <= 6)) {
      if (lessonAttendance[grade.date] !== undefined) {
        if (grade.checked) {
          lessonAttendance[grade.date] = true;
        }
      } else {
        lessonAttendance[grade.date] = grade.checked;
      }
    }
  }

  let totalLessons = 0;
  let attendedLessons = 0;
  for (const date in lessonAttendance) {
    totalLessons++;
    if (lessonAttendance[date]) {
      attendedLessons++;
    }
  }

  const annualAttendance = totalLessons > 0 ? (attendedLessons / totalLessons) * 100.0 : 0;

  return {
    average,
    total_points: totalPoints,
    count: totalCount,
    valid_grades: totalValidGrades,
    attendance: annualAttendance,
  };
}

function calculateSubjectStatistics(grades: Grade[], isFifthGrade: boolean = false): SubjectStats {
  const firstSemester = calculateSemesterStats(grades, 9, 12);
  const secondSemester = calculateSemesterStats(grades, 1, 6);
  const annual = calculateAnnualStatsWithRawData(grades, firstSemester, secondSemester, isFifthGrade);
  return { first_semester: firstSemester, second_semester: secondSemester, annual };
}

export function calculateStatistics(grades: Grade[], isFifthGrade: boolean = false): Statistics {
  if (grades.length === 0) {
    return {
      student_id: "",
      class_id: "",
      first_semester: { average: 0, total_points: 0, count: 0, valid_grades: 0, attendance: 0 },
      second_semester: { average: 0, total_points: 0, count: 0, valid_grades: 0, attendance: 0 },
      annual: { average: 0, total_points: 0, count: 0, valid_grades: 0, attendance: 0 },
      subject_breakdown: {},
    };
  }

  const stats: Statistics = {
    student_id: grades[0].student_id.toString(),
    class_id: grades[0].class_id.toString(),
    subject_breakdown: {},
    first_semester: { average: 0, total_points: 0, count: 0, valid_grades: 0, attendance: 0 },
    second_semester: { average: 0, total_points: 0, count: 0, valid_grades: 0, attendance: 0 },
    annual: { average: 0, total_points: 0, count: 0, valid_grades: 0, attendance: 0 },
  };

  const subjectGrades: Record<string, Grade[]> = {};
  for (const grade of grades) {
    const subjectID = grade.subject_id.toString();
    if (!subjectGrades[subjectID]) subjectGrades[subjectID] = [];
    subjectGrades[subjectID].push(grade);
  }

  for (const subjectID in subjectGrades) {
    stats.subject_breakdown[subjectID] = calculateSubjectStatistics(subjectGrades[subjectID], isFifthGrade);
  }

  // Filter out CT subjects for overall stats
  const ctSubjects = new Set<string>();
  for (const grade of grades) {
    if (grade.point === -3) {
      ctSubjects.add(grade.subject_id.toString());
    }
  }
  const nonCTGrades = grades.filter((g) => !ctSubjects.has(g.subject_id.toString()));

  stats.first_semester = calculateSemesterStats(nonCTGrades, 9, 12);
  stats.second_semester = calculateSemesterStats(nonCTGrades, 1, 6);
  stats.annual = calculateAnnualStatsWithRawData(nonCTGrades, stats.first_semester, stats.second_semester, isFifthGrade);

  return stats;
}

export function isFifthGradeClassname(classname: string | undefined | null): boolean {
  if (!classname) return false;
  const match = classname.trim().match(/^(\d+)/);
  return match ? parseInt(match[1], 10) === 5 : false;
}
