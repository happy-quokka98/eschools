import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { invalidateCache } from "@/lib/cache";

const PRESET_CONFIGS: { keywords: RegExp; hours: { [grade: number]: number } }[] = [
  {
    keywords: /ქართული|ლიტერატურა/i,
    hours: { 1: 8, 2: 7, 3: 6, 4: 6, 5: 5, 6: 5, 7: 4, 8: 5, 9: 5, 10: 5, 11: 5, 12: 5 }
  },
  {
    keywords: /მათემატიკა|ალგებრა|გეომეტრია/i,
    hours: { 1: 6, 2: 5, 3: 5, 4: 5, 5: 5, 6: 4, 7: 5, 8: 5, 9: 5, 10: 5, 11: 5, 12: 5 }
  },
  {
    keywords: /პირველი უცხოური|ინგლისური|უცხო ენა/i,
    hours: { 1: 0, 2: 2, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 2, 10: 3, 11: 2, 12: 2 }
  },
  {
    keywords: /მეორე უცხოური|რუსული|გერმანული|ფრანგული/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
  },
  {
    keywords: /მე და საზოგადოება/i,
    hours: { 1: 0, 2: 0, 3: 2, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
  },
  {
    keywords: /ჩვენი საქართველო/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 3, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
  },
  {
    keywords: /საქართველოს ისტორია/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 0, 9: 0, 10: 3, 11: 2, 12: 2 }
  },
  {
    keywords: /მსოფლიოს ისტორია|ისტორია/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 2, 9: 3, 10: 0, 11: 2, 12: 2 }
  },
  {
    keywords: /გეოგრაფია/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
  },
  {
    keywords: /მოქალაქეობა|სამოქალაქო/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
  },
  {
    keywords: /ბუნებისმეტყველება|ბუნება/i,
    hours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 3, 6: 3, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
  },
  {
    keywords: /ბიოლოგია/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
  },
  {
    keywords: /ფიზიკა/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
  },
  {
    keywords: /ქიმია/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
  },
  {
    keywords: /კომპიუტერული|ისტ|ტექნოლოგიები/i,
    hours: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
  },
  {
    keywords: /ხელოვნება|სახვითი/i,
    hours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 0, 11: 0, 12: 0 }
  },
  {
    keywords: /მუსიკა/i,
    hours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 0, 11: 0, 12: 0 }
  },
  {
    keywords: /სპორტი|ფიზიკური აღზრდა/i,
    hours: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
  },
  {
    keywords: /ჭადრაკი/i,
    hours: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
  }
];

const parseGrade = (cls: any): number => {
  if (typeof cls.grade === "number" && cls.grade >= 1 && cls.grade <= 12) return cls.grade;
  const name = cls.classname || cls.name || "";
  const match = name.match(/^([0-9]+)/);
  if (match) return parseInt(match[1], 10);
  const romanMap: { [k: string]: number } = {
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
    VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12
  };
  const romanMatch = name.match(/^(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)/i);
  if (romanMatch) return romanMap[romanMatch[1].toUpperCase()] || 0;
  return 0;
};

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const classCollection = db.collection("class");
    const subjectCollection = db.collection("subject");

    const classes = await classCollection.find({}).toArray();
    const subjects = await subjectCollection.find({}).toArray();

    if (classes.length === 0) {
      return NextResponse.json({ message: "No classes found to update" }, { status: 400 });
    }

    const bulkOps: any[] = [];
    let matchedCount = 0;

    // For each class, update hours_per_week for its subjects
    for (const cls of classes) {
      const grade = parseGrade(cls);
      if (grade < 1 || grade > 12) continue;

      const existingSubjects: any[] = cls.subjects || [];
      const updatedSubjectsMap = new Map<string, any>();

      // Preserve existing subject objects
      existingSubjects.forEach((s: any) => {
        const sName = typeof s === "string" ? s.trim() : (s.subject_name || s.name || "").trim();
        if (sName) {
          updatedSubjectsMap.set(sName.toLowerCase(), typeof s === "object" ? { ...s } : { subject_name: sName });
        }
      });

      // Also match all global subjects in the school
      for (const subj of subjects) {
        const sName = (subj.name || subj.subject_name || "").trim();
        if (!sName) continue;

        let hours = 0;
        for (const preset of PRESET_CONFIGS) {
          if (preset.keywords.test(sName)) {
            hours = preset.hours[grade] || 0;
            matchedCount++;
            break;
          }
        }

        const key = sName.toLowerCase();
        const existing = updatedSubjectsMap.get(key);
        if (existing) {
          existing.hours_per_week = hours;
          existing.subject_name = sName;
          if (subj._id) existing.subject_id = String(subj._id);
        } else if (hours > 0) {
          updatedSubjectsMap.set(key, {
            subject_name: sName,
            subject_id: String(subj._id),
            hours_per_week: hours
          });
        }
      }

      const updatedSubjectsList = Array.from(updatedSubjectsMap.values());

      bulkOps.push({
        updateOne: {
          filter: { _id: cls._id },
          update: { $set: { subjects: updatedSubjectsList } }
        }
      });
    }

    if (bulkOps.length > 0) {
      await classCollection.bulkWrite(bulkOps);
    }

    invalidateCache(["all_classes_formatted", "all_classes"]);

    return NextResponse.json({
      message: "ყველა საგნის დატვირთვა წარმატებით შეივსო ეროვნული სასწავლო გეგმის მიხედვით!",
      updatedClassesCount: bulkOps.length,
      matchedCount
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error autofilling all workloads:", error);
    return NextResponse.json(
      { message: error.message || "Failed to autofill workloads" },
      { status: 500 }
    );
  }
}
