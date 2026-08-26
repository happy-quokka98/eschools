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
      sender_id,
      sender_name,
      sender_role,
      receiver_id,
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

    const db = await getDb();

    // Option 1: Get list of potential contacts to start a chat with
    if (get_contacts === "true") {
      const roleLabels: Record<string, string> = {
        rector: "რექტორი",
        prorector: "პრორექტორი",
        academic: "სასწავლო ნაწილი",
        clerk: "საქმის მწარმოებელი",
        secretary: "მდივანი",
        accountant: "ბუღალტერი",
        it_manager: "IT მენეჯერი",
        ped_council: "პედსაბჭოს ხელმძღვანელი",
        admin: "ადმინისტრატორი",
        sysadmin: "სისტემური ადმინისტრატორი"
      };

      if (role === "student" || role === "parent") {
        // Find student class
        const student = await db.collection("students").findOne({ user_ID: user_id });
        if (!student || !student.class_id) {
          return NextResponse.json([]);
        }
        
        // Find class subjects and teachers
        const classDoc = await db.collection("class").findOne({ _id: student.class_id });
        if (!classDoc || !classDoc.subjects) {
          return NextResponse.json([]);
        }
        
        const teacherIds = classDoc.subjects.map((s: any) => s.teacher_id);
        const teachers = await db.collection("teachers")
          .find({ _id: { $in: teacherIds } })
          .toArray();

        // Parents see: teachers + staff except ped_council
        const admins = await db.collection("admins").find({ role: { $ne: "ped_council" } }).toArray();

        const contacts = [
          ...teachers.map((t: any) => ({
            id: t.user_ID,
            name: `${t.name} ${t.surname}`,
            role: "teacher"
          })),
          ...admins.map((a: any) => ({
            id: a.user_ID,
            name: `${a.name} ${a.surname} (${roleLabels[a.role || "admin"]})`,
            role: a.role || "admin"
          }))
        ];

        return NextResponse.json(contacts);
      } else if (role === "teacher") {
        // Find classes this teacher teaches
        const teacher = await db.collection("teachers").findOne({ user_ID: user_id });
        if (!teacher) return NextResponse.json([]);

        const classes = await db.collection("class")
          .find({ "subjects.teacher_id": teacher._id })
          .toArray();

        const classIds = classes.map((c: any) => c._id);

        // Fetch students in these classes to contact their parents
        const students = await db.collection("students")
          .find({ class_id: { $in: classIds } })
          .toArray();

        // Teachers see: parents of their students + all staff (including ped_council)
        const admins = await db.collection("admins").find({}).toArray();

        const contacts = [
          ...students.map((s: any) => ({
            id: s.user_ID,
            name: `მშობელი: ${s.name} ${s.surname} (${classes.find(c => c._id.toString() === s.class_id.toString())?.classname || ""})`,
            role: "parent"
          })),
          ...admins.map((a: any) => ({
            id: a.user_ID,
            name: `${a.name} ${a.surname} (${roleLabels[a.role || "admin"]})`,
            role: a.role || "admin"
          }))
        ];

        return NextResponse.json(contacts);
      } else if (role === "ped_council") {
        // Ped council head can message only teachers
        const teachers = await db.collection("teachers").find({}).toArray();
        const contacts = teachers.map((t: any) => ({
          id: t.user_ID,
          name: `${t.name} ${t.surname} (მასწავლებელი)`,
          role: "teacher"
        }));
        return NextResponse.json(contacts);
      } else if (["admin", "rector", "prorector", "academic", "clerk", "secretary", "accountant", "it_manager", "sysadmin"].includes(role || "")) {
        // Staff see all teachers and all parents.
        // If it's IT Manager, they also see all students.
        const teachers = await db.collection("teachers").find({}).toArray();
        const students = await db.collection("students").find({}).toArray();
        const classes = await db.collection("class").find({}).toArray();

        const contacts = [
          ...teachers.map((t: any) => ({
            id: t.user_ID,
            name: `${t.name} ${t.surname} (მასწავლებელი)`,
            role: "teacher"
          })),
          ...students.map((s: any) => ({
            id: s.user_ID,
            name: role === "it_manager" ? `მოსწავლე: ${s.name} ${s.surname} (${classes.find(c => c._id.toString() === s.class_id.toString())?.classname || ""})` : `მშობელი: ${s.name} ${s.surname} (${classes.find(c => c._id.toString() === s.class_id.toString())?.classname || ""})`,
            role: role === "it_manager" ? "student" : "parent"
          }))
        ];

        return NextResponse.json(contacts);
      }
    }

    // Option 2: Get chat history between current user and a specific contact
    if (contact_id) {
      const filter: any = {
        $or: [
          { sender_id: user_id, receiver_id: contact_id },
          { sender_id: contact_id, receiver_id: user_id }
        ]
      };
      if (role) {
        filter.$or = [
          { sender_id: user_id, sender_role: role, receiver_id: contact_id },
          { sender_id: contact_id, receiver_id: user_id, receiver_role: role }
        ];
      }
      const chatMessages = await db.collection("messages")
        .find(filter)
        .sort({ date: 1, time: 1 })
        .toArray();

      return NextResponse.json(chatMessages);
    }

    // Option 3: Get all messages for the current user (inbox overview)
    const filterAll: any = {
      $or: [
        { sender_id: user_id },
        { receiver_id: user_id }
      ]
    };
    if (role) {
      filterAll.$or = [
        { sender_id: user_id, sender_role: role },
        { receiver_id: user_id, receiver_role: role }
      ];
    }
    const allUserMessages = await db.collection("messages")
      .find(filterAll)
      .sort({ date: -1, time: -1 })
      .toArray();

    return NextResponse.json(allUserMessages);
  } catch (error) {
    console.error("Error in GET messages API:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}
