"use client";

import React, { useState, useEffect } from "react";
import { FaShieldAlt, FaFileUpload, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

interface InfractionItem {
  _id?: string;
  student_id: string;
  student_name: string;
  mandaturi_ref_id: string;
  category: string;
  description: string;
  infraction_date: string;
  principal_response_doc?: string;
  principal_response_notes?: string;
}

interface StudentItem {
  _id: string;
  name: string;
  surname: string;
  user_ID: string;
}

interface MandaturiInfractionManagerProps {
  selectedColor: string;
}

export default function MandaturiInfractionManager({ selectedColor }: MandaturiInfractionManagerProps) {
  const [infractions, setInfractions] = useState<InfractionItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [mandaturiRef, setMandaturiRef] = useState("");
  const [category, setCategory] = useState("დისციპლინური დარღვევა");
  const [description, setDescription] = useState("");
  const [infractionDate, setInfractionDate] = useState(new Date().toISOString().split("T")[0]);

  // Attach Document State
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [responseFile, setResponseFile] = useState<File | null>(null);
  const [responseNotes, setResponseNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [infRes, stRes] = await Promise.all([
        fetch("/api/mandaturi-infractions"),
        fetch("/api/students")
      ]);

      if (infRes.ok) {
        const infData = await infRes.json();
        setInfractions(infData);
      }
      if (stRes.ok) {
        const stData = await stRes.json();
        setStudents(stData);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInfraction = async (e: React.FormEvent) => {
    e.preventDefault();
    const stObj = students.find((s) => s._id === studentId);
    if (!stObj) return;

    try {
      const res = await fetch("/api/mandaturi-infractions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          student_name: `${stObj.name} ${stObj.surname}`,
          mandaturi_ref_id: mandaturiRef,
          category,
          description,
          infraction_date: infractionDate
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setStudentId("");
        setMandaturiRef("");
        setDescription("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttachPrincipalResponse = async (id: string) => {
    if (!responseFile) {
      setErrorMessage("გთხოვთ აირჩიოთ ფაილი (PDF, Word, სურათი)");
      return;
    }

    setUploading(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", responseFile);
      formData.append("infraction_id", id);
      formData.append("notes", responseNotes);

      const res = await fetch("/api/mandaturi-infractions/attach-response", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "ფაილის ატვირთვისას დაფიქსირდა შეცდომა");
      } else {
        setAttachingId(null);
        setResponseFile(null);
        setResponseNotes("");
        fetchData();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "შეცდომა მიბმისას");
    }
    setUploading(false);
  };

  return (
    <div style={{ color: "#0f172a", width: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FaShieldAlt style={{ color: "#2563eb" }} /> მანდატურის დარღვევები & დირექტორის რეაგირება
          </h3>
          <p style={{ fontSize: "14px", color: "#64748b", fontWeight: 600, margin: "4px 0 0 0" }}>
            მანდატურის სამსახურის საინფორმაციო ბაზიდან შემოსული აღრიცხვის ფურცლები და რეაგირების დოკუმენტები
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "12px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)"
          }}
        >
          + დარღვევის ფურცლის ასახვა
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <form onSubmit={handleCreateInfraction} style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "28px", borderRadius: "20px", width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#0f172a" }}>მანდატურის დარღვევის ფურცლის ასახვა</h3>
            
            <div>
              <label style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "block", marginBottom: "6px" }}>მოსწავლე:</label>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontWeight: 700 }}>
                <option value="">აირჩიეთ მოსწავლე...</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} {s.surname} ({s.user_ID})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "block", marginBottom: "6px" }}>მანდატურის ოქმის / ფურცლის № (Ref ID):</label>
              <input type="text" required value={mandaturiRef} onChange={(e) => setMandaturiRef(e.target.value)} placeholder="მაგ: MAND-2026-8819" style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontWeight: 700 }} />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "block", marginBottom: "6px" }}>კატეგორია:</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontWeight: 700 }}>
                  <option value="დისციპლინური დარღვევა">დისციპლინური დარღვევა</option>
                  <option value="საგაკვეთილო პროცესის ჩაშლა">საგაკვეთილო პროცესის ჩაშლა</option>
                  <option value="ინვენტარის დაზიანება">ინვენტარის დაზიანება</option>
                  <option value="სხვა">სხვა</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "block", marginBottom: "6px" }}>თარიღი:</label>
                <input type="date" value={infractionDate} onChange={(e) => setInfractionDate(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontWeight: 700, colorScheme: "light" }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "block", marginBottom: "6px" }}>დარღვევის შინაარსი / აღწერა:</label>
              <textarea rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="დარღვევის დეტალური აღწერა..." style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontWeight: 700 }} />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "10px 16px", borderRadius: "10px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", fontWeight: 700, cursor: "pointer" }}>გაუქმება</button>
              <button type="submit" style={{ padding: "10px 18px", borderRadius: "10px", background: "#2563eb", color: "white", border: "none", fontWeight: 800, cursor: "pointer" }}>ასახვა</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b", fontWeight: 600 }}>იტვირთება...</div>
      ) : infractions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", color: "#64748b", fontWeight: 700, background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
          🛡️ მანდატურის დარღვევის ფურცლები არ მოიძებნა
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {infractions.map((inf) => (
            <div key={inf._id?.toString()} style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "22px", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 800, padding: "4px 10px", borderRadius: "6px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", textTransform: "uppercase" }}>
                    ოქმი №: {inf.mandaturi_ref_id}
                  </span>
                  <h4 style={{ margin: "8px 0 4px 0", fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>{inf.student_name} ({inf.category})</h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#475569", fontWeight: 600 }}>{inf.description}</p>
                </div>

                <div style={{ textAlign: "right", fontSize: "13px", color: "#64748b", fontWeight: 700 }}>
                  თარიღი: {inf.infraction_date}
                </div>
              </div>

              {/* Principal Response Document */}
              <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                {inf.principal_response_doc ? (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "13px", color: "#166534", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaCheckCircle /> დირექტორის რეაგირების დოკუმენტი მიბმულია
                      </div>
                      {inf.principal_response_notes && <div style={{ fontSize: "13px", color: "#15803d", fontWeight: 600, marginTop: "4px" }}>" {inf.principal_response_notes} "</div>}
                    </div>
                    <a href={inf.principal_response_doc} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontSize: "13px", fontWeight: 800, textDecoration: "underline" }}>
                      დოკუმენტის ნახვა ➔
                    </a>
                  </div>
                ) : (
                  <div>
                    {attachingId === inf._id?.toString() ? (
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>დირექტორის რეაგირების დოკუმენტის მიბმა</div>
                        
                        <input type="file" onChange={(e) => setResponseFile(e.target.files?.[0] || null)} style={{ color: "#0f172a", fontSize: "13px", fontWeight: 600 }} />
                        <input type="text" placeholder="დირექტორის შენიშვნა / რეზოლუცია..." value={responseNotes} onChange={(e) => setResponseNotes(e.target.value)} style={{ padding: "8px 12px", borderRadius: "8px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "13px", fontWeight: 700 }} />

                        {errorMessage && (
                          <div style={{ fontSize: "12px", color: "#dc2626", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                            <FaExclamationTriangle /> {errorMessage}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button disabled={uploading} onClick={() => handleAttachPrincipalResponse(inf._id!.toString())} style={{ background: "#16a34a", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 800, cursor: "pointer" }}>
                            {uploading ? "მოწმდება & იტვირთება..." : "დოკუმენტის მიბმა"}
                          </button>
                          <button onClick={() => setAttachingId(null)} style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>
                            გაუქმება
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAttachingId(inf._id!.toString()); setErrorMessage(""); }} style={{ background: "#f1f5f9", color: "#2563eb", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                        <FaFileUpload /> დირექტორის რეაგირების დოკუმენტის მიბმა
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
