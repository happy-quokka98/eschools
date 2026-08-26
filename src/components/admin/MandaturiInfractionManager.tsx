"use client";
import React, { useState, useEffect } from "react";
import { FaShieldAlt, FaFileUpload, FaFileAlt, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { Infraction } from "@/lib/models";

interface MandaturiInfractionManagerProps {
  selectedColor: string;
}

export default function MandaturiInfractionManager({ selectedColor }: MandaturiInfractionManagerProps) {
  const [infractions, setInfractions] = useState<Infraction[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form for new Mandaturi infraction sheet
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [mandaturiRef, setMandaturiRef] = useState("");
  const [category, setCategory] = useState("დისციპლინური დარღვევა");
  const [description, setDescription] = useState("");
  const [infractionDate, setInfractionDate] = useState(new Date().toISOString().split("T")[0]);

  // Form for attaching principal response document
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [responseFile, setResponseFile] = useState<File | null>(null);
  const [responseNotes, setResponseNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [iRes, sRes] = await Promise.all([
        fetch("/api/infractions"),
        fetch("/api/student/all")
      ]);
      if (iRes.ok) setInfractions(await iRes.json());
      if (sRes.ok) setStudents(await sRes.json());
    } catch (err) {
      console.error("Infractions fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInfraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !mandaturiRef || !description) return;

    const studentObj = students.find(s => s._id === studentId);

    try {
      const res = await fetch("/api/infractions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          student_name: studentObj ? `${studentObj.name} ${studentObj.surname}` : "მოსწავლე",
          class_id: studentObj?.class_id || "",
          mandaturi_ref_id: mandaturiRef,
          category,
          description,
          infraction_date: infractionDate
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        setMandaturiRef("");
        setDescription("");
        fetchData();
      }
    } catch (err) {
      console.error("Create infraction error:", err);
    }
  };

  const handleAttachPrincipalResponse = async (id: string) => {
    if (!responseFile) {
      setErrorMessage("გთხოვთ აირჩიოთ დირექტორის რეაგირების დოკუმენტი");
      return;
    }
    setErrorMessage("");
    setUploading(true);

    try {
      // 1. Upload to File Security API
      const formData = new FormData();
      formData.append("file", responseFile);

      const fileRes = await fetch("/api/file-upload", {
        method: "POST",
        body: formData
      });
      const fileData = await fileRes.json();

      if (!fileRes.ok) {
        setErrorMessage(fileData.error || "ფაილის უსაფრთხოების შემოწმებამ ვერ გაიარა!");
        setUploading(false);
        return;
      }

      // 2. Attach document to infraction record
      const putRes = await fetch("/api/infractions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          principal_response_doc: fileData.file_url,
          principal_response_notes: responseNotes,
          status: "reviewed"
        })
      });

      if (putRes.ok) {
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
    <div style={{ color: "white", width: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FaShieldAlt style={{ color: selectedColor }} /> მანდატურის დარღვევები & დირექტორის რეაგირება
          </h3>
          <p style={{ fontSize: "13px", opacity: 0.6, margin: "4px 0 0 0" }}>
            მანდატურის სამსახურის საინფორმაციო ბაზიდან შემოსული აღრიცხვის ფურცლები და რეაგირების დოკუმენტები
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
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
          + დარღვევის ფურცლის ასახვა
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <form onSubmit={handleCreateInfraction} style={{ background: "#18181b", padding: "24px", borderRadius: "20px", width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>მანდატურის დარღვევის ფურცლის ასახვა</h3>
            
            <div>
              <label style={{ fontSize: "12px", opacity: 0.7 }}>მოსწავლე:</label>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
                <option value="">აირჩიეთ მოსწავლე...</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} {s.surname} ({s.user_ID})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", opacity: 0.7 }}>მანდატურის ოქმის / ფურცლის № (Ref ID):</label>
              <input type="text" required value={mandaturiRef} onChange={(e) => setMandaturiRef(e.target.value)} placeholder="მაგ: MAND-2026-8819" style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", opacity: 0.7 }}>კატეგორია:</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
                  <option value="დისციპლინური დარღვევა">დისციპლინური დარღვევა</option>
                  <option value="საგაკვეთილო პროცესის ჩაშლა">საგაკვეთილო პროცესის ჩაშლა</option>
                  <option value="ინვენტარის დაზიანება">ინვენტარის დაზიანება</option>
                  <option value="სხვა">სხვა</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", opacity: 0.7 }}>თარიღი:</label>
                <input type="date" value={infractionDate} onChange={(e) => setInfractionDate(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", opacity: 0.7 }}>დარღვევის შინაარსი / აღწერა:</label>
              <textarea rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="დარღვევის დეტალური აღწერა..." style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "10px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", color: "white", border: "none", cursor: "pointer" }}>გაუქმება</button>
              <button type="submit" style={{ padding: "10px 16px", borderRadius: "8px", background: selectedColor, color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}>ასახვა</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", opacity: 0.6 }}>იტვირთება...</div>
      ) : infractions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", opacity: 0.5, background: "rgba(255,255,255,0.02)", borderRadius: "16px" }}>
          მანდატურის დარღვევის ფურცლები არ მოიძებნა
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {infractions.map((inf) => (
            <div key={inf._id?.toString()} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "20px", borderRadius: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "6px", background: "#ef444433", color: "#f87171", textTransform: "uppercase" }}>
                    ოქმი №: {inf.mandaturi_ref_id}
                  </span>
                  <h4 style={{ margin: "6px 0 2px 0", fontSize: "16px", fontWeight: 800 }}>{inf.student_name} ({inf.category})</h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.8 }}>{inf.description}</p>
                </div>

                <div style={{ textAlign: "right", fontSize: "12px", opacity: 0.6 }}>
                  თარიღი: {inf.infraction_date}
                </div>
              </div>

              {/* Principal Response Document */}
              <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {inf.principal_response_doc ? (
                  <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "13px", color: "#34d399", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaCheckCircle /> დირექტორის რეაგირების დოკუმენტი მიბმულია
                      </div>
                      {inf.principal_response_notes && <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>" {inf.principal_response_notes} "</div>}
                    </div>
                    <a href={inf.principal_response_doc} target="_blank" rel="noreferrer" style={{ color: "#60a5fa", fontSize: "13px", fontWeight: 700, textDecoration: "underline" }}>
                      დოკუმენტის ნახვა ➔
                    </a>
                  </div>
                ) : (
                  <div>
                    {attachingId === inf._id?.toString() ? (
                      <div style={{ background: "rgba(255,255,255,0.04)", padding: "14px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700 }}>დირექტორის რეაგირების დოკუმენტის მიბმა</div>
                        
                        <input type="file" onChange={(e) => setResponseFile(e.target.files?.[0] || null)} style={{ color: "white", fontSize: "13px" }} />
                        <input type="text" placeholder="დირექტორის შენიშვნა / რეზოლუცია..." value={responseNotes} onChange={(e) => setResponseNotes(e.target.value)} style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "13px" }} />

                        {errorMessage && (
                          <div style={{ fontSize: "12px", color: "#f87171", display: "flex", alignItems: "center", gap: "6px" }}>
                            <FaExclamationTriangle /> {errorMessage}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button disabled={uploading} onClick={() => handleAttachPrincipalResponse(inf._id!.toString())} style={{ background: "#10b981", color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
                            {uploading ? "მოწმდება & იტვირთება..." : "დოკუმენტის მიბმა"}
                          </button>
                          <button onClick={() => setAttachingId(null)} style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer" }}>
                            გაუქმება
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAttachingId(inf._id!.toString()); setErrorMessage(""); }} style={{ background: "rgba(255,255,255,0.08)", color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
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
