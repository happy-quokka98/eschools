"use client";
import React, { useState, useEffect } from "react";
import { FaAward, FaMedal, FaStar, FaGraduationCap, FaSearch, FaFilter } from "react-icons/fa";

interface TopStudent {
  student_id: string;
  name: string;
  user_ID: string;
  class_name: string;
  numeric_level?: number;
  stage: string; // 'საბაზო' | 'საშუალო' | 'დაწყებითი'
  average: number;
  min_subject_avg?: number;
  total_subjects?: number;
  medal?: "gold" | "silver" | "none";
  total_grades_count: number;
  is_perfect_10: boolean;
}

interface TopStudentsMonitorProps {
  selectedColor: string;
}

export default function TopStudentsMonitor({ selectedColor }: TopStudentsMonitorProps) {
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>("საშუალო"); // Default focus on High School (X-XII)
  const [medalFilter, setMedalFilter] = useState<string>("all"); // 'all' | 'gold' | 'silver'
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchTopStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/top-students");
      if (res.ok) {
        const data = await res.json();
        setTopStudents(data);
      }
    } catch (err) {
      console.error("Top students fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTopStudents();
  }, []);

  // Filter students based on stage, medal candidacy, and search term
  const filteredStudents = topStudents.filter((s) => {
    const matchesStage = stageFilter === "all" || s.stage === stageFilter;
    const matchesMedal =
      medalFilter === "all" ||
      (medalFilter === "gold" && s.medal === "gold") ||
      (medalFilter === "silver" && s.medal === "silver");

    const matchesSearch =
      (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.user_ID || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.class_name || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStage && matchesMedal && matchesSearch;
  });

  // Calculate statistics specifically for High School (X, XI, XII / საშუალო საფეხური)
  const highSchoolStudents = topStudents.filter((s) => s.stage === "საშუალო");
  const goldMedalists = highSchoolStudents.filter((s) => s.medal === "gold");
  const silverMedalists = highSchoolStudents.filter((s) => s.medal === "silver");
  const totalHighSchoolCount = highSchoolStudents.length;

  return (
    <div style={{ color: "white", width: "100%" }}>
      {/* Header section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "24px",
              fontWeight: 800,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            <FaAward size={28} style={{ color: "#fbbf24" }} /> წარჩინებულთა გამოვლენა & რესურსცენტრის მონიტორინგი
          </h3>
          <p style={{ fontSize: "14px", opacity: 0.7, margin: "6px 0 0 0" }}>
            საშუალო (X-XII კლასები), საბაზო და დაწყებითი საფეხურის წარჩინებულთა ავტომატური მონიტორინგი
          </p>
        </div>
      </div>

      {/* High School Medals Summary Statistics Section (X, XI, XII კლასები) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginBottom: "28px"
        }}
      >
        {/* Gold Medals Card */}
        <div
          onClick={() => { setStageFilter("საშუალო"); setMedalFilter("gold"); }}
          style={{
            background: "linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(217, 119, 6, 0.05))",
            border: "1px solid rgba(251, 191, 36, 0.4)",
            borderRadius: "18px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            cursor: "pointer",
            transition: "transform 0.2s ease, boxShadow 0.2s ease",
            boxShadow: medalFilter === "gold" ? "0 0 20px rgba(251, 191, 36, 0.3)" : "none"
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)"
            }}
          >
            <FaMedal size={26} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#fbbf24", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              🥇 ოქროს მედალი (X-XII)
            </div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "white", marginTop: "2px" }}>
              {goldMedalists.length} <span style={{ fontSize: "14px", fontWeight: 500, opacity: 0.6 }}>მოსწავლე</span>
            </div>
            <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "2px" }}>ყველა საგანში ≥9.45 (დამრგვალებით 10)</div>
          </div>
        </div>

        {/* Silver Medals Card */}
        <div
          onClick={() => { setStageFilter("საშუალო"); setMedalFilter("silver"); }}
          style={{
            background: "linear-gradient(135deg, rgba(226, 232, 240, 0.12), rgba(148, 163, 184, 0.05))",
            border: "1px solid rgba(203, 213, 225, 0.4)",
            borderRadius: "18px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            cursor: "pointer",
            transition: "transform 0.2s ease, boxShadow 0.2s ease",
            boxShadow: medalFilter === "silver" ? "0 0 20px rgba(226, 232, 240, 0.3)" : "none"
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #94a3b8, #64748b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(148, 163, 184, 0.4)"
            }}
          >
            <FaMedal size={26} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              🥈 ვერცხლის მედალი (X-XII)
            </div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "white", marginTop: "2px" }}>
              {silverMedalists.length} <span style={{ fontSize: "14px", fontWeight: 500, opacity: 0.6 }}>მოსწავლე</span>
            </div>
            <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "2px" }}>1+ საგანში 8.45-9.44 (დამრგვალებით 9), დანარჩენი 10</div>
          </div>
        </div>

        {/* Total High School Honor Students Card */}
        <div
          onClick={() => { setStageFilter("საშუალო"); setMedalFilter("all"); }}
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(79, 70, 229, 0.05))",
            border: "1px solid rgba(129, 140, 248, 0.4)",
            borderRadius: "18px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            cursor: "pointer"
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)"
            }}
          >
            <FaGraduationCap size={28} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#a5b4fc", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              🎓 საშუალო საფეხური (X-XII)
            </div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "white", marginTop: "2px" }}>
              {totalHighSchoolCount} <span style={{ fontSize: "14px", fontWeight: 500, opacity: 0.6 }}>მოსწავლე</span>
            </div>
            <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "2px" }}>სულ მე-10, 11, 12 კლასები</div>
          </div>
        </div>
      </div>

      {/* Control Filters Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          gap: "12px",
          flexWrap: "wrap",
          background: "rgba(255, 255, 255, 0.03)",
          padding: "16px 20px",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.08)"
        }}
      >
        {/* Stage Tabs */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "საშუალო", label: "🎓 საშუალო (X-XII)", desc: "მედალოსნები" },
            { id: "საბაზო", label: "📘 საბაზო (VII-IX)", desc: "" },
            { id: "დაწყებითი", label: "🎒 დაწყებითი (I-VI)", desc: "" },
            { id: "all", label: "🌐 ყველა საფეხური", desc: "" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStageFilter(tab.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: stageFilter === tab.id ? "1px solid #fbbf24" : "1px solid rgba(255,255,255,0.1)",
                background: stageFilter === tab.id ? "rgba(251, 191, 36, 0.15)" : "#27272a",
                color: stageFilter === tab.id ? "#fbbf24" : "white",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Medal Filter Dropdown & Search */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {stageFilter === "საშუალო" && (
            <select
              value={medalFilter}
              onChange={(e) => setMedalFilter(e.target.value)}
              style={{
                padding: "9px 14px",
                borderRadius: "10px",
                background: "#27272a",
                border: "1px solid rgba(251,191,36,0.4)",
                color: "#fbbf24",
                fontWeight: 700,
                fontSize: "13px"
              }}
            >
              <option value="all">ყველა მედალი (ოქრო & ვერცხლი)</option>
              <option value="gold">🥇 მხოლოდ ოქროს მედალი (10.0)</option>
              <option value="silver">🥈 მხოლოდ ვერცხლის მედალი (9-იანით)</option>
            </select>
          )}

          <div style={{ position: "relative" }}>
            <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} size={13} />
            <input
              type="text"
              placeholder="ძებნა (სახელი / კლასი)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "9px 14px 9px 34px",
                borderRadius: "10px",
                background: "#27272a",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "white",
                fontSize: "13px",
                width: "200px"
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid View */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", opacity: 0.6, fontSize: "16px" }}>
          იტვირთება მონაცემები...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "50px",
            opacity: 0.6,
            background: "rgba(255,255,255,0.02)",
            borderRadius: "20px",
            border: "1px dashed rgba(255,255,255,0.1)"
          }}
        >
          წარჩინებული მოსწავლეები მითითებული კრიტერიუმით არ მოიძებნა
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "18px"
          }}
        >
          {filteredStudents.map((st) => {
            const isGold = st.medal === "gold";
            const isSilver = st.medal === "silver";

            return (
              <div
                key={st.student_id}
                style={{
                  background: isGold
                    ? "linear-gradient(135deg, rgba(251, 191, 36, 0.16), rgba(180, 83, 9, 0.05))"
                    : isSilver
                    ? "linear-gradient(135deg, rgba(226, 232, 240, 0.14), rgba(100, 116, 139, 0.05))"
                    : "linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))",
                  border: isGold
                    ? "1px solid rgba(251, 191, 36, 0.5)"
                    : isSilver
                    ? "1px solid rgba(203, 213, 225, 0.5)"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "18px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  position: "relative",
                  boxShadow: isGold
                    ? "0 6px 20px rgba(251, 191, 36, 0.15)"
                    : isSilver
                    ? "0 6px 20px rgba(226, 232, 240, 0.1)"
                    : "none"
                }}
              >
                {/* Medal Icon badge */}
                <div style={{ position: "absolute", top: "18px", right: "18px" }}>
                  {isGold ? (
                    <FaMedal size={26} color="#fbbf24" style={{ filter: "drop-shadow(0 2px 8px rgba(251, 191, 36, 0.6))" }} />
                  ) : isSilver ? (
                    <FaMedal size={26} color="#e2e8f0" style={{ filter: "drop-shadow(0 2px 8px rgba(226, 232, 240, 0.6))" }} />
                  ) : (
                    <FaStar size={20} color="#fbbf24" opacity={0.6} />
                  )}
                </div>

                {/* Stage / Medal badge */}
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  {isGold && (
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: "8px",
                        background: "linear-gradient(90deg, #f59e0b, #d97706)",
                        color: "white",
                        boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)"
                      }}
                    >
                      🥇 ოქროს მედალი
                    </div>
                  )}

                  {isSilver && (
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: "8px",
                        background: "linear-gradient(90deg, #94a3b8, #64748b)",
                        color: "white",
                        boxShadow: "0 2px 8px rgba(148, 163, 184, 0.3)"
                      }}
                    >
                      🥈 ვერცხლის მედალი
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "rgba(255, 255, 255, 0.7)"
                    }}
                  >
                    {st.stage} საფეხური
                  </div>
                </div>

                {/* Student Info */}
                <div>
                  <h4 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>{st.name}</h4>
                  <div style={{ fontSize: "12px", opacity: 0.65, marginTop: "4px" }}>
                    კლასი: <strong style={{ color: "#fbbf24" }}>{st.class_name}</strong> {st.user_ID && `| ID: ${st.user_ID}`}
                  </div>
                </div>

                {/* Average stats */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "4px",
                    paddingTop: "12px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px", opacity: 0.6 }}>საშუალო ქულა:</div>
                    {st.min_subject_avg !== undefined && (
                      <div style={{ fontSize: "10px", opacity: 0.45 }}>მინ. საგანი: {st.min_subject_avg}</div>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 900,
                      color: isGold ? "#fbbf24" : isSilver ? "#e2e8f0" : "#34d399",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <FaStar size={15} color="#fbbf24" /> {st.average}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
