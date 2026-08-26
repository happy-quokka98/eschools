import type { Grade, SemesterStats, AnnualStats, SubjectStats, Statistics } from "./models";

export function calculateSemesterStats(grades: Grade[], startMonth: number, endMonth: number): SemesterStats {
  let totalPoints = 0;
  let count = 0;
  let validGrades = 0;
  let hasCTGrade = false;

  const lessonAttendance: Record<string, boolean> = {};

  for (const grade of grades) {
    if (grade.pointType === 4) continue;

    const date = new Date(grade.date);
    if (isNaN(date.getTime())) continue;

    const month = date.getMonth() + 1;
    if (month >= startMonth && month <= endMonth) {
      if (grade.point === -3) {
        hasCTGrade = true;
      }

      if (grade.point >= 0 && grade.point <= 10) {
        totalPoints += grade.point;
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

  let average = 0;
  if (hasCTGrade) {
    average = -3;
  } else if (validGrades > 0) {
    average = totalPoints / validGrades;
  }

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
  let ctGrade: Grade | null = null;

  for (const grade of grades) {
    if (grade.pointType === 4 && grade.point !== -1) {
      externalGrade = grade;
      break;
    }
  }
  for (const grade of grades) {
    if (grade.point === -3) {
      ctGrade = grade;
      break;
    }
  }

  let average = 0;
  if (externalGrade) {
    average = externalGrade.point;
  }else if (ctGrade) {
    average = -3;
  } else if (isFifthGrade) {
    average = secondSemester.valid_grades >= 0
      ? secondSemester.average
      : firstSemester.average;
  } else if (firstSemester.valid_grades >= 0 && secondSemester.valid_grades > 0) {
    average = (firstSemester.average + secondSemester.average) / 2.0;
  } else if (firstSemester.valid_grades >= 0) {
    average = firstSemester.average;
  } else if (secondSemester.valid_grades >= 0) {
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
