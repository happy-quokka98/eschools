import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

// Forbidden executable file extensions
const DANGEROUS_EXTENSIONS = [
  ".exe", ".bat", ".bin", ".cmd", ".sh", ".ps1", ".msi", ".dll", ".scr", ".vbs", ".jar", ".com", ".pif", ".application", ".gadget", ".wsf"
];

// Allowed MIME magic signatures (file headers)
const DANGEROUS_MAGIC_HEADERS = [
  "4d5a", // MZ (.exe, .dll)
  "7f454c46", // ELF (.bin, Linux executable)
  "213c617263683e", // archive
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ფაილი არ არის ატვირთული" }, { status: 400 });
    }

    const filename = file.name || "file";
    const ext = path.extname(filename).toLowerCase();

    // 1. Check Extension
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      return NextResponse.json({
        error: `უსაფრთხოების დარღვევა: საშიში გაფართოების ფაილი (${ext}) დაბლოკილია!`,
        blocked: true
      }, { status: 400 });
    }

    // Read initial bytes (magic header)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hexHeader = buffer.subarray(0, 8).toString("hex").toLowerCase();

    // 2. Check Magic Bytes Header
    for (const dangerousHeader of DANGEROUS_MAGIC_HEADERS) {
      if (hexHeader.startsWith(dangerousHeader)) {
        return NextResponse.json({
          error: "უსაფრთხოების დარღვევა: ფაილის შიგთავსი სცდება უსაფრთხოების სტანდარტს (Exec/Binary header detected)!",
          blocked: true
        }, { status: 400 });
      }
    }

    // Save allowed safe file to public/uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeFilename);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${safeFilename}`;

    return NextResponse.json({
      success: true,
      file_name: filename,
      file_url: fileUrl,
      size: file.size
    });

  } catch (err: any) {
    console.error("File upload error:", err);
    return NextResponse.json({ error: err.message || "ფაილის ატვირთვის შეცდომა" }, { status: 500 });
  }
}
