"use client";
import React, { useState } from 'react';
import { useColor } from './../../components/ColorContext';
import ColorPalette from './../../components/ColorPalette';
import StudentSubjectsGrades from './../../components/StudentSubjectsGrades';
import NoticeBoard from './../../components/NoticeBoard';
import ChatModule from './../../components/ChatModule';
import DailyTimeline from './../../components/DailyTimeline';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  FaSignOutAlt, 
  FaGraduationCap, 
  FaChartBar, 
  FaStickyNote, 
  FaBullhorn, 
  FaComments,
  FaCalendarAlt
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

function readStudentSession(): { studentId: string; classId: string } {
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

const Student: React.FC = () => {
    const navigate = useNavigate();
    const { selectedColor } = useColor();
    const [{ studentId, classId }] = useState(readStudentSession);
    const [activeTab, setActiveTab] = useState<'grades' | 'timeline'>('grades');

    // Password change form state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState('');
    const [passLoading, setPassLoading] = useState(false);

    // Fetch student info
    const { data: studentInfo } = useQuery({
        queryKey: ['student-info', studentId],
        queryFn: async () => {
            const res = await fetch(`/api/student/info?user_ID=${studentId}`);
            if (!res.ok) throw new Error();
            return res.json();
        },
        enabled: !!studentId
    });

    // Notices, behaviors, and analytics queries removed for student (moved to parent)

    const studentFullName = studentInfo ? `${studentInfo.name} ${studentInfo.surname}` : 'მოსწავლე';

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('studentId');
        localStorage.removeItem('classId');
        navigate('/');
    };

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
            const res = await fetch('/api/student/change-password', {
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

    if (!studentId || !classId) {
        return (
            <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '60px 16px', textAlign: 'center', color: '#64748b' }}>
                <ColorPalette />
                <button className="logout-btn" onClick={handleLogout}>
                    <FaSignOutAltIcon /> გამოსვლა
                </button>
                გთხოვთ ხელახლა შეხვიდეთ სისტემაში
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'grades':
                return <StudentSubjectsGrades studentId={studentId} classId={classId} />;
            case 'timeline':
                return <DailyTimeline classId={classId} />;

        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: '80px', paddingBottom: '40px' }}>
            <ColorPalette />
            <button className="logout-btn" onClick={handleLogout}>
                <FaSignOutAltIcon /> გამოსვლა
            </button>

            {/* Dashboard Header Banner */}
            <div style={{ maxWidth: '1200px', margin: '0 auto 30px auto', padding: '0 16px' }}>
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px 30px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
                    border: '1px solid #e2e8f0'
                }}>
                    <div>
                        <div style={{ fontSize: '12px', color: selectedColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                            {getGreeting()} • {getGeorgianDate()}
                        </div>
                        <h2 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{studentFullName}</h2>
                    </div>
                    {studentInfo?.classInfo?.classname && (
                        <div style={{
                            padding: '8px 16px',
                            borderRadius: '12px',
                            backgroundColor: `${selectedColor}12`,
                            color: selectedColor,
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}>
                            კლასი: {studentInfo.classInfo.classname}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs Navigation */}
            <div style={{ maxWidth: '1200px', margin: '0 auto 30px auto', padding: '0 16px' }}>
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #cbd5e1'
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
                            color: activeTab === 'grades' ? 'white' : '#64748b',
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
                            color: activeTab === 'timeline' ? 'white' : '#64748b',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <FaCalendarAlt size={16} /> დღის განრიგი
                    </button>
                </div>
            </div>

            {/* Active Tab Panel Content */}
            <div>
                {renderTabContent()}
            </div>
        </div>
    );
};

export default Student;
