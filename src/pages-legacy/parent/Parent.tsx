"use client";
import React, { useState, useEffect } from 'react';
import { useColor } from './../../components/ColorContext';
import ColorPalette from './../../components/ColorPalette';
import StudentSubjectsGrades from './../../components/StudentSubjectsGrades';
import NoticeBoard from './../../components/NoticeBoard';
import ChatModule from './../../components/ChatModule';
import DailyTimeline from './../../components/DailyTimeline';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { 
  FaSignOutAlt, 
  FaGraduationCap, 
  FaChartBar, 
  FaStickyNote, 
  FaBullhorn, 
  FaComments,
  FaCalendarAlt,
  FaFileAlt,
  FaPlus,
  FaDownload,
  FaKey,
  FaClock,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';

const FaSignOutAltIcon = FaSignOutAlt as React.ComponentType<any>;

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

function readParentSession(): { studentId: string; classId: string } {
    if (typeof window === 'undefined') return { studentId: '', classId: '' };
    const storedStudentId = localStorage.getItem('studentId');
    const storedClassId = localStorage.getItem('classId');
    if (storedStudentId && storedClassId) {
        return { studentId: storedStudentId, classId: storedClassId };
    }
    const urlParams = new URLSearchParams(window.location.search);
    return {
        studentId: urlParams.get('student_id') || '',
        classId: urlParams.get('class_id') || '',
    };
}

const Parent: React.FC = () => {
    const navigate = useNavigate();
    const { selectedColor } = useColor();
    const queryClient = useQueryClient();
    const [{ studentId, classId }] = useState(readParentSession);
    const [activeTab, setActiveTab] = useState<'grades' | 'timeline' | 'notices' | 'messages' | 'applications' | 'password'>('grades');

    // Create application states
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);
    const [appType, setAppType] = useState('ავადმყოფობის გამოცდენა');
    const [appTitle, setAppTitle] = useState('');
    const [appContent, setAppContent] = useState('');
    const [appError, setAppError] = useState('');
    const [appSuccess, setAppSuccess] = useState('');

    // Password change states
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState('');
    const [passLoading, setPassLoading] = useState(false);

    // Fetch student/child info
    const { data: studentInfo } = useQuery({
        queryKey: ['student-info', studentId],
        queryFn: async () => {
            const res = await fetch(`/api/student/info?user_ID=${studentId}`);
            if (!res.ok) throw new Error();
            return res.json();
        },
        enabled: !!studentId
    });

    // Fetch announcements
    const { data: announcements } = useQuery({
        queryKey: ['announcements-unread'],
        queryFn: async () => {
            const response = await fetch('/api/announcements');
            if (!response.ok) throw new Error();
            return response.json();
        },
        refetchInterval: 8000
    });

    // Fetch parent applications
    const { data: applications, isLoading: appsLoading } = useQuery<any[]>({
        queryKey: ['parent-applications', studentId],
        queryFn: async () => {
            const res = await fetch(`/api/applications?user_id=${studentId}&role=parent`);
            if (!res.ok) throw new Error();
            return res.json();
        },
        enabled: !!studentId
    });

    // Fetch messages for badge
    const { data: allMessages } = useQuery({
        queryKey: ['parent-messages-unread', studentId],
        queryFn: async () => {
            const response = await fetch(`/api/messages?user_id=${studentId}&role=parent`);
            if (!response.ok) throw new Error();
            return response.json();
        },
        enabled: !!studentId,
        refetchInterval: 5000
    });

    const hasUnreadMessages = React.useMemo(() => {
        if (!allMessages || !Array.isArray(allMessages)) return false;
        const incomingCount = allMessages.filter((m: any) => m.sender_id !== studentId).length;
        const seenCount = typeof window !== 'undefined' ? parseInt(localStorage.getItem('seen_incoming_messages_parent_count') || '0', 10) : 0;
        return incomingCount > seenCount;
    }, [allMessages, studentId]);

    const hasUnreadNotices = React.useMemo(() => {
        if (!announcements || !Array.isArray(announcements)) return false;
        const totalNotices = announcements.length;
        const seenNotices = typeof window !== 'undefined' ? parseInt(localStorage.getItem('seen_notices_parent_count') || '0', 10) : 0;
        return totalNotices > seenNotices;
    }, [announcements]);

    useEffect(() => {
        if (activeTab === 'messages' && allMessages && Array.isArray(allMessages)) {
            const incomingCount = allMessages.filter((m: any) => m.sender_id !== studentId).length;
            localStorage.setItem('seen_incoming_messages_parent_count', incomingCount.toString());
        }
    }, [activeTab, allMessages, studentId]);

    useEffect(() => {
        if (activeTab === 'notices' && announcements && Array.isArray(announcements)) {
            localStorage.setItem('seen_notices_parent_count', announcements.length.toString());
        }
    }, [activeTab, announcements]);

    const studentFullName = studentInfo ? `${studentInfo.name} ${studentInfo.surname}` : 'მოსწავლე';
    const parentFullName = studentInfo ? `${studentFullName}-ის მშობელი` : 'მშობელი';

    const handleLogout = () => {
        localStorage.removeItem('login');
        localStorage.removeItem('studentId');
        localStorage.removeItem('classId');
        navigate('/');
    };

    // Submit Application Mutation
    const submitAppMutation = useMutation({
        mutationFn: async (newApp: { student_id: string; type: string; title: string; content: string }) => {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newApp)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'შეცდომა განაცხადის გაგზავნისას');
            }
            return res.json();
        },
        onSuccess: () => {
            setAppSuccess('განაცხადი წარმატებით გაიგზავნა!');
            setAppTitle('');
            setAppContent('');
            queryClient.invalidateQueries({ queryKey: ['parent-applications'] });
            setTimeout(() => {
                setIsAppModalOpen(false);
                setAppSuccess('');
            }, 1500);
        },
        onError: (err: any) => {
            setAppError(err.message || 'სერვერთან კავშირი ვერ დამყარდა');
        }
    });

    const handleCreateApplication = (e: React.FormEvent) => {
        e.preventDefault();
        setAppError('');
        setAppSuccess('');
        if (!appTitle || !appContent) {
            setAppError('გთხოვთ შეავსოთ ყველა ველი');
            return;
        }
        submitAppMutation.mutate({
            student_id: studentId,
            type: appType,
            title: appTitle,
            content: appContent
        });
    };

    // Change Password
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
            const res = await fetch('/api/parent/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: studentId, oldPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setPassSuccess('პაროლი წარმატებით შეიცვალა!');
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setPassError(data.message || 'შეცდომა პაროლის შეცვლისას');
            }
        } catch {
            setPassError('სერვერთან კავშირი ვერ დამყარდა');
        } finally {
            setPassLoading(false);
        }
    };

    // DOCX Generation Function
    const handleDownloadDocx = (app: any) => {
        const doc = new Document({
            sections: [{
                properties: {},
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
                            new TextRun({ text: `მოსწავლე ${studentFullName}-ის მშობლისგან\n`, font: "DejaVu Sans" }),
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
                            new TextRun({ text: "მშობლის ხელმოწერა: ________________________", font: "DejaVu Sans" }),
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
            link.download = `ganცხადება_${app.type.replace(/\s+/g, '_')}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }).catch(err => {
            console.error("Docx generation error:", err);
        });
    };

    if (!studentId || !classId) {
        return (
            <div style={{ minHeight: '100vh', background: '#0f172a', padding: '60px 16px', textAlign: 'center', color: '#94a3b8' }}>
                <ColorPalette />
                <button onClick={handleLogout} style={{ background: '#f43f5e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                    <FaSignOutAlt size={16} /> გამოსვლა
                </button>
                <div style={{ fontSize: '18px' }}>გთხოვთ ხელახლა გაიაროთ ავტორიზაცია მშობლის როლით.</div>
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'grades':
                return <StudentSubjectsGrades studentId={studentId} classId={classId} />;
            case 'timeline':
                return <DailyTimeline classId={classId} />;
            case 'notices':
                return <NoticeBoard currentUser={{ id: studentId, name: parentFullName, role: 'parent' }} />;
            case 'messages':
                return <ChatModule currentUser={{ id: studentId, name: parentFullName, role: 'parent' }} />;
            case 'applications':
                return (
                    <div className="admin-list-container" style={{ padding: '24px', background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>საქმის წარმოება და განაცხადები</h2>
                                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', margin: 0 }}>მართეთ თქვენი ოფიციალური მოთხოვნები სკოლის ადმინისტრაციასთან</p>
                            </div>
                            <button 
                                onClick={() => setIsAppModalOpen(true)}
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    backgroundColor: selectedColor, 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '10px 18px', 
                                    borderRadius: '8px', 
                                    fontWeight: 'bold', 
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <FaPlus /> ახალი განაცხადი
                            </button>
                        </div>

                        {appsLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>განაცხადები იტვირთება...</div>
                        ) : !applications || applications.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', background: '#0f172a', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <FaFileAlt size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>განაცხადები არ მოიძებნა</div>
                                <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>თქვენ ჯერ არ გაგიგზავნიათ განაცხადები.</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '13px' }}>
                                            <th style={{ padding: '12px 16px' }}>თარიღი</th>
                                            <th style={{ padding: '12px 16px' }}>ტიპი</th>
                                            <th style={{ padding: '12px 16px' }}>თემა / სათაური</th>
                                            <th style={{ padding: '12px 16px' }}>სტატუსი</th>
                                            <th style={{ padding: '12px 16px' }}>განმხილველი / კომენტარი</th>
                                            <th style={{ padding: '12px 16px', textRight: 'right' } as any}>მოქმედება</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {applications.map((app) => (
                                            <tr key={app._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', transition: 'background 0.2s' }} className="table-row-hover">
                                                <td style={{ padding: '16px' }}>
                                                    {new Date(app.submittedAt).toLocaleDateString('ka-GE')}
                                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                                        {new Date(app.submittedAt).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', fontWeight: 'bold' }}>{app.type}</td>
                                                <td style={{ padding: '16px', maxWidth: '250px' }}>
                                                    <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.title}</div>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '4px' }}>{app.content}</div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '6px', 
                                                        padding: '4px 10px', 
                                                        borderRadius: '20px', 
                                                        fontSize: '12px', 
                                                        fontWeight: 'bold',
                                                        backgroundColor: app.status === 'დადასტურებული' ? 'rgba(34,197,94,0.15)' : app.status === 'უარყოფილი' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                                        color: app.status === 'დადასტურებული' ? '#22c55e' : app.status === 'უარყოფილი' ? '#ef4444' : '#f59e0b',
                                                        border: app.status === 'დადასტურებული' ? '1px solid rgba(34,197,94,0.3)' : app.status === 'უარყოფილი' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.3)'
                                                    }}>
                                                        {app.status === 'დადასტურებული' ? <FaCheckCircle /> : app.status === 'უარყოფილი' ? <FaTimesCircle /> : <FaClock />}
                                                        {app.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    {app.resolvedBy ? (
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0' }}>{app.resolvedBy}</div>
                                                            {app.comment && <div style={{ fontSize: '12px', color: '#a3a3a3', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', marginTop: '4px', borderLeft: `3px solid ${selectedColor}` }}>{app.comment}</div>}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#64748b', fontSize: '13px' }}>მიმდინარეობს განხილვა</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right' } as any}>
                                                    <button
                                                        onClick={() => handleDownloadDocx(app)}
                                                        title="დოკუმენტის ჩამოტვირთვა (.docx)"
                                                        style={{
                                                            background: 'rgba(255,255,255,0.05)',
                                                            color: 'white',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            padding: '8px 12px',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            fontSize: '13px',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                    >
                                                        <FaDownload /> ჩამოტვირთვა
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            case 'password':
                return (
                    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '24px', background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><FaKey style={{ color: selectedColor }} /> პაროლის შეცვლა</h2>
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>შეცვალეთ თქვენი მიმდინარე შესასვლელი პაროლი</p>
                        
                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>მიმდინარე პაროლი</label>
                                <input
                                    type="password"
                                    value={oldPassword}
                                    onChange={e => setOldPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>ახალი პაროლი</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>გაიმეორეთ ახალი პაროლი</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }}
                                />
                            </div>

                            {passError && <div style={{ fontSize: '13px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>{passError}</div>}
                            {passSuccess && <div style={{ fontSize: '13px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.2)' }}>{passSuccess}</div>}

                            <button
                                type="submit"
                                disabled={passLoading}
                                style={{
                                    backgroundColor: selectedColor,
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    marginTop: '8px',
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                {passLoading ? 'იცვლება...' : 'პაროლის განახლება'}
                            </button>
                        </form>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="student-page-wrapper" style={{ background: '#0f172a', minHeight: '100vh', color: 'white', paddingBottom: '60px' }}>
            <div className="start-page-bg-glow" style={{ background: `radial-gradient(circle at center, ${selectedColor}26 0%, transparent 70%)`, pointerEvents: 'none' }} />
            
            <ColorPalette />

            <div className="student-page-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
                {/* Header */}
                <header className="student-page-header animate-fade-in-down" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>
                            <span>{getGeorgianDate()}</span>
                            <span>•</span>
                            <span style={{ color: selectedColor }}>მშობლის პორტალი</span>
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '6px 0 0 0' }}>
                            {getGreeting()}, <span style={{ color: selectedColor }}>{parentFullName}</span>
                        </h1>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>მოსწავლე: {studentFullName} ({studentInfo?.classname || ''})</p>
                    </div>

                    <button 
                        onClick={handleLogout}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            background: 'rgba(244,63,94,0.1)', 
                            color: '#f43f5e', 
                            border: '1px solid rgba(244,63,94,0.2)', 
                            padding: '10px 20px', 
                            borderRadius: '8px', 
                            fontWeight: 'bold', 
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f43f5e'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = '#f43f5e'; }}
                    >
                        <FaSignOutAlt size={16} /> გამოსვლა
                    </button>
                </header>

                {/* Tabs Toggles */}
                <div className="student-tabs-container" style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: '32px'
                }}>
                    <button
                        onClick={() => setActiveTab('grades')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: activeTab === 'grades' ? selectedColor : 'transparent',
                            color: activeTab === 'grades' ? 'white' : '#94a3b8',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <FaGraduationCap size={16} /> ნიშნები
                    </button>
                    <button
                        onClick={() => setActiveTab('timeline')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: activeTab === 'timeline' ? selectedColor : 'transparent',
                            color: activeTab === 'timeline' ? 'white' : '#94a3b8',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <FaCalendarAlt size={16} /> განრიგი
                    </button>
                    <button
                        onClick={() => setActiveTab('notices')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: activeTab === 'notices' ? selectedColor : 'transparent',
                            color: activeTab === 'notices' ? 'white' : '#94a3b8',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            position: 'relative'
                        }}
                    >
                        <FaBullhorn size={16} /> განცხადებები
                        {hasUnreadNotices && (
                            <span style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                                border: '1.5px solid #0f172a',
                                boxShadow: '0 0 6px #ef4444'
                            }} />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: activeTab === 'messages' ? selectedColor : 'transparent',
                            color: activeTab === 'messages' ? 'white' : '#94a3b8',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            position: 'relative'
                        }}
                    >
                        <FaComments size={16} /> ჩატი
                        {hasUnreadMessages && (
                            <span style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                                border: '1.5px solid #0f172a',
                                boxShadow: '0 0 6px #ef4444'
                            }} />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('applications')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: activeTab === 'applications' ? selectedColor : 'transparent',
                            color: activeTab === 'applications' ? 'white' : '#94a3b8',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <FaFileAlt size={16} /> საქმის წარმოება
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: activeTab === 'password' ? selectedColor : 'transparent',
                            color: activeTab === 'password' ? 'white' : '#94a3b8',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <FaKey size={16} /> პაროლი
                    </button>
                </div>

                {/* Tab content */}
                <div>
                    {renderTabContent()}
                </div>
            </div>

            {/* Application Modal */}
            {isAppModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(15,23,42,0.85)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999,
                    padding: '16px'
                }}>
                    <div style={{
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '550px',
                        padding: '28px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                        position: 'relative'
                    }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0' }}>ახალი განაცხადის შექმნა</h3>
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 24px 0' }}>შეავსეთ განაცხადის ფორმა. გაგზავნის შემდეგ მას დამრიგებელი ან ადმინისტრატორი განიხილავს.</p>

                        <form onSubmit={handleCreateApplication} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>განაცხადის ტიპი</label>
                                <select
                                    value={appType}
                                    onChange={e => setAppType(e.target.value)}
                                    style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none', cursor: 'pointer' }}
                                >
                                    <option value="ავადმყოფობის გამოცდენა">ავადმყოფობის გამოცდენა</option>
                                    <option value="ცნობის მოთხოვნა">ცნობის მოთხოვნა (სკოლიდან)</option>
                                    <option value="ექსკურსიაზე ნებართვა">ნებართვა ექსკურსიაზე</option>
                                    <option value="სკოლიდან გათავისუფლება">სკოლიდან გათავისუფლება (დროებით)</option>
                                    <option value="ფინანსური / გადახდები">ფინანსური / გადახდები</option>
                                    <option value="სხვა">სხვა სახის განცხადება</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>სათაური / თემა</label>
                                <input
                                    type="text"
                                    value={appTitle}
                                    onChange={e => setAppTitle(e.target.value)}
                                    placeholder="მაგ. Alice-ის გაცდენის საპატიოდ ჩათვლა"
                                    style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>განცხადების შინაარსი</label>
                                <textarea
                                    value={appContent}
                                    onChange={e => setAppContent(e.target.value)}
                                    placeholder="გთხოვთ დაწეროთ დაწვრილებითი ინფორმაცია..."
                                    rows={5}
                                    style={{ padding: '10px 14px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none', resize: 'vertical' }}
                                />
                            </div>

                            {appError && <div style={{ fontSize: '13px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>{appError}</div>}
                            {appSuccess && <div style={{ fontSize: '13px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.2)' }}>{appSuccess}</div>}

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsAppModalOpen(false)}
                                    style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    გაუქმება
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitAppMutation.isPending}
                                    style={{ padding: '10px 20px', backgroundColor: selectedColor, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    {submitAppMutation.isPending ? 'იგზავნება...' : 'გაგზავნა'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Parent;
