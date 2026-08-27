"use client";
import React, { useState, useEffect } from "react";
import { FaChalkboardTeacher, FaHistory, FaBookOpen, FaTasks, FaKey, FaRegTimesCircle, FaBullhorn, FaComments, FaCalendarAlt } from "react-icons/fa";
import HomeworkModule from "../../components/HomeworkModule";
import NoticeBoard from "../../components/NoticeBoard";
import ChatModule from "../../components/ChatModule";
import { useQuery } from "@tanstack/react-query";
import { GiTeacher } from "react-icons/gi";
import { MdAdd, MdOutlineWarningAmber } from "react-icons/md";
import { IoStatsChartSharp } from "react-icons/io5";
import { IconType } from "react-icons";
import { useColor } from "./../../components/ColorContext";
import ColorPalette from "./../../components/ColorPalette";
import { useNavigate, Routes, Route, useParams } from "react-router-dom"; // For navigation after logout and useParams
import InfoModal from "../../components/InfoModal";
import DetailedGradeHistory from "../../components/admin/DetailedGradeHistory";
import "../admin/Admin.css";

const FaChalkboardTeacherIcon = FaChalkboardTeacher as React.ComponentType<{
  size?: number | string;
}>;
const GiTeacherIcon = GiTeacher as React.ComponentType<{
  size?: number | string;
}>;

const fromDate = `${new Date().getFullYear()}-01-01`;
const toDate = new Date().toISOString().slice(0, 10);

const TutorClassDetails: React.FC<{
  allSubjects: any[];
  allTeachers: any[];
  tutorClass: any;
  selectedColor: string;
}> = ({ allSubjects, allTeachers, tutorClass, selectedColor }) => {
  if (!tutorClass) return null;
  const subjectsList = tutorClass.subjects || [];
  return (
    <div className="admin-list-container" style={{ padding: '24px', width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}99)`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '20px',
          flexShrink: 0,
        }}>
          {tutorClass.classname}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.5 }}>
            სადამრიგებლო კლასი
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>
            {subjectsList.length} საგანი
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {subjectsList.map((subj: { subject_id: string; teacher_id: string }) => {
          const subjObj = allSubjects.find((s: { _id: string }) => s._id === subj.subject_id);
          const subjName = subjObj ? subjObj.name : "უცნობი საგანი";
          const teacherObj = allTeachers.find((t: { _id: string }) => t._id === subj.teacher_id);
          const teacherName = teacherObj
            ? `${teacherObj.name} ${teacherObj.surname}`
            : "უცნობი მასწავლებელი";
          return (
            <div key={subj.subject_id} className="tutor-subject-row">
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <FaBookOpen size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{subjName}</div>
                <div style={{ fontSize: '13px', opacity: 0.6, marginTop: '2px' }}>{teacherName}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Teacher: React.FC = () => {
  const BoxWidth = 350;
  const BoxGap = 20;
  const { selectedColor } = useColor();
  const navigate = useNavigate();
  const [teachesClasses, setTeachesClasses] = useState<any[]>([]);
  const [tutorClasses, setTutorClasses] = useState<any[]>([]);
  const [selectedTutorClass, setSelectedTutorClass] = useState<any | null>(
    null,
  );
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalMessage, setInfoModalMessage] = useState("");
  const [view, setView] = useState<"main" | "gradeEntry" | "gradeHistory">(
    "main",
  );
  const [historyClassId, setHistoryClassId] = useState<string | null>(null);
  const [pointType, setPointType] = useState(0); // Default to "აირჩიეთ ტიპი"
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editGrade, setEditGrade] = useState<any>(null); // grade object
  const [editPoint, setEditPoint] = useState("");
  const [editPointType, setEditPointType] = useState(2);
  const [editLoading, setEditLoading] = useState(false);
  const [grades, setGrades] = useState<any[]>([]);
  const [teacherSchedule, setTeacherSchedule] = useState<any[][]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "calendar" | "homeroom" | "teaching" | "notices" | "messages"
  >("teaching");

  // Get current logged-in teacher info for chat and notices
  const chatLoginData = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem("login") || "{}" : "{}");
  const currentUserID = chatLoginData.user_ID || "";
  const teacherObjForChat = allTeachers.find((t: any) => t.user_ID === currentUserID);
  const teacherIdForChat = teacherObjForChat?._id || currentUserID;
  const teacherNameForChat = teacherObjForChat ? `${teacherObjForChat.name} ${teacherObjForChat.surname}` : "მასწავლებელი";

  // Fetch teacher messages for unread badge evaluation
  const { data: teacherMessages } = useQuery({
    queryKey: ['teacher-messages-unread', teacherIdForChat],
    queryFn: async () => {
      const response = await fetch(`/api/messages?user_id=${teacherIdForChat}`);
      if (!response.ok) throw new Error();
      return response.json();
    },
    enabled: !!teacherIdForChat,
    refetchInterval: 5000
  });

  // Fetch announcements for unread badge evaluation
  const { data: teacherAnnouncements } = useQuery({
    queryKey: ['announcements-unread-teacher'],
    queryFn: async () => {
      const response = await fetch('/api/announcements');
      if (!response.ok) throw new Error();
      return response.json();
    },
    refetchInterval: 8000
  });

  const hasUnreadTeacherMessages = React.useMemo(() => {
    if (!teacherMessages || !Array.isArray(teacherMessages)) return false;
    const incomingCount = teacherMessages.filter((m: any) => m.sender_id !== teacherIdForChat).length;
    const seenCount = typeof window !== 'undefined' ? parseInt(localStorage.getItem('seen_incoming_messages_count_teacher') || '0', 10) : 0;
    return incomingCount > seenCount;
  }, [teacherMessages, teacherIdForChat]);

  const hasUnreadTeacherNotices = React.useMemo(() => {
    if (!teacherAnnouncements || !Array.isArray(teacherAnnouncements)) return false;
    const totalNotices = teacherAnnouncements.length;
    const seenNotices = typeof window !== 'undefined' ? parseInt(localStorage.getItem('seen_notices_count_teacher') || '0', 10) : 0;
    return totalNotices > seenNotices;
  }, [teacherAnnouncements]);

  useEffect(() => {
    if (activeTab === 'messages' && teacherMessages && Array.isArray(teacherMessages)) {
      const incomingCount = teacherMessages.filter((m: any) => m.sender_id !== teacherIdForChat).length;
      localStorage.setItem('seen_incoming_messages_count_teacher', incomingCount.toString());
    }
  }, [activeTab, teacherMessages, teacherIdForChat]);

  useEffect(() => {
    if (activeTab === 'notices' && teacherAnnouncements && Array.isArray(teacherAnnouncements)) {
      localStorage.setItem('seen_notices_count_teacher', teacherAnnouncements.length.toString());
    }
  }, [activeTab, teacherAnnouncements]);

  // Password change state for teacher
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPassError('ყველა ველი აუცილებელია');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('ახალი პაროლები არ ემთხვევა');
      return;
    }
    setPassLoading(true);
    try {
      const loginData = JSON.parse(localStorage.getItem('login') || '{}');
      const user_ID = loginData.user_ID;
      const res = await fetch('/api/teacher/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: user_ID, oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPassSuccess('პაროლი წარმატებით შეიცვალა!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setIsPassModalOpen(false), 1500);
      } else {
        setPassError(data.message || 'შეცდომა პაროლის შეცვლისას');
      }
    } catch {
      setPassError('სერვერთან კავშირი ვერ დამყარდა');
    } finally {
      setPassLoading(false);
    }
  };

  useEffect(() => {
    const fetchClasses = async () => {
      // Get teacher user_ID from localStorage
      const loginData = JSON.parse(localStorage.getItem("login") || "{}");
      const user_ID = loginData.user_ID;
      if (!user_ID) return;
      // Fetch all classes
      const res = await fetch("/api/classes");
      if (!res.ok) return;
      const allClasses = await res.json();
      // Fetch all teachers to get _id for this user_ID and for subject display
      const tRes = await fetch("/api/teacher/all");
      if (!tRes.ok) return;
      const teachers = await tRes.json();
      setAllTeachers(teachers);
      const teacher = teachers.find((t: any) => t.user_ID === user_ID);
      if (!teacher) return;
      const teacherId = teacher._id;
      // Fetch all subjects for subject names
      const subjRes = await fetch("/api/subjects");
      if (!subjRes.ok) return;
      const subjects = await subjRes.json();
      setAllSubjects(subjects);
      // Tutor classes
      const tutor = allClasses.filter((cls: any) => cls.damrigebeli === teacherId);
      // Teaches classes (any subject)
      const teaches = allClasses
        .filter(
          (cls: any) =>
            Array.isArray(cls.subjects) &&
            cls.subjects.some((subj: any) => subj.teacher_id === teacherId),
        )
        .map((cls: any) => {
          // Find subjects this teacher teaches in this class
          const teacherSubjects = (cls.subjects || [])
            .filter((subj: any) => subj.teacher_id === teacherId)
            .map((subj: any) => {
              const subjObj = subjects.find(
                (s: any) => s._id === subj.subject_id,
              );
              return subjObj ? subjObj.name : "";
            })
            .filter((name: string) => !!name);
          return { ...cls, teacherSubjects };
        });
      setTutorClasses(tutor);
      setTeachesClasses(teaches);
      // Fetch teacher schedule
      setScheduleLoading(true);
      const scheduleRes = await fetch(
        `/api/teacher/schedule?user_ID=${user_ID}`,
      );
      if (scheduleRes.ok) {
        const sched = await scheduleRes.json();
        setTeacherSchedule(sched);
      }
      setScheduleLoading(false);
    };
    fetchClasses();
  }, []);

  const AdminContainer: React.CSSProperties = {
    width: "100%",
    minHeight: "100dvh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    flexDirection: "column",
    gap: "20px",
    textTransform: "uppercase",
    fontWeight: "700",
    color: "white",
    position: "relative",
    boxSizing: "border-box",
    padding: "60px 16px 20px",
  };

  const BoxTitle = (): React.CSSProperties => ({
    fontSize: "clamp(22px, 5vw, 36px)",
    textAlign: "center",
    width: "100%",
  });

  const AdminContent = (gap = BoxGap): React.CSSProperties => ({
    width: "100%",
    maxWidth: `${BoxWidth * 2 + gap}px`,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: `${gap}px`,
    boxSizing: "border-box",
    padding: "0 8px",
  });

  const AdminBox = (
    boxWidth = BoxWidth,
    isHovered: boolean,
  ): React.CSSProperties => ({
    backgroundColor: selectedColor,
    fontSize: "clamp(16px, 3vw, 20px)",
    width: "100%",
    maxWidth: `${boxWidth}px`,
    minWidth: "200px",
    flex: "1 1 200px",
    minHeight: "80px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "16px",
    boxShadow: isHovered
      ? "0 12px 24px rgba(0, 0, 0, 0.3)"
      : "0 8px 16px rgba(0, 0, 0, 0.2)",
    transform: isHovered ? "scale(1.03)" : "scale(1)",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    color: "white",
    gap: "10px",
    textAlign: "center",
    padding: "12px",
  });



  useEffect(() => {
    try {
      const loginDataStr = localStorage.getItem('login');
      if (!loginDataStr) {
        navigate('/', { replace: true });
        return;
      }
      const loginData = JSON.parse(loginDataStr);
      if (loginData.role !== 'teacher') {
        navigate(loginData.role ? `/${loginData.role}` : '/', { replace: true });
      }
    } catch {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('login');
    localStorage.removeItem('authToken');
    navigate('/', { replace: true });
  };

  // Helper to check if a date is within 14 days from today
  function isWithin14Days(dateStr: string) {
    const today = new Date();
    const date = new Date(dateStr);
    const diff = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 14 && diff >= 0;
  }

  // Get user role from localStorage
  const loginData = JSON.parse(localStorage.getItem("login") || "{}");
  const isTeacher = loginData.role === "teacher";

  // Helper: Days and lessons
  const days = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ"];
  const lessons = [1, 2, 3, 4, 5, 6, 7];
  const lessonRoman = ["1", "2", "3", "4", "5", "6", "7"];

  // Teacher calendar table component
  const TeacherCalendarTable: React.FC<{ schedule: any[][] }> = ({
    schedule,
  }) => {
    const { data: calendarEvents } = useQuery<any[]>({
      queryKey: ['calendar-events-teacher-table'],
      queryFn: async () => {
        const res = await fetch('/api/calendar-events');
        if (!res.ok) return [];
        return res.json();
      },
      refetchInterval: 10000
    });

    const hasEvents = calendarEvents && calendarEvents.length > 0;

    return (
      <div className="schedule-grid-container">
        {hasEvents && (
          <div style={{
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            {calendarEvents.map((evt) => (
              <div
                key={evt.date}
                style={{
                  backgroundColor: evt.type === 'holiday' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                  border: evt.type === 'holiday' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(14, 165, 233, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  color: evt.type === 'holiday' ? '#f87171' : '#38bdf8',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span>{evt.type === 'holiday' ? 'დასვენების დღე:' : 'აღდგენის დღე:'}</span>
                <strong>{evt.date}</strong> — <span>{evt.title}</span>
                {evt.type === 'makeup' && evt.replacementDayOfWeek !== undefined && (
                  <span style={{ opacity: 0.9 }}>
                    ({days[evt.replacementDayOfWeek]}ს ცხრილით)
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="schedule-header-grid">
          <div className="schedule-day-pill" style={{ opacity: 0 }}></div> {/* Spacer for time column */}
          {days.map((day) => (
            <div key={day} className="schedule-day-pill">{day}</div>
          ))}
        </div>
        
        {lessons.map((lessonIdx, rowIdx) => (
          <div key={lessonIdx} className="schedule-row">
            <div className="schedule-time-slot">
              {lessonRoman[rowIdx]}
            </div>
            {days.map((_, dayIdx) => {
              const slot = schedule[dayIdx]?.[lessonIdx - 1];
              return (
                <div
                  key={dayIdx}
                  className={`schedule-lesson-card ${slot ? 'active' : ''}`}
                >
                  {slot ? (
                    <div className="schedule-subject-name">
                      {slot.className}
                    </div>
                  ) : (
                    <span className="schedule-empty">---</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Unified Teacher Layout Component
  const TeacherLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <div className="admin-page-wrapper">
        <div
          className="admin-page-bg-glow"
          style={{ background: `radial-gradient(circle at center, ${selectedColor}26 0%, transparent 70%)` }}
        />
        <ColorPalette />
        <div style={{ position: 'fixed', top: '15px', right: '15px', display: 'flex', gap: '10px', zIndex: 100 }}>
          <button
            onClick={() => setIsPassModalOpen(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              background: 'rgba(20, 25, 45, 0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'white',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(20, 25, 45, 0.85)'}
          >
            <FaKey size={13} color="#fbbf24" /> პაროლის შეცვლა
          </button>
          <button className="logout-btn" onClick={handleLogout} style={{ position: 'static' }}>
            გამოსვლა
          </button>
        </div>
        <div className="admin-page-content">
          <header className="admin-page-header animate-fade-in-down">
            <h1 className="admin-page-title">
              მასწავლებლის <span style={{ color: selectedColor }}>პანელი</span>
            </h1>
            <p className="admin-page-subtitle">სასწავლო პროცესის მართვის სისტემა</p>
          </header>
          <div className="admin-main-view animate-zoom-in" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            {children}
          </div>
        </div>

        {/* Teacher Password Change Modal */}
        {isPassModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'rgba(20, 25, 45, 0.9)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: 800 }}>პაროლის შეცვლა</h3>
                <button onClick={() => setIsPassModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                  <FaRegTimesCircle size={20} />
                </button>
              </div>
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {passError && <div style={{ color: '#ef4444', background: '#ef444415', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>{passError}</div>}
                {passSuccess && <div style={{ color: '#10b981', background: '#10b98115', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>{passSuccess}</div>}
                
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', display: 'block', marginBottom: '6px', fontWeight: 600 }}>მიმდინარე პაროლი</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', display: 'block', marginBottom: '6px', fontWeight: 600 }}>ახალი პაროლი</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', display: 'block', marginBottom: '6px', fontWeight: 600 }}>დაადასტურეთ ახალი პაროლი</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                    placeholder="••••••••"
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" className="admin-submit-btn" disabled={passLoading} style={{ flex: 1 }}>
                    {passLoading ? 'მუშავდება...' : 'შენახვა'}
                  </button>
                  <button type="button" onClick={() => setIsPassModalOpen(false)} className="admin-cancel-btn">
                    გაუქმება
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Teach class options page
  const TeachClassOptionsPage: React.FC = () => {
    const { id } = useParams();
    const classObj = teachesClasses.find((cls: any) => cls._id === id);
    const handleCardClick = (label: string) => {
      if (label === "ნიშნის შეტანა") {
        navigate(`/teacher/teach/${id}/grade`);
      } else if (label === "ისტორია") {
        navigate(`/teacher/teach/${id}/history`);
      } else if (label === "სტატისტიკა") {
        navigate(`/teacher/teach/${id}/statistics`);
      } else if (label === "დავალებები") {
        navigate(`/teacher/teach/${id}/homework`);
      }
    };
    return (
      <TeacherLayout>
        <div className="admin-view-container" style={{ maxWidth: '800px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            onClick={() => navigate("/teacher")}
            className="admin-back-btn"
            style={{ alignSelf: 'flex-start', marginBottom: '24px' }}
          >
            უკან დაბრუნება
          </button>
          <div className="admin-view-header" style={{ justifyContent: 'center', marginTop: '10px' }}>
            <h2 className="admin-view-title" style={{ fontSize: '32px', fontWeight: 800 }}>{classObj ? classObj.classname : ""}</h2>
          </div>
          <div className="admin-grid" style={{ marginTop: '30px', width: '100%', justifyContent: 'center' }}>
            {[
              { label: "ნიშნის შეტანა", icon: MdAdd },
              { label: "დავალებები", icon: FaTasks },
              { label: "ისტორია", icon: FaHistory },
              { label: "სტატისტიკა", icon: IoStatsChartSharp },
            ].map((item, idx) => (
              <div
                key={item.label}
                className="admin-card"
                onClick={() => handleCardClick(item.label)}
              >
                <div className="admin-card-icon-wrapper">
                  <item.icon size={32} />
                </div>
                <div className="admin-card-label">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </TeacherLayout>
    );
  };

  // Teacher Homework Page
  const TeacherHomeworkPage: React.FC = () => {
    const { id } = useParams();
    const loginData = JSON.parse(localStorage.getItem("login") || "{}");
    const user_ID = loginData.user_ID || "teacher";
    const teacherObj = allTeachers.find((t: any) => t.user_ID === user_ID);
    const teacherName = teacherObj ? `${teacherObj.name} ${teacherObj.surname}` : "მასწავლებელი";

    return (
      <TeacherLayout>
        <div className="admin-view-container" style={{ maxWidth: "900px", width: "100%", margin: "0 auto" }}>
          <button onClick={() => navigate(`/teacher/teach/${id}`)} className="admin-back-btn" style={{ marginBottom: "24px" }}>
            უკან დაბრუნება
          </button>
          <HomeworkModule
            userRole="teacher"
            userId={teacherObj?._id || user_ID}
            userName={teacherName}
            classId={id}
            selectedColor={selectedColor}
          />
        </div>
      </TeacherLayout>
    );
  };

  // Grade entry page
  const GradeEntryPage: React.FC = () => {
    const { id } = useParams();
    const [students, setStudents] = useState<any[]>([]);
    const [gradeType, setGradeType] = useState("საკლასო");
    const [grades, setGrades] = useState<{
      [studentId: string]: { attendance: boolean; point: string; comment?: string; excuse_reason?: string };
    }>({});
    const [isProjectToggle, setIsProjectToggle] = useState(false);
    const [lessonNum, setLessonNum] = useState<number>(1);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(() => {
      const today = new Date();
      return today.toISOString().split("T")[0];
    });
    // For custom Georgian date picker
    const georgianMonths = [
      "იანვარი",
      "თებერვალი",
      "მარტი",
      "აპრილი",
      "მაისი",
      "ივნისი",
      "ივლისი",
      "აგვისტო",
      "სექტემბერი",
      "ოქტომბერი",
      "ნოემბერი",
      "დეკემბერი",
    ];
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [day, setDay] = useState(today.getDate());
    // Teacher's allowed start date
    const [gradeEntryStartDate, setGradeEntryStartDate] = useState<
      string | null
    >(null);
    const [currentTeacherId, setCurrentTeacherId] = useState<string | null>(null);

    useEffect(() => {
      const fetchStudentsAndStartDate = async () => {
        setLoading(true);
        // Fetch only students of this class (by grade + parallel from classname)
        const classObj = teachesClasses.find((cls: any) => cls._id === id);
        const match = classObj?.classname.match(/^([0-9]+)([ა-ჰ])$/);
        const studentsUrl = match
          ? `/api/student/grade/${match[1]}?parallel=${encodeURIComponent(match[2])}`
          : "/api/student/all";
        const res = await fetch(studentsUrl);
        if (!res.ok) return;
        const fetched = await res.json();
        const classStudents = match
          ? fetched
          : fetched.filter((s: any) => s.classInfo && s.classInfo._id === id);
        setStudents(classStudents);
        // Initialize grades state
        const initialGrades: {
          [studentId: string]: { attendance: boolean; point: string; excuse_reason?: string };
        } = {};
        classStudents.forEach((s: any) => {
          initialGrades[s._id] = { attendance: true, point: "" };
        });
        setGrades(initialGrades);
        // Fetch teacher's allowed start date (mock: get from /api/teacher/all)
        const loginData = JSON.parse(localStorage.getItem("login") || "{}");
        const user_ID = loginData.user_ID;
        const tRes = await fetch("/api/teacher/all");
        if (tRes.ok) {
          const allTeachers = await tRes.json();
          const teacher = allTeachers.find((t: any) => t.user_ID === user_ID);
          if (teacher) {
            setCurrentTeacherId(teacher._id);
            if (teacher.gradeEntryStartDate) {
              setGradeEntryStartDate(teacher.gradeEntryStartDate);
            } else {
              // Default: 14 days window
              const defaultStart = new Date();
              defaultStart.setDate(defaultStart.getDate() - 13);
              setGradeEntryStartDate(defaultStart.toISOString().split("T")[0]);
            }
          }
        }
        setLoading(false);
      };
      fetchStudentsAndStartDate();
    }, [id]);

    // Handle day changes when month/year changes
    useEffect(() => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      if (day > daysInMonth) {
        setDay(daysInMonth);
      }
    }, [year, month, day]);

    // Fetch existing grades when date, subject, or lessonNum changes
    useEffect(() => {
      if (!id || !selectedSubject || !day || !month || !year || students.length === 0) return;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const fetchExistingGrades = async () => {
        try {
          const res = await fetch(`/api/grades?class_id=${id}&subject_id=${selectedSubject}&date=${dateStr}&lesson_num=${lessonNum}`);
          if (res.ok) {
            const existingGradesList = await res.json();
            if (Array.isArray(existingGradesList) && existingGradesList.length > 0) {
              const newGradesState: Record<string, any> = {};
              students.forEach((s: any) => {
                newGradesState[s._id] = { attendance: true, point: "", comment: "" };
              });
              existingGradesList.forEach((g: any) => {
                const sId = String(g.student_id);
                newGradesState[sId] = {
                  attendance: g.checked ?? true,
                  point: g.point >= 0 ? String(g.point) : (g.comment || (g.is_formative ? "განმავითარებელი" : "")),
                  comment: g.comment || "",
                  excuse_reason: g.excuse_reason
                };
              });
              setGrades(newGradesState);
            }
          }
        } catch (err) {
          console.error("Error fetching existing grades:", err);
        }
      };
      fetchExistingGrades();
    }, [id, selectedSubject, year, month, day, lessonNum, students]);

    // Memoize allowed days calculation to prevent unnecessary re-renders
    const allowedDays = React.useMemo(() => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      // Calculate allowed date range (from gradeEntryStartDate to today)
      const maxDateObj = new Date();
      maxDateObj.setHours(0, 0, 0, 0);
      const minDateObj = gradeEntryStartDate
        ? new Date(gradeEntryStartDate)
        : new Date(maxDateObj);
      minDateObj.setHours(0, 0, 0, 0);

      // Find the class object and its calendar
      const classObj = teachesClasses.find((cls: any) => cls._id === id);

      const hasLessonOnDay = (dayOfWeekIdx: number) => {
        if (!classObj || !classObj.calendar || !Array.isArray(classObj.calendar)) return false;
        const dayLessons = classObj.calendar[dayOfWeekIdx];
        if (!dayLessons || !Array.isArray(dayLessons)) return false;

        return dayLessons.some((entry: any) => {
          if (!entry) return false;
          const teacherMatch = entry.teacher_id && entry.teacher_id.toString() === currentTeacherId;
          const subjectMatch = !selectedSubject || (entry.subject_id && entry.subject_id.toString() === selectedSubject);
          return teacherMatch && subjectMatch;
        });
      };

      // Helper to check if a date is in range and has a lesson
      const isDayAllowed = (y: number, m: number, d: number) => {
        const dateObj = new Date(y, m, d);
        dateObj.setHours(0, 0, 0, 0);
        const dateInRange = dateObj >= minDateObj && dateObj <= maxDateObj;
        if (!dateInRange) return false;

        // If teacher ID is not yet loaded, we don't filter by calendar yet
        if (!currentTeacherId) return true;

        const dayOfWeek = dateObj.getDay(); // 0 (Sun) - 6 (Sat)
        const dayOfWeekIdx = dayOfWeek - 1; // 0 (Mon) - 4 (Fri)
        if (dayOfWeekIdx < 0 || dayOfWeekIdx > 4) return false;

        return hasLessonOnDay(dayOfWeekIdx);
      };

      // Filter days for dropdown
      return Array.from({ length: daysInMonth }, (_, i) => i + 1).filter((d) =>
        isDayAllowed(year, month, d),
      );
    }, [year, month, gradeEntryStartDate, currentTeacherId, selectedSubject, teachesClasses, id]);

    // Auto-select the first allowed day if the current selected day is not allowed
    useEffect(() => {
      if (allowedDays.length > 0 && !allowedDays.includes(day)) {
        setDay(allowedDays[0]);
      }
    }, [allowedDays, day]);

    const handleAttendanceChange = (studentId: string, checked: boolean) => {
      setGrades((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          attendance: checked,
          point: checked ? prev[studentId].point : "",
        },
      }));
    };
    const handlePointChange = (studentId: string, value: string) => {
      setGrades((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], point: value },
      }));
    };
    const handleCommentChange = (studentId: string, commentVal: string) => {
      setGrades((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          comment: commentVal,
          point: commentVal.trim() !== "" ? "განმავითარებელი" : "",
        },
      }));
    };

    // Memoize the student list to prevent unnecessary re-renders
    const memoizedStudents = React.useMemo(() => students, [students]);
    const handleSubmit = async () => {
      if (!selectedSubject) {
        alert("გთხოვთ აირჩიოთ საგანი");
        return;
      }
      // Check comment-only rule (1-4 and 5th grade 1st semester)
      const classObj = teachesClasses.find((cls: any) => cls._id === id);
      const classGradeNum = parseInt(classObj?.classname || "", 10);
      const isFirstSemester = month >= 8 && month <= 11; // Sept (8) to Dec (11)
      const isCommentOnly = (!isNaN(classGradeNum) && classGradeNum >= 1 && classGradeNum <= 4) ||
                           (!isNaN(classGradeNum) && classGradeNum === 5 && isFirstSemester);

      // Compose date string
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      // Get teacherId from localStorage
      const loginData = JSON.parse(localStorage.getItem("login") || "{}");
      const user_ID = loginData.user_ID;
      // Fetch all teachers to get MongoDB _id
      const tRes = await fetch("/api/teacher/all");
      if (!tRes.ok) return alert("მასწავლებლის იდენტიფიკაცია ვერ მოხერხდა");
      const allTeachers = await tRes.json();
      const teacher = allTeachers.find((t: any) => t.user_ID === user_ID);
      if (!teacher) return alert("მასწავლებელი ვერ მოიძებნა");
      const teacherId = teacher._id;
      // Get classId from useParams
      const classId = id;
      // Loop through students and submit grades
      let successCount = 0;
      let errorCount = 0;
      const gradesToSave: any[] = [];
      for (const student of memoizedStudents) {
        const grade = grades[student._id];
        if (!grade) continue;
        const isNumeric = !isNaN(parseInt(grade.point, 10)) && grade.point !== "ჩთ" && grade.point !== "არ ჩთ";
        const pointValue = isNumeric ? parseInt(grade.point, 10) : (grade.point === "ჩთ" || grade.point === "არ ჩთ" ? -3 : -1);
        const commentText = grade.comment || (isCommentOnly ? (grade.point !== "განმავითარებელი" ? grade.point : "") : (typeof grade.point === "string" && !isNumeric && grade.point !== "ჩთ" && grade.point !== "არ ჩთ" ? grade.point : ""));
        const isFormative = isCommentOnly || (typeof commentText === "string" && commentText.trim() !== "");
        const isExcused = grade.attendance === false && grade.excuse_reason && grade.excuse_reason !== "general_unexcused";

        const now = new Date();
        const timeStr = now.toTimeString().split(" ")[0]; // "HH:MM:SS"
        const payload = {
          student_id: student._id,
          teacher_id: teacherId,
          class_id: classId,
          subject_id: selectedSubject,
          pointType: pointType,
          point: pointValue,
          date: dateStr,
          time: timeStr,
          comment: commentText,
          checked: grades[student._id]?.attendance ?? true,
          is_excused: isExcused,
          excuse_reason: isExcused ? grade.excuse_reason : undefined,
          is_formative: isFormative,
          lesson_num: lessonNum
        };
        gradesToSave.push(payload);
      }
      if (gradesToSave.length > 0) {
        const res = await fetch("/api/grades/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gradesToSave),
        });
        if (res.ok) {
          successCount++;
          setInfoModalMessage("ყველა ნიშანი წარმატებით შეინახა!");
          setInfoModalOpen(true);
        } else {
          errorCount++;
          setInfoModalMessage("შეცდომა: ნიშნები ვერ შეინახა!");
          setInfoModalOpen(true);
        }
      }
    };

    const handleBack = () => {
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate("/teacher");
      }
    };

    if (loading)
      return (
        <div style={{ color: "white", textAlign: "center", marginTop: "40px" }}>
          იტვირთება...
        </div>
      );

    // Switch style
    const switchStyle: React.CSSProperties = {
      position: "relative",
      display: "inline-block",
      width: "46px",
      height: "24px",
    };
    const sliderStyle: React.CSSProperties = {
      position: "absolute",
      cursor: "pointer",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "#ccc",
      borderRadius: "24px",
      transition: ".4s",
    };
    const sliderCheckedStyle: React.CSSProperties = {
      ...sliderStyle,
      backgroundColor: selectedColor,
    };
    const circleStyle: React.CSSProperties = {
      position: "absolute",
      content: '""',
      height: "18px",
      width: "18px",
      left: "3px",
      bottom: "3px",
      backgroundColor: "white",
      borderRadius: "50%",
      transition: ".4s",
    };
    const circleCheckedStyle: React.CSSProperties = {
      ...circleStyle,
      transform: "translateX(22px)",
    };

    // Find subjects for this teacher in this class
    const classObj = teachesClasses.find((cls: any) => cls._id === id);
    let teacherSubjects: any[] = [];
    if (classObj && Array.isArray(classObj.subjects)) {
      const loginData = JSON.parse(localStorage.getItem("login") || "{}");
      const user_ID = loginData.user_ID;
      const teacher = allTeachers.find((t: any) => t.user_ID === user_ID);
      if (teacher) {
        teacherSubjects = classObj.subjects.filter(
          (subj: any) => subj.teacher_id === teacher._id,
        );
      }
    }

    return (
      <TeacherLayout>
        <div className="admin-view-container" style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
          <button
            onClick={handleBack}
            className="admin-back-btn"
            style={{ marginBottom: '24px' }}
          >
            უკან დაბრუნება
          </button>

          <div className="admin-form-container" style={{ maxWidth: '100%', marginBottom: '40px' }}>
            <h2 className="admin-form-title">ნიშნის შეტანა</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div className="admin-form-group">
              <label className="admin-label">საგანი:</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="admin-select"
              >
                <option value="">აირჩიეთ საგანი</option>
                {teacherSubjects.map((subj: any) => {
                  const subjObj = allSubjects.find(
                    (s: any) => s._id === subj.subject_id,
                  );
                  return subjObj ? (
                    <option key={subj.subject_id} value={subj.subject_id}>
                      {subjObj.name}
                    </option>
                  ) : null;
                })}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">წელი:</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="admin-select"
              >
                {[year - 1, year, year + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">თვე:</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="admin-select"
              >
                {georgianMonths.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">დღე:</label>
              {allowedDays.length === 0 ? (
                <div style={{ color: "#ff5252", fontSize: '12px', marginTop: '10px' }}>
                  ქულების ჩაწერა შეუძლებელია
                </div>
              ) : (
                <select
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                  className="admin-select"
                >
                  {allowedDays.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="admin-form-group">
              <label className="admin-label">ტიპი:</label>
              <select
                value={pointType}
                onChange={(e) => setPointType(Number(e.target.value))}
                className="admin-select"
              >
                <option value={0}>აირჩიეთ ტიპი</option>
                <option value={1}>საშინაო</option>
                <option value={2}>საკლასო</option>
                <option value={3}>შემაჯამებელი</option>
              </select>
            </div>

            {(() => {
              const selectedDateObj = new Date(year, month, day);
              const jsDay = selectedDateObj.getDay();
              const scheduleDayIdx = jsDay >= 1 && jsDay <= 5 ? jsDay - 1 : -1;
              const classObj = teachesClasses.find((cls: any) => cls._id === id);
              const daySchedule = scheduleDayIdx >= 0 && classObj?.calendar ? classObj.calendar[scheduleDayIdx] : [];
              const scheduledLessonsCount = selectedSubject && Array.isArray(daySchedule)
                ? daySchedule.filter((slot: any) => slot && String(slot.subject_id) === String(selectedSubject)).length
                : 1;
              const maxLessons = Math.max(1, scheduledLessonsCount);

              if (maxLessons <= 1) return null;
              return (
                <div className="admin-form-group">
                  <label className="admin-label">გაკვეთილის საათი:</label>
                  <select
                    value={lessonNum}
                    onChange={(e) => setLessonNum(Number(e.target.value))}
                    className="admin-select"
                  >
                    {Array.from({ length: maxLessons }, (_, idx) => idx + 1).map((num) => (
                      <option key={num} value={num}>
                        {num === 1 ? "1-ლი გაკვეთილი (I საათი)" : num === 2 ? "მე-2 გაკვეთილი (II საათი)" : `${num}-ე გაკვეთილი`}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })()}
          </div>
        </div>

        {selectedSubject &&
          allowedDays.length > 0 &&
          gradeEntryStartDate &&
          pointType > 0 ? (
          <div className="admin-list-container" style={{ maxWidth: '100%' }}>
            <div className="admin-view-header" style={{ padding: '20px 24px', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 0 }}>
              <h3 className="admin-view-title" style={{ fontSize: '20px' }}>მოსწავლეთა სია</h3>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: '14px', opacity: 0.8 }}>
                <span><strong>საგანი:</strong> {allSubjects.find((s) => s._id === selectedSubject)?.name}</span>
                <span><strong>თარიღი:</strong> {day} {georgianMonths[month]} {year}</span>
              </div>
            </div>

            {(() => {
              const classObj = teachesClasses.find((cls: any) => cls._id === id);
              const classGradeNum = parseInt(classObj?.classname || "", 10);
              const isFirstSemester = month >= 8 && month <= 11; // Sept (8) to Dec (11)
              const isCommentOnly = (!isNaN(classGradeNum) && classGradeNum >= 1 && classGradeNum <= 4) ||
                                   (!isNaN(classGradeNum) && classGradeNum === 5 && isFirstSemester);
              const selectedSubjObj = allSubjects.find((s: any) => s._id === selectedSubject);
              const isProjectSubject = isProjectToggle || 
                                       selectedSubjObj?.is_project || 
                                       selectedSubjObj?.name?.includes("პროექტ") || 
                                       selectedSubjObj?.name?.includes("ჩათვლ");

              return (
                <>
                  <div className="grade-entry-header">
                    <div>მოსწავლე</div>
                    <div style={{ textAlign: 'center' }}>დასწრება</div>
                    <div style={{ textAlign: 'center' }}>
                      {isCommentOnly ? "განმავითარებელი კომენტარი" : isProjectSubject ? "ჩათვლა (ჩთ / არ ჩთ)" : "ქულა (0-10)"}
                    </div>
                  </div>

                  <div className="grade-entry-list">
                    {memoizedStudents.map((student) => {
                      const checked = grades[student._id]?.attendance ?? true;
                      return (
                        <div key={student._id} className="grade-entry-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}99)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '14px',
                              color: 'white',
                              flexShrink: 0,
                            }}>
                              {student.name?.[0] ?? ''}{student.surname?.[0] ?? ''}
                            </div>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '15px' }}>
                              {student.name} {student.surname}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <label style={switchStyle}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => handleAttendanceChange(student._id, e.target.checked)}
                                style={{ display: 'none' }}
                              />
                              <span style={checked ? sliderCheckedStyle : sliderStyle}>
                                <span style={checked ? circleCheckedStyle : circleStyle}></span>
                              </span>
                            </label>
                            {!checked && (
                              <select
                                value={grades[student._id]?.excuse_reason || "general_unexcused"}
                                onChange={(e) => {
                                  setGrades(prev => ({
                                    ...prev,
                                    [student._id]: { ...prev[student._id], excuse_reason: e.target.value }
                                  }));
                                }}
                                style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px', background: '#27272a', color: '#fbbf24', border: '1px solid rgba(255,255,255,0.1)' }}
                              >
                                <option value="general_unexcused">არასაპატიო</option>
                                <option value="olympiad">⭐ ოლიმპიადა</option>
                                <option value="sports">🏆 სპორტული</option>
                                <option value="art">🎨 სახელოვნებო</option>
                                <option value="medical">🏥 სამედიცინო</option>
                                <option value="general_excused">✓ სხვა საპატიო</option>
                              </select>
                            )}
                          </div>

                          {isCommentOnly ? (
                            <input
                              type="text"
                              value={grades[student._id]?.comment ?? (grades[student._id]?.point !== "განმავითარებელი" ? grades[student._id]?.point ?? "" : "")}
                              onChange={(e) => handleCommentChange(student._id, e.target.value)}
                              placeholder="დაწერეთ განმავითარებელი კომენტარი..."
                              disabled={!checked}
                              className="admin-input"
                              style={{
                                padding: '8px 12px',
                                fontSize: '13px',
                                opacity: checked ? 1 : 0.5,
                                width: '100%',
                                maxWidth: '280px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: 'white',
                                borderRadius: '8px'
                              }}
                            />
                          ) : isProjectSubject ? (
                            <select
                              value={grades[student._id]?.point ?? ''}
                              onChange={(e) => handlePointChange(student._id, e.target.value)}
                              disabled={!checked}
                              className="admin-select"
                              style={{ padding: '8px 12px', fontSize: '14px', opacity: checked ? 1 : 0.5 }}
                            >
                              <option value="">აირჩიეთ...</option>
                              <option value="ჩთ">ჩთ (ჩათვლილი)</option>
                              <option value="არ ჩთ">არ ჩთ (არაჩათვლილი)</option>
                            </select>
                          ) : (
                            <select
                              value={grades[student._id]?.point ?? ''}
                              onChange={(e) => handlePointChange(student._id, e.target.value)}
                              disabled={!checked}
                              className="admin-select"
                              style={{ padding: '8px 12px', fontSize: '14px', opacity: checked ? 1 : 0.5 }}
                            >
                              <option value="">აირჩიეთ...</option>
                              {Array.from({ length: 11 }, (_, n) => n).map((n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleSubmit}
                className="admin-submit-btn"
                style={{ maxWidth: '300px' }}
              >
                მონაცემების შენახვა
              </button>
            </div>
          </div>
        ) : (
          <div className="admin-card" style={{ padding: '60px' }}>
            <div className="admin-card-icon-wrapper" style={{ marginBottom: '20px' }}>
              <MdOutlineWarningAmber size={48} />
            </div>
            <div className="admin-card-label" style={{ marginBottom: '15px' }}>
              გთხოვთ აირჩიოთ ყველა საჭირო პარამეტრი
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: '1.6' }}>
              {!selectedSubject && "• აირჩიეთ საგანი"}<br />
              {selectedSubject && !allowedDays.length && "• აირჩიეთ სწორი თარიღი"}<br />
              {selectedSubject && allowedDays.length > 0 && pointType === 0 && "• აირჩიეთ ქულის ტიპი"}
            </div>
          </div>
        )}

        <InfoModal
          isOpen={infoModalOpen}
          message={infoModalMessage}
          onClose={() => setInfoModalOpen(false)}
        />
      </div>
    </TeacherLayout>
    );
  };

  const getAcademicYearFromDate = (dateStr: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const startYear = month >= 9 ? year : year - 1;
    return `${startYear}-${startYear + 1}`;
  };

  const getCurrentAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startYear = month >= 9 ? year : year - 1;
    return `${startYear}-${startYear + 1}`;
  };

  // Grade history page
  const GradeHistoryPage: React.FC<{ allSubjects: any[] }> = () => {
    const { id } = useParams();
    const classId = id!;
    const classObj = teachesClasses.find((cls: any) => cls._id === classId);
    const className = classObj ? classObj.classname : "";
    const { selectedColor } = useColor();

    return (
      <TeacherLayout>
        <DetailedGradeHistory
          classId={classId}
          className={className}
          selectedColor={selectedColor}
          onBackClick={() => navigate(-1)}
        />
      </TeacherLayout>
    );
  };

  // Statistics page
  const StatisticsPage: React.FC = () => {
    const { id } = useParams();
    const classId = id!;
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [selectedSemester, setSelectedSemester] = useState<string>("წლიური");
    const [selectedMark, setSelectedMark] = useState<number>(10);
    const [selectedAttendance, setSelectedAttendance] = useState<number>(100);
    const [students, setStudents] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Get teacher's classes and subjects
    const classObj = teachesClasses.find((cls: any) => cls._id === classId);
    let teacherSubjects: any[] = [];
    if (classObj && Array.isArray(classObj.subjects)) {
      const loginData = JSON.parse(localStorage.getItem("login") || "{}");
      const user_ID = loginData.user_ID;
      const teacher = allTeachers.find((t: any) => t.user_ID === user_ID);
      if (teacher) {
        teacherSubjects = classObj.subjects.filter(
          (subj: any) => subj.teacher_id === teacher._id,
        );
      }
    }

    const handleViewStatistics = async () => {
      if (!selectedSubject) {
        alert("გთხოვთ აირჩიოთ საგანი");
        return;
      }

      setLoading(true);
      try {
        // Fetch only students of this class (by grade + parallel from classname)
        const match = classObj?.classname.match(/^([0-9]+)([ა-ჰ])$/);
        const studentsUrl = match
          ? `/api/student/grade/${match[1]}?parallel=${encodeURIComponent(match[2])}`
          : "/api/student/all";
        const studentsRes = await fetch(studentsUrl);
        const fetched = await studentsRes.json();
        const classStudents = match
          ? fetched
          : fetched.filter(
            (s: any) => s.classInfo && s.classInfo._id === classId,
          );
        setStudents(classStudents);

        // Fetch grades for this class and selected subject
        const gradesRes = await fetch(
          `/api/grades?class_id=${classId}&subject_id=${selectedSubject}`,
        );
        const gradesData = await gradesRes.json();
        setGrades(Array.isArray(gradesData) ? gradesData : []);

        setShowResults(true);
      } catch (error) {
        console.error("Error fetching statistics:", error);
        alert("სტატისტიკის ჩვენება ვერ მოხერხდა");
      } finally {
        setLoading(false);
      }
    };

    const calculateStudentStats = (studentId: string) => {
      const studentGrades = grades.filter((g) => g.student_id === studentId);

      // Filter grades by semester
      const getSemesterGrades = (semester: string) => {
        return studentGrades.filter((g) => {
          const gradeDate = new Date(g.date);
          const month = gradeDate.getMonth() + 1; // getMonth() returns 0-11

          if (semester === "პირველი") {
            // September (9) to December (12)
            return month >= 9 && month <= 12;
          } else if (semester === "მეორე") {
            // January (1) to June (6)
            return month >= 1 && month <= 6;
          }
          return true; // წლიური - all grades
        });
      };

      let averageScore = 0;
      let attendancePercentage = 0;

      if (selectedSemester === "წლიური") {
        // Calculate annual average: (first semester + second semester) / 2
        const firstSemesterGrades = getSemesterGrades("პირველი");
        const secondSemesterGrades = getSemesterGrades("მეორე");

        const isNumericGrade = (g: any) => {
          const pt = typeof g.point === "number" ? g.point : (typeof g.point === "string" && !isNaN(parseInt(g.point, 10)) ? parseInt(g.point, 10) : -1);
          return pt >= 0 && pt <= 10 && !g.is_formative && g.point !== -3;
        };
        const getPtVal = (g: any) => (typeof g.point === "number" ? g.point : parseInt(g.point, 10));

        const firstSemesterNumeric = firstSemesterGrades.filter(isNumericGrade);
        const secondSemesterNumeric = secondSemesterGrades.filter(isNumericGrade);

        const firstSemesterAvg =
          firstSemesterNumeric.length > 0
            ? firstSemesterNumeric.reduce((sum, g) => sum + getPtVal(g), 0) /
            firstSemesterNumeric.length
            : 0;
        const secondSemesterAvg =
          secondSemesterNumeric.length > 0
            ? secondSemesterNumeric.reduce((sum, g) => sum + getPtVal(g), 0) /
            secondSemesterNumeric.length
            : 0;

        averageScore = (firstSemesterAvg + secondSemesterAvg) / 2;

        // Calculate attendance for all grades
        const totalGrades = studentGrades.length;
        const attendedGrades = studentGrades.filter(
          (g) => g.checked === true,
        ).length;
        attendancePercentage =
          totalGrades > 0 ? (attendedGrades / totalGrades) * 100 : 0;
      } else {
        // Calculate for specific semester
        const semesterGrades = getSemesterGrades(selectedSemester);
        const isNumericGrade = (g: any) => {
          const pt = typeof g.point === "number" ? g.point : (typeof g.point === "string" && !isNaN(parseInt(g.point, 10)) ? parseInt(g.point, 10) : -1);
          return pt >= 0 && pt <= 10 && !g.is_formative && g.point !== -3;
        };
        const getPtVal = (g: any) => (typeof g.point === "number" ? g.point : parseInt(g.point, 10));

        const numericGrades = semesterGrades.filter(isNumericGrade);

        averageScore =
          numericGrades.length > 0
            ? numericGrades.reduce((sum, g) => sum + getPtVal(g), 0) /
            numericGrades.length
            : 0;

        const totalGrades = semesterGrades.length;
        const attendedGrades = semesterGrades.filter(
          (g) => g.checked === true,
        ).length;
        attendancePercentage =
          totalGrades > 0 ? (attendedGrades / totalGrades) * 100 : 0;
      }

      return {
        averageScore: parseFloat(averageScore.toFixed(1)),
        attendancePercentage: parseFloat(attendancePercentage.toFixed(1)),
      };
    };

    const filteredStudents = students;

    return (
      <TeacherLayout>
        <div className="admin-view-container" style={{ width: '100%', maxWidth: '850px', margin: '0 auto' }}>
          <button
            onClick={() => navigate(-1)}
            className="admin-back-btn"
            style={{ marginBottom: '24px' }}
          >
            უკან დაბრუნება
          </button>

        <div className="admin-form-container" style={{ marginTop: '20px', marginBottom: '40px' }}>
          <h2 className="admin-form-title" style={{ color: 'blue' }}>სტატისტიკა</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div className="admin-form-group">
              <label className="admin-label">კლასი:</label>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: 'white', fontWeight: 700 }}>
                {classObj?.classname || ""}
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">აირჩიეთ საგანი:</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="admin-select"
              >
                <option value="">აირჩიეთ საგანი</option>
                {teacherSubjects.map((subj: any) => {
                  const subjObj = allSubjects.find(
                    (s: any) => s._id === subj.subject_id,
                  );
                  return subjObj ? (
                    <option key={subj.subject_id} value={subj.subject_id}>
                      {subjObj.name}
                    </option>
                  ) : null;
                })}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">სემესტრი:</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="admin-select"
              >
                <option value="წლიური">წლიური</option>
                <option value="პირველი">პირველი</option>
                <option value="მეორე">მეორე</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
            <button
              onClick={handleViewStatistics}
              className="admin-submit-btn"
              disabled={loading || !selectedSubject}
              style={{ maxWidth: '300px' }}
            >
              {loading ? "იტვირთება..." : "სტატიტიკის ნახვა"}
            </button>
          </div>
        </div>

        {showResults && (
          <div className="admin-list-container">
            <div className="admin-view-header" style={{ padding: '24px' }}>
              <h3 className="admin-view-title" style={{ fontSize: '20px' }}>შედეგები</h3>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                    <th>მოსწავლე</th>
                    <th style={{ textAlign: "center" }}>საშუალო ქულა</th>
                    <th style={{ textAlign: "center" }}>სწრებადობა</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => {
                    const stats = calculateStudentStats(student._id);
                    return (
                      <tr key={student._id}>
                        <td style={{ textAlign: 'center', opacity: 0.5 }}>{index + 1}</td>
                        <td style={{ fontWeight: 600 }}>{student.name} {student.surname}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`status-badge ${stats.averageScore >= 9 ? 'high' : stats.averageScore >= 7 ? 'medium' : 'low'}`}>
                            {stats.averageScore.toFixed(1)}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`status-badge ${stats.attendancePercentage >= 90 ? 'high' : stats.attendancePercentage >= 70 ? 'medium' : 'low'}`}>
                            {stats.attendancePercentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="admin-card" style={{ padding: '40px' }}>
                <div className="admin-card-label" style={{ opacity: 0.5 }}>
                  არცერთი მოსწავლე არ აკმაყოფილებს არჩეულ კრიტერიუმებს
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </TeacherLayout>
    );
  };

  const tabList = [
    { key: "teaching", label: "სასწავლო კლასები", badge: false },
    { key: "homeroom", label: "სადამრიგებლო კლასები", badge: false },
    { key: "calendar", label: "ჩემი განრიგი", badge: false },
    { key: "notices", label: "📢 განცხადებები", badge: hasUnreadTeacherNotices },
    { key: "messages", label: "💬 ჩატი", badge: hasUnreadTeacherMessages },
  ];

  // Main page content
  const mainContent = (
    <TeacherLayout>
      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Tab bar */}
        <div className="admin-tabs" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {tabList.map((tab) => (
            <button
              key={tab.key}
              className={`admin-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key as any)}
              style={{ position: 'relative' }}
            >
              {tab.label}
              {tab.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#ef4444',
                    borderRadius: '50%',
                    boxShadow: '0 0 8px #ef4444'
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="admin-view-container" style={{ width: '100%', padding: 0 }}>
          {activeTab === "calendar" &&
            (scheduleLoading ? (
              <div className="admin-form-container" style={{ textAlign: 'center' }}>
                <div className="admin-form-title">განრიგი იტვირთება...</div>
              </div>
            ) : (
              <TeacherCalendarTable schedule={teacherSchedule} />
            ))}
          {activeTab === "homeroom" && (
            <div className="admin-view-container">
              <h2 className="admin-view-title" style={{ marginBottom: '30px', textAlign: 'center' }}>სადამრიგებლო კლასები</h2>
              <div className="admin-grid">
                {tutorClasses.length === 0 && (
                  <div className="admin-card">
                    <div className="admin-card-label">არ გაქვთ სადამრიგებლო კლასი</div>
                  </div>
                )}
                {tutorClasses.map((cls, idx) => (
                  <div
                    key={cls._id}
                    className="admin-card"
                    onClick={() => navigate(`/teacher/class/${cls._id}`)}
                  >
                    <div className="admin-card-icon-wrapper">
                      <GiTeacherIcon size={32} />
                    </div>
                    <div className="admin-card-label">
                      {cls.classname}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === "teaching" && (
            <div className="admin-view-container">
              <h2 className="admin-view-title" style={{ marginBottom: '30px', textAlign: 'center' }}>კლასები, სადაც ასწავლით</h2>
              <div className="admin-grid">
                {teachesClasses.length === 0 && (
                  <div className="admin-card">
                    <div className="admin-card-label">არ ასწავლით არცერთ კლასში</div>
                  </div>
                )}
                {teachesClasses.map((cls, idx) => (
                  <div
                    key={cls._id}
                    className="admin-card"
                    onClick={() => navigate(`/teacher/teach/${cls._id}`)}
                  >
                    <div className="admin-card-icon-wrapper">
                      <FaChalkboardTeacherIcon size={32} />
                    </div>
                    <div className="admin-card-label">
                      {cls.classname}
                      {cls.teacherSubjects && cls.teacherSubjects.length > 0 && (
                        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px', textTransform: 'none' }}>
                          {cls.teacherSubjects.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === "notices" && (
            <div style={{ width: '100%', marginTop: '20px' }}>
              <NoticeBoard currentUser={{ id: teacherIdForChat, name: teacherNameForChat, role: 'teacher' }} />
            </div>
          )}
          {activeTab === "messages" && (
            <div style={{ width: '100%', marginTop: '20px' }}>
              <ChatModule currentUser={{ id: teacherIdForChat, name: teacherNameForChat, role: 'teacher' }} />
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );

  // Tutor class details page
  const TutorClassDetailsPage: React.FC = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [tutorClass, setTutorClass] = useState<any | null>(null);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);

    useEffect(() => {
      const fetchData = async () => {
        // Fetch class by ID
        const classRes = await fetch("/api/classes");
        if (!classRes.ok) return;
        const allClasses = await classRes.json();
        const foundClass = allClasses.find((cls: any) => cls._id === id);
        setTutorClass(foundClass);
        // Fetch all subjects
        const subjRes = await fetch("/api/subjects");
        if (subjRes.ok) setSubjects(await subjRes.json());
        // Fetch all teachers
        const tRes = await fetch("/api/teacher/all");
        if (tRes.ok) setTeachers(await tRes.json());
        setLoading(false);
      };
      fetchData();
    }, [id]);

    if (loading)
      return (
        <div style={{ color: "white", textAlign: "center", marginTop: "40px" }}>
          იტვირთება...
        </div>
      );
    if (!tutorClass)
      return (
        <div style={{ color: "white", textAlign: "center", marginTop: "40px" }}>
          კლასი ვერ მოიძებნა
        </div>
      );
    return (
      <TeacherLayout>
        <div className="admin-view-container" style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
          <button
            onClick={() => navigate("/teacher")}
            className="admin-back-btn"
            style={{ marginBottom: '24px' }}
          >
            უკან დაბრუნება
          </button>
          <TutorClassDetails
            allSubjects={subjects}
            allTeachers={teachers}
            tutorClass={tutorClass}
            selectedColor={selectedColor}
          />
        </div>
      </TeacherLayout>
    );
  };

  return (
    <Routes>
      <Route
        path="/*"
        element={
          <Routes>
            <Route path="/" element={mainContent} />
            <Route path="class/:id" element={<TutorClassDetailsPage />} />
            <Route path="teach/:id" element={<TeachClassOptionsPage />} />
            <Route path="teach/:id/grade" element={<GradeEntryPage />} />
            <Route
              path="teach/:id/history"
              element={<GradeHistoryPage allSubjects={allSubjects} />}
            />
            <Route path="teach/:id/statistics" element={<StatisticsPage />} />
            <Route path="teach/:id/homework" element={<TeacherHomeworkPage />} />
          </Routes>
        }
      />
    </Routes>
  );
};

export default Teacher;
