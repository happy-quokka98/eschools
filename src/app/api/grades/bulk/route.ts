import { NextRequest, NextResponse } from "next/server";
import { getDb, getGradesCollectionName } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const grades = await req.json();

    if (!Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json({ message: "მოთხოვნის ტანი არასწორია" }, { status: 400 });
    }

    const db = await getDb();
    const timeStr = new Date().toTimeString().split(" ")[0];

    // Group bulk operations by collection name
    const operationsByCollection: Record<string, any[]> = {};

    for (const grade of grades) {
      grade.time = timeStr;
      if (!grade.lesson_num) {
        grade.lesson_num = 1;
      }
      
      // Convert string IDs to ObjectId for consistent querying
      if (grade.teacher_id && ObjectId.isValid(grade.teacher_id)) {
        grade.teacher_id = new ObjectId(grade.teacher_id);
      }
      if (grade.student_id && ObjectId.isValid(grade.student_id)) {
        grade.student_id = new ObjectId(grade.student_id);
      }
      if (grade.subject_id && ObjectId.isValid(grade.subject_id)) {
        grade.subject_id = new ObjectId(grade.subject_id);
      }
      if (grade.class_id && ObjectId.isValid(grade.class_id)) {
        grade.class_id = new ObjectId(grade.class_id);
      }

      const collectionName = getGradesCollectionName(grade.date);
      if (!operationsByCollection[collectionName]) {
        operationsByCollection[collectionName] = [];
      }

      operationsByCollection[collectionName].push({
        updateOne: {
          filter: {
            student_id: grade.student_id,
            subject_id: grade.subject_id,
            date: grade.date,
            lesson_num: grade.lesson_num,
          },
          update: { $set: grade },
          upsert: true
        }
      });
    }

    // Execute bulkWrite for each collection involved
    for (const [collectionName, ops] of Object.entries(operationsByCollection)) {
      await db.collection(collectionName).bulkWrite(ops);
    }

    // Update student points array with grade ObjectIDs
    for (const grade of grades) {
      if (grade.student_id && grade.subject_id && grade.date) {
        const collectionName = getGradesCollectionName(grade.date);
        const savedGrade = await db.collection(collectionName).findOne({
          student_id: grade.student_id,
          subject_id: grade.subject_id,
          date: grade.date,
          lesson_num: grade.lesson_num || 1,
        });

        if (savedGrade && savedGrade._id) {
          await db.collection("students").updateOne(
            { _id: grade.student_id },
            { $addToSet: { points: savedGrade._id } }
          );
        }
      }
    }

    return NextResponse.json({ message: "ნიშნები წარმატებით შეინახა!" });
  } catch (error) {
    console.error("Error in bulk write:", error);
    return NextResponse.json({ message: "შეცდომა შენახვისას" }, { status: 500 });
  }
}
