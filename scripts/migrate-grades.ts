import { MongoClient } from "mongodb";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/";
const dbName = "school";

function getGradesCollectionName(dateInput?: string | Date): string {
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
  const month = date.getMonth() + 1;

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

async function migrate() {
  const client = new MongoClient(uri);

  try {
    console.log("🚀 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected successfully.");
    const db = client.db(dbName);

    const gradesColl = db.collection("grades");
    const existingGrades = await gradesColl.find({}).toArray();

    if (existingGrades.length === 0) {
      console.log("ℹ️ No grades found in the legacy 'grades' collection to migrate.");
      return;
    }

    console.log(`📦 Found ${existingGrades.length} grades in legacy collection. Grouping for bulk migration...`);

    // Group grades by target collection
    const groupedByColl: Record<string, any[]> = {};
    for (const grade of existingGrades) {
      const targetCollName = getGradesCollectionName(grade.date);
      if (!groupedByColl[targetCollName]) {
        groupedByColl[targetCollName] = [];
      }
      groupedByColl[targetCollName].push(grade);
    }

    const stats: Record<string, number> = {};

    // Process each target collection using bulkWrite operations
    await Promise.all(
      Object.entries(groupedByColl).map(async ([collName, grades]) => {
        const targetColl = db.collection(collName);

        const ops = grades.map((grade) => ({
          updateOne: {
            filter: {
              student_id: grade.student_id,
              subject_id: grade.subject_id,
              date: grade.date,
            },
            update: { $set: grade },
            upsert: true,
          },
        }));

        const chunkSize = 1000;
        for (let i = 0; i < ops.length; i += chunkSize) {
          const chunk = ops.slice(i, i + chunkSize);
          await targetColl.bulkWrite(chunk, { ordered: false });
        }

        stats[collName] = grades.length;
      })
    );

    console.log("\n✅ Migration completed successfully!");
    console.log("-----------------------------------------");
    for (const [coll, count] of Object.entries(stats)) {
      console.log(`📍 Collection '${coll}': Migrated ${count} grades.`);
    }
    console.log("-----------------------------------------");
    console.log("Note: For safety, legacy grades have NOT been deleted from the 'grades' collection.");

  } catch (error) {
    console.error("❌ Error during migration:", error);
  } finally {
    await client.close();
    console.log("🚀 Connection closed.");
  }
}

migrate();

