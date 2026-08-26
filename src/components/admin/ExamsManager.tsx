"use client";
import React, { useState, useEffect } from "react";
import { FaCalendarCheck, FaUserEdit, FaPlus, FaCheck, FaTimes } from "react-icons/fa";
import { Exam, ExternRegistration } from "@/lib/models";

interface ExamsManagerProps {
  selectedColor: string;
}

export default function ExamsManager({ selectedColor }: ExamsManagerProps) {
  const [activeTab, setActiveTab] = useState<"exams" | "externs">("exams");
  const [exams, setExams] = useState<Exam[]>([]);
  const [externs, setExterns] = useState<ExternRegistration[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Exam Form
  const [showExamModal, setShowExamModal] = useState(false);
  const [examType, setExamType] = useState<"annual" | "semester" | "autumn" | "extern_30" | "make_up">("annual");
  const [examTitle, setExamTitle] = useState("");
  const [examClassId, setExamClassId] = useState("");
  const [examSubjectId, setExamSubjectId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examTime, setExamTime] = useState("10:00");
  const [examLocation, setExamLocation] = useState("საგამოცდო ოთახი 204");

  // New Extern Form
  const [showExternModal, setShowExternModal] = useState(false);
  const [extName, setExtName] = useState("");
  const [extSurname, setExtSurname] = useState("");
  const [extPersonalId, setExtPersonalId] = useState("");
  const [extPhone, setExtPhone] = useState("");
  const [extSubjects, setExtSubjects] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eRes, extRes, cRes, sRes] = await Promise.all([
        fetch("/api/exams"),
        fetch("/api/exams/register-extern"),
        fetch("/api/classes"),
        fetch("/api/subjects")
      ]);

      if (eRes.ok) setExams(await eRes.json());
      if (extRes.ok) setExterns(await extRes.json());
      if (cRes.ok) setClasses(await cRes.json());
      if (sRes.ok) setSubjects(await sRes.json());
    } catch (err) {
      console.error("Exams fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle || !examClassId || !examDate) return;

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: examType,
          title: examTitle,
          class_id: examClassId,
          subject_id: examSubjectId,
          date: examDate,
          time: examTime,
          location: examLocation
        })
      });
      if (res.ok) {
        setShowExamModal(false);
        setExamTitle("");
        fetchData();
      }
    } catch (err) {
      console.error("Create exam error:", err);
    }
  };

  const handleRegisterExtern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extName || !extSurname || !extPersonalId) return;

    try {
      const res = await fetch("/api/exams/register-extern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: extName,
          student_surname: extSurname,
          personal_id: extPersonalId,
          phone: extPhone,
          subjects: extSubjects.length > 0 ? extSubjects : ["მათემატიკა", "ქართული"]
        })
      });
      if (res.ok) {
        setShowExternModal(false);
        setExtName("");
        setExtSurname("");
        setExtPersonalId("");
        fetchData();
      }
    } catch (err) {
      console.error("Register extern error:", err);
    }
  };

  const handleExternStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/exams/register-extern", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Extern status error:", err);
    }
  };

  const getExamTypeName = (type: string) => {
    switch (type) {
      case "annual": return "წლიური გამოცდა";
      case "semester": return "სემესტრული გამოცდა";
      case "autumn": return "საშემოდგომო გამოცდა";
      case "extern_30": return "ექსტერნატი (30% გაცდენა)";
      case "make_up": return "შემაჯამებლის აღდგენა";
      default: return type;
    }
  };

  return (
    <div style={{ color: "white", width: "100%" }}>
      {/* Header Tabs */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setActiveTab("exams")}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              border: "none",
              background: activeTab === "exams" ? selectedColor : "rgba(255,255,255,0.06)",
              color: "white",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            გამოცდების დაგეგმვა
          </button>
          <button
            onClick={() => setActiveTab("externs")}
            style={{
              padding: "10px 18px",
              borderRadius: "12px",
              border: "none",
              background: activeTab === "externs" ? selectedColor : "rgba(255,255,255,0.06)",
              color: "white",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            ექსტერნატის რეგისტრაციები
          </button>
        </div>

        {activeTab === "exams" ? (
          <button
            onClick={() => setShowExamModal(true)}
            style={{
              background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}99)`,
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "12px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            + გამოცდის ჩანიშვნა
          </button>
        ) : (
          <button
            onClick={() => setShowExternModal(true)}
            style={{
              background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}99)`,
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "12px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            + ექსტერნის რეგისტრაცია
          </button>
        )}
      </div>

      {/* Exam Modal */}
      {showExamModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <form onSubmit={handleCreateExam} style={{ background: "#18181b", padding: "24px", borderRadius: "20px", width: "100%", maxWidth: "500px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>ახალი გამოცდის ჩანიშვნა</h3>
            
            <div>
              <label style={{ fontSize: "12px", opacity: 0.7 }}>გამოცდის ტიპი:</label>
              <select value={examType} onChange={(e: any) => setExamType(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
                <option value="annual">წლიური გამოცდა</option>
                <option value="semester">სემესტრული გამოცდა</option>
                <option value="autumn">საშემოდგომო გამოცდა</option>
                <option value="extern_30">ექსტერნატი (30% გაცდენის გამო)</option>
                <option value="make_up">შემაჯამებლის აღდგენა</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", opacity: 0.7 }}>სათაური / დასახელება:</label>
              <input type="text" required value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="მაგ: მათემატიკის ექსტერნატი" style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
            </div>

            <div>
              <label style={{ fontSize: "12px", opacity: 0.7 }}>კლასი:</label>
              <select value={examClassId} onChange={(e) => setExamClassId(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
                <option value="">აირჩიეთ კლასი...</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.classname}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", opacity: 0.7 }}>თარიღი:</label>
                <input type="date" required value={examDate} onChange={(e) => setExamDate(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", opacity: 0.7 }}>დრო:</label>
                <input type="time" value={examTime} onChange={(e) => setExamTime(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", opacity: 0.7 }}>ჩატარების ადგილი / ოთახი:</label>
              <input type="text" value={examLocation} onChange={(e) => setExamLocation(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
              <button type="button" onClick={() => setShowExamModal(false)} style={{ padding: "10px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", color: "white", border: "none", cursor: "pointer" }}>გაუქმება</button>
              <button type="submit" style={{ padding: "10px 16px", borderRadius: "8px", background: selectedColor, color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}>შენახვა</button>
            </div>
          </form>
        </div>
      )}

      {/* Extern Registration Modal */}
      {showExternModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <form onSubmit={handleRegisterExtern} style={{ background: "#18181b", padding: "24px", borderRadius: "20px", width: "100%", maxWidth: "500px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>ექსტერნატის გამოცდაზე რეგისტრაცია</h3>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", opacity: 0.7 }}>სახელი:</label>
                <input type="text" required value={extName} onChange={(e) => setExtName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", opacity: 0.7 }}>გვარი:</label>
                <input type="text" required value={extSurname} onChange={(e) => setExtSurname(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", opacity: 0.7 }}>პირადი ნომერი (11 ნიშნა):</label>
              <input type="text" required value={extPersonalId} onChange={(e) => setExtPersonalId(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
            </div>

            <div>
              <label style={{ fontSize: "12px", opacity: 0.7 }}>ტელეფონის ნომერი:</label>
              <input type="text" value={extPhone} onChange={(e) => setExtPhone(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
              <button type="button" onClick={() => setShowExternModal(false)} style={{ padding: "10px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", color: "white", border: "none", cursor: "pointer" }}>გაუქმება</button>
              <button type="submit" style={{ padding: "10px 16px", borderRadius: "8px", background: selectedColor, color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}>რეგისტრაცია</button>
            </div>
          </form>
        </div>
      )}

      {/* Content View */}
      {activeTab === "exams" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {exams.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", opacity: 0.5, background: "rgba(255,255,255,0.02)", borderRadius: "16px" }}>
              ჩანიშნული გამოცდები არ მოიძებნა
            </div>
          ) : (
            exams.map((ex) => {
              const clsObj = classes.find(c => c._id === ex.class_id);
              return (
                <div key={ex._id?.toString()} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px 20px", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "6px", background: `${selectedColor}33`, color: selectedColor, textTransform: "uppercase" }}>
                      {getExamTypeName(ex.type)}
                    </span>
                    <h4 style={{ margin: "6px 0 2px 0", fontSize: "16px" }}>{ex.title} ({clsObj?.classname || "კლასი"})</h4>
                    <div style={{ fontSize: "12px", opacity: 0.6 }}>ოთახი: {ex.location}</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700 }}>{ex.date} | {ex.time}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {externs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", opacity: 0.5, background: "rgba(255,255,255,0.02)", borderRadius: "16px" }}>
              ექსტერნატის რეგისტრაციები არ მოიძებნა
            </div>
          ) : (
            externs.map((ext) => (
              <div key={ext._id?.toString()} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px 20px", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px" }}>{ext.student_name} {ext.student_surname}</h4>
                  <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "2px" }}>
                    პირადი №: <strong>{ext.personal_id}</strong> | ტელ: {ext.phone || "—"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#60a5fa", marginTop: "4px" }}>
                    საგნები: {ext.subjects?.join(", ")}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 800, padding: "4px 10px", borderRadius: "6px",
                    background: ext.status === "approved" ? "#10b98133" : ext.status === "rejected" ? "#ef444433" : "#f59e0b33",
                    color: ext.status === "approved" ? "#34d399" : ext.status === "rejected" ? "#f87171" : "#fbbf24"
                  }}>
                    {ext.status === "approved" ? "დადასტურებული" : ext.status === "rejected" ? "უარყოფილი" : "მომლოდინე"}
                  </span>

                  {ext.status === "pending" && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => handleExternStatus(ext._id!.toString(), "approved")} style={{ background: "#10b981", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}>დადასტურება</button>
                      <button onClick={() => handleExternStatus(ext._id!.toString(), "rejected")} style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}>უარყოფა</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
