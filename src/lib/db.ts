import { MongoClient, Db } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/school";

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db("school");
}

export function getGradesCollectionName(dateInput?: string | Date): string {
  let date: Date;
  if (!dateInput) {
    date = new Date();
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      date = new Date();
    }
  } else {
    date = dateInput;
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed (1-12)

  let startYear: number;
  let endYear: number;

  if (month >= 9) {
    startYear = year;
    endYear = year + 1;
  } else {
    startYear = year - 1;
    endYear = year;
  }

  const startStr = String(startYear).slice(-2);
  const endStr = String(endYear).slice(-2);

  return `${startStr}${endStr}year`;
}

export async function getGradesCollectionNames(db: Db): Promise<string[]> {
  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name);
  
  const yearCollections = names.filter((name) => /^\d{4}year$/.test(name));
  
  if (names.includes("grades")) {
    yearCollections.push("grades");
  }
  
  if (yearCollections.length === 0) {
    yearCollections.push(getGradesCollectionName());
  }
  
  return yearCollections;
}

export function formatYearToCollectionName(yearInput?: string | null): string | null {
  if (!yearInput) return null;

  const rangeMatch = yearInput.match(/^(\d{4})-(\d{4})$/);
  if (rangeMatch) {
    const startStr = rangeMatch[1].slice(-2);
    const endStr = rangeMatch[2].slice(-2);
    return `${startStr}${endStr}year`;
  }

  if (/^\d{4}$/.test(yearInput)) {
    return `${yearInput}year`;
  }

  if (/^\d{4}year$/.test(yearInput)) {
    return yearInput;
  }

  return null;
}

export async function findGrades(
  db: Db,
  filter: Record<string, any>,
  options?: { year?: string | null; date?: string | null }
): Promise<any[]> {
  let collectionName = "";

  if (options?.year) {
    const resolved = formatYearToCollectionName(options.year);
    if (resolved) {
      collectionName = resolved;
    }
  }

  if (!collectionName && options?.date) {
    collectionName = getGradesCollectionName(options.date);
  }

  if (!collectionName && filter.date && typeof filter.date === "string") {
    collectionName = getGradesCollectionName(filter.date);
  }

  if (!collectionName) {
    collectionName = getGradesCollectionName(new Date());
  }

  // Ensure database indexes are created for performance
  ensureIndexes(db, collectionName);

  const results = await db.collection(collectionName).find(filter).toArray();

  return results.filter((grade) => {
    if (!grade.date) return true;
    const dateObj = new Date(grade.date);
    if (isNaN(dateObj.getTime())) return true;
    const month = dateObj.getMonth() + 1; // getMonth is 0-indexed (0-11)
    const day = dateObj.getDate();
    // Exclude June 16 to September 14 inclusive
    const isExcluded =
      (month === 6 && day >= 16) ||
      month === 7 ||
      month === 8 ||
      (month === 9 && day <= 14);
    return !isExcluded;
  });
}

const indexedCollections = new Set<string>();

export async function ensureIndexes(db: any, collectionName: string) {
  if (indexedCollections.has(collectionName)) return;

  try {
    // Idempotent compound index creation for maximum query speed
    await Promise.all([
      db.collection(collectionName).createIndex({ student_id: 1, class_id: 1, subject_id: 1, date: 1, lesson_num: 1 }),
      db.collection(collectionName).createIndex({ class_id: 1, subject_id: 1, date: 1 }),
      db.collection(collectionName).createIndex({ student_id: 1, date: 1 }),
      db.collection("students").createIndex({ user_ID: 1 }, { sparse: true }),
      db.collection("teachers").createIndex({ user_ID: 1 }, { sparse: true }),
      db.collection("assignments").createIndex({ class_id: 1, teacher_id: 1 }),
      db.collection("assignment_submissions").createIndex({ assignment_id: 1, student_id: 1 }),
    ]);
    indexedCollections.add(collectionName);
  } catch (err) {
    console.error("Auto index creation failed:", err);
  }
}


