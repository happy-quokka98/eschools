import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import { Message } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    const { sender_id, sender_name, sender_role, receiver_id, receiver_name, receiver_role, content } = await req.json();

    if (!sender_id || !sender_name || !sender_role || !receiver_id || !receiver_name || !receiver_role || !content) {
      return NextResponse.json({ message: "ყველა ველი აუცილებელია" }, { status: 400 });
    }

    const db = await getDb();
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toTimeString().split(' ')[0];

    const message: Message = {
      sender_id: sender_id.toString(),
      sender_name,
      sender_role,
      receiver_id: receiver_id.toString(),
      receiver_name,
      receiver_role,
      content,
      date: dateStr,
      time: timeStr
    };

    await db.collection("messages").insertOne(message);

    return NextResponse.json({ message: "შეტყობინება წარმატებით გაიგზავნა", data: message });
  } catch (error) {
    console.error("Error in POST messages API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user_id = req.nextUrl.searchParams.get("user_id");
    const contact_id = req.nextUrl.searchParams.get("contact_id");
    const get_contacts = req.nextUrl.searchParams.get("get_contacts");
    const role = req.nextUrl.searchParams.get("role");

    if (!user_id) {
      return NextResponse.json({ message: "user_id საჭიროა" }, { status: 400 });
    }

    const trimmedUserId = user_id.trim();
    const db = await getDb();

    // Option 1: Get list of potential contacts to start a chat with
    if (get_contacts === "true") {
      if (role === "student") {
        let student = null;
        if (ObjectId.isValid(trimmedUserId)) {
          student = await db.collection("students").findOne({ _id: new ObjectId(trimmedUserId) });
        }
        if (!student) {
          student = await db.collection("students").findOne({
            $or: [{ ID: trimmedUserId }, { user_ID: trimmedUserId }]
          });
        }
        if (!student || !student.class_id) {
          return NextResponse.json([]);
        }
        
        const classDoc = await db.collection("class").findOne({
          $or: [{ _id: student.class_id }, { _id: ObjectId.isValid(student.class_id.toString()) ? new ObjectId(student.class_id.toString()) : null }]
        });
        if (!classDoc || !classDoc.subjects) {
          return NextResponse.json([]);
        }
        
        const teacherIds = classDoc.subjects.map((s: any) => s.teacher_id);
        const teachers = await db.collection("teachers")
          .find({
            $or: [
              { _id: { $in: teacherIds } },
              { ID: { $in: teacherIds.map((t: any) => t.toString()) } },
              { user_ID: { $in: teacherIds.map((t: any) => t.toString()) } }
            ]
          })
          .toArray();

        const contacts = teachers.map((t: any) => ({
          id: t.ID || t.user_ID || t._id.toString(),
          name: `${t.name} ${t.surname} (მასწავლებელი)`,
          role: "teacher"
        }));

        return NextResponse.json(contacts);
      } else if (role === "teacher") {
        // Find teacher by ObjectId, ID, or user_ID
        let teacher = null;
        if (ObjectId.isValid(trimmedUserId)) {
          teacher = await db.collection("teachers").findOne({ _id: new ObjectId(trimmedUserId) });
        }
        if (!teacher) {
          teacher = await db.collection("teachers").findOne({
            $or: [{ ID: trimmedUserId }, { user_ID: trimmedUserId }]
          });
        }
        if (!teacher) return NextResponse.json([]);

        const teacherStrId = teacher._id.toString();
        const teacherPersonalId = teacher.ID || teacher.user_ID;

        // Fetch all classes
        const allClasses = await db.collection("class").find({}).toArray();

        // Collect class IDs assigned to teacher
        const assignedClassIdStrings = new Set<string>();
        if (Array.isArray(teacher.classes)) {
          teacher.classes.forEach((tc: any) => {
            if (tc.class_id) assignedClassIdStrings.add(tc.class_id.toString());
          });
        }

        // Filter classes where teacher is assigned or tutor
        const myClasses = allClasses.filter((c: any) => {
          const cIdStr = c._id.toString();
          if (assignedClassIdStrings.has(cIdStr)) return true;
          const damrigebeliStr = c.damrigebeli ? c.damrigebeli.toString() : (c.tutor_id ? c.tutor_id.toString() : null);
          if (damrigebeliStr && (damrigebeliStr === teacherStrId || damrigebeliStr === teacherPersonalId)) return true;
          if (Array.isArray(c.subjects)) {
            return c.subjects.some((s: any) => {
              const tid = s.teacher_id ? s.teacher_id.toString() : null;
              return tid && (tid === teacherStrId || tid === teacherPersonalId);
            });
          }
          return false;
        });

        const myClassIdStrings = new Set(myClasses.map(c => c._id.toString()));

        // Fetch students belonging ONLY to these classes
        const allStudents = await db.collection("students").find({}, { projection: { password: 0, points: 0 } }).toArray();
        const myStudents = allStudents.filter(s => s.class_id && myClassIdStrings.has(s.class_id.toString()));

        // Fetch colleague teachers who teach in these SAME classes
        const colleagueTeacherIds = new Set<string>();
        myClasses.forEach((c: any) => {
          if (c.damrigebeli) colleagueTeacherIds.add(c.damrigebeli.toString());
          if (c.tutor_id) colleagueTeacherIds.add(c.tutor_id.toString());
          if (Array.isArray(c.subjects)) {
            c.subjects.forEach((s: any) => {
              if (s.teacher_id) colleagueTeacherIds.add(s.teacher_id.toString());
            });
          }
        });

        const allTeachers = await db.collection("teachers").find({}, { projection: { password: 0 } }).toArray();
        const myColleagues = allTeachers.filter(t => {
          const tIdStr = t._id.toString();
          const tPersonalId = t.ID || t.user_ID;
          if (tIdStr === teacherStrId || tPersonalId === teacherPersonalId) return false;
          return colleagueTeacherIds.has(tIdStr) || (tPersonalId && colleagueTeacherIds.has(tPersonalId));
        });

        const contacts = [
          ...myColleagues.map((t: any) => ({
            id: t.ID || t.user_ID || t._id.toString(),
            name: `${t.name} ${t.surname} (კოლეგა მასწავლებელი)`,
            role: "teacher"
          })),
          ...myStudents.map((s: any) => {
            const cObj = myClasses.find(c => c._id.toString() === s.class_id.toString());
            const classNameStr = cObj ? (cObj.ID || cObj.classname || "") : "";
            return {
              id: s.ID || s.user_ID || s._id.toString(),
              name: `${s.name} ${s.surname} (${classNameStr})`,
              role: "student"
            };
          })
        ];

        return NextResponse.json(contacts);
      } else if (role === "admin") {
        // Admin can message any teacher or student
        const teachers = await db.collection("teachers").find({}).toArray();
        const students = await db.collection("students").find({}).toArray();
        const classes = await db.collection("class").find({}).toArray();

        const contacts = [
          ...teachers.map((t: any) => ({
            id: t.ID || t.user_ID || t._id.toString(),
            name: `${t.name} ${t.surname} (მასწავლებელი)`,
            role: "teacher"
          })),
          ...students.map((s: any) => ({
            id: s.ID || s.user_ID || s._id.toString(),
            name: `${s.name} ${s.surname} (${classes.find(c => c._id.toString() === s.class_id.toString())?.ID || classes.find(c => c._id.toString() === s.class_id.toString())?.classname || ""})`,
            role: "student"
          }))
        ];

        return NextResponse.json(contacts);
      }
    }

    // Option 2: Get chat history between current user and a specific contact
    if (contact_id) {
      const trimmedContactId = contact_id.trim();
      const chatMessages = await db.collection("messages")
        .find({
          $or: [
            { sender_id: trimmedUserId, receiver_id: trimmedContactId },
            { sender_id: trimmedContactId, receiver_id: trimmedUserId }
          ]
        })
        .sort({ date: 1, time: 1 })
        .toArray();

      return NextResponse.json(chatMessages);
    }

    // Option 3: Get all messages for the current user (inbox overview)
    const allUserMessages = await db.collection("messages")
      .find({
        $or: [
          { sender_id: trimmedUserId },
          { receiver_id: trimmedUserId }
        ]
      })
      .sort({ date: -1, time: -1 })
      .toArray();

    return NextResponse.json(allUserMessages);
  } catch (error) {
    console.error("Error in GET messages API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}
