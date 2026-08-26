"use client";
import React, { useState, useEffect } from "react";
import { FaAward, FaMedal, FaStar, FaBuilding, FaSearch } from "react-icons/fa";

interface TopStudent {
  student_id: string;
  name: string;
  user_ID: string;
  class_name: string;
  stage: string; // 'საბაზო' | 'საშუალო' | 'დაწყებითი'
  average: number;
  total_grades_count: number;
  is_perfect_10: boolean;
}

interface TopStudentsMonitorProps {
  selectedColor: string;
}

export default function TopStudentsMonitor({ selectedColor }: TopStudentsMonitorProps) {
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>("all");
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

  const filteredStudents = topStudents.filter((s) => {
    const matchesStage = stageFilter === "all" || s.stage === stageFilter;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.user_ID.toLowerCase().includes(searchQuery.toLowerCase()) || s.class_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

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
          <h3 style={{ fontSize: "22px", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <FaAward style={{ color: "#fbbf24" }} /> წარჩინებულთა გამოვლენა & რესურსცენტრის მონიტორინგი
          </h3>
          <p style={{ fontSize: "13px", opacity: 0.6, margin: "4px 0 0 0" }}>
            საბაზო და საშუალო საფეხურის წარჩინებული მოსწავლეების ავტომატური გამოვლენა (საშუალო ქულა 10.0)
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              background: "#27272a",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              fontSize: "13px"
            }}
          >
            <option value="all">ყველა საფეხური</option>
            <option value="საბაზო">საბაზო საფეხური (VII-IX)</option>
            <option value="საშუალო">საშუალო საფეხური (X-XII)</option>
            <option value="დაწყებითი">დაწყებითი საფეხური</option>
          </select>

          <input
            type="text"
            placeholder="ძებნა (სახელი / კლასი)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              background: "#27272a",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              fontSize: "13px"
            }}
          />
        </div>
      </div>

      {/* Grid view */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", opacity: 0.6 }}>იტვირთება...</div>
      ) : filteredStudents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", opacity: 0.5, background: "rgba(255,255,255,0.02)", borderRadius: "16px" }}>
          წარჩინებული მოსწავლეები არ მოიძებნა
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
          {filteredStudents.map((st) => (
            <div
              key={st.student_id}
              style={{
                background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(255,255,255,0.02))",
                border: "1px solid rgba(251,191,36,0.3)",
                borderRadius: "16px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                position: "relative"
              }}
            >
              <div style={{ position: "absolute", top: "16px", right: "16px", color: "#fbbf24" }}>
                <FaMedal size={24} />
              </div>

              <div style={{ fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "6px", background: "rgba(251,191,36,0.2)", color: "#fbbf24", width: "fit-content" }}>
                {st.stage} საფეხური
              </div>

              <div>
                <h4 style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>{st.name}</h4>
                <div style={{ fontSize: "12px", opacity: 0.6, marginTop: "2px" }}>კლასი: <strong>{st.class_name}</strong> | ID: {st.user_ID}</div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "12px", opacity: 0.7 }}>საშუალო ქულა:</div>
                <div style={{ fontSize: "20px", fontWeight: 900, color: "#34d399", display: "flex", alignItems: "center", gap: "4px" }}>
                  <FaStar size={14} color="#fbbf24" /> {st.average}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
