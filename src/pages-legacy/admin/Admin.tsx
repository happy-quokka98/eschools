"use client";
import React, { useState, useEffect, FormEvent } from 'react';
import { FaUserGraduate, FaChalkboardTeacher, FaHistory, FaBookOpen, FaBookReader, FaCalendarAlt, FaFileAlt, FaSearch, FaBullhorn, FaComments, FaSignOutAlt, FaDownload, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { MdEdit, MdAdd, MdOutlineWarningAmber } from "react-icons/md";
import { IoStatsChartSharp, IoLockClosedSharp } from "react-icons/io5";
import { GoPlus } from "react-icons/go";
import { IconType } from 'react-icons';
import { useColor } from './../../components/ColorContext';
import { useQuery } from '@tanstack/react-query';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import ColorPalette from './../../components/ColorPalette';
import { useNavigate } from 'react-router-dom';
import { IoSchoolSharp } from "react-icons/io5";
import { FaArrowLeftLong } from "react-icons/fa6";
import AddStudentForm from '../../components/admin/AddStudentForm';
import StudentList from '../../components/admin/StudentList';
import AdminDashboard from '../../components/admin/AdminDashboard';
import MessagePopup from '../../components/MessagePopup';
import ConfirmationModal from '../../components/ConfirmationModal';
import EditStudentModal from '../../components/admin/EditStudentModal';
import TeacherList from '../../components/admin/TeacherList';
import EditTeacherModal from '../../components/admin/EditTeacherModal';
import AddTeacherForm from '../../components/admin/AddTeacherForm';
import AddClassForm from '../../components/admin/AddClassForm';
import AddSubjectForm from '../../components/admin/AddSubjectForm';
import EditClassForm from '../../components/admin/EditClassForm';
import AdminCalendarManager from '../../components/admin/AdminCalendarManager';
import DetailedGradeHistory from '../../components/admin/DetailedGradeHistory';
import SubjectList from '../../components/admin/SubjectList';
import ExternalsMarkInput from '../../components/admin/ExternalsMarkInput';
import ReportGenerator from '../../components/admin/ReportGenerator';
import StudentCard from '../../components/admin/StudentCard';
import NoticeBoard from '../../components/NoticeBoard';
import ChatModule from '../../components/ChatModule';
import AtRiskList from '../../components/admin/AtRiskList';
import './Admin.css';

const ArrowLeftIcon = FaArrowLeftLong as React.FC<{ size?: number | string }>;
const FaSignOutAltIcon = FaSignOutAlt as React.ComponentType<any>;


interface Student {
    _id: string;
    name: string;
    surname: string;
    user_ID: string;
    classInfo?: {
        _id?: string;
        classname: string;
    };
}

interface Teacher {
    _id: string;
    name: string;
    surname: string;
    user_ID: string;
}

interface Subject {
    _id: string;
    name: string;
}

interface Class {
    _id: string;
    classname: string;
    tutor_id?: string;
    subjects?: { subject_id: string; teacher_id: string }[];
}

const AdminApplicationsPanel: React.FC<{ adminId: string; role: string; handleBackClick: () => void }> = ({ adminId, role, handleBackClick }) => {
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const { selectedColor } = useColor();

  const { data: apps, refetch, isLoading } = useQuery<any[]>({
    queryKey: ['admin-applications', adminId, role],
    queryFn: async () => {
      const res = await fetch(`/api/applications?user_id=${adminId}&role=${role}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!adminId
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
          resolvedBy: adminId
        })
      });
      if (res.ok) {
        refetch();
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
              new TextRun({ text: "სკოლის დირექციას / სადამრიგებლო კლასის ხელმძღვანელს\n", font: "DejaVu Sans" }),
              new TextRun({ text: "ვისგან: ", bold: true, font: "DejaVu Sans" }),
              new TextRun({ text: `მოსწავლე ${app.studentName}-ის მშობლისგან\n`, font: "DejaVu Sans" }),
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
      link.download = `ganacxadeba_${app.type.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  if (isLoading) return <div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>განაცხადები იტვირთება...</div>;

  return (
    <div style={{ width: '100%' }}>
      <button className="admin-back-btn" onClick={handleBackClick} style={{ marginBottom: '24px' }}>
        <FaArrowLeftLong /> უკან დაბრუნება
      </button>

      <div className="admin-list-container" style={{ padding: '24px', background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>სკოლის ყველა განაცხადი (საქმის წარმოება)</h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>სისტემაში შემოსული ყველა მშობლის განცხადების მონიტორინგი და რეზოლუცია</p>

        {!apps || apps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>განაცხადები არ არის შემოსული.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
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
      </div>
    </div>
  );
};

const AdminStaffManagement: React.FC<{ selectedColor: string }> = ({ selectedColor }) => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('rector');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: staffList, refetch, isLoading } = useQuery<any[]>({
    queryKey: ['admin-staff-list'],
    queryFn: async () => {
      const res = await fetch('/api/admin/all');
      if (!res.ok) throw new Error();
      return res.json();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !surname || !userId || !password) {
      alert("გთხოვთ შეავსოთ ყველა ველი");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          surname,
          user_ID: userId,
          password,
          role
        })
      });
      if (res.ok) {
        setName('');
        setSurname('');
        setUserId('');
        setPassword('');
        setRole('rector');
        setShowAddForm(false);
        refetch();
        alert('ახალი თანამშრომელი წარმატებით დაემატა!');
      } else {
        const errData = await res.json();
        alert(`დამატება ვერ მოხერხდა: ${errData.message || 'შეცდომა'}`);
      }
    } catch {
      alert('კავშირის შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  const roleLabels: Record<string, string> = {
    rector: "რექტორი",
    prorector: "პრორექტორი",
    academic: "სასწავლო ნაწილი",
    clerk: "საქმის მწარმოებელი",
    secretary: "მდივანი",
    accountant: "ბუღალტერი",
    it_manager: "IT მენეჯერი",
    ped_council: "პედსაბჭოს ხელმძღვანელი",
    admin: "ადმინისტრატორი",
    sysadmin: "სისტემური ადმინისტრატორი"
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>სკოლის პერსონალის მართვა</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', margin: 0 }}>სისტემაში რეგისტრირებული ადმინისტრაციული როლების მართვა</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ padding: '10px 20px', backgroundColor: selectedColor, border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {showAddForm ? 'დახურვა' : 'ახალი თანამშრომლის დამატება'}
        </button>
      </div>

      {showAddForm && (
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', margin: 0 }}>თანამშრომლის რეგისტრაცია</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>სახელი</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="სახელი" style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>გვარი</label>
                <input type="text" value={surname} onChange={e => setSurname(e.target.value)} placeholder="გვარი" style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>პირადი ნომერი / ID</label>
                <input type="text" value={userId} onChange={e => setUserId(e.target.value)} placeholder="კაბინეტში შესასვლელი ID" style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>პაროლი</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="პაროლი" style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '300px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>როლი / პოზიცია</label>
              <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }}>
                <option value="rector">რექტორი</option>
                <option value="prorector">პრორექტორი</option>
                <option value="academic">სასწავლო ნაწილი</option>
                <option value="secretary">მდივანი</option>
                <option value="accountant">ბუღალტერი</option>
                <option value="it_manager">IT მენეჯერი</option>
                <option value="clerk">საქმის მწარმოებელი</option>
                <option value="ped_council">პედსაბჭოს ხელმძღვანელი</option>
                <option value="admin">ადმინისტრატორი</option>
                <option value="sysadmin">სისტემური ადმინისტრატორი</option>
              </select>
            </div>

            <button type="submit" disabled={loading} style={{ alignSelf: 'flex-end', padding: '10px 24px', backgroundColor: selectedColor, border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? 'რეგისტრირდება...' : 'დამატება'}
            </button>
          </form>
        </div>
      )}

      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>იტვირთება...</div>
        ) : !staffList || staffList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>თანამშრომლები არ მოიძებნა.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '13px' }}>
                  <th style={{ padding: '12px' }}>თანამშრომელი</th>
                  <th style={{ padding: '12px' }}>პირადი ნომერი / ID</th>
                  <th style={{ padding: '12px' }}>როლი</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(s => (
                  <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#e2e8f0' }}>{s.name} {s.surname}</td>
                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{s.user_ID}</td>
                    <td style={{ padding: '12px', color: selectedColor, fontWeight: 'bold' }}>{roleLabels[s.role] || roleLabels.admin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminPedCouncilMeetings: React.FC<{ adminId: string; selectedColor: string }> = ({ adminId, selectedColor }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [agenda, setAgenda] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: meetings, refetch, isLoading } = useQuery<any[]>({
    queryKey: ['admin-ped-meetings'],
    queryFn: async () => {
      const res = await fetch('/api/ped-council');
      if (!res.ok) throw new Error();
      return res.json();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) {
      alert("გთხოვთ შეავსოთ ყველა აუცილებელი ველი");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ped-council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date,
          time,
          agenda,
          scheduledBy: adminId
        })
      });
      if (res.ok) {
        setTitle('');
        setDate('');
        setTime('');
        setAgenda('');
        refetch();
        alert('პედსაბჭოს სხდომა წარმატებით ჩაინიშნა!');
      } else {
        alert('სხდომის ჩანიშვნა ვერ მოხერხდა');
      }
    } catch {
      alert('კავშირის შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', color: 'white' }}>
      
      {/* Schedule meeting form */}
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>ახალი პედსაბჭოს სხდომის ჩანიშვნა</h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>შეავსეთ სხდომის დეტალები მასწავლებლებისთვის საჩვენებლად</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>თემა / სათაური *</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="მაგ. I სემესტრის შეჯამება" 
                style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>თარიღი *</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>დრო *</label>
              <input 
                type="time" 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }} 
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>დღის წესრიგი / შინაარსი</label>
            <textarea 
              value={agenda} 
              onChange={e => setAgenda(e.target.value)} 
              placeholder="შეხვედრის დეტალები..." 
              rows={4} 
              style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none', resize: 'vertical' }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{ alignSelf: 'flex-end', padding: '10px 24px', backgroundColor: selectedColor, border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: 'opacity 0.2s' }}
          >
            {loading ? 'ინიშნება...' : 'სხდომის ჩანიშვნა'}
          </button>
        </form>
      </div>

      {/* List of meetings */}
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>ჩანიშნული სხდომები</h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>პედსაბჭოს მიმდინარე და ძველი სხდომები</p>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>იტვირთება...</div>
        ) : !meetings || meetings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>ჩანიშნული სხდომები არ მოიძებნა.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '13px' }}>
                  <th style={{ padding: '12px' }}>თარიღი / დრო</th>
                  <th style={{ padding: '12px' }}>თემა</th>
                  <th style={{ padding: '12px' }}>აღწერა / დღის წესრიგი</th>
                  <th style={{ padding: '12px' }}>ჩამნიშნავი</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map(m => (
                  <tr key={m._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      {m.date}
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{m.time}</div>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#e2e8f0' }}>{m.title}</td>
                    <td style={{ padding: '12px', whiteSpace: 'pre-wrap' }}>{m.agenda || '—'}</td>
                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{m.scheduledByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

const Admin: React.FC = () => {
    const { selectedColor } = useColor();
    const navigate = useNavigate();
    const logoutButtonStyle: React.CSSProperties = {};

    const loginData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('login') || '{}') : {};
    const adminId = loginData.user_ID || 'admin';
    const adminRole = loginData.role || 'admin';
    const roleLabels: Record<string, string> = {
        rector: "რექტორი",
        prorector: "პრორექტორი",
        academic: "სასწავლო ნაწილი",
        clerk: "საქმის მწარმოებელი",
        secretary: "მდივანი",
        accountant: "ბუღალტერი",
        it_manager: "IT მენეჯერი",
        ped_council: "პედსაბჭოს ხელმძღვანელი",
        admin: "ადმინისტრატორი",
        sysadmin: "სისტემური ადმინისტრატორი"
    };
    const adminName = roleLabels[adminRole] || 'ადმინისტრატორი';

    const [boxWidth, setBoxWidth] = useState(350);
    const [view, setView] = useState('main'); // 'main', 'studentOptions', 'studentList', 'addStudentForm', 'teacherList', 'addTeacherForm', 'teacherOptions', 'addClassForm', 'addSubjectForm', 'editClass', 'classHistoryGrades', 'classHistoryParallels', 'classHistoryTable', 'manageCalendars', 'detailedGradeHistory', 'subjectList'
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classFilter, setClassFilter] = useState<number | null>(null);
    const [parallelFilter, setParallelFilter] = useState<string | null>(null);
    const [popup, setPopup] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [confirmation, setConfirmation] = useState<{ message: string; onConfirm: () => void; } | null>(null);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [isEditTeacherModalOpen, setIsEditTeacherModalOpen] = useState(false);
    const [classHistory, setClassHistory] = useState<{ classname: string; tutorName: string; studentCount: number; }[]>([]);
    const [selectedHistoryGrade, setSelectedHistoryGrade] = useState<number | null>(null);
    const [selectedHistoryParallel, setSelectedHistoryParallel] = useState<string | null>(null);
    const [historyParallels, setHistoryParallels] = useState<string[]>([]);
    const [historyParallelTutors, setHistoryParallelTutors] = useState<{ [parallel: string]: string }>({});
    const [historyParallelCounts, setHistoryParallelCounts] = useState<{ [parallel: string]: number }>({});
    const [historyTable, setHistoryTable] = useState<{ classname: string; tutorName: string; studentCount: number; }[]>([]);
    const [journalTeachers, setJournalTeachers] = useState<any[]>([]);
    const [loadingJournal, setLoadingJournal] = useState(false);
    const [updatingTeacherId, setUpdatingTeacherId] = useState<string | null>(null);
    const [customDates, setCustomDates] = useState<{ [teacherId: string]: string }>({});
    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
    const [selectedClassForHistory, setSelectedClassForHistory] = useState<{ id: string; name: string } | null>(null);
    const [selectedSubjectForHistory, setSelectedSubjectForHistory] = useState<{ id: string; name: string } | null>(null);
    const [selectedClassForExternals, setSelectedClassForExternals] = useState<{ id: string; name: string } | null>(null);
    const [selectedClassForReport, setSelectedClassForReport] = useState<{ id: string; name: string } | null>(null);
    const [showReportGenerator, setShowReportGenerator] = useState(false);
    const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);

    const ClassSwitcher: React.FC<{
        currentClassId: string;
        viewType: 'history' | 'externals' | 'report';
        titleSuffix?: string;
        onClassChange?: (newClassId: string, newClassName: string) => void;
    }> = ({ currentClassId, viewType, titleSuffix = "", onClassChange }) => {
        if (!classes || classes.length === 0) return null;
        if (classes.length === 1) {
            return (
                <span style={{ fontWeight: 800, fontSize: '18px', color: 'white' }}>
                    {classes[0].classname}{titleSuffix}
                </span>
            );
        }

        // Sort classes in Georgian order
        const sortedClasses = [...classes].sort((a, b) => {
            const gradeA = parseInt(a.classname.match(/\d+/)?.[0] || '0', 10);
            const gradeB = parseInt(b.classname.match(/\d+/)?.[0] || '0', 10);
            if (gradeA !== gradeB) return gradeA - gradeB;

            const letterA = a.classname.match(/[ა-ჰa-zA-Z]/)?.[0] || '';
            const letterB = b.classname.match(/[ა-ჰa-zA-Z]/)?.[0] || '';
            return letterA.localeCompare(letterB, 'ka');
        });

        const currentIndex = sortedClasses.findIndex((cls: any) => cls._id === currentClassId);
        
        // Helper function to handle navigation
        const handleNavigate = (targetId: string, targetName: string) => {
            if (onClassChange) {
                onClassChange(targetId, targetName);
                return;
            }
            if (viewType === 'history') {
                setSelectedClassForHistory({ id: targetId, name: targetName });
            } else if (viewType === 'externals') {
                setSelectedClassForExternals({ id: targetId, name: targetName });
            } else if (viewType === 'report') {
                setSelectedClassForReport({ id: targetId, name: targetName });
            }
        };

        if (currentIndex === -1) {
            return (
                <span style={{ fontWeight: 800, fontSize: '18px', color: 'white' }}>
                    {sortedClasses[0]?.classname || ""}
                </span>
            );
        }

        const prevIndex = (currentIndex - 1 + sortedClasses.length) % sortedClasses.length;
        const nextIndex = (currentIndex + 1) % sortedClasses.length;

        const prevClass = sortedClasses[prevIndex];
        const nextClass = sortedClasses[nextIndex];

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
                    onClick={() => handleNavigate(prevClass._id, prevClass.classname)}
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
                        onChange={(e) => {
                            const target = sortedClasses.find(c => c._id === e.target.value);
                            if (target) handleNavigate(target._id, target.classname);
                        }}
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
                        {sortedClasses.map((cls: any) => (
                            <option key={cls._id} value={cls._id} style={{ background: '#1e293b', color: 'white' }}>
                                {cls.classname}{titleSuffix}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => handleNavigate(nextClass._id, nextClass.classname)}
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

    const showPopup = (message: string, type: 'success' | 'error') => {
        setPopup({ message, type });
    };

    const fetchAllSubjects = async () => {
        try {
            const res = await fetch('/api/subjects');
            if (res.ok) {
                const data = await res.json();
                setSubjects(data);
            } else {
                console.error('Failed to fetch subjects.');
            }
        } catch (err) {
            console.error('Error fetching subjects:', err);
        }
    };

    const fetchAllClasses = async () => {
        try {
            const res = await fetch('/api/classes');
            if (res.ok) {
                const data = await res.json();
                setClasses(data);
            } else {
                console.error('Failed to fetch classes.');
            }
        } catch (err) {
            console.error('Error fetching classes:', err);
        }
    };

    const fetchClassHistory = async () => {
        try {
            // Fetch all classes
            const classRes = await fetch('/api/classes');
            if (!classRes.ok) throw new Error('Failed to fetch classes');
            const classData = await classRes.json();

            // Fetch all teachers (for tutor names)
            const teacherRes = await fetch('/api/teacher/all');
            if (!teacherRes.ok) throw new Error('Failed to fetch teachers');
            const teacherData = await teacherRes.json();

            // Fetch all students (for counting)
            const studentRes = await fetch('/api/student/all');
            if (!studentRes.ok) throw new Error('Failed to fetch students');
            const studentData = await studentRes.json();

            // Build the class history array
            const history = classData.map((cls: any) => {
                // Find tutor name
                let tutorName = '';
                if (cls.tutor_id) {
                    const tutor = teacherData.find((t: any) => t._id === cls.tutor_id);
                    tutorName = tutor ? `${tutor.name} ${tutor.surname}` : '';
                }
                // Count students in this class
                const studentCount = studentData.filter((s: any) => s.classInfo && s.classInfo.classname === cls.classname).length;
                return {
                    classname: cls.classname,
                    tutorName,
                    studentCount,
                };
            });
            setClassHistory(history);
        } catch (err) {
            setClassHistory([]);
        }
    };

    const fetchClassHistoryParallels = async (grade: number) => {
        try {
            const classRes = await fetch('/api/classes');
            if (!classRes.ok) throw new Error('Failed to fetch classes');
            const classData = await classRes.json();
            // Fetch all teachers (for tutor names)
            const teacherRes = await fetch('/api/teacher/all');
            if (!teacherRes.ok) throw new Error('Failed to fetch teachers');
            const teacherData = await teacherRes.json();
            // Fetch only students of this grade (for counting)
            const studentRes = await fetch(`/api/student/grade/${grade}`);
            if (!studentRes.ok) throw new Error('Failed to fetch students');
            const studentData = await studentRes.json();
            // Extract parallels, tutor names, and student counts for the selected grade
            const parallels: string[] = [];
            const parallelTutors: { [parallel: string]: string } = {};
            const parallelCounts: { [parallel: string]: number } = {};
            classData.forEach((cls: any) => {
                const match = cls.classname.match(/^([0-9]+)([ა-ჰ])$/);
                if (match && parseInt(match[1], 10) === grade) {
                    const parallel = match[2];
                    if (!parallels.includes(parallel)) {
                        parallels.push(parallel);
                    }
                    let tutorName = '';
                    if (cls.tutor_id) {
                        const tutor = teacherData.find((t: any) => t._id === cls.tutor_id);
                        tutorName = tutor ? `${tutor.name} ${tutor.surname}` : '';
                    }
                    parallelTutors[parallel] = tutorName;
                    // Count students in this class
                    const studentCount = studentData.filter((s: any) => s.classInfo && s.classInfo.classname === cls.classname).length;
                    parallelCounts[parallel] = studentCount;
                }
            });
            setHistoryParallels(parallels);
            setHistoryParallelTutors(parallelTutors);
            setHistoryParallelCounts(parallelCounts);
        } catch (err) {
            setHistoryParallels([]);
            setHistoryParallelTutors({});
            setHistoryParallelCounts({});
        }
    };

    const fetchClassHistoryTable = async (grade: number, parallel: string) => {
        try {
            // Fetch all classes
            const classRes = await fetch('/api/classes');
            if (!classRes.ok) throw new Error('Failed to fetch classes');
            const classData = await classRes.json();
            // Find the class for this grade and parallel
            const classObj = classData.find((cls: any) => {
                const match = cls.classname.match(/^([0-9]+)([ა-ჰ])$/);
                return match && parseInt(match[1], 10) === grade && match[2] === parallel;
            });
            if (!classObj) {
                setHistoryTable([]);
                return;
            }
            // Fetch all teachers (for tutor names)
            const teacherRes = await fetch('/api/teacher/all');
            if (!teacherRes.ok) throw new Error('Failed to fetch teachers');
            const teacherData = await teacherRes.json();
            // Fetch only students in this specific grade+parallel
            const studentRes = await fetch(`/api/student/grade/${grade}?parallel=${encodeURIComponent(parallel)}`);
            if (!studentRes.ok) throw new Error('Failed to fetch students');
            const studentData = await studentRes.json();
            // Find tutor name
            let tutorName = '';
            if (classObj.tutor_id) {
                const tutor = teacherData.find((t: any) => t._id === classObj.tutor_id);
                tutorName = tutor ? `${tutor.name} ${tutor.surname}` : '';
            }
            // Count students in this class
            const studentCount = studentData.length;
            setHistoryTable([{ classname: classObj.classname, tutorName, studentCount }]);
        } catch (err) {
            setHistoryTable([]);
        }
    };

    const fetchJournalTeachers = async () => {
        setLoadingJournal(true);
        // Mock API: fetch all teachers and add a mock gradeEntryStartDate
        const res = await fetch('/api/teacher/all');
        if (!res.ok) return setLoadingJournal(false);
        const teachers = await res.json();
        // For demo, use a random or today-13 days as gradeEntryStartDate
        const today = new Date();
        const defaultStart = new Date(today);
        defaultStart.setDate(today.getDate() - 13);
        setJournalTeachers(teachers.map((t: any) => ({
            ...t,
            gradeEntryStartDate: t.gradeEntryStartDate || defaultStart.toISOString().split('T')[0],
        })));
        setLoadingJournal(false);
    };

    const handleSetDefaultStartDate = async (teacherId: string) => {
        setUpdatingTeacherId(teacherId);
        // Set gradeEntryStartDate to today-13 days
        const today = new Date();
        const defaultStart = new Date(today);
        defaultStart.setDate(today.getDate() - 13);
        const defaultDate = defaultStart.toISOString().split('T')[0];
        try {
            const res = await fetch('/api/teacher/set-grade-entry-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacherId, date: defaultDate }),
            });
            const data = await res.json();
            if (res.ok) {
                setJournalTeachers(prev => prev.map(t => t._id === teacherId ? { ...t, gradeEntryStartDate: defaultDate } : t));
                showPopup('თარიღი წარმატებით განახლდა', 'success');
            } else {
                showPopup(data.message || 'შეცდომა მოხდა', 'error');
            }
        } catch (err) {
            showPopup('სერვერთან დაკავშირება ვერ მოხერხდა', 'error');
        }
        setUpdatingTeacherId(null);
    };

    const handleCustomDateChange = (teacherId: string, value: string) => {
        setCustomDates(prev => ({ ...prev, [teacherId]: value }));
    };

    const handleSaveCustomDate = async (teacherId: string) => {
        setUpdatingTeacherId(teacherId);
        const newDate = customDates[teacherId];
        try {
            const res = await fetch('/api/teacher/set-grade-entry-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacherId, date: newDate }),
            });
            const data = await res.json();
            if (res.ok) {
                setJournalTeachers(prev => prev.map(t => t._id === teacherId ? { ...t, gradeEntryStartDate: newDate } : t));
                showPopup('თარიღი წარმატებით განახლდა', 'success');
            } else {
                showPopup(data.message || 'შეცდომა მოხდა', 'error');
            }
        } catch (err) {
            showPopup('სერვერთან დაკავშირება ვერ მოხერხდა', 'error');
        }
        setUpdatingTeacherId(null);
    };

    const handleJournalOpenClose = () => {
        setIsJournalModalOpen(true);
    };

    const handleJournalAction = async (action: 'semester' | 'year' | 'close') => {
        setIsJournalModalOpen(false);
        let newDate = '';
        const today = new Date();
        let targetDate = '';
        if (action === 'semester') {
            const month = today.getMonth() + 1;
            const year = today.getFullYear();
            if (month >= 9 && month <= 12) {
                // September-December: 15 September
                targetDate = `${year}-09-15`;
            } else if (month >= 1 && month <= 6) {
                // January-June: 15 January
                targetDate = `${year}-01-15`;
            } else {
                showPopup('სემესტრის გახსნა შესაძლებელია მხოლოდ სექტემბერი-დეკემბერი ან იანვარი-ივნისი.', 'error');
                return;
            }
            newDate = targetDate;
        } else if (action === 'year') {
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            if (month >= 9 && month <= 12) {
                newDate = `${year}-09-15`;
            } else if (month >= 1 && month <= 6) {
                newDate = `${year - 1}-09-15`;
            } else {
                showPopup('წელიწადის გახსნა შესაძლებელია მხოლოდ სექტემბერი-დეკემბერი ან იანვარი-ივნისი.', 'error');
                return;
            }
        } else if (action === 'close') {
            newDate = '';
        }
        // Update all teachers
        setUpdatingTeacherId('all');
        let successCount = 0;
        let errorCount = 0;
        for (const t of journalTeachers) {
            try {
                const res = await fetch('/api/teacher/set-grade-entry-date', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teacherId: t._id, date: newDate }),
                });
                if (res.ok) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch {
                errorCount++;
            }
        }
        setUpdatingTeacherId(null);
        // Refetch teachers to update UI and enforce new date restrictions
        await fetchJournalTeachers();
        if (successCount > 0 && errorCount === 0) {
            showPopup('ყველა მასწავლებლის თარიღი წარმატებით განახლდა', 'success');
            setJournalTeachers(prev => prev.map(t => ({ ...t, gradeEntryStartDate: newDate })));
        } else if (successCount > 0) {
            showPopup(`ნაწილობრივ განახლდა: წარმატებით: ${successCount}, შეცდომა: ${errorCount}`, 'error');
            setJournalTeachers(prev => prev.map(t => ({ ...t, gradeEntryStartDate: newDate })));
        } else {
            showPopup('შეცდომა: თარიღები ვერ განახლდა!', 'error');
        }
    };

    useEffect(() => {
        fetchAllClasses();
        fetchAllSubjects();
        fetchTeachers();
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 480) {
                setBoxWidth(window.innerWidth - 40);
            } else if (window.innerWidth < 768) {
                setBoxWidth(250);
            } else {
                setBoxWidth(350);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const AdminContainer: React.CSSProperties = {
        width: '100%',
        minHeight: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '20px',
        textTransform: 'uppercase',
        fontWeight: '700',
        color: 'white',
        boxSizing: 'border-box',
        position: 'relative',
        padding: '60px 16px 20px',
    };



    const BoxTitle = (): React.CSSProperties => ({
        fontSize: 'clamp(18px, 4vw, 24px)',
        textAlign: 'center',
    });

    const allDashboardItems = [
        { icon: FaUserGraduate, label: 'მოსწავლეები' },
        { icon: FaChalkboardTeacher, label: 'მასწავლებლები' },
        { icon: IoSchoolSharp, label: 'კლასი' },
        { icon: FaHistory, label: 'ისტორია' },
        { icon: IoStatsChartSharp, label: 'სტატისტიკა' },
        { icon: FaBookReader, label: 'ექსტერნი' },
        { icon: FaFileAlt, label: 'უწყისი' },
        { icon: FaBookOpen, label: 'ჟურნალის გახსნა/დახურვა' },
        { icon: FaCalendarAlt, label: 'გაკვეთილების კალენდარი' },
        { icon: FaSearch, label: 'დღის სკანირება' },
        { icon: FaBullhorn, label: 'განცხადებები' },
        { icon: FaComments, label: 'ჩატი' },
        { icon: FaFileAlt, label: 'განაცხადები' },
    ];

    let dashboardItems = allDashboardItems;

    if (adminRole === 'clerk') {
        dashboardItems = allDashboardItems.filter(item => item.label === 'განაცხადები');
    } else if (adminRole === 'secretary') {
        dashboardItems = allDashboardItems.filter(item => ['მოსწავლეები', 'ისტორია', 'განაცხადები', 'ჩატი'].includes(item.label));
    } else if (adminRole === 'accountant') {
        dashboardItems = allDashboardItems.filter(item => ['განაცხადები', 'ჩატი'].includes(item.label));
    } else if (adminRole === 'it_manager') {
        dashboardItems = allDashboardItems.filter(item => ['ჩატი'].includes(item.label));
    } else if (adminRole === 'ped_council') {
        dashboardItems = [
            ...allDashboardItems.filter(item => item.label === 'ჩატი'),
            { icon: FaCalendarAlt, label: 'პედსაბჭოს დანიშვნა' }
        ];
    } else if (adminRole === 'sysadmin') {
        dashboardItems = [
            ...allDashboardItems,
            { icon: FaChalkboardTeacher, label: 'პერსონალი' }
        ];
    }

    const classItems: { icon: IconType; label: string }[] = [
        { icon: IoSchoolSharp, label: 'კლასის დამატება' },
        { icon: FaBookReader, label: 'საგნის დამატება' },
        { icon: MdEdit, label: 'კლასის რედაქტირება' },
    ];

    const allStudentItems = [
        { icon: MdAdd, label: 'მოსწავლის დამატება' },
        { icon: FaUserGraduate, label: 'მოსწავლეთა სია' },
    ];
    const studentItems = adminRole === 'secretary' 
        ? allStudentItems.filter(item => item.label === 'მოსწავლეთა სია')
        : allStudentItems;

    const teacherItems: { icon: IconType; label: string }[] = [
        { icon: MdAdd, label: 'მასწავლებლის დამატება' },
        { icon: FaChalkboardTeacher, label: 'მასწავლებლების სია' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/');
    };

    const handleDeleteStudent = async (studentId: string) => {
        const performDelete = async () => {
            try {
                const res = await fetch(`/api/student/delete/${studentId}`, { method: 'DELETE' });
                if (res.ok) {
                    showPopup('მოსწავლე წარმატებით წაიშალა.', 'success');
                    if (classFilter) fetchStudents(classFilter, parallelFilter);
                } else {
                    showPopup('მოსწავლის წაშლა ვერ მოხერხდა.', 'error');
                }
            } catch (err) {
                showPopup('მოსწავლის წაშლისას მოხდა შეცდომა.', 'error');
            }
            setConfirmation(null);
        };

        setConfirmation({
            message: 'დარწმუნებული ხართ, რომ გსურთ ამ მოსწავლის წაშლა?',
            onConfirm: performDelete,
        });
    };

    const handleResetPassword = async (studentId: string) => {
        const performReset = async () => {
            try {
                const res = await fetch('/api/student/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: studentId }),
                });
                if (res.ok) {
                    showPopup('პაროლი წარმატებით აღდგა.', 'success');
                } else {
                    const data = await res.json();
                    showPopup(`პაროლის აღდგენა ვერ მოხერხდა: ${data.message}`, 'error');
                }
            } catch (err) {
                showPopup('პაროლის აღდგენისას მოხდა შეცდომა.', 'error');
            }
            setConfirmation(null);
        };

        setConfirmation({
            message: 'დარწმუნებული ხართ, რომ გსურთ ამ მოსწავლის პაროლის აღდგენა?',
            onConfirm: performReset,
        });
    };

    const handleEditStudent = (student: Student) => {
        setEditingStudent(student);
        setIsEditModalOpen(true);
    };

    const handleUpdateStudent = async (updatedStudent: Student) => {
        try {
            const cleanStudent = {
                _id: updatedStudent._id, // optional, based on backend needs
                name: updatedStudent.name,
                surname: updatedStudent.surname,
                user_ID: updatedStudent.user_ID,
                class_id: updatedStudent.classInfo?._id || "",
            };

            const res = await fetch(`/api/student/update/${updatedStudent._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanStudent),
                credentials: 'include', // only if your backend uses cookies/sessions
            });

            if (res.ok) {
                showPopup('მოსწავლე წარმატებით განახლდა.', 'success');
                setIsEditModalOpen(false);
                if (classFilter) fetchStudents(classFilter, parallelFilter);
            } else {
                const resData = await res.json().catch(() => null);
                const errorMsg = resData?.message || 'მოსწავლის განახლება ვერ მოხერხდა.';
                showPopup(errorMsg, 'error');
            }
        } catch (err) {
            console.error(err);
            showPopup('მოსწავლის განახლებისას მოხდა შეცდომა.', 'error');
        }
    };


    const handleDeleteTeacher = async (teacherId: string) => {
        const performDelete = async () => {
            try {
                const res = await fetch(`/api/teacher/delete/${teacherId}`, { method: 'DELETE' });
                if (res.ok) {
                    showPopup('მასწავლებელი წარმატებით წაიშალა.', 'success');
                    fetchTeachers();
                } else {
                    showPopup('მასწავლებლის წაშლა ვერ მოხერხდა.', 'error');
                }
            } catch (err) {
                showPopup('მასწავლებლის წაშლისას მოხდა შეცდომა.', 'error');
            }
            setConfirmation(null);
        };

        setConfirmation({
            message: 'დარწმუნებული ხართ, რომ გსურთ ამ მასწავლებლის წაშლა?',
            onConfirm: performDelete,
        });
    };

    const handleEditTeacher = (teacher: Teacher) => {
        setEditingTeacher(teacher);
        setIsEditTeacherModalOpen(true);
    };

    const handleUpdateTeacher = async (updatedTeacher: Teacher) => {
        try {
            const res = await fetch(`/api/teacher/update/${updatedTeacher._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTeacher),
            });
            if (res.ok) {
                showPopup('მასწავლებელი წარმატებით განახლდა.', 'success');
                setIsEditTeacherModalOpen(false);
                fetchTeachers();
            } else {
                showPopup('მასწავლებლის განახლება ვერ მოხერხდა.', 'error');
            }
        } catch (err) {
            showPopup('მასწავლებლის განახლებისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleResetTeacherPassword = async (teacherId: string) => {
        const performReset = async () => {
            try {
                const res = await fetch('/api/teacher/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: teacherId }),
                });
                if (res.ok) {
                    showPopup('პაროლი წარმატებით აღდგა.', 'success');
                } else {
                    const data = await res.json();
                    showPopup(`პაროლის აღდგენა ვერ მოხერხდა: ${data.message}`, 'error');
                }
            } catch (err) {
                showPopup('პაროლის აღდგენისას მოხდა შეცდომა.', 'error');
            }
            setConfirmation(null);
        };

        setConfirmation({
            message: 'დარწმუნებული ხართ, რომ გსურთ ამ მასწავლებლის პაროლის აღდგენა?',
            onConfirm: performReset,
        });
    };

    const handleCardClick = (label: string) => {
        switch (label) {
            case 'მოსწავლეები':
                setView('studentOptions');
                break;
            case 'მასწავლებლები':
                setView('teacherOptions');
                break;
            case 'კლასი':
                setView('classOptions');
                break;
            case 'ისტორია':
                fetchAllClasses();
                setView('classHistoryGrades');
                break;
            case 'სტატისტიკა':
                setView('statistics');
                break;
            case 'ექსტერნი':
                setView('externals');
                break;
            case 'უწყისი':
                setView('reportGeneration');
                break;
            case 'ჟურნალის გახსნა/დახურვა':
                fetchJournalTeachers();
                setView('journalOpen');
                break;
            case 'გაკვეთილების კალენდარი':
                setView('manageCalendars');
                break;
            case 'დღის სკანირება':
                setView('dayScan');
                break;
            case 'განაცხადები':
                setView('applications');
                break;
            case 'პედსაბჭოს დანიშვნა':
                setView('pedCouncilMeetings');
                break;
            case 'პერსონალი':
                setView('staffManagement');
                break;
            // Student sub-options
            case 'მოსწავლის დამატება':
                fetchClassesAndShowForm();
                break;
            case 'მოსწავლეთა სია':
                fetchAllClasses();
                setStudents([]);
                setClassFilter(null);
                setParallelFilter(null);
                setView('studentList');
                break;
            // Teacher sub-options
            case 'მასწავლებლის დამატება':
                setView('addTeacherForm');
                break;
            case 'მასწავლებლების სია':
                fetchTeachers();
                setView('teacherList');
                break;
            // Class sub-options
            case 'კლასის დამატება':
                setView('addClassForm');
                break;
            case 'საგნის დამატება':
                setView('addSubjectForm');
                break;
            case 'კლასის რედაქტირება':
                setView('editClass');
                break;
            case 'განცხადებები':
                setView('noticeBoard');
                break;
            case 'ჩატი':
                setView('chat');
                break;
            default:
                break;
        }
    };

    const handleBackClick = () => {
        if (view === 'journalOpen') {
            setView('main');
        } else if (view === 'studentOptions' || view === 'teacherOptions' || view === 'classOptions' || view === 'addClassForm' || view === 'addSubjectForm' || view === 'editClass' || view === 'noticeBoard' || view === 'chat' || view === 'applications') {
            setView('main');
        } else if (view === 'studentList' || view === 'addStudentForm') {
            setView('studentOptions');
        } else if (view === 'teacherList' || view === 'addTeacherForm') {
            setView('teacherOptions');
        } else if (view === 'classHistoryGrades') {
            setView('main');
        } else if (view === 'classHistoryParallels') {
            setView('classHistoryGrades');
        } else if (view === 'classHistoryTable') {
            setView('classHistoryParallels');
        } else if (view === 'detailedGradeHistory') {
            if (selectedSubjectForHistory) {
                setView('subjectList');
                setSelectedSubjectForHistory(null);
            } else {
                setView('classHistoryParallels');
                setSelectedClassForHistory(null);
            }
        } else if (view === 'subjectList') {
            setView('classHistoryParallels');
            setSelectedClassForHistory(null);
        } else if (view === 'manageCalendars') {
            setView('main');
        } else if (view === 'statistics') {
            setView('main');
        } else if (view === 'externals') {
            setView('main');
        } else if (view === 'externalsSubjectList') {
            setView('externals');
            setSelectedClassForExternals(null);
        } else if (view === 'externalsMarkInput') {
            setView('externalsSubjectList');
            setSelectedSubjectForHistory(null);
        } else if (view === 'reportGeneration') {
            if (showReportGenerator) {
                setShowReportGenerator(false);
                setSelectedClassForReport(null);
            } else {
                setView('main');
            }
        } else if (view === 'studentCard') {
            setSelectedStudentForCard(null);
            setView('studentList');
        }
    };

    const fetchClassesAndShowForm = async () => {
        try {
            const res = await fetch('/api/classes');
            if (res.ok) {
                const data = await res.json();
                setClasses(data);
                setView('addStudentForm');
            } else {
                showPopup('კლასების სიის ჩატვირთვა ვერ მოხერხდა.', 'error');
            }
        } catch (err) {
            showPopup('კლასების სიის ჩატვირთვისას მოხდა შეცდომა.', 'error');
        }
    };

    const fetchStudents = async (grade: number, parallel?: string | null) => {
        try {
            const qs = parallel ? `?parallel=${encodeURIComponent(parallel)}` : '';
            const res = await fetch(`/api/student/grade/${grade}${qs}`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            } else {
                showPopup('მოსწავლეების სიის ჩატვირთვა ვერ მოხერხდა.', 'error');
            }
        } catch (err) {
            showPopup('მოსწავლეების სიის ჩატვირთვისას მოხდა შეცდომა.', 'error');
        }
    };

    const fetchTeachers = async () => {
        try {
            const res = await fetch('/api/teacher/all');
            if (res.ok) {
                const data = await res.json();
                setTeachers(data);
            } else {
                showPopup('მასწავლებლების სიის ჩატვირთვა ვერ მოხერხდა.', 'error');
            }
        } catch (err) {
            showPopup('მასწავლებლების სიის ჩატვირთვისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const studentData = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/admin/student/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData),
            });

            if (res.ok) {
                showPopup('მოსწავლე წარმატებით დაემატა.', 'success');
                setView('studentOptions');
                if (classFilter) fetchStudents(classFilter, parallelFilter);
            } else {
                const data = await res.json();
                showPopup(`მოსწავლის დამატება ვერ მოხერხდა: ${data.message}`, 'error');
            }
        } catch (err) {
            showPopup('მოსწავლის დამატებისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleAddTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const teacherData = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/teacher/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teacherData),
            });

            if (res.ok) {
                showPopup('მასწავლებელი წარმატებით დაემატა.', 'success');
                setView('teacherOptions');
                fetchTeachers();
            } else {
                const data = await res.json();
                showPopup(`მასწავლებლის დამატება ვერ მოხერხდა: ${data.message}`, 'error');
            }
        } catch (err) {
            showPopup('მასწავლებლის დამატებისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleAddClass = async (className: string) => {
        try {
            const res = await fetch('/api/class/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classname: className, subjects: [] }),
            });
            if (res.ok) {
                showPopup('კლასი წარმატებით დაემატა.', 'success');
                setView('classOptions');
                fetchAllClasses();
            } else {
                const resBody = await res.text();
                try {
                    const data = JSON.parse(resBody);
                    showPopup(`კლასის დამატება ვერ მოხერხდა: ${data.message || 'Unknown error'}`, 'error');
                } catch {
                    showPopup(`კლასის დამატება ვერ მოხერხდა: ${resBody}`, 'error');
                }
            }
        } catch (err) {
            showPopup('კლასის დამატებისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleAddSubject = async (subjectName: string) => {
        try {
            const res = await fetch('/api/subject/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: subjectName }),
            });
            if (res.ok) {
                showPopup('საგანი წარმატებით დაემატა.', 'success');
                setView('classOptions');
                fetchAllSubjects();
            } else {
                const resBody = await res.text();
                try {
                    const data = JSON.parse(resBody);
                    showPopup(`საგნის დამატება ვერ მოხერხდა: ${data.message || 'Unknown error'}`, 'error');
                } catch {
                    showPopup(`საგნის დამატება ვერ მოხერხდა: ${resBody}`, 'error');
                }
            }
        } catch (err) {
            showPopup('საგნის დამატებისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleUpdateClass = async (classData: Class) => {
        try {
            const res = await fetch('/api/class/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(classData),
            });
            if (res.ok) {
                showPopup('კლასი წარმატებით განახლდა.', 'success');
                setView('classOptions');
                fetchAllClasses();
            } else {
                const resBody = await res.text();
                try {
                    const data = JSON.parse(resBody);
                    showPopup(`კლასის განახლება ვერ მოხერხდა: ${data.message || 'Unknown error'}`, 'error');
                } catch {
                    showPopup(`კლასის განახლება ვერ მოხერხდა: ${resBody}`, 'error');
                }
            }
        } catch (err) {
            showPopup('კლასის განახლებისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleAddSubjectsToClass = async (classId: string, subjects: string[]) => {
        try {
            const res = await fetch('/api/class/add-subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ class_id: classId, subjects }),
            });
            if (res.ok) {
                showPopup('საგნები წარმატებით დაემატა.', 'success');
                setView('classOptions');
                fetchAllClasses();
            } else {
                const resBody = await res.text();
                try {
                    const data = JSON.parse(resBody);
                    showPopup(`საგნების დამატება ვერ მოხერხდა: ${data.message || 'Unknown error'}`, 'error');
                } catch {
                    showPopup(`საგნების დამატება ვერ მოხერხდა: ${resBody}`, 'error');
                }
            }
        } catch (err) {
            showPopup('საგნების დამატებისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleGradeClick = (grade: number) => {
        setClassFilter(grade);
        setParallelFilter(null);
        fetchStudents(grade);
    };

    const handleParallelClick = (parallel: string | null) => {
        setParallelFilter(parallel);
    };

    const filteredStudents = students.filter(student => {
        if (!student.classInfo?.classname) return false;
        const grade = parseInt(student.classInfo.classname);
        const parallel = student.classInfo.classname.slice(-1);
        if (classFilter && grade !== classFilter) return false;
        if (parallelFilter && parallel !== parallelFilter) return false;
        return true;
    });

    const seedSubjects = async () => {
        try {
            const res = await fetch('/api/seed-subjects', { method: 'POST' });
            if (res.ok) {
                showPopup('საგნები წარმატებით დაემატა.', 'success');
                fetchAllSubjects();
            } else {
                showPopup('საგნების დამატება ვერ მოხერხდა.', 'error');
            }
        } catch (err) {
            showPopup('საგნების დამატებისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleHistoryGradeClick = (grade: number) => {
        setSelectedHistoryGrade(grade);
        fetchClassHistoryParallels(grade);
        setView('classHistoryParallels');
    };

    const handleHistoryParallelClick = (parallel: string) => {
        setSelectedHistoryParallel(parallel);
        if (selectedHistoryGrade) {
            // Find the class for this grade and parallel
            const classObj = classes.find((cls: any) => {
                const match = cls.classname.match(/^([0-9]+)([ა-ჰ])$/);
                return match && parseInt(match[1], 10) === selectedHistoryGrade && match[2] === parallel;
            });

            if (classObj) {
                setSelectedClassForHistory({ id: classObj._id, name: classObj.classname });
                setView('subjectList');
            } else {
                fetchClassHistoryTable(selectedHistoryGrade, parallel);
                setView('classHistoryTable');
            }
        }
    };

    const handleHistoryBack = () => {
        if (view === 'classHistoryParallels') {
            setView('classHistoryGrades');
        } else if (view === 'classHistoryTable') {
            setView('classHistoryParallels');
        } else {
            setView('main');
        }
    };

    const handleViewClassDetails = (className: string) => {
        const classObj = classes.find((cls: any) => cls.classname === className);
        if (classObj) {
            setSelectedClassForHistory({ id: classObj._id, name: classObj.classname });
            setView('detailedGradeHistory');
        }
    };

    const handleSubjectClick = (subjectId: string, subjectName: string) => {
        setSelectedSubjectForHistory({ id: subjectId, name: subjectName });
        setView('detailedGradeHistory');
    };

    const handleExternalsClassClick = (classId: string, className: string) => {
        setSelectedClassForExternals({ id: classId, name: className });
        setView('externalsSubjectList');
    };

    const handleExternalsSubjectClick = (subjectId: string, subjectName: string) => {
        setSelectedSubjectForHistory({ id: subjectId, name: subjectName });
        setView('externalsMarkInput');
    };

    const handleViewChange = (newView: string) => setView(newView);

    const handleViewStudentCard = (student: Student) => {
        setSelectedStudentForCard(student);
        setView('studentCard');
    };

    const DayScanPage: React.FC = () => {
        const [selectedClassId, setSelectedClassId] = useState<string>('');
        const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
        const [loading, setLoading] = useState(false);
        const [results, setResults] = useState<any[]>([]);
        const [scanned, setScanned] = useState(false);
        const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

        // Sort classes in Georgian order
        const sortedClasses = [...classes].sort((a, b) => {
            const gradeA = parseInt(a.classname.match(/\d+/)?.[0] || '0', 10);
            const gradeB = parseInt(b.classname.match(/\d+/)?.[0] || '0', 10);
            if (gradeA !== gradeB) return gradeA - gradeB;

            const letterA = a.classname.match(/[ა-ჰa-zA-Z]/)?.[0] || '';
            const letterB = b.classname.match(/[ა-ჰa-zA-Z]/)?.[0] || '';
            return letterA.localeCompare(letterB, 'ka');
        });

        const toggleRow = (subjectId: string) => {
            setExpandedRows(prev => ({
                ...prev,
                [subjectId]: !prev[subjectId]
            }));
        };

        const handleScan = async () => {
            if (!selectedClassId) {
                alert('გთხოვთ აირჩიოთ კლასი');
                return;
            }
            setLoading(true);
            setScanned(true);
            setExpandedRows({});
            try {
                // Fetch students of selected class
                const studentsRes = await fetch('/api/student/all');
                const allStus = await studentsRes.json();
                const filteredStus = allStus.filter((s: any) => s.classInfo && s.classInfo._id === selectedClassId);

                // Fetch all grades/attendance records for this class
                const gradesRes = await fetch(`/api/grades?class_id=${selectedClassId}`);
                const allGrades = await gradesRes.json();

                // Filter grades by date
                const dayGrades = allGrades.filter((g: any) => g.date === selectedDate);

                // Group grades by subject_id
                const gradesBySubject: Record<string, any[]> = {};
                dayGrades.forEach((g: any) => {
                    if (!gradesBySubject[g.subject_id]) {
                        gradesBySubject[g.subject_id] = [];
                    }
                    gradesBySubject[g.subject_id].push(g);
                });

                // Get all teachers for name mapping
                const teachersRes = await fetch('/api/teacher/all');
                const allTeachers = await teachersRes.json();

                // Evaluate attendance for each subject
                const evaluations = Object.entries(gradesBySubject).map(([subjId, subjGrades]) => {
                    // Group by student_id to get the unique attendance
                    const studentCheckedMap: Record<string, boolean> = {};
                    subjGrades.forEach(g => {
                        studentCheckedMap[g.student_id] = g.checked;
                    });

                    const presentCount = Object.values(studentCheckedMap).filter(c => c === true).length;
                    const absentCount = Object.values(studentCheckedMap).filter(c => c === false).length;
                    const total = presentCount + absentCount;
                    const rate = total > 0 ? (presentCount / total) * 100 : 0;

                    const absentStudentIds = Object.entries(studentCheckedMap)
                        .filter(([_, c]) => c === false)
                        .map(([sid]) => sid);

                    const absentStudentNames = absentStudentIds.map(sid => {
                        const stu = filteredStus.find((s: any) => s._id === sid);
                        return stu ? `${stu.name} ${stu.surname}` : 'უცნობი მოსწავლე';
                    });

                    const absentKey = [...absentStudentIds].sort().join(',');

                    const subjectName = subjects.find(s => s._id === subjId)?.name || 'უცნობი საგანი';
                    
                    const teacherId = subjGrades[0]?.teacher_id;
                    const teacherObj = allTeachers.find((t: any) => t._id === teacherId);
                    const teacherName = teacherObj ? `${teacherObj.name} ${teacherObj.surname}` : 'უცნობი მასწავლებელი';

                    const gradesList = subjGrades.map(g => {
                        const stu = filteredStus.find((s: any) => s._id === g.student_id);
                        const studentName = stu ? `${stu.name} ${stu.surname}` : 'უცნობი მოსწავლე';
                        return {
                            studentId: g.student_id,
                            studentName,
                            point: g.point,
                            pointType: g.pointType,
                            checked: g.checked,
                            time: g.time
                        };
                    }).sort((a, b) => a.studentName.localeCompare(b.studentName, 'ka'));

                    return {
                        subjectId: subjId,
                        subjectName,
                        teacherName,
                        presentCount,
                        absentCount,
                        total,
                        rate,
                        absentStudentIds,
                        absentStudentNames,
                        absentKey,
                        gradesList
                    };
                });

                // Detect discrepancies
                if (evaluations.length >= 2) {
                    const keyFrequencies: Record<string, number> = {};
                    evaluations.forEach(ev => {
                        keyFrequencies[ev.absentKey] = (keyFrequencies[ev.absentKey] || 0) + 1;
                    });

                    let majorityKey = '';
                    let maxFreq = 0;
                    Object.entries(keyFrequencies).forEach(([key, freq]) => {
                        if (freq > maxFreq) {
                            maxFreq = freq;
                            majorityKey = key;
                        }
                    });

                    const finalResults = evaluations.map(ev => ({
                        ...ev,
                        isDiscrepancy: ev.absentKey !== majorityKey
                    }));
                    setResults(finalResults);
                } else {
                    const finalResults = evaluations.map(ev => ({
                        ...ev,
                        isDiscrepancy: false
                    }));
                    setResults(finalResults);
                }
            } catch (err) {
                console.error(err);
                showPopup('სკანირებისას მოხდა შეცდომა.', 'error');
            } finally {
                setLoading(false);
            }
        };

        const hasAnyDiscrepancy = results.some(r => r.isDiscrepancy);

        return (
            <div className="admin-view-container animate-fade-in-down" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
                <button onClick={() => setView('main')} className="admin-back-btn" style={{ marginBottom: '24px' }}>
                    უკან დაბრუნება
                </button>

                <div className="admin-form-container" style={{ maxWidth: 'none', marginBottom: '30px', padding: '25px' }}>
                    <h2 className="admin-form-title">დღის სკანირება</h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
                        <div className="admin-form-group" style={{ margin: 0 }}>
                            <label className="admin-label">კლასი:</label>
                            <select className="admin-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                                <option value="">აირჩიეთ კლასი</option>
                                {sortedClasses.map(cls => (
                                    <option key={cls._id} value={cls._id}>{cls.classname}</option>
                                ))}
                            </select>
                        </div>

                        <div className="admin-form-group" style={{ margin: 0 }}>
                            <label className="admin-label">თარიღი:</label>
                            <input
                                type="date"
                                className="admin-select"
                                style={{ colorScheme: 'dark', color: 'white' }}
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                            />
                        </div>

                        <button className="admin-submit-btn" onClick={handleScan} disabled={loading} style={{ height: '44px', margin: 0 }}>
                            {loading ? 'მიმდინარეობს სკანირება...' : 'სკანირება'}
                        </button>
                    </div>
                </div>

                {scanned && !loading && (
                    <div className="admin-list-container animate-zoom-in" style={{ padding: '24px' }}>
                        {results.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.6)' }}>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>მონაცემები ვერ მოიძებნა</div>
                                <div>არჩეულ კლასში მითითებულ დღეს ნიშნები ან სწრებადობის ჩანაწერები არ ფიქსირდება.</div>
                            </div>
                        ) : (
                            <>
                                {hasAnyDiscrepancy ? (
                                    <div style={{ 
                                        background: 'rgba(244, 67, 54, 0.1)', 
                                        border: '1px solid rgba(244, 67, 54, 0.3)', 
                                        borderRadius: '12px', 
                                        padding: '16px 20px', 
                                        marginBottom: '24px',
                                        color: '#ff8a80',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                    }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            ⚠️ ყურადღება! აღმოჩენილია სწრებადობის შეუსაბამობა
                                        </div>
                                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                                            ზოგიერთ საგანში დაფიქსირებულია განსხვავებული სწრებადობის მაჩვენებელი. გთხოვთ გადაამოწმოთ ქვემოთ მონიშნული საგნები.
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ 
                                        background: 'rgba(76, 175, 80, 0.1)', 
                                        border: '1px solid rgba(76, 175, 80, 0.3)', 
                                        borderRadius: '12px', 
                                        padding: '16px 20px', 
                                        marginBottom: '24px',
                                        color: '#b9f6ca',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                    }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            ✅ სწრებადობა თანხვედრაშია
                                        </div>
                                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                                            ყველა საგანში დაფიქსირებულია იდენტური სწრებადობის მაჩვენებლები.
                                        </div>
                                    </div>
                                )}

                                <div className="admin-table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>საგანი</th>
                                                <th>მასწავლებელი</th>
                                                <th style={{ textAlign: 'center' }}>სულ შეფასდა</th>
                                                <th style={{ textAlign: 'center' }}>დაესწრო</th>
                                                <th style={{ textAlign: 'center' }}>გააცდინა</th>
                                                <th style={{ textAlign: 'center' }}>სწრებადობა (%)</th>
                                                <th style={{ textAlign: 'center' }}>დეტალები</th>
                                                <th style={{ textAlign: 'center' }}>სტატუსი</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.map((r, idx) => {
                                                const isExpanded = !!expandedRows[r.subjectId];
                                                return (
                                                    <React.Fragment key={r.subjectId}>
                                                        <tr style={r.isDiscrepancy ? { backgroundColor: 'rgba(239, 68, 68, 0.08)' } : {}}>
                                                            <td style={{ fontWeight: 700 }}>{r.subjectName}</td>
                                                            <td>{r.teacherName}</td>
                                                            <td style={{ textAlign: 'center' }}>{r.total}</td>
                                                            <td style={{ textAlign: 'center', color: '#4caf50', fontWeight: 'bold' }}>{r.presentCount}</td>
                                                            <td style={{ textAlign: 'center', color: '#f44336', fontWeight: 'bold' }}>{r.absentCount}</td>
                                                            <td style={{ textAlign: 'center', fontWeight: '800' }}>
                                                                {r.rate.toFixed(0)}%
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <button 
                                                                    className="admin-table-action-btn" 
                                                                    style={{ 
                                                                        backgroundColor: isExpanded ? '#64748b' : selectedColor,
                                                                        padding: '6px 14px',
                                                                        fontSize: '12px'
                                                                    }} 
                                                                    onClick={() => toggleRow(r.subjectId)}
                                                                >
                                                                    {isExpanded ? 'ჩაკეცვა' : 'გაშლა'}
                                                                </button>
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                {r.isDiscrepancy ? (
                                                                    <span className="status-badge low" style={{ textTransform: 'none', fontSize: '11px', padding: '4px 8px' }}>
                                                                        განსხვავებული
                                                                    </span>
                                                                ) : (
                                                                    <span className="status-badge high" style={{ textTransform: 'none', fontSize: '11px', padding: '4px 8px' }}>
                                                                        ნორმალური
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        {isExpanded && (
                                                            <tr>
                                                                <td colSpan={8} style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                        <div style={{ fontWeight: 'bold', color: selectedColor, fontSize: '14px', textTransform: 'none' }}>
                                                                            ჩაწერილი ნიშნები და სწრებადობა ({r.subjectName}):
                                                                        </div>
                                                                        <div className="admin-table-wrapper" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                                                                            <table className="admin-table" style={{ margin: 0, background: 'rgba(0,0,0,0.1)' }}>
                                                                                <thead>
                                                                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                                                        <th>მოსწავლე</th>
                                                                                        <th style={{ textAlign: 'center' }}>სწრებადობა</th>
                                                                                        <th style={{ textAlign: 'center' }}>ნიშანი</th>
                                                                                        <th style={{ textAlign: 'center' }}>ტიპი</th>
                                                                                        <th style={{ textAlign: 'center' }}>დრო</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {r.gradesList.map((g: any, gIdx: number) => (
                                                                                        <tr key={gIdx}>
                                                                                            <td style={{ fontWeight: 600 }}>{g.studentName}</td>
                                                                                            <td style={{ textAlign: 'center' }}>
                                                                                                {g.checked ? (
                                                                                                    <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✓ დაესწრო</span>
                                                                                                ) : (
                                                                                                    <span style={{ color: '#f44336', fontWeight: 'bold' }}>✗ გააცდინა</span>
                                                                                                )}
                                                                                            </td>
                                                                                            <td style={{ textAlign: 'center', fontWeight: '800', fontSize: '15px' }}>
                                                                                                {g.point >= 0 ? (
                                                                                                    <span style={{ color: g.point >= 9 ? '#4caf50' : g.point >= 7 ? '#ff9800' : '#f44336' }}>
                                                                                                        {g.point}
                                                                                                    </span>
                                                                                                ) : (
                                                                                                    <span style={{ opacity: 0.5 }}>-</span>
                                                                                                )}
                                                                                            </td>
                                                                                            <td style={{ textAlign: 'center', opacity: 0.8, fontSize: '13px' }}>
                                                                                                {g.pointType === 1 ? 'საშინაო' : g.pointType === 2 ? 'საკლასო' : g.pointType === 3 ? 'შემაჯამებელი' : g.pointType === 4 ? 'ექსტერნი' : 'დასწრება'}
                                                                                            </td>
                                                                                            <td style={{ textAlign: 'center', opacity: 0.5, fontSize: '13px' }}>{g.time || '-'}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        switch (view) {
            case 'main':
                return <AdminDashboard items={dashboardItems} onCardClick={handleCardClick} boxWidth={boxWidth} selectedColor={selectedColor} BoxTitle={BoxTitle} />;
            case 'studentOptions':
                return <AdminDashboard items={studentItems} onCardClick={handleCardClick} boxWidth={boxWidth} selectedColor={selectedColor} BoxTitle={BoxTitle} onBackClick={handleBackClick} />;
            case 'teacherOptions':
                return <AdminDashboard items={teacherItems} onCardClick={handleCardClick} boxWidth={boxWidth} selectedColor={selectedColor} BoxTitle={BoxTitle} onBackClick={handleBackClick} />;
            case 'classOptions':
                return <AdminDashboard items={classItems} onCardClick={handleCardClick} boxWidth={boxWidth} selectedColor={selectedColor} BoxTitle={BoxTitle} onBackClick={handleBackClick} />;
            case 'studentList':
                return <StudentList students={filteredStudents} onEditStudent={handleEditStudent} onDeleteStudent={handleDeleteStudent} onResetPassword={handleResetPassword} onBackClick={handleBackClick} onGradeClick={handleGradeClick} onParallelFilterClick={handleParallelClick} classFilter={classFilter} parallelFilter={parallelFilter} selectedColor={selectedColor} classes={classes} logoutButtonStyle={logoutButtonStyle} onViewStudentCard={handleViewStudentCard} />;
            case 'addStudentForm':
                return <AddStudentForm onAddStudent={handleAddStudent} onBackClick={() => setView('studentOptions')} classes={classes} selectedColor={selectedColor} logoutButtonStyle={logoutButtonStyle} />;
            case 'teacherList':
                return <TeacherList teachers={teachers} onEditTeacher={handleEditTeacher} onDeleteTeacher={handleDeleteTeacher} onResetPassword={handleResetTeacherPassword} onBackClick={handleBackClick} selectedColor={selectedColor} logoutButtonStyle={logoutButtonStyle} />;
            case 'addTeacherForm':
                return <AddTeacherForm onAddTeacher={handleAddTeacher} onCancel={() => setView('teacherOptions')} />;
            case 'addClassForm':
                return <AddClassForm onAddClass={handleAddClass} onCancel={() => setView('classOptions')} />;
            case 'addSubjectForm':
                return <AddSubjectForm onAddSubject={handleAddSubject} onCancel={() => setView('classOptions')} subjects={(subjects || []).map(s => s.name)} />;
            case 'editClass':
                return <EditClassForm onUpdateClass={handleUpdateClass} onCancel={() => setView('classOptions')} classes={classes} teachers={teachers} subjects={subjects} />;
            case 'classHistoryGrades':
                return (
                    <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
                        <button className="admin-back-btn" onClick={handleHistoryBack} style={{ marginBottom: '20px' }}>
                            <ArrowLeftIcon size={20} /> უკან
                        </button>
                        <h2 style={{ color: 'white', width: '100%', textAlign: 'center', marginBottom: '28px', fontSize: '24px', fontWeight: 800 }}>აირჩიეთ კლასი</h2>
                        {Array.from(new Set(
                            classes
                                .map(c => {
                                    const match = c.classname.match(/^([0-9]+)([ა-ჰ])$/);
                                    return match ? parseInt(match[1], 10) : null;
                                })
                                .filter((g): g is number => g !== null)
                        )).sort((a, b) => a - b).map(grade => (
                            <div 
                                key={grade} 
                                className="admin-card animate-zoom-in"
                                style={{ 
                                    width: '120px', 
                                    height: '120px', 
                                    fontSize: '36px', 
                                    fontWeight: '800', 
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    justifyContent: 'center',
                                    padding: 0,
                                    minHeight: 'auto'
                                }} 
                                onClick={() => handleHistoryGradeClick(grade)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)`;
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                    e.currentTarget.style.boxShadow = `0 8px 24px ${selectedColor}44`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
                                }}
                            >
                                {grade}
                            </div>
                        ))}
                    </div>
                );
            case 'classHistoryParallels':
                return (
                    <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
                        <button className="admin-back-btn" onClick={handleHistoryBack} style={{ marginBottom: '20px' }}>
                            <ArrowLeftIcon size={20} /> უკან
                        </button>
                        <h2 style={{ color: 'white', width: '100%', textAlign: 'center', marginBottom: '28px', fontSize: '24px', fontWeight: 800 }}>აირჩიეთ პარალელი</h2>
                        {historyParallels.length > 0 ? (
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '20px',
                                width: '100%',
                                maxWidth: '1200px',
                                justifyContent: 'center'
                            }}>
                                {historyParallels.sort((a, b) => {
                                    // Georgian alphabet order: ა, ბ, გ, დ, ე, ვ, ზ, თ, ი, კ, ლ, მ, ნ, ო, პ, ჟ, რ, ს, ტ, უ, ფ, ქ, ღ, ყ, შ, ჩ, ც, ძ, წ, ჭ, ხ, ჯ, ჰ
                                    const georgianOrder = 'აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ';
                                    const aIndex = georgianOrder.indexOf(a);
                                    const bIndex = georgianOrder.indexOf(b);
                                    return aIndex - bIndex;
                                }).map(parallel => (
                                    <div 
                                        key={parallel} 
                                        className="admin-card animate-zoom-in"
                                        style={{
                                            minHeight: '180px',
                                            width: '280px',
                                            padding: '24px',
                                            justifyContent: 'center',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            textAlign: 'center',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px'
                                        }}
                                        onClick={() => handleHistoryParallelClick(parallel)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)`;
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                            e.currentTarget.style.transform = 'translateY(-6px)';
                                            e.currentTarget.style.boxShadow = `0 12px 30px ${selectedColor}44`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
                                        }}
                                    >
                                        <div style={{ fontSize: '32px', fontWeight: '800', color: 'white' }}>
                                            {selectedHistoryGrade}{parallel}
                                        </div>
                                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {historyParallelTutors[parallel] || 'დამრიგებელი არ არის'}
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>
                                            მოსწავლეები: {historyParallelCounts[parallel] ?? 0}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: 'white', fontSize: '24px', width: '100%', textAlign: 'center' }}>პარალელები ვერ მოიძებნა</div>
                        )}
                    </div>
                );
            case 'classHistoryTable':
                return <ClassHistoryTable
                    classHistory={historyTable}
                    onBackClick={handleHistoryBack}
                    selectedColor={selectedColor}
                    logoutButtonStyle={logoutButtonStyle}
                    onViewDetails={handleViewClassDetails}
                />;
            case 'journalOpen':
                return (
                    <div className="admin-list-container animate-zoom-in" style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
                        <button className="admin-back-btn" onClick={handleBackClick} style={{ marginBottom: '24px' }}>
                            <ArrowLeftIcon size={20} /> უკან
                        </button>
                        <h2 className="admin-view-title" style={{ marginBottom: '24px', textAlign: 'center' }}>ჟურნალის გახსნა</h2>
                        {loadingJournal ? <div style={{ color: 'white', textAlign: 'center', marginTop: '20px' }}>იტვირთება...</div> : (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>სახელი</th>
                                        <th>გვარი</th>
                                        <th>პ/ნ</th>
                                        <th>ქულების ჩაწერის დაწყების თარიღი</th>
                                        <th style={{ textAlign: 'center' }}>მოქმედება</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {journalTeachers.map(t => (
                                        <tr key={t._id}>
                                            <td style={{ fontWeight: 600 }}>{t.name}</td>
                                            <td style={{ fontWeight: 600 }}>{t.surname}</td>
                                            <td>{t.user_ID}</td>
                                            <td>
                                                <input
                                                    type="date"
                                                    value={customDates[t._id] ?? t.gradeEntryStartDate}
                                                    onChange={e => handleCustomDateChange(t._id, e.target.value)}
                                                    className="admin-select"
                                                    style={{ colorScheme: 'dark', color: 'white', padding: '8px 12px', fontSize: '14px', width: 'auto' }}
                                                />
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button 
                                                        onClick={() => handleSetDefaultStartDate(t._id)} 
                                                        disabled={updatingTeacherId === t._id} 
                                                        className="admin-table-action-btn"
                                                        style={{ background: selectedColor }}
                                                    >
                                                        {updatingTeacherId === t._id ? '...' : 'სტანდარტული'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleSaveCustomDate(t._id)} 
                                                        disabled={updatingTeacherId === t._id || !customDates[t._id]} 
                                                        className="admin-table-action-btn"
                                                        style={{ background: '#4caf50' }}
                                                    >
                                                        {updatingTeacherId === t._id ? '...' : 'გახსნა'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            case 'manageCalendars':
                return (
                    <AdminCalendarManager
                        teachers={teachers}
                        classes={classes}
                        subjects={subjects}
                        onBack={() => setView('main')}
                        showPopup={showPopup}
                    />
                );
            case 'subjectList':
                return selectedClassForHistory ? (
                    <SubjectList
                        classId={selectedClassForHistory.id}
                        className={selectedClassForHistory.name}
                        selectedColor={selectedColor}
                        logoutButtonStyle={logoutButtonStyle}
                        onBackClick={handleBackClick}
                        onSubjectClick={handleSubjectClick}
                        classSwitcher={<ClassSwitcher currentClassId={selectedClassForHistory.id} viewType="history" titleSuffix=" - საგნები" />}
                    />
                ) : (
                    <div style={{ color: 'white', textAlign: 'center' }}>კლასი ვერ მოიძებნა</div>
                );
            case 'detailedGradeHistory':
                return selectedClassForHistory ? (
                    <DetailedGradeHistory
                        classId={selectedClassForHistory.id}
                        className={selectedClassForHistory.name}
                        subjectId={selectedSubjectForHistory?.id}
                        subjectName={selectedSubjectForHistory?.name}
                        selectedColor={selectedColor}
                        logoutButtonStyle={logoutButtonStyle}
                        onBackClick={handleBackClick}
                        classSwitcher={<ClassSwitcher currentClassId={selectedClassForHistory.id} viewType="history" titleSuffix=" - ისტორია" />}
                    />
                ) : (
                    <div style={{ color: 'white', textAlign: 'center' }}>კლასი ვერ მოიძებნა</div>
                );
            case 'dayScan':
                return <DayScanPage />;
            case 'statistics':
                return <AdminStatisticsPage
                    classes={classes}
                    subjects={subjects}
                    teachers={teachers}
                    selectedColor={selectedColor}
                    logoutButtonStyle={logoutButtonStyle}
                    onBackClick={handleBackClick}
                />;
            case 'externals':
                return (
                    <div style={{ width: '100%' }}>
                        <button className="admin-back-btn" onClick={handleBackClick} style={{ marginBottom: '24px' }}>
                            <ArrowLeftIcon size={20} /> უკან
                        </button>
                        <h2 style={{ color: 'white', fontSize: '28px', textAlign: 'center', marginBottom: '30px', fontWeight: 800 }}>
                            ექსტერნები - კლასების არჩევა
                        </h2>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            width: "100%",
                            gap: '20px',
                            padding: '20px'
                        }}>
                            {classes.map((cls) => (
                                <div
                                    key={cls._id}
                                    onClick={() => handleExternalsClassClick(cls._id, cls.classname)}
                                    className="admin-card animate-zoom-in"
                                    style={{
                                        minHeight: '130px',
                                        width: '280px',
                                        padding: '25px',
                                        justifyContent: 'center',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.08)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)`;
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                        e.currentTarget.style.transform = 'translateY(-6px)';
                                        e.currentTarget.style.boxShadow = `0 12px 30px ${selectedColor}44`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
                                    }}
                                >
                                    <div style={{
                                        fontSize: '32px',
                                        fontWeight: '800',
                                        color: 'white',
                                        textAlign: 'center'
                                    }}>
                                        {cls.classname}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'externalsSubjectList':
                return selectedClassForExternals ? (
                    <SubjectList
                        classId={selectedClassForExternals.id}
                        className={selectedClassForExternals.name}
                        selectedColor={selectedColor}
                        logoutButtonStyle={logoutButtonStyle}
                        onBackClick={handleBackClick}
                        onSubjectClick={handleExternalsSubjectClick}
                        classSwitcher={<ClassSwitcher currentClassId={selectedClassForExternals.id} viewType="externals" titleSuffix=" - საგნები" />}
                    />
                ) : (
                    <div style={{ color: 'white', textAlign: 'center' }}>კლასი ვერ მოიძებნა</div>
                );
            case 'externalsMarkInput':
                return selectedClassForExternals && selectedSubjectForHistory ? (
                    <ExternalsMarkInput
                        classId={selectedClassForExternals.id}
                        className={selectedClassForExternals.name}
                        subjectId={selectedSubjectForHistory.id}
                        subjectName={selectedSubjectForHistory.name}
                        selectedColor={selectedColor}
                        logoutButtonStyle={logoutButtonStyle}
                        onBackClick={handleBackClick}
                        classSwitcher={<ClassSwitcher currentClassId={selectedClassForExternals.id} viewType="externals" titleSuffix=" - ექსტერნების ნიშნები" />}
                    />
                ) : (
                    <div style={{ color: 'white', textAlign: 'center' }}>მონაცემები ვერ მოიძებნა</div>
                );
            case 'reportGeneration':
                if (showReportGenerator && selectedClassForReport) {
                    return (
                        <ReportGenerator
                            classId={selectedClassForReport.id}
                            className={selectedClassForReport.name}
                            selectedColor={selectedColor}
                            logoutButtonStyle={logoutButtonStyle}
                            onBackClick={() => {
                                setShowReportGenerator(false);
                                setSelectedClassForReport(null);
                            }}
                            classSwitcher={<ClassSwitcher currentClassId={selectedClassForReport.id} viewType="report" titleSuffix=" - უწყისი" />}
                        />
                    );
                }
                return (
                    <div style={{ width: '100%', maxWidth: '1200px' }}>
                        <button className="admin-back-btn" onClick={handleBackClick} style={{ marginBottom: '24px' }}>
                            <ArrowLeftIcon size={20} /> უკან
                        </button>
                        <h2 style={{ color: 'white', fontSize: '28px', textAlign: 'center', marginBottom: '30px', fontWeight: 800 }}>
                            უწყისის გენერირება - კლასების არჩევა
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '20px',
                            padding: '20px'
                        }}>
                            {classes
                                .sort((a, b) => {
                                    // Sort classes in Georgian order (1ა, 1ბ, 2ა, 2ბ, etc.)
                                    const gradeA = parseInt(a.classname.match(/\d+/)?.[0] || '0');
                                    const gradeB = parseInt(b.classname.match(/\d+/)?.[0] || '0');
                                    if (gradeA !== gradeB) return gradeA - gradeB;

                                    const letterA = a.classname.match(/[ა-ჰ]/)?.[0] || '';
                                    const letterB = b.classname.match(/[ა-ჰ]/)?.[0] || '';
                                    return letterA.localeCompare(letterB, 'ka');
                                })
                                .map((cls) => (
                                    <div
                                        key={cls._id}
                                        onClick={() => {
                                            setSelectedClassForReport({ id: cls._id, name: cls.classname });
                                            setShowReportGenerator(true);
                                        }}
                                        className="admin-card animate-zoom-in"
                                        style={{
                                            minHeight: '130px',
                                            padding: '25px',
                                            justifyContent: 'center',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.08)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)`;
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                            e.currentTarget.style.transform = 'translateY(-6px)';
                                            e.currentTarget.style.boxShadow = `0 12px 30px ${selectedColor}44`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '32px',
                                            fontWeight: '800',
                                            color: 'white',
                                            textAlign: 'center'
                                        }}>
                                            {cls.classname}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                );
            case 'reportGenerator':
                return selectedClassForReport ? (
                    <ReportGenerator
                        classId={selectedClassForReport.id}
                        className={selectedClassForReport.name}
                        selectedColor={selectedColor}
                        logoutButtonStyle={logoutButtonStyle}
                        onBackClick={() => {
                            setShowReportGenerator(false);
                            setSelectedClassForReport(null);
                        }}
                    />
                ) : (
                    <div style={{ color: 'white', textAlign: 'center' }}>კლასი ვერ მოიძებნა</div>
                );
            case 'studentCard':
                return selectedStudentForCard ? (
                    <StudentCard
                        student={selectedStudentForCard}
                        selectedColor={selectedColor}
                        logoutButtonStyle={logoutButtonStyle}
                        onBackClick={() => {
                            setSelectedStudentForCard(null);
                            setView('studentList');
                        }}
                    />
                ) : (
                    <div style={{ color: 'white', textAlign: 'center' }}>მოსწავლე ვერ მოიძებნა</div>
                );
            case 'noticeBoard':
                return (
                    <div style={{ width: '100%' }}>
                        <button className="admin-back-btn" onClick={handleBackClick} style={{ marginBottom: '24px' }}>
                            <ArrowLeftIcon size={20} /> უკან დაბრუნება
                        </button>
                        <NoticeBoard allowCreate={true} currentUser={{ id: adminId, name: adminName, role: adminRole }} />
                    </div>
                );
            case 'chat':
                return (
                    <div style={{ width: '100%' }}>
                        <button className="admin-back-btn" onClick={handleBackClick} style={{ marginBottom: '24px' }}>
                            <ArrowLeftIcon size={20} /> უკან დაბრუნება
                        </button>
                        <ChatModule currentUser={{ id: adminId, name: adminName, role: adminRole }} />
                    </div>
                );
            case 'applications':
                return (
                    <AdminApplicationsPanel adminId={adminId} role={adminRole} handleBackClick={handleBackClick} />
                );
            case 'pedCouncilMeetings':
                return (
                    <div style={{ width: '100%' }}>
                        <button className="admin-back-btn" onClick={handleBackClick} style={{ marginBottom: '24px' }}>
                            <ArrowLeftIcon size={20} /> უკან დაბრუნება
                        </button>
                        <AdminPedCouncilMeetings adminId={adminId} selectedColor={selectedColor} />
                    </div>
                );
            case 'staffManagement':
                return (
                    <div style={{ width: '100%' }}>
                        <button className="admin-back-btn" onClick={handleBackClick} style={{ marginBottom: '24px' }}>
                            <ArrowLeftIcon size={20} /> უკან დაბრუნება
                        </button>
                        <AdminStaffManagement selectedColor={selectedColor} />
                    </div>
                );
            default:
                return <div>არასწორი არჩევანი</div>;
        }
    };

    return (
        <div className="admin-page-wrapper">
            <div className="admin-page-bg-glow" style={{ background: `radial-gradient(circle at center, ${selectedColor}26 0%, transparent 70%)` }} />

            <ColorPalette />
            <button
                onClick={handleLogout}
                className="logout-btn"
            >
                <FaSignOutAltIcon /> გამოსვლა
            </button>

            <div className="admin-page-content">
                <header className="admin-page-header animate-fade-in-down">
                    <h1 className="admin-page-title">
                        ადმინისტრატორის <span style={{ color: selectedColor }}>პანელი</span>
                    </h1>
                    <p className="admin-page-subtitle">
                        მართვის სისტემა
                    </p>
                </header>

                <div className="admin-main-view animate-zoom-in">
                    {renderContent()}
                </div>
            </div>

            {confirmation && (
                <ConfirmationModal
                    isOpen={!!confirmation}
                    message={confirmation.message}
                    onConfirm={confirmation.onConfirm}
                    onCancel={() => setConfirmation(null)}
                />
            )}
            {popup && <MessagePopup message={popup.message} type={popup.type} onClose={() => setPopup(null)} />}

            {isEditModalOpen && editingStudent && (
                <EditStudentModal
                    student={editingStudent}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleUpdateStudent}
                    classes={classes}
                />
            )}
            {isEditTeacherModalOpen && editingTeacher && (
                <EditTeacherModal
                    teacher={editingTeacher}
                    isOpen={isEditTeacherModalOpen}
                    onClose={() => setIsEditTeacherModalOpen(false)}
                    onSave={handleUpdateTeacher}
                    classes={classes}
                />
            )}

            {isJournalModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'rgba(20, 25, 45, 0.85)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '40px', minWidth: '380px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>აირჩიეთ მოქმედება</div>
                        
                        <button 
                            onClick={() => handleJournalAction('semester')} 
                            style={{ 
                                background: 'linear-gradient(135deg, #3a8dde 0%, #1d4ed8 100%)', 
                                width: '100%', 
                                color: 'white', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '14px', 
                                padding: '14px 28px', 
                                fontWeight: '800', 
                                fontSize: '15px', 
                                cursor: 'pointer', 
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 4px 15px rgba(58, 141, 222, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(58, 141, 222, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(58, 141, 222, 0.2)';
                            }}
                        >
                            სრული სემესტრის გახსნა
                        </button>
                        
                        <button 
                            onClick={() => handleJournalAction('year')} 
                            style={{ 
                                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', 
                                width: '100%', 
                                color: 'white', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '14px', 
                                padding: '14px 28px', 
                                fontWeight: '800', 
                                fontSize: '15px', 
                                cursor: 'pointer', 
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.2)';
                            }}
                        >
                            სრული წლის გახსნა
                        </button>
                        
                        <button 
                            onClick={() => handleJournalAction('close')} 
                            style={{ 
                                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', 
                                width: '100%', 
                                color: 'white', 
                                border: '1px solid rgba(255,255,255,0.05)', 
                                borderRadius: '14px', 
                                padding: '14px 28px', 
                                fontWeight: '800', 
                                fontSize: '15px', 
                                cursor: 'pointer', 
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.2)';
                            }}
                        >
                            ჟურნალის დახურვა
                        </button>

                        <button 
                            onClick={() => setIsJournalModalOpen(false)} 
                            style={{ 
                                background: 'transparent', 
                                color: 'rgba(255,255,255,0.6)', 
                                border: 'none', 
                                borderRadius: '8px', 
                                padding: '8px 24px', 
                                fontWeight: 'bold', 
                                fontSize: '14px', 
                                cursor: 'pointer', 
                                marginTop: '10px',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                        >
                            გაუქმება
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ClassHistoryTable: React.FC<{
    classHistory: { classname: string; tutorName: string; studentCount: number; }[];
    onBackClick: () => void;
    selectedColor: string;
    logoutButtonStyle: React.CSSProperties;
    onViewDetails?: (className: string) => void;
}> = ({ classHistory, onBackClick, selectedColor, onViewDetails }) => (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
        <button onClick={onBackClick} className="admin-back-btn" style={{ marginBottom: '24px' }}>
            <ArrowLeftIcon size={20} /> უკან
        </button>
        <h2 className="admin-view-title" style={{ marginBottom: '24px', textAlign: 'center' }}>კლასების ისტორია</h2>
        <div className="admin-list-container animate-zoom-in" style={{ padding: 0 }}>
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>კლასი</th>
                            <th>დამრიგებელი</th>
                            <th>მოსწავლეთა რაოდენობა</th>
                            {onViewDetails && <th style={{ textAlign: 'center' }}>ქმედება</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {classHistory.length > 0 ? classHistory.map((row) => (
                            <tr key={row.classname}>
                                <td style={{ fontWeight: '700', fontSize: '18px' }}>{row.classname}</td>
                                <td style={{ fontWeight: '600', color: '#cbd5e1' }}>{row.tutorName}</td>
                                <td style={{ fontWeight: '600' }}>{row.studentCount}</td>
                                {onViewDetails && (
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => onViewDetails(row.classname)}
                                            className="admin-table-action-btn"
                                            style={{
                                                background: selectedColor,
                                                padding: '10px 20px',
                                                fontSize: '14px',
                                            }}
                                        >
                                            დეტალები
                                        </button>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={onViewDetails ? 4 : 3} style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                                    კლასები ვერ მოიძებნა
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

// Admin Statistics Page Component
const AdminStatisticsPage: React.FC<{
    classes: Class[];
    subjects: Subject[];
    teachers: Teacher[];
    selectedColor: string;
    logoutButtonStyle: React.CSSProperties;
    onBackClick: () => void;
}> = ({ classes, subjects, teachers, selectedColor, logoutButtonStyle, onBackClick }) => {
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [students, setStudents] = useState<any[]>([]);
    const [classStatistics, setClassStatistics] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const handleViewStatistics = async () => {
        if (!selectedClass) {
            alert('გთხოვთ აირჩიოთ კლასი');
            return;
        }

        setLoading(true);
        try {
            // Fetch students for the selected class
            const studentsRes = await fetch('/api/student/all');
            const allStudents = await studentsRes.json();
            const classStudents = allStudents.filter((s: any) => s.classInfo && s.classInfo._id === selectedClass);
            setStudents(classStudents);

            // Fetch class statistics using the new API
            let url = `/api/class-statistics?class_id=${selectedClass}`;
            if (selectedSubject) {
                url += `&subject_id=${selectedSubject}`;
            }

            const statsRes = await fetch(url);
            if (!statsRes.ok) {
                throw new Error('Failed to fetch statistics');
            }
            const statsData = await statsRes.json();
            setClassStatistics(statsData);

            setShowResults(true);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            alert('სტატისტიკის ჩვენება ვერ მოხერხდა');
        } finally {
            setLoading(false);
        }
    };

    const getStudentStats = (studentId: string) => {
        if (!classStatistics || !classStatistics[studentId]) {
            return {
                firstSemester: 0,
                secondSemester: 0,
                annual: 0,
                attendance: 0
            };
        }

        const stats = classStatistics[studentId];

        // If a specific subject is selected, use subject breakdown
        if (selectedSubject && stats.subject_breakdown && stats.subject_breakdown[selectedSubject]) {
            const subjectStats = stats.subject_breakdown[selectedSubject];

            return {
                firstSemester: subjectStats.first_semester?.average || 0,
                secondSemester: subjectStats.second_semester?.average || 0,
                annual: subjectStats.annual?.average || 0,
                attendance: subjectStats.annual?.attendance || 0
            };
        }

        // Otherwise use overall stats
        return {
            firstSemester: stats.first_semester?.average || 0,
            secondSemester: stats.second_semester?.average || 0,
            annual: stats.annual?.average || 0,
            attendance: stats.annual?.attendance || 0
        };
    };

    const filteredStudents = students;

    // Get teacher name for the selected class
    const getTeacherName = () => {
        if (!selectedClass || !selectedSubject) return '';
        const classObj = classes.find(c => c._id === selectedClass);
        if (!classObj || !classObj.subjects) return '';

        const subjectObj = classObj.subjects.find(s => s.subject_id === selectedSubject);
        if (!subjectObj) return '';

        const teacher = teachers.find(t => t._id === subjectObj.teacher_id);
        return teacher ? `${teacher.name} ${teacher.surname}` : '';
    };

    return (
        <div style={{ background: 'white', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '1100px', margin: '20px auto', boxSizing: 'border-box' as const }}>
            <button onClick={onBackClick} style={{ marginBottom: '24px', background: selectedColor, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>უკან დაბრუნება</button>

            <div style={{ fontSize: '22px', fontWeight: '700', color: 'blue', marginBottom: '24px', textAlign: 'center' }}>სტატისტიკა</div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px', textAlign: 'center', fontStyle: 'italic' }}>
                * თუ მოსწავლეს აქვს ექსტერნის ნიშანი, წლიური ნიშანი ჩაანაცვლება ექსტერნის ნიშნით
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                {/* Class Selection */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <label style={{ fontWeight: '600', minWidth: '120px', color: '#2196f3' }}>აირჩიეთ კლასი:</label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '2px solid #2196f3',
                            fontSize: '16px',
                            minWidth: '200px',
                            backgroundColor: '#f8f9fa',
                            color: '#333'
                        }}
                    >
                        <option value="">აირჩიეთ კლასი</option>
                        {classes
                            .sort((a, b) => {
                                // Sort classes in Georgian order (1ა, 1ბ, 2ა, 2ბ, etc.)
                                const gradeA = parseInt(a.classname.match(/\d+/)?.[0] || '0');
                                const gradeB = parseInt(b.classname.match(/\d+/)?.[0] || '0');
                                if (gradeA !== gradeB) return gradeA - gradeB;

                                const letterA = a.classname.match(/[ა-ჰ]/)?.[0] || '';
                                const letterB = b.classname.match(/[ა-ჰ]/)?.[0] || '';
                                return letterA.localeCompare(letterB, 'ka');
                            })
                            .map((cls) => (
                                <option key={cls._id} value={cls._id}>{cls.classname}</option>
                            ))}
                    </select>
                </div>

                {/* Subject Selection */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <label style={{ fontWeight: '600', minWidth: '120px', color: '#2196f3' }}>აირჩიეთ საგანი:</label>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '2px solid #2196f3',
                            fontSize: '16px',
                            minWidth: '200px',
                            backgroundColor: '#f8f9fa',
                            color: '#333'
                        }}
                    >
                        <option value="">ყველა საგანი</option>
                        {subjects.map((subj) => (
                            <option key={subj._id} value={subj._id}>{subj.name}</option>
                        ))}
                    </select>
                </div>




            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '30px' }}>
                <button
                    onClick={handleViewStatistics}
                    disabled={loading || !selectedClass}
                    style={{
                        background: selectedColor,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                    }}
                >
                    {loading ? 'იტვირთება...' : 'სტატიტიკის ნახვა'}
                </button>
            </div>

            {/* Results */}
            {showResults && (
                <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <AtRiskList classId={selectedClass} className={classes.find(c => c._id === selectedClass)?.classname || ''} />

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#333' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #ddd', background: '#f8f8f8' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>მოსწავლე</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>პირველი სემესტრი</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>მეორე სემესტრი</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>წლიური</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>სწრებადობა</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, index) => {
                                    const stats = getStudentStats(student._id);
                                    return (
                                        <tr key={student._id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: '#6c757d',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {index + 1}
                                                </div>
                                                {student.name} {student.surname}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#2196f3' }}>
                                                {stats.firstSemester.toFixed(1)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#4caf50' }}>
                                                {stats.secondSemester.toFixed(1)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#ff9800' }}>
                                                {stats.annual.toFixed(1)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#9c27b0' }}>
                                                {stats.attendance.toFixed(1)}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {students.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#6c757d',
                            fontSize: '18px'
                        }}>
                            ამ კლასში მოსწავლეები ვერ მოიძებნა
                        </div>
                    )}

                    {/* Summary Statistics */}
                    {classStatistics && students.length > 0 && (
                        <div style={{
                            marginTop: '30px',
                            padding: '20px',
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #dee2e6'
                        }}>
                            <h3 style={{ color: 'blue', marginBottom: '15px', textAlign: 'center' }}>
                                კლასის საერთო სტატისტიკა
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196f3' }}>
                                        {students.length}
                                    </div>
                                    <div style={{ color: '#666' }}>მოსწავლე</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
                                        {selectedSubject ? subjects.find(s => s._id === selectedSubject)?.name || 'საგანი' : 'ყველა საგანი'}
                                    </div>
                                    <div style={{ color: '#666' }}>საგანი</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
                                        {students.filter(s => classStatistics && classStatistics[s._id]).length}
                                    </div>
                                    <div style={{ color: '#666' }}>სტატისტიკით</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Admin;
