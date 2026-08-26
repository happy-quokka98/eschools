import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { user_ID, password } = await req.json();
    if (!user_ID || !password) {
      return NextResponse.json({ message: "გთხოვთ შეიყვანოთ მომხმარებელი და პაროლი" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("students").findOne({ user_ID });
    
    if (!result) {
      return NextResponse.json({ message: "მონაცემები არასწორია" }, { status: 401 });
    }

    const match = await bcrypt.compare(password, result.password);
    if (match) {
      const response: any = {
        message: "ავტორიზაცია წარმატებით დასრულდა",
        user_ID,
        role: "parent",
      };
      if (result.class_id) {
        response.class_id = result.class_id.toString();
      }
      return NextResponse.json(response);
    }
    
    return NextResponse.json({ message: "მონაცემები არასწორია" }, { status: 401 });
  } catch (error) {
    console.error("Parent login error:", error);
    return NextResponse.json({ message: "სერვერზე მოხდა შეცდომა" }, { status: 500 });
  }
}
