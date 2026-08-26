import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

// GET: Fetch applications based on role
export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const role = req.nextUrl.searchParams.get("role");
    const userId = req.nextUrl.searchParams.get("user_id");

    if (!role || !userId) {
      return NextResponse.json({ message: "როლი და მომხმარებლის ID აუცილებელია" }, { status: 400 });
    }

    let query: any = {};
    const own = req.nextUrl.searchParams.get("own");

    if (own === "true") {
      query = { teacher_id: userId, submittedByRole: "teacher" };
    } else if (role === "parent") {
      // Find the student record first to get their database _id
      const student = await db.collection("students").findOne({ user_ID: userId });
      if (!student) {
        return NextResponse.json([]);
      }
      query = { student_id: student._id };
    } else if (role === "teacher") {
      // Find the teacher record to get their _id
      const teacher = await db.collection("teachers").findOne({ user_ID: userId });
      if (!teacher) {
        return NextResponse.json([]);
      }
      
      // Find the classes this teacher tutors (homerooms)
      const tutorClasses = await db.collection("class").find({ tutor_id: teacher._id }).toArray();
      if (tutorClasses.length === 0) {
        return NextResponse.json([]);
      }
      
      const classIds = tutorClasses.map(cls => cls._id);
      query = { class_id: { $in: classIds } };
    } else if (["admin", "rector", "prorector", "academic", "sysadmin"].includes(role)) {
      // Sees all applications
      query = {};
    } else if (role === "clerk") {
      // Sees absence reasons/similar
      query = { type: { $in: ["ავადმყოფობის გამოცდენა", "სკოლიდან გათავისუფლება"] } };
    } else if (role === "secretary") {
      // Sees teacher applications
      query = { submittedByRole: "teacher" };
    } else if (role === "accountant") {
      // Sees financial applications
      query = { type: "ფინანსური / გადახდები" };
    } else {
      return NextResponse.json({ message: "არასწორი როლი" }, { status: 400 });
    }

    const applications = await db.collection("applications").find(query).sort({ submittedAt: -1 }).toArray();

    // Populate student and class details for display if present
    const studentIds = applications.filter(app => app.student_id).map(app => app.student_id);
    const classIds = applications.filter(app => app.class_id).map(app => app.class_id);

    const students = await db.collection("students").find({ _id: { $in: studentIds } }).toArray();
    const classes = await db.collection("class").find({ _id: { $in: classIds } }).toArray();

    const studentMap = Object.fromEntries(students.map(s => [s._id.toString(), `${s.name} ${s.surname}`]));
    const classMap = Object.fromEntries(classes.map(c => [c._id.toString(), c.classname]));

    const populatedApplications = applications.map(app => ({
      ...app,
      _id: app._id.toString(),
      student_id: app.student_id ? app.student_id.toString() : null,
      class_id: app.class_id ? app.class_id.toString() : null,
      studentName: app.student_id ? (studentMap[app.student_id.toString()] || "უცნობი მოსწავლე") : (app.teacherName || "მასწავლებელი"),
      classname: app.class_id ? (classMap[app.class_id.toString()] || "უცნობი კლასი") : "მასწავლებელი"
    }));

    return NextResponse.json(populatedApplications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}

// POST: Submit a new application (by parent or teacher)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDb();

    if (body.submittedByRole === "teacher") {
      const { teacher_id, type, title, content } = body;
      if (!teacher_id || !type || !title || !content) {
        return NextResponse.json({ message: "ყველა ველი აუცილებელია" }, { status: 400 });
      }

      const teacher = await db.collection("teachers").findOne({ user_ID: teacher_id });
      if (!teacher) {
        return NextResponse.json({ message: "მასწავლებელი ვერ მოიძებნა" }, { status: 404 });
      }

      const application = {
        teacher_id: teacher.user_ID,
        teacherName: `${teacher.name} ${teacher.surname}`,
        submittedByRole: "teacher",
        type,
        title,
        content,
        status: "განხილვაში",
        submittedAt: new Date().toISOString(),
        resolvedBy: null,
        resolvedAt: null,
        comment: ""
      };

      await db.collection("applications").insertOne(application);
      return NextResponse.json({ message: "განაცხადი წარმატებით გაიგზავნა" });
    }

    const { student_id, type, title, content } = body;

    if (!student_id || !type || !title || !content) {
      return NextResponse.json({ message: "ყველა ველი აუცილებელია" }, { status: 400 });
    }

    const student = await db.collection("students").findOne({ user_ID: student_id });
    if (!student) {
      return NextResponse.json({ message: "მოსწავლე ვერ მოიძებნა" }, { status: 404 });
    }

    const application = {
      student_id: student._id,
      class_id: student.class_id,
      parent_id: student_id,
      type,
      title,
      content,
      status: "განხილვაში",
      submittedAt: new Date().toISOString(),
      resolvedBy: null,
      resolvedAt: null,
      comment: ""
    };

    await db.collection("applications").insertOne(application);

    return NextResponse.json({ message: "განაცხადი წარმატებით გაიგზავნა" });
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}

// PUT: Resolve/Update application status (by teacher or admin)
export async function PUT(req: NextRequest) {
  try {
    const { applicationId, status, comment, resolvedBy } = await req.json();

    if (!applicationId || !status || !resolvedBy) {
      return NextResponse.json({ message: "აუცილებელი პარამეტრები აკლია" }, { status: 400 });
    }

    if (status !== "დადასტურებული" && status !== "უარყოფილი") {
      return NextResponse.json({ message: "არასწორი სტატუსი" }, { status: 400 });
    }

    const db = await getDb();
    
    // Find resolver name (teacher or admin/staff)
    let resolverName = "სკოლის ადმინისტრაცია";
    const teacher = await db.collection("teachers").findOne({ user_ID: resolvedBy });
    if (teacher) {
      resolverName = `${teacher.name} ${teacher.surname} (დამრიგებელი)`;
    } else {
      const admin = await db.collection("admins").findOne({ user_ID: resolvedBy });
      if (admin) {
        const roleLabels: Record<string, string> = {
          rector: "რექტორი",
          prorector: "პრორექტორი",
          academic: "სასწავლო ნაწილი",
          clerk: "საქმის მწარმოებელი",
          secretary: "მდივანი",
          accountant: "ბუღალტერი",
          ped_council: "პედსაბჭოს ხელმძღვანელი",
          admin: "ადმინისტრატორი"
        };
        const roleLabel = roleLabels[admin.role] || "ადმინისტრატორი";
        resolverName = `${admin.name} ${admin.surname} (${roleLabel})`;
      }
    }

    const result = await db.collection("applications").updateOne(
      { _id: new ObjectId(applicationId) },
      {
        $set: {
          status,
          comment: comment || "",
          resolvedBy: resolverName,
          resolvedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "განაცხადი ვერ მოიძებნა" }, { status: 404 });
    }

    return NextResponse.json({ message: "განაცხადის სტატუსი წარმატებით განახლდა" });
  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}
