"use client";
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaChalkboardTeacher, FaHistory, FaBookOpen, FaBullhorn, FaComments, FaSignOutAlt, FaFileAlt, FaCheck, FaTimes, FaDownload, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { GiTeacher } from "react-icons/gi";
import { MdAdd, MdOutlineWarningAmber, MdStarBorder } from "react-icons/md";
import { IoStatsChartSharp } from "react-icons/io5";
import { IconType } from "react-icons";
import { useColor } from "./../../components/ColorContext";
import ColorPalette from "./../../components/ColorPalette";
import { useNavigate, Routes, Route, useParams } from "react-router-dom"; // For navigation after logout and useParams
import InfoModal from "../../components/InfoModal";
import NoticeBoard from "../../components/NoticeBoard";
import ChatModule from "../../components/ChatModule";
import AtRiskList from "../../components/admin/AtRiskList";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import "../admin/Admin.css";

const FaChalkboardTeacherIcon = FaChalkboardTeacher as React.ComponentType<{
  size?: number | string;
}>;
const GiTeacherIcon = GiTeacher as React.ComponentType<{
  size?: number | string;
  style?: React.CSSProperties;
  className?: string;
}>;
const FaSignOutAltIcon = FaSignOutAlt as React.ComponentType<{
  size?: number | string;
  style?: React.CSSProperties;
  className?: string;
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

function getGeorgianDate() {
  const days = ['კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი'];
  const months = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
}

function getGreeting() {
  const hours = new Date().getHours();
  if (hours < 12) return 'დილა მშვიდობისა';
  if (hours < 18) return 'დღე მშვიდობისა';
  return 'საღამო მშვიდობისა';
}

const TeacherApplicationsPanel: React.FC<{ teacherId: string }> = ({ teacherId }) => {
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [appSubTab, setAppSubTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('შვებულება');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { selectedColor } = useColor();

  // Query incoming homeroom applications
  const { data: apps, refetch: refetchIncoming, isLoading: incomingLoading } = useQuery<any[]>({
    queryKey: ['teacher-applications-incoming', teacherId],
    queryFn: async () => {
      const res = await fetch(`/api/applications?user_id=${teacherId}&role=teacher`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!teacherId
  });

  // Query outgoing teacher's own applications
  const { data: ownApps, refetch: refetchOutgoing, isLoading: outgoingLoading } = useQuery<any[]>({
    queryKey: ['teacher-applications-outgoing', teacherId],
    queryFn: async () => {
      const res = await fetch(`/api/applications?user_id=${teacherId}&role=teacher&own=true`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!teacherId
  });

  const handleResolve = async (appId: string, status: 'დადასტურებული' | 'უარყოფილი') => {
    setResolvingId(appId);
    try {
      const res = await fetch('/api/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          status,
          comment: commentText[appId] || "",
          resolvedBy: teacherId
        })
      });
      if (res.ok) {
        refetchIncoming();
      } else {
        alert("შეცდომა განაცხადის განახლებისას");
      }
    } catch (err) {
      console.error(err);
      alert("კავშირი ვერ დამყარდა");
    } finally {
      setResolvingId(null);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      alert("გთხოვთ შეავსოთ ყველა ველი");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          submittedByRole: 'teacher',
          type,
          title,
          content
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setTitle('');
        setContent('');
        refetchOutgoing();
        alert('განაცხადი წარმატებით გაიგზავნა მდივანთან!');
      } else {
        alert('განაცხადის გაგზავნა ვერ მოხერხდა');
      }
    } catch {
      alert('კავშირის შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  const downloadAppDoc = (app: any) => {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "ოფიციალური განცხადება", bold: true, size: 28, font: "DejaVu Sans" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "ვის: ", bold: true, font: "DejaVu Sans" }),
              new TextRun({ text: app.submittedByRole === 'teacher' ? "სკოლის მდივანს / ადმინისტრაციას\n" : "სკოლის დირექციას / სადამრიგებლო კლასის ხელმძღვანელს\n", font: "DejaVu Sans" }),
              new TextRun({ text: "ვისგან: ", bold: true, font: "DejaVu Sans" }),
              new TextRun({ text: app.submittedByRole === 'teacher' ? `მასწავლებელ ${app.teacherName}-სგან\n` : `მოსწავლე ${app.studentName}-ის მშობლისგან\n`, font: "DejaVu Sans" }),
              new TextRun({ text: "თარიღი: ", bold: true, font: "DejaVu Sans" }),
              new TextRun({ text: `${new Date(app.submittedAt).toLocaleDateString('ka-GE')} ${new Date(app.submittedAt).toLocaleTimeString('ka-GE')}\n\n`, font: "DejaVu Sans" }),
              new TextRun({ text: "განაცხადის ტიპი: ", bold: true, font: "DejaVu Sans" }),
              new TextRun({ text: `${app.type}\n`, font: "DejaVu Sans" }),
              new TextRun({ text: "სათაური: ", bold: true, font: "DejaVu Sans" }),
              new TextRun({ text: `${app.title}\n\n`, bold: true, font: "DejaVu Sans" }),
              new TextRun({ text: "განცხადების შინაარსი:\n", bold: true, font: "DejaVu Sans" }),
              new TextRun({ text: `${app.content}\n\n`, font: "DejaVu Sans" }),
            ],
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `საქმისწარმოების სტატუსი: `, bold: true, font: "DejaVu Sans" }),
              new TextRun({ text: `${app.status}\n`, font: "DejaVu Sans" }),
              app.resolvedBy ? new TextRun({ text: `რეზოლუცია: ${app.resolvedBy}\n`, font: "DejaVu Sans" }) : new TextRun({ text: "", font: "DejaVu Sans" }),
              app.comment ? new TextRun({ text: `განმხილველის კომენტარი: ${app.comment}\n`, font: "DejaVu Sans" }) : new TextRun({ text: "", font: "DejaVu Sans" }),
            ],
            spacing: { after: 600 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "ხელმოწერა: ________________________", font: "DejaVu Sans" }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ganacxadeba_${app.type.replace(/\\s+/g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const isLoading = incomingLoading || outgoingLoading;

  if (isLoading) return <div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>განაცხადები იტვირთება...</div>;

  return (
    <div className="admin-list-container" style={{ padding: '24px', background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
      
      {/* Sub-tabs toggles */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '24px' }}>
        <button 
          onClick={() => setAppSubTab('incoming')} 
          style={{ background: 'none', border: 'none', color: appSubTab === 'incoming' ? selectedColor : '#94a3b8', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
        >
          შემოსული განაცხადები (სადამრიგებლო)
        </button>
        <button 
          onClick={() => setAppSubTab('outgoing')} 
          style={{ background: 'none', border: 'none', color: appSubTab === 'outgoing' ? selectedColor : '#94a3b8', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
        >
          ჩემი განაცხადები (მდივანთან)
        </button>
      </div>

      {appSubTab === 'incoming' ? (
        <>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>მოსწავლეთა განაცხადები (საქმის წარმოება)</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>თქვენი სადამრიგებლო კლასის მოსწავლეების მშობლებისგან შემოსული განცხადებები</p>

          {!apps || apps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>განაცხადები არ არის შემოსული.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '13px' }}>
                    <th style={{ padding: '12px' }}>თარიღი</th>
                    <th style={{ padding: '12px' }}>მოსწავლე / კლასი</th>
                    <th style={{ padding: '12px' }}>ტიპი</th>
                    <th style={{ padding: '12px' }}>განცხადების შინაარსი</th>
                    <th style={{ padding: '12px' }}>სტატუსი</th>
                    <th style={{ padding: '12px' }}>მოქმედება / რეზოლუცია</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app) => (
                    <tr key={app._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                      <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                        {new Date(app.submittedAt).toLocaleDateString('ka-GE')}
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                          {new Date(app.submittedAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 'bold' }}>{app.studentName}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>კლასი: {app.classname}</div>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{app.type}</td>
                      <td style={{ padding: '12px', maxWidth: '300px' }}>
                        <div style={{ fontWeight: 'bold' }}>{app.title}</div>
                        <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{app.content}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          backgroundColor: app.status === 'დადასტურებული' ? 'rgba(34,197,94,0.15)' : app.status === 'უარყოფილი' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                          color: app.status === 'დადასტურებული' ? '#22c55e' : app.status === 'უარყოფილი' ? '#ef4444' : '#f59e0b',
                        }}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {app.status === 'განხილვაში' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '220px' }}>
                            <input
                              type="text"
                              placeholder="კომენტარი (არასავალდებულო)..."
                              value={commentText[app._id] || ""}
                              onChange={(e) => setCommentText({ ...commentText, [app._id]: e.target.value })}
                              style={{ padding: '6px 10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', fontSize: '12px', outline: 'none' }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleResolve(app._id, 'დადასტურებული')}
                                disabled={resolvingId === app._id}
                                style={{ flex: 1, padding: '6px 10px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                დადასტურება
                              </button>
                              <button
                                onClick={() => handleResolve(app._id, 'უარყოფილი')}
                                disabled={resolvingId === app._id}
                                style={{ flex: 1, padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                უარყოფა
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>განხილულია: <strong style={{ color: '#e2e8f0' }}>{app.resolvedBy}</strong></div>
                            {app.comment && <div style={{ fontSize: '12px', color: '#cbd5e1', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px', marginTop: '4px' }}>{app.comment}</div>}
                            <button
                              onClick={() => downloadAppDoc(app)}
                              style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}
                            >
                              <FaDownload size={10} /> ჩამოტვირთვა (.docx)
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>ჩემი განაცხადები</h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', margin: 0 }}>მდივანთან გაგზავნილი თქვენი ოფიციალური მოთხოვნები</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              style={{ padding: '8px 16px', background: selectedColor, border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ახალი განაცხადის გაგზავნა
            </button>
          </div>

          {!ownApps || ownApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>თქვენ ჯერ არ გაგიგზავნიათ განაცხადები.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '13px' }}>
                    <th style={{ padding: '12px' }}>თარიღი</th>
                    <th style={{ padding: '12px' }}>ტიპი</th>
                    <th style={{ padding: '12px' }}>განცხადების შინაარსი</th>
                    <th style={{ padding: '12px' }}>სტატუსი</th>
                    <th style={{ padding: '12px' }}>მოქმედება / რეზოლუცია</th>
                  </tr>
                </thead>
                <tbody>
                  {ownApps.map((app) => (
                    <tr key={app._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                      <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                        {new Date(app.submittedAt).toLocaleDateString('ka-GE')}
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                          {new Date(app.submittedAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{app.type}</td>
                      <td style={{ padding: '12px', maxWidth: '300px' }}>
                        <div style={{ fontWeight: 'bold' }}>{app.title}</div>
                        <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{app.content}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          backgroundColor: app.status === 'დადასტურებული' ? 'rgba(34,197,94,0.15)' : app.status === 'უარყოფილი' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                          color: app.status === 'დადასტურებული' ? '#22c55e' : app.status === 'უარყოფილი' ? '#ef4444' : '#f59e0b',
                        }}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {app.resolvedBy ? (
                          <div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>განხილულია: <strong style={{ color: '#e2e8f0' }}>{app.resolvedBy}</strong></div>
                            {app.comment && <div style={{ fontSize: '12px', color: '#cbd5e1', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px', marginTop: '4px' }}>{app.comment}</div>}
                            <button
                              onClick={() => downloadAppDoc(app)}
                              style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}
                            >
                              <FaDownload size={10} /> ჩამოტვირთვა (.docx)
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>მიმდინარეობს განხილვა (მდივნის მიერ)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* New application modal */}
          {isModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px' }}>
              <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', color: 'white' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 16px 0' }}>ახალი განაცხადის გაგზავნა მდივანთან</h3>
                <form onSubmit={handleCreateApp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>განაცხადის ტიპი</label>
                    <select value={type} onChange={e => setType(e.target.value)} style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }}>
                      <option value="შვებულება">შვებულება</option>
                      <option value="მატერიალური მოთხოვნა">მატერიალური მოთხოვნა (კლასისთვის)</option>
                      <option value="კლასგარეშე აქტივობა">ნებართვა კლასგარეშე აქტივობაზე</option>
                      <option value="სხვა">სხვა სახის მოთხოვნა</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>სათაური</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="სათაური..." style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>განცხადების შინაარსი</label>
                    <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="დაწვრილებითი აღწერა..." rows={4} style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none', resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>გაუქმება</button>
                    <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: selectedColor, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{loading ? 'იგზავნება...' : 'გაგზავნა'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};const TeacherPedCouncilMeetings: React.FC = () => {
  const { data: meetings, isLoading } = useQuery<any[]>({
    queryKey: ['ped-meetings-list'],
    queryFn: async () => {
      const res = await fetch('/api/ped-council');
      if (!res.ok) throw new Error();
      return res.json();
    }
  });

  if (isLoading) return <div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>პედსაბჭოს სხდომები იტვირთება...</div>;

  return (
    <div className="admin-list-container" style={{ padding: '24px', background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>პედსაბჭოს სხდომები</h2>
      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>პედსაბჭოს ხელმძღვანელის მიერ ჩანიშნული შეხვედრები</p>

      {!meetings || meetings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>სხდომები ჩანიშნული არ არის.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '13px' }}>
                <th style={{ padding: '12px' }}>თარიღი / დრო</th>
                <th style={{ padding: '12px' }}>თემა</th>
                <th style={{ padding: '12px' }}>დღის წესრიგი / შინაარსი</th>
                <th style={{ padding: '12px' }}>ჩამნიშნავი</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((meeting) => (
                <tr key={meeting._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    {meeting.date}
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {meeting.time}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#cbd5e1' }}>{meeting.title}</td>
                  <td style={{ padding: '12px', whiteSpace: 'pre-wrap' }}>{meeting.agenda || '—'}</td>
                  <td style={{ padding: '12px', color: '#94a3b8' }}>{meeting.scheduledByName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  const [teacherId, setTeacherId] = useState<string>("");
  const [teacherFullName, setTeacherFullName] = useState<string>("მასწავლებელი");
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
    "calendar" | "homeroom" | "teaching" | "notices" | "chat" | "password" | "applications" | "ped_council_meetings"
  >("teaching");

  // Teacher password change form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  const ClassSwitcher: React.FC<{
    currentClassId: string;
    routeType: "teach" | "class";
    pageType: "options" | "grade" | "history";
  }> = ({ currentClassId, routeType, pageType }) => {
    const classesList = routeType === "class" ? tutorClasses : teachesClasses;
    if (!classesList || classesList.length === 0) return null;
    if (classesList.length === 1) {
      return (
        <h2 className="admin-view-title" style={{ margin: 0 }}>
          {classesList[0].classname}
        </h2>
      );
    }

    const currentIndex = classesList.findIndex((cls: any) => cls._id === currentClassId);
    if (currentIndex === -1) {
      const classObj = classesList[0];
      return (
        <h2 className="admin-view-title" style={{ margin: 0 }}>
          {classObj ? classObj.classname : ""}
        </h2>
      );
    }

    const prevIndex = (currentIndex - 1 + classesList.length) % classesList.length;
    const nextIndex = (currentIndex + 1) % classesList.length;

    const prevClass = classesList[prevIndex];
    const nextClass = classesList[nextIndex];

    const handleNavigate = (targetId: string) => {
      if (pageType === "options") {
        navigate(`/teacher/${routeType}/${targetId}`);
      } else if (pageType === "grade") {
        navigate(`/teacher/teach/${targetId}/grade`);
      } else if (pageType === "history") {
        navigate(`/teacher/${routeType}/${targetId}/history`);
      }
    };

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '6px 12px',
        borderRadius: '12px',
        width: 'fit-content',
      }}>
        <button
          onClick={() => handleNavigate(prevClass._id)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = selectedColor}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
          title={`წინა კლასი: ${prevClass.classname}`}
        >
          <FaChevronLeft size={12} />
        </button>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            value={currentClassId}
            onChange={(e) => handleNavigate(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontWeight: 800,
              fontSize: '15px',
              padding: '4px 20px 4px 4px',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'white\' height=\'20\' viewBox=\'0 0 24 24\' width=\'20\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right center',
              textAlign: 'center'
            }}
          >
            {classesList.map((cls: any) => (
              <option key={cls._id} value={cls._id} style={{ background: '#1e293b', color: 'white' }}>
                {cls.classname}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => handleNavigate(nextClass._id)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = selectedColor}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
          title={`შემდეგი კლასი: ${nextClass.classname}`}
        >
          <FaChevronRight size={12} />
        </button>
      </div>
    );
  };

  // Fetch all messages for unread badge evaluation
  const { data: allMessages } = useQuery({
    queryKey: ['teacher-messages-unread', teacherId],
    queryFn: async () => {
      const response = await fetch(`/api/messages?user_id=${teacherId}`);
      if (!response.ok) throw new Error();
      return response.json();
    },
    enabled: !!teacherId,
    refetchInterval: 5000 // Poll messages
  });

  // Fetch announcements for unread badge evaluation
  const { data: announcements } = useQuery({
    queryKey: ['announcements-unread-teacher'],
    queryFn: async () => {
      const response = await fetch('/api/announcements');
      if (!response.ok) throw new Error();
      return response.json();
    },
    refetchInterval: 8000
  });

  const hasUnreadMessages = React.useMemo(() => {
    if (!allMessages || !Array.isArray(allMessages)) return false;
    const incomingCount = allMessages.filter((m: any) => m.sender_id !== teacherId).length;
    const seenCount = typeof window !== 'undefined' ? parseInt(localStorage.getItem('seen_incoming_messages_count_teacher') || '0', 10) : 0;
    return incomingCount > seenCount;
  }, [allMessages, teacherId]);

  const hasUnreadNotices = React.useMemo(() => {
    if (!announcements || !Array.isArray(announcements)) return false;
    const totalNotices = announcements.length;
    const seenNotices = typeof window !== 'undefined' ? parseInt(localStorage.getItem('seen_notices_count_teacher') || '0', 10) : 0;
    return totalNotices > seenNotices;
  }, [announcements]);

  // Clear messages badge when user clicks on Chat tab
  useEffect(() => {
    if (activeTab === 'chat' && allMessages && Array.isArray(allMessages)) {
      const incomingCount = allMessages.filter((m: any) => m.sender_id !== teacherId).length;
      localStorage.setItem('seen_incoming_messages_count_teacher', incomingCount.toString());
    }
  }, [activeTab, allMessages, teacherId]);

  // Clear notices badge when user clicks on notices tab
  useEffect(() => {
    if (activeTab === 'notices' && announcements && Array.isArray(announcements)) {
      localStorage.setItem('seen_notices_count_teacher', announcements.length.toString());
    }
  }, [activeTab, announcements]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPassError("ყველა ველი აუცილებელია");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("ახალი პაროლები არ ემთხვევა");
      return;
    }
    setPassLoading(true);
    try {
      const loginData = JSON.parse(localStorage.getItem("login") || "{}");
      const user_ID = loginData.user_ID;
      const res = await fetch("/api/teacher/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: user_ID, oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPassSuccess("პაროლი წარმატებით შეიცვალა!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPassError(data.message || "შეცდომა პაროლის შეცვლისას");
      }
    } catch {
      setPassError("სერვერთან კავშირი ვერ დამყარდა");
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
      setTeacherId(teacher.user_ID);
      setTeacherFullName(`${teacher.name} ${teacher.surname}`);
      // Fetch all subjects for subject names
      const subjRes = await fetch("/api/subjects");
      if (!subjRes.ok) return;
      const subjects = await subjRes.json();
      setAllSubjects(subjects);
      // Tutor classes
      const tutor = allClasses.filter((cls: any) => cls.tutor_id === teacherId);
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



  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
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
  }) => (
    <div className="schedule-grid-container">
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

  // Teach class options page
  const TeachClassOptionsPage: React.FC = () => {
    const { id } = useParams();
    const classObj = teachesClasses.find((cls: any) => cls._id === id);
    const handleCardClick = (label: string) => {
      if (label === "ნიშნის შეტანა") {
        navigate(`/teacher/teach/${id}/grade`);
      } else if (label === "ისტორია") {
        navigate(`/teacher/teach/${id}/history`);
      }
    };
    return (
      <div className="admin-view-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button
          onClick={() => navigate("/teacher")}
          className="admin-back-btn"
        >
          უკან დაბრუნება
        </button>
        <div className="admin-view-header" style={{ justifyContent: 'center', marginTop: '20px' }}>
          <ClassSwitcher currentClassId={id!} routeType="teach" pageType="options" />
        </div>
        <div className="admin-grid" style={{ marginTop: '40px' }}>
          {[
            { label: "ნიშნის შეტანა", icon: MdAdd },
            { label: "ისტორია", icon: FaHistory },
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
    );
  };

  // Grade entry page
  const GradeEntryPage: React.FC = () => {
    const { id } = useParams();
    const [students, setStudents] = useState<any[]>([]);
    const [gradeType, setGradeType] = useState("საკლასო");
    const [grades, setGrades] = useState<{
      [studentId: string]: { attendance: boolean; point: string };
    }>({});
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
          [studentId: string]: { attendance: boolean; point: string };
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

    // Memoize the student list to prevent unnecessary re-renders
    const memoizedStudents = React.useMemo(() => students, [students]);
    const handleSubmit = async () => {
      if (!selectedSubject) {
        alert("გთხოვთ აირჩიოთ საგანი");
        return;
      }
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
        const pointValue =
          grade.point === "" || grade.point === "ჩთ"
            ? -1
            : parseInt(grade.point, 10);
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
          comment: "",
          checked: grades[student._id]?.attendance ?? true,
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
      <div className="admin-view-container" style={{ width: '100%', margin: '0 auto' }}>
        <button
          onClick={handleBack}
          className="admin-back-btn"
        >
          უკან დაბრუნება
        </button>

        <div className="admin-form-container" style={{ maxWidth: '100%', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <h2 className="admin-form-title" style={{ margin: 0 }}>ნიშნის შეტანა</h2>
            <ClassSwitcher currentClassId={id!} routeType="teach" pageType="grade" />
          </div>

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

            <div className="grade-entry-header">
              <div>მოსწავლე</div>
              <div style={{ textAlign: 'center' }}>დასწრება</div>
              <div style={{ textAlign: 'center' }}>ქულა</div>
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

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
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
                    </div>

                    <select
                      value={grades[student._id]?.point ?? ''}
                      onChange={(e) => handlePointChange(student._id, e.target.value)}
                      disabled={!checked}
                      className="admin-select"
                      style={{ padding: '8px 12px', fontSize: '14px', opacity: checked ? 1 : 0.5 }}
                    >
                      <option value="">ნიშნის გარეშე</option>
                      {Array.from({ length: 11 }, (_, n) => n).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                      <option value="ჩთ">ჩთ</option>
                    </select>
                  </div>
                );
              })}
            </div>
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
    );
  };

  // Grade history page
  const GradeHistoryPage: React.FC<{ allSubjects: any[] }> = ({
    allSubjects,
  }) => {
    const { id } = useParams();
    const classId = id!;
    console.log("GradeHistoryPage - classId from params:", classId);
    const [grades, setGrades] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);
    const [allTeachers, setAllTeachers] = useState<any[]>([]);
    const { selectedColor } = useColor();
    useEffect(() => {
      const fetchData = async () => {
        try {
          // Get current teacher ID first
          const loginData = JSON.parse(localStorage.getItem("login") || "{}");
          const user_ID = loginData.user_ID;
          const teachersRes = await fetch("/api/teacher/all");
          if (!teachersRes.ok) {
            setLoading(false);
            return;
          }
          const teachersData = await teachersRes.json();
          setAllTeachers(teachersData);
          const teacher = teachersData.find((t: any) => t.user_ID === user_ID);

          if (teacher) {
            // Fetch grades only for this class
            const res = await fetch(`/api/grades?class_id=${classId}`);
            if (res.ok) {
              const allGrades = await res.json();
              setGrades(Array.isArray(allGrades) ? allGrades : []);
            } else {
              setGrades([]);
            }

            // Get teacher's subjects for this class
            const classesRes = await fetch("/api/classes");
            if (classesRes.ok) {
              const allClasses = await classesRes.json();
              const classObj = allClasses.find((c: any) => c._id === classId);
              if (classObj && Array.isArray(classObj.subjects)) {
                // If they are the tutor, show all subjects. Otherwise, show only their own subjects.
                const isTutor = classObj.tutor_id === teacher._id;
                const teacherSubjs = isTutor
                  ? classObj.subjects
                  : classObj.subjects.filter(
                      (subj: any) => subj.teacher_id === teacher._id,
                    );
                setTeacherSubjects(teacherSubjs);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching grades:", error);
          setGrades([]);
        }

        // Fetch only students of this class (by grade + parallel from classname)
        const classObj =
          teachesClasses.find((cls: any) => cls._id === classId) ||
          tutorClasses.find((cls: any) => cls._id === classId);
        const match = classObj?.classname.match(/^([0-9]+)([ა-ჰ])$/);
        const studentsUrl = match
          ? `/api/student/grade/${match[1]}?parallel=${encodeURIComponent(match[2])}`
          : "/api/student/all";
        const studentsRes = await fetch(studentsUrl);
        const studentsData = studentsRes.ok ? await studentsRes.json() : [];
        setStudents(
          match
            ? studentsData
            : studentsData.filter(
              (s: any) => s.classInfo && s.classInfo._id === classId,
            ),
        );

        setLoading(false);
      };
      fetchData();
    }, [classId]);

    // Auto-select first subject when teacherSubjects are loaded
    useEffect(() => {
      if (teacherSubjects.length > 0 && !selectedSubject) {
        setSelectedSubject(teacherSubjects[0].subject_id);
      }
    }, [teacherSubjects, selectedSubject]);

    if (loading)
      return (
        <div style={{ color: "white", textAlign: "center", marginTop: "40px" }}>
          იტვირთება...
        </div>
      );
    if (students.length === 0)
      return (
        <div style={{ color: "white", textAlign: "center", marginTop: "40px" }}>
          კლასში მოსწავლეები ვერ მოიძებნა
        </div>
      );

    // Get current teacher ID
    const loginData = JSON.parse(localStorage.getItem("login") || "{}");
    const user_ID = loginData.user_ID;
    const currentTeacher = allTeachers?.find((t: any) => t.user_ID === user_ID);
    const currentTeacherId = currentTeacher?._id;

    // TEMPORARY: Show all grades without any filtering to debug
    // Filter grades by selected subject
    const filteredGrades = selectedSubject
      ? grades.filter((g) => g.subject_id === selectedSubject)
      : grades;

    // Get unique dates from filtered grades only - exactly like admin
    const allDatesSet = new Set<string>();
    filteredGrades.forEach((g) => allDatesSet.add(g.date));
    const allDatesArr = Array.from(allDatesSet).sort();

    // Build student-date grade mapping for filtered grades - exactly like admin
    const studentDateGrades: {
      [studentId: string]: { [date: string]: any[] };
    } = {};
    filteredGrades.forEach((g) => {
      if (!studentDateGrades[g.student_id])
        studentDateGrades[g.student_id] = {};
      if (!studentDateGrades[g.student_id][g.date])
        studentDateGrades[g.student_id][g.date] = [];
      studentDateGrades[g.student_id][g.date].push(g);
    });

    // Helper function to format date - exactly like admin
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;
    };

    // Helper function to get grade display - show multiple grades per day
    const getGradeDisplay = (gradeList: any[]) => {
      if (gradeList.length === 0) return null;

      // Sort grades by pointType (highest first) and then by point value
      const sortedGrades = gradeList.sort((a, b) => {
        if (a.pointType !== b.pointType) {
          return b.pointType - a.pointType; // Higher pointType first
        }
        return b.point - a.point; // Higher point first
      });

      // Display up to 3 grades, separated by comma
      const displayGrades = sortedGrades.slice(0, 3).map((grade) => {
        if (grade.point === -1) {
          return grade.checked ? "✓" : "✗";
        } else if (grade.point === -2) {
          return "X";
        } else {
          return grade.point.toString();
        }
      });

      return displayGrades.join(", ");
    };

    // Helper function to get grade color - use color of most important grade
    const getGradeColor = (gradeList: any[]) => {
      if (gradeList.length === 0) return "#e0e0e0";

      // Get the highest pointType grade (most important)
      const highestGrade = gradeList.reduce((prev, current) =>
        current.pointType > prev.pointType ? current : prev,
      );

      if (highestGrade.point === -1) {
        return highestGrade.checked ? "#4caf50" : "#f44336";
      } else if (highestGrade.point === -2) {
        return "#9c27b0"; // Purple for X grades
      } else {
        const point = highestGrade.point;
        if (point >= 9) return "#4caf50"; // Green for high grades
        if (point >= 7) return "#ff9800"; // Orange for medium grades
        return "#f44336"; // Red for low grades
      }
    };

    // Simple debug info
    console.log("Grades count:", grades.length);
    console.log("Students count:", students.length);
    console.log("Unique dates count:", allDatesArr.length);
    if (grades.length > 0) {
      console.log("Sample grade:", grades[0]);
      console.log(
        "First 3 grades dates:",
        grades.slice(0, 3).map((g) => g.date),
      );
    }

    return (
      <div className="admin-view-container" style={{ width: '100%', margin: '0 auto' }}>
        <button
          onClick={() => navigate(-1)}
          className="admin-back-btn"
        >
          უკან დაბრუნება
        </button>

        <div className="admin-view-header" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <h2 className="admin-view-title" style={{ margin: 0 }}>ნიშნების ისტორია</h2>
            <ClassSwitcher currentClassId={classId} routeType={window.location.pathname.includes('/class/') ? "class" : "teach"} pageType="history" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <label className="admin-label" style={{ margin: 0 }}>საგანი:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="admin-select"
              style={{ width: '100%', maxWidth: '250px' }}
            >
              {teacherSubjects.map((subj) => {
                const subjObj = allSubjects.find(
                  (s: any) => s._id === subj.subject_id,
                );
                return (
                  <option key={subj.subject_id} value={subj.subject_id}>
                    {subjObj ? subjObj.name : subj.subject_id}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {allDatesArr.length === 0 ? (
          <div className="admin-card" style={{ padding: '60px' }}>
            <div className="admin-card-icon-wrapper" style={{ marginBottom: '20px' }}>
              <FaHistory size={48} />
            </div>
            <div className="admin-card-label">
              {selectedSubject
                ? `ამ კლასში ${allSubjects.find((s) => s._id === selectedSubject)?.name || "საგნის"} ნიშნები ვერ მოიძებნა`
                : "ამ კლასში ნიშნები ვერ მოიძებნა"}
            </div>
          </div>
        ) : (
          <div className="admin-list-container">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>სახელი</th>
                    <th>გვარი</th>
                    {allDatesArr.map((date) => (
                      <th
                        key={date}
                        style={{ textAlign: 'center', minWidth: '80px' }}
                      >
                        {formatDate(date)}
                      </th>
                    ))}
                    <th style={{ textAlign: 'center' }}>საშუალო</th>
                    <th style={{ textAlign: 'center' }}>დასწრება (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((stu) => {
                    const gradesArr = grades.filter(
                      (g) => g.student_id === stu._id,
                    );
                    const numericPoints = gradesArr.filter(
                      (g) => typeof g.point === "number" && g.point !== -1,
                    );
                    const avg =
                      numericPoints.length > 0
                        ? (
                          numericPoints.reduce((sum, g) => sum + g.point, 0) /
                          numericPoints.length
                        ).toFixed(2)
                        : "";
                    const attended = gradesArr.filter(
                      (g) => g.checked === true,
                    ).length;
                    const attendance =
                      gradesArr.length > 0
                        ? ((attended / gradesArr.length) * 100).toFixed(0)
                        : "";

                    const avgNum = Number(avg);
                    const attNum = Number(attendance);

                    return (
                      <tr
                        key={stu._id}
                        style={
                          avgNum < 5 || attNum < 70
                            ? { backgroundColor: 'rgba(244, 67, 54, 0.05)' }
                            : {}
                        }
                      >
                        <td style={{ fontWeight: 600 }}>{stu.name}</td>
                        <td style={{ fontWeight: 600 }}>{stu.surname}</td>
                        {allDatesArr.map((date) => {
                          const gradeList =
                            studentDateGrades[stu._id]?.[date] || [];
                          const gradeDisplay = getGradeDisplay(gradeList);
                          const gradeColor = getGradeColor(gradeList);

                          let cellBg = undefined;
                          let cellColor = gradeColor;
                          const hasSummative = gradeList.some((g: any) => g.pointType === 3);
                          const hasHomework = gradeList.some((g: any) => g.pointType === 1);
                          if (hasSummative) {
                            cellBg = "rgba(239, 68, 68, 0.15)"; // Soft red
                            cellColor = "#b91c1c"; // Dark red text
                          } else if (hasHomework) {
                            cellBg = "rgba(245, 158, 11, 0.15)"; // Soft yellow
                            cellColor = "#b45309"; // Dark yellow/brown text
                          }

                          return (
                            <td
                              key={date}
                              style={{
                                textAlign: "center",
                                fontWeight: "800",
                                backgroundColor: cellBg,
                                color: cellColor,
                              }}
                            >
                              {gradeDisplay || "-"}
                            </td>
                          );
                        })}
                        <td style={{ textAlign: "center" }}>
                          <span className={`status-badge ${avgNum >= 9 ? 'high' : avgNum >= 7 ? 'medium' : 'low'}`}>
                            {avg !== "" ? avgNum.toFixed(1) : "-"}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`status-badge ${attNum >= 90 ? 'high' : attNum >= 70 ? 'medium' : 'low'}`}>
                            {attendance !== "" ? `${attendance}%` : "-"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Modal must be rendered here, inside the main return */}
        {editModalOpen && editGrade && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.3)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: 32,
                minWidth: 320,
                boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
              }}
            >
              <h3 style={{ marginBottom: 16 }}>ნიშნის შეცვლა</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 600 }}>ქულა: </label>
                <select
                  value={editPoint}
                  onChange={(e) => setEditPoint(e.target.value)}
                  style={{ marginLeft: 8, padding: 6, borderRadius: 4 }}
                >
                  <option value="">---</option>
                  {Array.from({ length: 11 }, (_, n) => n).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                  <option value="ჩთ">ჩთ</option>
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 600 }}>ტიპი: </label>
                <select
                  value={editPointType}
                  onChange={(e) => setEditPointType(Number(e.target.value))}
                  style={{ marginLeft: 8, padding: 6, borderRadius: 4 }}
                >
                  <option value={1}>საშინაო</option>
                  <option value={2}>საკლასო</option>
                  <option value={3}>შემაჯამებელი</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                <button
                  onClick={async () => {
                    setEditLoading(true);
                    // Prepare payload
                    const payload = editGrade
                      ? {
                        student_id: editGrade.student_id,
                        subject_id: editGrade.subject_id,
                        class_id: editGrade.class_id,
                        date: editGrade.date,
                        teacher_id: editGrade.teacher_id,
                        point:
                          editPoint === "" || editPoint === "ჩთ"
                            ? -1
                            : parseInt(editPoint, 10),
                        pointType: editPointType,
                        checked: editGrade.checked,
                        comment: editGrade.comment || "",
                      }
                      : {};
                    // Send update to backend
                    const res = await fetch("/api/grade/submit", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      alert(data.Message || "შეცდომა!");
                      setEditLoading(false);
                      return;
                    }
                    setEditLoading(false);
                    setEditModalOpen(false);
                    // Update grades state in-place or add if new
                    setGrades((prevGrades) => {
                      const exists = prevGrades.some(
                        (g) =>
                          g.student_id === payload.student_id &&
                          g.subject_id === payload.subject_id &&
                          g.class_id === payload.class_id &&
                          g.date === payload.date,
                      );
                      if (exists) {
                        return prevGrades.map((g) => {
                          if (
                            g.student_id === payload.student_id &&
                            g.subject_id === payload.subject_id &&
                            g.class_id === payload.class_id &&
                            g.date === payload.date
                          ) {
                            return {
                              ...g,
                              point: payload.point,
                              pointType: payload.pointType,
                            };
                          }
                          return g;
                        });
                      } else {
                        // Add new grade
                        return [
                          ...prevGrades,
                          {
                            student_id: payload.student_id,
                            subject_id: payload.subject_id,
                            class_id: payload.class_id,
                            date: payload.date,
                            teacher_id: payload.teacher_id,
                            point: payload.point,
                            pointType: payload.pointType,
                            checked: payload.checked,
                            comment: payload.comment || "",
                          },
                        ];
                      }
                    });
                  }}
                  className="admin-submit-btn"
                  style={{ margin: 0, width: 'auto', padding: '12px 30px', background: `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)` }}
                  disabled={editLoading}
                >
                  {editLoading ? 'ინახება...' : 'შენახვა'}
                </button>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="admin-cancel-btn"
                  style={{ padding: '12px 30px' }}
                  disabled={editLoading}
                >
                  გაუქმება
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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

        const firstSemesterNumeric = firstSemesterGrades.filter(
          (g) => typeof g.point === "number" && g.point !== -1,
        );
        const secondSemesterNumeric = secondSemesterGrades.filter(
          (g) => typeof g.point === "number" && g.point !== -1,
        );

        const firstSemesterAvg =
          firstSemesterNumeric.length > 0
            ? firstSemesterNumeric.reduce((sum, g) => sum + g.point, 0) /
            firstSemesterNumeric.length
            : 0;
        const secondSemesterAvg =
          secondSemesterNumeric.length > 0
            ? secondSemesterNumeric.reduce((sum, g) => sum + g.point, 0) /
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
        const numericGrades = semesterGrades.filter(
          (g) => typeof g.point === "number" && g.point !== -1,
        );

        averageScore =
          numericGrades.length > 0
            ? numericGrades.reduce((sum, g) => sum + g.point, 0) /
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

    // Calculate aggregate metrics for showResults
    const classMetrics = React.useMemo(() => {
      if (!showResults || filteredStudents.length === 0) return null;
      
      let totalAvg = 0;
      let totalAtt = 0;
      let ratedStudents = 0;
      const studentStatsMap = filteredStudents.map(student => {
        const stats = calculateStudentStats(student._id);
        if (stats.averageScore > 0) ratedStudents++;
        totalAvg += stats.averageScore;
        totalAtt += stats.attendancePercentage;
        return {
          student,
          stats
        };
      });

      const avgClassScore = ratedStudents > 0 ? totalAvg / ratedStudents : 0;
      const avgClassAtt = totalAtt / filteredStudents.length;

      // Group student counts by performance range
      let highCount = 0; // 9-10
      let mediumCount = 0; // 7-8
      let lowCount = 0; // < 7

      studentStatsMap.forEach(item => {
        const score = item.stats.averageScore;
        if (score >= 8.5) highCount++;
        else if (score >= 6.5) mediumCount++;
        else if (score > 0) lowCount++;
      });

      // Sort to find top 3 performers
      const sortedByPerformance = [...studentStatsMap]
        .filter(item => item.stats.averageScore > 0)
        .sort((a, b) => b.stats.averageScore - a.stats.averageScore || b.stats.attendancePercentage - a.stats.attendancePercentage);
      const top3 = sortedByPerformance.slice(0, 3);

      return {
        avgClassScore,
        avgClassAtt,
        highCount,
        mediumCount,
        lowCount,
        totalRated: ratedStudents,
        top3
      };
    }, [showResults, filteredStudents, grades, selectedSemester]);

    return (
      <div className="admin-view-container" style={{ width: '100%', margin: '0 auto' }}>
        <button
          onClick={() => navigate(-1)}
          className="admin-back-btn"
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
            <div className="admin-view-header" style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="admin-view-title" style={{ fontSize: '20px' }}>შედეგები და ანალიტიკა</h3>
            </div>

            {/* Interactive Analytics Cards Dashboard */}
            {classMetrics && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                padding: '24px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
              }}>
                {/* Metric Card 1: Class Academic Average */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '140px'
                }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    კლასის საშუალო მოსწრება
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    {classMetrics.avgClassScore.toFixed(1)}
                    <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>/10</span>
                  </div>
                  <span className={`status-badge ${classMetrics.avgClassScore >= 8.5 ? 'high' : classMetrics.avgClassScore >= 6.5 ? 'medium' : 'low'}`} style={{ marginTop: '8px' }}>
                    {classMetrics.avgClassScore >= 8.5 ? 'მაღალი' : classMetrics.avgClassScore >= 6.5 ? 'საშუალო' : 'დაბალი'}
                  </span>
                </div>

                {/* Metric Card 2: Attendance Average */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', textAlign: 'center' }}>
                    საშუალო დასწრება
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', textAlign: 'center', marginBottom: '10px' }}>
                    {classMetrics.avgClassAtt.toFixed(1)}%
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${classMetrics.avgClassAtt}%`, background: '#10b981', borderRadius: '10px' }} />
                  </div>
                </div>

                {/* Metric Card 3: Grade Distribution */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', textAlign: 'center' }}>
                    მოსწრების განაწილება
                  </div>
                  {[
                    { label: 'მაღალი (8.5-10)', count: classMetrics.highCount, color: '#10b981' },
                    { label: 'საშუალო (6.5-8.4)', count: classMetrics.mediumCount, color: selectedColor },
                    { label: 'დაბალი (<6.5)', count: classMetrics.lowCount, color: '#ef4444' }
                  ].map((row, rIdx) => {
                    const pct = classMetrics.totalRated > 0 ? (row.count / classMetrics.totalRated) * 100 : 0;
                    return (
                      <div key={rIdx} style={{ fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: '2px' }}>
                          <span>{row.label}</span>
                          <span style={{ fontWeight: 'bold' }}>{row.count} მოსწ.</span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: row.color, borderRadius: '10px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Metric Card 4: Class Top Performers */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', textAlign: 'center' }}>
                    🏆 საგნის ლიდერები
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, justifyContent: 'center' }}>
                    {classMetrics.top3.length === 0 ? (
                      <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>ჩანაწერები არ არის</div>
                    ) : (
                      classMetrics.top3.map((item, topIdx) => (
                        <div key={topIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <span style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: topIdx === 0 ? '#fbbf24' : topIdx === 1 ? '#cbd5e1' : '#cd7f32',
                              color: 'black',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              flexShrink: 0
                            }}>
                              {topIdx + 1}
                            </span>
                            <span style={{ fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.student.name} {item.student.surname.slice(0, 1)}.
                            </span>
                          </div>
                          <span style={{ fontWeight: 700, color: selectedColor }}>{item.stats.averageScore.toFixed(1)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

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
    );
  };

  const tabList = [
    { key: "teaching", label: "კლასები, სადაც ასწავლით" },
    { key: "homeroom", label: "სადამრიგებლო კლასები" },
    { key: "calendar", label: "ჩემი კვირის განრიგი" },
    { key: "ped_council_meetings", label: "პედსაბჭო" },
    { key: "notices", label: "განცხადებები" },
    { key: "chat", label: "ჩატი" },
    { key: "applications", label: "განაცხადები" },
    { key: "password", label: "პაროლის შეცვლა" },
  ];

  // Main page content
  const mainContent = (
    <>
      <header className="admin-page-header">
        <div style={{ fontSize: '12px', color: selectedColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>
          {getGreeting()} • {getGeorgianDate()}
        </div>
        <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GiTeacherIcon size={32} style={{ color: selectedColor }} /> {teacherFullName}
        </h1>
        <div className="admin-page-subtitle">მასწავლებლის პირადი კაბინეტი</div>
      </header>

      {/* Tab bar */}
      <div className="admin-tabs">
        {tabList.map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              position: 'relative'
            }}
          >
            {tab.label}
            {((tab.key === "notices" && hasUnreadNotices) || (tab.key === "chat" && hasUnreadMessages)) && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                border: '1.5px solid white',
                boxShadow: '0 0 6px #ef4444'
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="admin-view-container" style={{ width: '100%' }}>
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
          <NoticeBoard allowCreate={true} currentUser={{ id: teacherId, name: teacherFullName, role: 'teacher' }} />
        )}
        {activeTab === "chat" && (
          <ChatModule currentUser={{ id: teacherId, name: teacherFullName, role: 'teacher' }} />
        )}
        {activeTab === "applications" && (
          <TeacherApplicationsPanel teacherId={teacherId} />
        )}
        {activeTab === "ped_council_meetings" && (
          <TeacherPedCouncilMeetings />
        )}
        {activeTab === "password" && (
          <div style={{ maxWidth: '450px', width: '100%', margin: '40px auto', padding: '16px' }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
              border: '1px solid #cbd5e1',
              color: '#333'
            }}>
              <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', color: '#1e293b', textAlign: 'center', fontWeight: 700 }}>პაროლის შეცვლა</h2>
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>ძველი პაროლი</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', color: '#333' }}
                    placeholder="შეიყვანეთ ძველი პაროლი"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>ახალი პაროლი</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', color: '#333' }}
                    placeholder="შეიყვანეთ ახალი პაროლი"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>გაიმეორეთ ახალი პაროლი</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', color: '#333' }}
                    placeholder="გაიმეორეთ ახალი პაროლი"
                  />
                </div>

                {passError && <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>{passError}</div>}
                {passSuccess && <div style={{ color: '#10b981', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>{passSuccess}</div>}

                <button
                  type="submit"
                  disabled={passLoading}
                  style={{
                    marginTop: '10px',
                    padding: '12px',
                    backgroundColor: selectedColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                >
                  {passLoading ? 'ინახება...' : 'პაროლის შეცვლა'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
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
      <div className="admin-view-container" style={{ width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate("/teacher")}
              className="admin-back-btn"
              style={{ margin: 0 }}
            >
              უკან დაბრუნება
            </button>
            <ClassSwitcher currentClassId={id!} routeType="class" pageType="options" />
          </div>
          <button
            onClick={() => navigate(`/teacher/class/${id}/history`)}
            className="admin-submit-btn"
            style={{
              background: selectedColor,
              margin: 0,
              width: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '14px'
            }}
          >
            <FaHistory size={16} /> ნიშნების ისტორია
          </button>
        </div>
        <TutorClassDetails
          allSubjects={subjects}
          allTeachers={teachers}
          tutorClass={tutorClass}
          selectedColor={selectedColor}
        />
        <div style={{ marginTop: '30px' }}>
          <AtRiskList classId={id!} className={tutorClass.classname} />
        </div>
      </div>
    );
  };

  // Behavior entry page
  const BehaviorEntryPage: React.FC = () => {
    const { id } = useParams();
    const classId = id!;
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form state for modal
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [behType, setBehType] = useState<'positive' | 'negative'>('positive');
    const [points, setPoints] = useState(5);
    const [category, setCategory] = useState('participation');
    const [comment, setComment] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const classObj = teachesClasses.find((cls: any) => cls._id === classId);

    useEffect(() => {
      const fetchStudents = async () => {
        setLoading(true);
        const match = classObj?.classname.match(/^([0-9]+)([ა-ჰ])$/);
        const studentsUrl = match
          ? `/api/student/grade/${match[1]}?parallel=${encodeURIComponent(match[2])}`
          : "/api/student/all";
        const res = await fetch(studentsUrl);
        if (res.ok) {
          const fetched = await res.json();
          const classStudents = match
            ? fetched
            : fetched.filter((s: any) => s.classInfo && s.classInfo._id === classId);
          setStudents(classStudents);
        }
        setLoading(false);
      };
      fetchStudents();
    }, [classId]);

    const handleSaveBehavior = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedStudent) return;
      setIsSaving(true);
      
      const loginData = JSON.parse(localStorage.getItem("login") || "{}");
      const user_ID = loginData.user_ID;
      const currentTeacher = allTeachers.find((t: any) => t.user_ID === user_ID);

      const payload = {
        student_id: selectedStudent.user_ID,
        teacher_id: user_ID,
        teacher_name: currentTeacher ? `${currentTeacher.name} ${currentTeacher.surname}` : "მასწავლებელი",
        class_id: classId,
        type: behType,
        points,
        category,
        comment
      };

      try {
        const res = await fetch('/api/behaviors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert('ქცევა წარმატებით ჩაიწერა!');
          setSelectedStudent(null);
          setComment('');
        } else {
          alert('ქცევის ჩაწერა ვერ მოხერხდა');
        }
      } catch {
        alert('კავშირის შეცდომა');
      } finally {
        setIsSaving(false);
      }
    };

    if (loading) return <div style={{ color: "white", textAlign: "center", marginTop: "40px" }}>იტვირთება...</div>;

    return (
      <div className="admin-view-container" style={{ width: '100%', margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} className="admin-back-btn">
          უკან დაბრუნება
        </button>

        <div className="admin-list-container" style={{ marginTop: '20px' }}>
          <div className="admin-view-header" style={{ padding: '24px' }}>
            <h3 className="admin-view-title" style={{ fontSize: '20px' }}>ქცევის შეფასება - {classObj?.classname}</h3>
          </div>
          
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>მოსწავლე</th>
                  <th>პირადი ნომერი</th>
                  <th style={{ textAlign: 'center' }}>ქმედება</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600 }}>{s.name} {s.surname}</td>
                    <td>{s.user_ID}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="admin-table-action-btn"
                        style={{ background: selectedColor, padding: '8px 16px', fontSize: '13px' }}
                      >
                        შეფასება
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Behavior Form Modal */}
        {selectedStudent && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '30px', minWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', color: '#333' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700 }}>ქცევის შეფასება: {selectedStudent.name} {selectedStudent.surname}</h3>
              <form onSubmit={handleSaveBehavior} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>შეფასების ტიპი:</label>
                  <select value={behType} onChange={e => {
                    const val = e.target.value as 'positive' | 'negative';
                    setBehType(val);
                    setCategory(val === 'positive' ? 'participation' : 'disruption');
                  }} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}>
                    <option value="positive">🟢 შექება (დადებითი)</option>
                    <option value="negative">🔴 შენიშვნა (უარყოფითი)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>ქულა (1-5):</label>
                  <select value={points} onChange={e => setPoints(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n} ქულა</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>კატეგორია:</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}>
                    {behType === 'positive' ? (
                      <>
                        <option value="participation">გაკვეთილზე აქტიურობა</option>
                        <option value="helpful">დახმარება / თანამშრომლობა</option>
                        <option value="homework">დავალების კარგად მომზადება</option>
                        <option value="other">სხვა</option>
                      </>
                    ) : (
                      <>
                        <option value="disruption">გაკვეთილის ჩაშლა / ხმაური</option>
                        <option value="bullying">ბულინგი / კონფლიქტი</option>
                        <option value="dress_code">დრესკოდის დარღვევა</option>
                        <option value="other">სხვა</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>კომენტარი:</label>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical', fontFamily: 'inherit' }} placeholder="დაწერეთ მოკლე აღწერა..." />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" onClick={() => setSelectedStudent(null)} className="admin-cancel-btn" style={{ padding: '10px 20px' }}>გაუქმება</button>
                  <button type="submit" disabled={isSaving} className="admin-submit-btn" style={{ margin: 0, width: 'auto', padding: '10px 24px', background: selectedColor }}>
                    {isSaving ? 'ინახება...' : 'შენახვა'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-page-wrapper">
      <div
        className="admin-page-bg-glow"
        style={{
          background: `radial-gradient(circle at center, ${selectedColor}26 0%, transparent 70%)`,
        }}
      />
      <div className="admin-page-content">
        <ColorPalette />
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAltIcon /> გამოსვლა
        </button>
        <Routes>
          <Route path="/" element={mainContent} />
          <Route path="class/:id" element={<TutorClassDetailsPage />} />
          <Route
            path="class/:id/history"
            element={<GradeHistoryPage allSubjects={allSubjects} />}
          />
          <Route path="teach/:id" element={<TeachClassOptionsPage />} />
          <Route path="teach/:id/grade" element={<GradeEntryPage />} />
          <Route
            path="teach/:id/history"
            element={<GradeHistoryPage allSubjects={allSubjects} />}
          />
        </Routes>
      </div>
    </div>
  );
};

export default Teacher;
