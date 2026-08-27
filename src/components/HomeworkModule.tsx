"use client";

import React, { useState, useEffect } from "react";
import { FaTasks, FaFileUpload, FaClock, FaCheckCircle, FaExclamationTriangle, FaCommentDots } from "react-icons/fa";

interface AssignmentItem {
  _id?: string;
  class_id: string;
  subject_id?: string;
  title: string;
  description: string;
  deadline: string;
  created_at: string;
}

interface SubmissionItem {
  _id?: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  file_url: string;
  file_name: string;
  comment?: string;
  submitted_at: string;
  status: "pending" | "approved" | "needs_resubmission";
  feedback?: string;
}

interface HomeworkModuleProps {
  userRole: "student" | "teacher" | "admin";
  userId: string;
  userName: string;
  classId?: string; // If applicable
  selectedColor: string;
}

export default function HomeworkModule({
  userRole,
  userId,
  userName,
  classId,
  selectedColor
}: HomeworkModuleProps) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, SubmissionItem[]>>({});
  const [loading, setLoading] = useState(true);

  // Teacher Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]);
  const [targetClassId, setTargetClassId] = useState(classId || "");

  // Student Upload State
  const [uploadingAssignmentId, setUploadingAssignmentId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadComment, setUploadComment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Teacher Feedback State
  const [feedbackSubmissionId, setFeedbackSubmissionId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      let url = "/api/assignments";
      if (classId) url += `?class_id=${classId}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);

        // Fetch submissions for all assignments
        const subMap: Record<string, SubmissionItem[]> = {};
        for (const asn of data) {
          const subRes = await fetch(`/api/assignments/submissions?assignment_id=${asn._id}`);
          if (subRes.ok) {
            subMap[asn._id] = await subRes.json();
          }
        }
        setSubmissions(subMap);
      }
    } catch (err) {
      console.error("HomeworkModule fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, [classId]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: targetClassId,
          teacher_id: userId,
          title,
          description,
          deadline
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setTitle("");
        setDescription("");
        fetchAssignments();
      }
    } catch (err) {
      console.error("Create assignment error:", err);
    }
  };

  const handleStudentUpload = async (assignmentId: string) => {
    if (!selectedFile) {
      setUploadError("გთხოვთ აირჩიოთ ფაილი (PDF, Word, სურათი)");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("assignment_id", assignmentId);
      formData.append("student_id", userId);
      formData.append("student_name", userName);
      formData.append("comment", uploadComment);

      const res = await fetch("/api/assignments/submit", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "ფაილის ატვირთვისას დაფიქსირდა შეცდომა");
      } else {
        setUploadingAssignmentId(null);
        setSelectedFile(null);
        setUploadComment("");
        fetchAssignments();
      }
    } catch (err: any) {
      setUploadError(err.message || "შეცდომა ატვირთვისას");
    }
    setIsUploading(false);
  };

  const handleFeedback = async (submissionId: string, status: "approved" | "needs_resubmission") => {
    try {
      const res = await fetch("/api/assignments/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId,
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
    <div style={{ width: "100%", color: "#0f172a" }}>
      {/* Header Bar */}
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
            <FaTasks style={{ color: "#2563eb" }} /> საშინაო დავალებების მოდული
          </h3>
          <p style={{ fontSize: "14px", color: "#64748b", fontWeight: 600, margin: "4px 0 0 0" }}>
            დავალებების გაცემა, ელექტრონულად მიღება და ფაილების უსაფრთხო შემოწმება
          </p>
        </div>

        {userRole === "teacher" && (
          <button
            onClick={() => setShowCreateModal(true)}
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
            + დავალების გაცემა
          </button>
        )}
      </div>

      {/* Create Modal for Teacher */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 1200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <form onSubmit={handleCreateAssignment} style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            padding: "28px",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "500px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#0f172a" }}>ახალი საშინაო დავალების გაცემა</h3>
            
            {!classId && (
              <div>
                <label style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "block", marginBottom: "6px" }}>კლასის ID:</label>
                <input
                  type="text"
                  required
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  placeholder="მაგ: 65a123..."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontWeight: 700 }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "block", marginBottom: "6px" }}>დავალების სათაური:</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="მაგ: სავარჯიშო 4, გვერდი 112"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "block", marginBottom: "6px" }}>პირობა / აღწერა:</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="დავალების დეტალური აღწერა..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "block", marginBottom: "6px" }}>ჩაბარების ბოლო ვადა:</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontWeight: 700, colorScheme: "light" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
              <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: "10px 16px", borderRadius: "10px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", fontWeight: 700, cursor: "pointer" }}>გაუქმება</button>
              <button type="submit" style={{ padding: "10px 18px", borderRadius: "10px", background: "#2563eb", color: "white", border: "none", fontWeight: 800, cursor: "pointer" }}>გაცემა</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b", fontWeight: 600 }}>იტვირთება...</div>
      ) : assignments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", color: "#64748b", fontWeight: 700, background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
          📋 დავალებები არ მოიძებნა
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
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "20px",
                  padding: "22px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.03)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>{asn.title}</h4>
                    <p style={{ margin: "6px 0 0 0", fontSize: "14px", color: "#475569", fontWeight: 600 }}>{asn.description}</p>
                  </div>
                  <div style={{ fontSize: "13px", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#0f172a", padding: "6px 14px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                    <FaClock style={{ color: "#2563eb" }} /> ვადა: <strong>{asn.deadline}</strong>
                  </div>
                </div>

                {/* Student Action: Upload */}
                {userRole === "student" && (
                  <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                    {mySubmission ? (
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "12px 16px" }}>
                        <div style={{ fontSize: "13px", color: "#166534", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
                          <FaCheckCircle /> დავალება ატვირთულია ({mySubmission.submitted_at?.slice(0, 10)})
                        </div>
                        {mySubmission.file_name && (
                          <div style={{ fontSize: "13px", marginTop: "4px", color: "#475569", fontWeight: 600 }}>
                            ფაილი: <a href={mySubmission.file_url} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 800 }}>{mySubmission.file_name}</a>
                          </div>
                        )}
                        {mySubmission.feedback && (
                          <div style={{ fontSize: "13px", marginTop: "6px", color: "#b45309", fontWeight: 700 }}>
                            <strong>მასწავლებლის უკუკავშირი:</strong> {mySubmission.feedback}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {uploadingAssignmentId === asn._id?.toString() ? (
                          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>დავალების ფაილის ატვირთვა</div>
                            
                            <input
                              type="file"
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                              style={{ color: "#0f172a", fontSize: "13px", fontWeight: 600 }}
                            />

                            <input
                              type="text"
                              placeholder="კომენტარი მასწავლებლისთვის (არასავალდებულო)..."
                              value={uploadComment}
                              onChange={(e) => setUploadComment(e.target.value)}
                              style={{ padding: "8px 12px", borderRadius: "8px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "13px", fontWeight: 700 }}
                            />

                            {uploadError && (
                              <div style={{ fontSize: "12px", color: "#dc2626", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                                <FaExclamationTriangle /> {uploadError}
                              </div>
                            )}

                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                disabled={isUploading}
                                onClick={() => handleStudentUpload(asn._id!.toString())}
                                style={{ background: "#16a34a", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 800, cursor: "pointer" }}
                              >
                                {isUploading ? "მოწმდება & იტვირთება..." : "ატვირთვა"}
                              </button>
                              <button
                                onClick={() => setUploadingAssignmentId(null)}
                                style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}
                              >
                                გაუქმება
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setUploadingAssignmentId(asn._id!.toString()); setUploadError(""); }}
                            style={{ background: "#2563eb", color: "white", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
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
                  <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                      ჩაბარებული დავალებები ({asnSubmissions.length}):
                    </div>
                    {asnSubmissions.length === 0 ? (
                      <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>ჯერჯერობით არცერთ მოსწავლეს არ აუტვირთავს.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {asnSubmissions.map((sub) => (
                          <div key={sub._id?.toString()} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 14px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                            <div>
                              <strong style={{ color: "#0f172a" }}>{sub.student_name}</strong> - <a href={sub.file_url} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: 800 }}>{sub.file_name}</a>
                              {sub.comment && <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>"{sub.comment}"</div>}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {feedbackSubmissionId === sub._id?.toString() ? (
                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                  <input
                                    type="text"
                                    placeholder="უკუკავშირი..."
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    style={{ padding: "6px 10px", borderRadius: "6px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "12px", fontWeight: 700 }}
                                  />
                                  <button onClick={() => handleFeedback(sub._id!.toString(), "approved")} style={{ background: "#16a34a", color: "white", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>მიღება</button>
                                  <button onClick={() => handleFeedback(sub._id!.toString(), "needs_resubmission")} style={{ background: "#dc2626", color: "white", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>ხელახლა გადაგზავნა</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setFeedbackSubmissionId(sub._id!.toString())}
                                  style={{ background: "#f1f5f9", color: "#2563eb", border: "1px solid #cbd5e1", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
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
