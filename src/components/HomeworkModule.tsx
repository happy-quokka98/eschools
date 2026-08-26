"use client";
import React, { useState, useEffect } from "react";
import { FaFileUpload, FaTasks, FaCheckCircle, FaExclamationTriangle, FaCommentDots, FaClock } from "react-icons/fa";
import { Assignment, AssignmentSubmission } from "@/lib/models";

interface HomeworkModuleProps {
  userRole: "teacher" | "student" | "admin";
  userId: string;
  userName: string;
  classId?: string;
  selectedColor: string;
}

export default function HomeworkModule({
  userRole,
  userId,
  userName,
  classId,
  selectedColor
}: HomeworkModuleProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission[]>>({});
  const [loading, setLoading] = useState(true);

  // New Assignment state (Teacher)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [targetClassId, setTargetClassId] = useState(classId || "");

  // Student upload state
  const [uploadingAssignmentId, setUploadingAssignmentId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadComment, setUploadComment] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Feedback state
  const [feedbackSubmissionId, setFeedbackSubmissionId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      let url = "/api/assignments";
      if (classId) url += `?class_id=${classId}`;
      else if (userRole === "teacher") url += `?teacher_id=${userId}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);

        // Fetch submissions for all fetched assignments in parallel
        const submissionPromises = data.map(async (asn: Assignment) => {
          if (!asn._id) return { id: "", data: [] };
          const subRes = await fetch(`/api/assignments/submit?assignment_id=${asn._id}`);
          if (subRes.ok) {
            const subData = await subRes.json();
            return { id: asn._id.toString(), data: subData };
          }
          return { id: asn._id.toString(), data: [] };
        });

        const results = await Promise.all(submissionPromises);
        const newSubmissions: Record<string, AssignmentSubmission[]> = {};
        results.forEach(item => {
          if (item.id) newSubmissions[item.id] = item.data;
        });
        setSubmissions(newSubmissions);
      }
    } catch (err) {
      console.error("Fetch assignments error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, [classId, userId]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline || !targetClassId) return;

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: targetClassId,
          teacher_id: userId,
          teacher_name: userName,
          title,
          description,
          deadline
        })
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setDeadline("");
        setShowCreateModal(false);
        fetchAssignments();
      }
    } catch (err) {
      console.error("Create assignment error:", err);
    }
  };

  const handleStudentUpload = async (assignmentId: string) => {
    if (!selectedFile) {
      setUploadError("გთხოვთ აირჩიოთ ფაილი");
      return;
    }
    setUploadError("");
    setUploadSuccess("");
    setIsUploading(true);

    try {
      // 1. Upload to File Security API
      const formData = new FormData();
      formData.append("file", selectedFile);

      const fileRes = await fetch("/api/file-upload", {
        method: "POST",
        body: formData
      });
      const fileData = await fileRes.json();

      if (!fileRes.ok) {
        setUploadError(fileData.error || "ფაილის უსაფრთხოების შემოწმებამ ვერ გაიარა!");
        setIsUploading(false);
        return;
      }

      // 2. Save submission reference
      const subRes = await fetch("/api/assignments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: assignmentId,
          student_id: userId,
          student_name: userName,
          file_name: fileData.file_name,
          file_url: fileData.file_url,
          comment: uploadComment
        })
      });

      if (subRes.ok) {
        setUploadSuccess("დავალება წარმატებით აიტვირთა!");
        setSelectedFile(null);
        setUploadComment("");
        setUploadingAssignmentId(null);
        fetchAssignments();
      }
    } catch (err: any) {
      setUploadError(err.message || "შეცდომა ატვირთვისას");
    }
    setIsUploading(false);
  };

  const handleFeedback = async (submissionId: string, status: "approved" | "needs_resubmission") => {
    try {
      const res = await fetch("/api/assignments/submit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          status,
          feedback: feedbackText
        })
      });
      if (res.ok) {
        setFeedbackSubmissionId(null);
        setFeedbackText("");
        fetchAssignments();
      }
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  return (
    <div style={{ width: "100%", color: "white" }}>
      {/* Header Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div>
          <h3 style={{ fontSize: "22px", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FaTasks style={{ color: selectedColor }} /> საშინაო დავალებების მოდული
          </h3>
          <p style={{ fontSize: "13px", opacity: 0.6, margin: "4px 0 0 0" }}>
            დავალებების გაცემა, ელექტრონულად მიღება და ფაილების უსაფრთხო შემოწმება
          </p>
        </div>

        {userRole === "teacher" && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}bb)`,
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "12px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
            }}
          >
            + დავალების გაცემა
          </button>
        )}
      </div>

      {/* Create Modal for Teacher */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          zIndex: 1200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <form onSubmit={handleCreateAssignment} style={{
            background: "#18181b",
            padding: "24px",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "500px",
            display: "flex",
            flexDirection: "column",
            gap: "14px"
          }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>ახალი საშინაო დავალების გაცემა</h3>
            
            {!classId && (
              <div>
                <label style={{ fontSize: "12px", opacity: 0.7 }}>კლასის ID:</label>
                <input
                  type="text"
                  required
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  placeholder="მაგ: 65a123..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: "12px", opacity: 0.7 }}>დავალების სათაური:</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="მაგ: სავარჯიშო 4, გვერდი 112"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", opacity: 0.7 }}>პირობა / აღწერა:</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="დეტალური ინსტრუქცია..."
                style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", opacity: 0.7 }}>შესრულების ვადა (Deadline):</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: "10px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", color: "white", border: "none", cursor: "pointer" }}
              >
                გაუქმება
              </button>
              <button
                type="submit"
                style={{ padding: "10px 16px", borderRadius: "8px", background: selectedColor, color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}
              >
                გამოქვეყნება
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assignment List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", opacity: 0.6 }}>იტვირთება...</div>
      ) : assignments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", opacity: 0.5, background: "rgba(255,255,255,0.02)", borderRadius: "16px" }}>
          დავალებები არ მოიძებნა
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {assignments.map((asn) => {
            const asnSubmissions = submissions[asn._id!.toString()] || [];
            const mySubmission = asnSubmissions.find(s => s.student_id === userId);

            return (
              <div
                key={asn._id?.toString()}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  padding: "20px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>{asn.title}</h4>
                    <p style={{ margin: "6px 0 0 0", fontSize: "13px", opacity: 0.8 }}>{asn.description}</p>
                  </div>
                  <div style={{ fontSize: "12px", background: "rgba(255,255,255,0.06)", padding: "6px 12px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaClock /> ვადა: <strong>{asn.deadline}</strong>
                  </div>
                </div>

                {/* Student Action: Upload */}
                {userRole === "student" && (
                  <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {mySubmission ? (
                      <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", padding: "12px 16px" }}>
                        <div style={{ fontSize: "13px", color: "#34d399", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                          <FaCheckCircle /> დავალება ატვირთულია ({mySubmission.submitted_at?.slice(0, 10)})
                        </div>
                        {mySubmission.file_name && (
                          <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.8 }}>
                            ფაილი: <a href={mySubmission.file_url} target="_blank" rel="noreferrer" style={{ color: "#60a5fa" }}>{mySubmission.file_name}</a>
                          </div>
                        )}
                        {mySubmission.feedback && (
                          <div style={{ fontSize: "12px", marginTop: "6px", color: "#fbbf24" }}>
                            <strong>მასწავლებლის უკუკავშირი:</strong> {mySubmission.feedback}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {uploadingAssignmentId === asn._id?.toString() ? (
                          <div style={{ background: "rgba(255,255,255,0.04)", padding: "14px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 700 }}>დავალების ფაილის ატვირთვა</div>
                            
                            <input
                              type="file"
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                              style={{ color: "white", fontSize: "13px" }}
                            />

                            <input
                              type="text"
                              placeholder="კომენტარი მასწავლებლისთვის (არასავალდებულო)..."
                              value={uploadComment}
                              onChange={(e) => setUploadComment(e.target.value)}
                              style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "13px" }}
                            />

                            {uploadError && (
                              <div style={{ fontSize: "12px", color: "#f87171", display: "flex", alignItems: "center", gap: "6px" }}>
                                <FaExclamationTriangle /> {uploadError}
                              </div>
                            )}

                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                disabled={isUploading}
                                onClick={() => handleStudentUpload(asn._id!.toString())}
                                style={{ background: "#10b981", color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                              >
                                {isUploading ? "მოწმდება & იტვირთება..." : "ატვირთვა"}
                              </button>
                              <button
                                onClick={() => setUploadingAssignmentId(null)}
                                style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer" }}
                              >
                                გაუქმება
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setUploadingAssignmentId(asn._id!.toString()); setUploadError(""); }}
                            style={{ background: selectedColor, color: "white", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                          >
                            <FaFileUpload /> შესრულებული დავალების ატვირთვა
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Teacher / Admin View: Submissions */}
                {userRole !== "student" && (
                  <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
                      ჩაბარებული დავალებები ({asnSubmissions.length}):
                    </div>
                    {asnSubmissions.length === 0 ? (
                      <div style={{ fontSize: "12px", opacity: 0.5 }}>ჯერჯერობით არცერთ მოსწავლეს არ აუტვირთავს.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {asnSubmissions.map((sub) => (
                          <div key={sub._id?.toString()} style={{ background: "rgba(255,255,255,0.02)", padding: "10px 14px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                            <div>
                              <strong>{sub.student_name}</strong> - <a href={sub.file_url} target="_blank" rel="noreferrer" style={{ color: "#60a5fa" }}>{sub.file_name}</a>
                              {sub.comment && <div style={{ fontSize: "12px", opacity: 0.7 }}>"{sub.comment}"</div>}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {feedbackSubmissionId === sub._id?.toString() ? (
                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                  <input
                                    type="text"
                                    placeholder="უკუკავშირი..."
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    style={{ padding: "4px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", fontSize: "12px" }}
                                  />
                                  <button onClick={() => handleFeedback(sub._id!.toString(), "approved")} style={{ background: "#10b981", color: "white", border: "none", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}>მიღება</button>
                                  <button onClick={() => handleFeedback(sub._id!.toString(), "needs_resubmission")} style={{ background: "#ef4444", color: "white", border: "none", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}>ხელახლა გადაგზავნა</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setFeedbackSubmissionId(sub._id!.toString())}
                                  style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                                >
                                  <FaCommentDots /> უკუკავშირი
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
