import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const georgianLetters = ["ა","ბ","გ","დ","ე","ვ","ზ","თ","ი","კ","ლ","მ","ნ","ო","პ","ჟ","რ","ს","ტ","უ","ფ","ქ","ღ","ყ","შ","ჩ","ც","ძ","წ","ჭ","ხ","ჯ","ჰ"];
const letterOrder: Record<string, number> = {};
georgianLetters.forEach((l, i) => { letterOrder[l] = i; });

function extractGradeAndLetter(className: string): [number, string] {
  className = className.trim();
  let gradeStr = "";
  let letter = "";
  for (const char of className) {
    if (char >= "0" && char <= "9") {
      gradeStr += char;
    } else if (char >= "ა" && char <= "ჰ") {
      letter = char;
      break;
    } else if (gradeStr) {
      break;
    }
  }
  return [parseInt(gradeStr) || 0, letter];
}

export async function GET() {
  const db = await getDb();
  const classes = await db.collection("class").find({}).toArray();

  classes.sort((a, b) => {
    const [gradeA, letterA] = extractGradeAndLetter(a.classname);
    const [gradeB, letterB] = extractGradeAndLetter(b.classname);
    if (gradeA !== gradeB) return gradeA - gradeB;
    const orderA = letterOrder[letterA] ?? 999;
    const orderB = letterOrder[letterB] ?? 999;
    return orderA - orderB;
  });

  return NextResponse.json(classes);
}
