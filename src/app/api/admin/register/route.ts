import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, surname, user_ID, password, requesterId } = await req.json();

    if (!user_ID || !password || !name || !surname) {
      return NextResponse.json({ message: "ყველა ველის შევსება სავალდებულოა" }, { status: 400 });
    }

    const db = await getDb();

    // Enforce superadmin restriction: only superadmin can add admins
    if (requesterId) {
      const requester = await db.collection("admins").findOne({ user_ID: requesterId });
      const isSuperadmin = requester?.role === "superadmin" || requesterId === "kakhi-kakhidze";
      if (!isSuperadmin) {
        return NextResponse.json({ message: "მხოლოდ სუპერადმინისტრატორს აქვს ადმინისტრატორის დამატების უფლება" }, { status: 403 });
      }
    }

    // Check if user_ID already exists
    const existingAdmin = await db.collection("admins").findOne({ user_ID });
    const existingUser = await db.collection("users").findOne({ user_ID });
    if (existingAdmin || existingUser) {
      return NextResponse.json({ message: "ამ მომხმარებლის ID-ით ადმინისტრატორი უკვე არსებობს" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminDoc = {
      name,
      surname,
      user_ID,
      password: hashedPassword,
      role: "admin",
      createdAt: new Date().toISOString()
    };

    await db.collection("admins").insertOne({ ...adminDoc });
    await db.collection("users").insertOne({ ...adminDoc });

    return NextResponse.json({ message: "ადმინისტრატორი წარმატებით დარეგისტრირდა", user_ID });
  } catch (error) {
    console.error("Error registering admin:", error);
    return NextResponse.json({ message: "ადმინისტრატორის რეგისტრაციისას მოხდა შეცდომა" }, { status: 500 });
  }
}

