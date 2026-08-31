"use client";
import React, { useState, useEffect } from "react";
import { FaAward, FaMedal, FaStar, FaGraduationCap, FaSearch, FaTrophy, FaUsers, FaChartLine } from "react-icons/fa";

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

interface TopClass {
  class_id: string;
  classname: string;
  numeric_level: number;
  stage: string;
  average: number;
  student_count: number;
  honor_students_count: number;
  ten_students_count: number;
  rank: number;
}

interface TopStudentsMonitorProps {
  selectedColor: string;
}

export default function TopStudentsMonitor({ selectedColor }: TopStudentsMonitorProps) {
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [topClasses, setTopClasses] = useState<TopClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"classes" | "students">("classes");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [medalFilter, setMedalFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch("/api/top-students"),
        fetch("/api/top-classes"),
      ]);

      if (studentsRes.ok) {
        const sData = await studentsRes.json();
        setTopStudents(Array.isArray(sData) ? sData : []);
      }
      if (classesRes.ok) {
        const cData = await classesRes.json();
        setTopClasses(Array.isArray(cData) ? cData : []);
      }
    } catch (err) {
      console.error("Top monitor fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
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

  // Filter classes based on stage and search term
  const filteredClasses = topClasses.filter((c) => {
    const matchesStage = stageFilter === "all" || c.stage === stageFilter;
    const matchesSearch = (c.classname || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

  // Calculate statistics specifically for High School (X, XI, XII / საშუალო საფეხური)
  const highSchoolStudents = topStudents.filter((s) => s.stage === "საშუალო");
  const goldMedalists = highSchoolStudents.filter((s) => s.medal === "gold");
  const silverMedalists = highSchoolStudents.filter((s) => s.medal === "silver");
  const totalHighSchoolCount = highSchoolStudents.length;

  // School Leader Class
  const topOverallClass = topClasses.length > 0 ? topClasses[0] : null;

  return (
    <div style={{ width: "100%" }}>
      {/* Header section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "16px",
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
              color: "#0f172a",
            }}
          >
            <FaAward size={28} style={{ color: "#d97706" }} /> აკადემიური მონიტორინგი & წარჩინებულთა გამოვლენა
          </h3>
          <p style={{ fontSize: "14px", color: "#64748b", fontWeight: 600, margin: "6px 0 0 0" }}>
            ყველაზე მაღალშედეგიანი კლასების რეიტინგი, წარჩინებული მოსწავლეები და მედალოსნების მონიტორინგი
          </p>
        </div>
      </div>

      {/* Main View Mode Selector (Classes vs Students) */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          background: "#ffffff",
          padding: "6px",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
        }}
      >
        <button
          type="button"
          onClick={() => setViewMode("classes")}
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: "12px",
            border: "none",
            background: viewMode === "classes" ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "transparent",
            color: viewMode === "classes" ? "#ffffff" : "#475569",
            fontWeight: 800,
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            boxShadow: viewMode === "classes" ? "0 4px 12px rgba(37, 99, 235, 0.25)" : "none",
          }}
        >
          <FaTrophy size={16} /> 🏆 ყველაზე მაღალშედეგიანი კლასები
        </button>

        <button
          type="button"
          onClick={() => setViewMode("students")}
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: "12px",
            border: "none",
            background: viewMode === "students" ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "transparent",
            color: viewMode === "students" ? "#ffffff" : "#475569",
            fontWeight: 800,
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            boxShadow: viewMode === "students" ? "0 4px 12px rgba(37, 99, 235, 0.25)" : "none",
          }}
        >
          <FaGraduationCap size={18} /> 🎓 წარჩინებული მოსწავლეები & მედალოსნები
        </button>
      </div>

      {/* Featured Leader Spotlight Card for #1 Top Performing Class */}
      {topOverallClass && viewMode === "classes" && (
        <div
          style={{
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            border: "2px solid #fde68a",
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
            boxShadow: "0 8px 30px rgba(245, 158, 11, 0.15)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 6px 18px rgba(245, 158, 11, 0.4)",
              }}
            >
              <FaTrophy size={34} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#b45309",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                👑 სკოლის ყველაზე მაღალშედეგიანი კლასი (1-ლი ადგილი)
              </div>
              <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#78350f", margin: "4px 0 0 0" }}>
                {topOverallClass.classname} კლასი
              </h2>
              <div style={{ fontSize: "13px", color: "#b45309", fontWeight: 600, marginTop: "4px" }}>
                საფეხური: {topOverallClass.stage} ({topOverallClass.numeric_level} კლასი)
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div
              style={{
                background: "#ffffff",
                padding: "12px 18px",
                borderRadius: "14px",
                border: "1px solid #fde68a",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: "11px", color: "#b45309", fontWeight: 700 }}>საშუალო ქულა</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#78350f" }}>⭐ {topOverallClass.average}</div>
            </div>

            <div
              style={{
                background: "#ffffff",
                padding: "12px 18px",
                borderRadius: "14px",
                border: "1px solid #fde68a",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: "11px", color: "#b45309", fontWeight: 700 }}>წარჩინებულები (≥9.0)</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#b45309" }}>
                🎓 {topOverallClass.honor_students_count}
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                padding: "12px 18px",
                borderRadius: "14px",
                border: "1px solid #fde68a",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: "11px", color: "#b45309", fontWeight: 700 }}>10-იანოსნები (≥9.8)</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: "#d97706" }}>
                🥇 {topOverallClass.ten_students_count}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High School Medals Summary Statistics Section when in Students View */}
      {viewMode === "students" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {/* Gold Medals Card */}
          <div
            onClick={() => {
              setStageFilter("საშუალო");
              setMedalFilter("gold");
            }}
            style={{
              background: "#fffbeb",
              border: "1.5px solid #fde68a",
              borderRadius: "18px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              cursor: "pointer",
              transition: "transform 0.2s ease, boxShadow 0.2s ease",
              boxShadow: medalFilter === "gold" ? "0 8px 25px rgba(245, 158, 11, 0.25)" : "0 4px 15px rgba(0, 0, 0, 0.03)",
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
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
              }}
            >
              <FaMedal size={26} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#b45309", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🥇 ოქროს მედალი (X-XII)
              </div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#78350f", marginTop: "2px" }}>
                {goldMedalists.length} <span style={{ fontSize: "14px", fontWeight: 600, color: "#b45309" }}>მოსწავლე</span>
              </div>
              <div style={{ fontSize: "11px", color: "#b45309", fontWeight: 600, marginTop: "2px" }}>ყველა საგანში ≥9.45 (დამრგვალებით 10)</div>
            </div>
          </div>

          {/* Silver Medals Card */}
          <div
            onClick={() => {
              setStageFilter("საშუალო");
              setMedalFilter("silver");
            }}
            style={{
              background: "#f8fafc",
              border: "1.5px solid #cbd5e1",
              borderRadius: "18px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              cursor: "pointer",
              transition: "transform 0.2s ease, boxShadow 0.2s ease",
              boxShadow: medalFilter === "silver" ? "0 8px 25px rgba(100, 116, 139, 0.25)" : "0 4px 15px rgba(0, 0, 0, 0.03)",
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
                boxShadow: "0 4px 12px rgba(148, 163, 184, 0.4)",
              }}
            >
              <FaMedal size={26} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#475569", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🥈 ვერცხლის მედალი (X-XII)
              </div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", marginTop: "2px" }}>
                {silverMedalists.length} <span style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>მოსწავლე</span>
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>1+ საგანში 8.45-9.44 (დამრგვალებით 9), დანარჩენი 10</div>
            </div>
          </div>

          {/* Total High School Honor Students Card */}
          <div
            onClick={() => {
              setStageFilter("საშუალო");
              setMedalFilter("all");
            }}
            style={{
              background: "#eff6ff",
              border: "1.5px solid #bfdbfe",
              borderRadius: "18px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.4)",
              }}
            >
              <FaGraduationCap size={28} />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#1e40af", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🎓 საშუალო საფეხური (X-XII)
              </div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#1e3a8a", marginTop: "2px" }}>
                {totalHighSchoolCount} <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e40af" }}>მოსწავლე</span>
              </div>
              <div style={{ fontSize: "11px", color: "#1e40af", fontWeight: 600, marginTop: "2px" }}>სულ მე-10, 11, 12 კლასები</div>
            </div>
          </div>
        </div>
      )}

      {/* Control Filters Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          gap: "12px",
          flexWrap: "wrap",
          background: "#ffffff",
          padding: "16px 20px",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.03)",
        }}
      >
        {/* Stage Tabs */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "🌐 ყველა საფეხური" },
            { id: "საშუალო", label: "🎓 საშუალო (X-XII)" },
            { id: "საბაზო", label: "📘 საბაზო (VII-IX)" },
            { id: "დაწყებითი", label: "🎒 დაწყებითი (I-VI)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStageFilter(tab.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: stageFilter === tab.id ? "1px solid #2563eb" : "1px solid #cbd5e1",
                background: stageFilter === tab.id ? "#2563eb" : "#f8fafc",
                color: stageFilter === tab.id ? "#ffffff" : "#475569",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Medal Filter Dropdown & Search */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {viewMode === "students" && stageFilter === "საშუალო" && (
            <select
              value={medalFilter}
              onChange={(e) => setMedalFilter(e.target.value)}
              style={{
                padding: "9px 14px",
                borderRadius: "10px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#0f172a",
                fontWeight: 700,
                fontSize: "13px",
              }}
            >
              <option value="all">ყველა მედალი (ოქრო & ვერცხლი)</option>
              <option value="gold">🥇 მხოლოდ ოქროს მედალი (10.0)</option>
              <option value="silver">🥈 მხოლოდ ვერცხლის მედალი (9-იანით)</option>
            </select>
          )}

          <div style={{ position: "relative" }}>
            <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={13} />
            <input
              type="text"
              placeholder={viewMode === "classes" ? "ძებნა კლასით (მაგ. 10ა)..." : "ძებნა (სახელი / კლასი)..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "9px 14px 9px 34px",
                borderRadius: "10px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#0f172a",
                fontWeight: 700,
                fontSize: "13px",
                width: "220px",
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#64748b", fontSize: "16px", fontWeight: 600 }}>
          იტვირთება მონაცემები...
        </div>
      ) : viewMode === "classes" ? (
        /* Top Classes Grid View */
        filteredClasses.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              color: "#64748b",
              fontWeight: 600,
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px dashed #cbd5e1",
            }}
          >
            კლასების მონაცემები მითითებული კრიტერიუმით არ მოიძებნა
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {filteredClasses.map((cls) => {
              const isFirst = cls.rank === 1;
              const isSecond = cls.rank === 2;
              const isThird = cls.rank === 3;

              return (
                <div
                  key={cls.class_id}
                  style={{
                    background: isFirst
                      ? "#fffbeb"
                      : isSecond
                      ? "#f8fafc"
                      : isThird
                      ? "#fff7ed"
                      : "#ffffff",
                    border: isFirst
                      ? "2px solid #fde68a"
                      : isSecond
                      ? "1.5px solid #cbd5e1"
                      : isThird
                      ? "1.5px solid #ffedd5"
                      : "1px solid #e2e8f0",
                    borderRadius: "20px",
                    padding: "22px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "16px",
                    position: "relative",
                    boxShadow: isFirst
                      ? "0 8px 24px rgba(245, 158, 11, 0.15)"
                      : "0 4px 15px rgba(0, 0, 0, 0.03)",
                  }}
                >
                  {/* Top Rank Badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: isFirst
                            ? "linear-gradient(135deg, #f59e0b, #d97706)"
                            : isSecond
                            ? "linear-gradient(135deg, #94a3b8, #64748b)"
                            : isThird
                            ? "linear-gradient(135deg, #f97316, #c2410c)"
                            : "#f1f5f9",
                          color: isFirst || isSecond || isThird ? "#ffffff" : "#475569",
                          fontWeight: 900,
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: isFirst ? "0 4px 10px rgba(245, 158, 11, 0.3)" : "none",
                        }}
                      >
                        #{cls.rank}
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "6px",
                          background: "#f1f5f9",
                          color: "#475569",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {cls.stage} საფეხური
                      </span>
                    </div>

                    {isFirst && <span style={{ fontSize: "20px" }}>🏆</span>}
                    {isSecond && <span style={{ fontSize: "20px" }}>🥈</span>}
                    {isThird && <span style={{ fontSize: "20px" }}>🥉</span>}
                  </div>

                  {/* Class Info */}
                  <div>
                    <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#0f172a" }}>
                      {cls.classname} კლასი
                    </h3>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, marginTop: "4px" }}>
                      სულ შეფასებული მოსწავლე: <strong>{cls.student_count}</strong>
                    </div>
                  </div>

                  {/* Class Average Grade Progress Bar */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>საშუალო ქულა</span>
                      <span style={{ fontSize: "20px", fontWeight: 900, color: isFirst ? "#b45309" : "#2563eb" }}>
                        ⭐ {cls.average}
                      </span>
                    </div>
                    <div style={{ height: "8px", width: "100%", background: "#e2e8f0", borderRadius: "100px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(Math.max((cls.average / 10) * 100, 0), 100)}%`,
                          background: isFirst
                            ? "linear-gradient(90deg, #f59e0b, #d97706)"
                            : "linear-gradient(90deg, #2563eb, #3b82f6)",
                          borderRadius: "100px",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats Footer */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: "12px",
                      borderTop: "1px solid #e2e8f0",
                      fontSize: "12px",
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    <div>
                      🎓 წარჩინებულები: <strong style={{ color: "#2563eb" }}>{cls.honor_students_count}</strong>
                    </div>
                    <div>
                      🥇 10.0 ქულა: <strong style={{ color: "#d97706" }}>{cls.ten_students_count}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Top Students Grid View */
        filteredStudents.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              color: "#64748b",
              fontWeight: 600,
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px dashed #cbd5e1",
            }}
          >
            წარჩინებული მოსწავლეები მითითებული კრიტერიუმით არ მოიძებნა
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "18px",
            }}
          >
            {filteredStudents.map((st) => {
              const isGold = st.medal === "gold";
              const isSilver = st.medal === "silver";

              return (
                <div
                  key={st.student_id}
                  style={{
                    background: isGold ? "#fffbeb" : isSilver ? "#f8fafc" : "#ffffff",
                    border: isGold
                      ? "1.5px solid #fde68a"
                      : isSilver
                      ? "1.5px solid #cbd5e1"
                      : "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    position: "relative",
                    boxShadow: isGold
                      ? "0 4px 15px rgba(245, 158, 11, 0.12)"
                      : isSilver
                      ? "0 4px 15px rgba(100, 116, 139, 0.08)"
                      : "0 4px 15px rgba(0, 0, 0, 0.03)",
                  }}
                >
                  {/* Medal Icon badge */}
                  <div style={{ position: "absolute", top: "18px", right: "18px" }}>
                    {isGold ? (
                      <FaMedal size={26} color="#d97706" style={{ filter: "drop-shadow(0 2px 6px rgba(245, 158, 11, 0.4))" }} />
                    ) : isSilver ? (
                      <FaMedal size={26} color="#64748b" style={{ filter: "drop-shadow(0 2px 6px rgba(100, 116, 139, 0.3))" }} />
                    ) : (
                      <FaStar size={20} color="#f59e0b" opacity={0.7} />
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
                          boxShadow: "0 2px 6px rgba(245, 158, 11, 0.3)",
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
                          background: "linear-gradient(90deg, #64748b, #475569)",
                          color: "white",
                          boxShadow: "0 2px 6px rgba(100, 116, 139, 0.3)",
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
                        background: "#f1f5f9",
                        color: "#475569",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      {st.stage} საფეხური
                    </div>
                  </div>

                  {/* Student Info */}
                  <div>
                    <h4 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>{st.name}</h4>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>
                      კლასი: <strong style={{ color: isGold ? "#b45309" : "#2563eb" }}>{st.class_name}</strong> {st.user_ID && `| ID: ${st.user_ID}`}
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
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>საშუალო ქულა:</div>
                      {st.min_subject_avg !== undefined && (
                        <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>მინ. საგანი: {st.min_subject_avg}</div>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: 900,
                        color: isGold ? "#b45309" : isSilver ? "#334155" : "#059669",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FaStar size={15} color="#f59e0b" /> {st.average}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
