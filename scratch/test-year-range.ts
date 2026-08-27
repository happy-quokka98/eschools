import { MongoClient } from "mongodb";

function getAcademicYearDateRange(yearInput?: string | null): { $gte: string; $lt: string } | null {
  if (!yearInput) return null;

  let startYear: number | null = null;
  let endYear: number | null = null;

  const rangeMatch = yearInput.match(/^(\d{2,4})[-/](\d{2,4})$/);
  if (rangeMatch) {
    let s = parseInt(rangeMatch[1], 10);
    let e = parseInt(rangeMatch[2], 10);
    if (s < 100) s += 2000;
    if (e < 100) e += 2000;
    startYear = s;
    endYear = e;
  }

  if (!startYear) {
    const yearColMatch = yearInput.match(/^(\d{2})(\d{2})year$/);
    if (yearColMatch) {
      startYear = 2000 + parseInt(yearColMatch[1], 10);
      endYear = 2000 + parseInt(yearColMatch[2], 10);
    }
  }

  if (!startYear) {
    const singleMatch = yearInput.match(/^(\d{4})(year)?$/);
    if (singleMatch) {
      startYear = parseInt(singleMatch[1], 10);
      endYear = startYear + 1;
    }
  }

  if (startYear && endYear) {
    return {
      $gte: `${startYear}-09-01`,
      $lt: `${endYear}-07-01`,
    };
  }

  return null;
}

console.log("2324year:", getAcademicYearDateRange("2324year"));
console.log("2425year:", getAcademicYearDateRange("2425year"));
console.log("2526year:", getAcademicYearDateRange("2526year"));
console.log("2023-2024:", getAcademicYearDateRange("2023-2024"));
