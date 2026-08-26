"use client";
import React, { useState, useEffect } from 'react';
import { IoArrowBack } from 'react-icons/io5';

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string }>;

interface Grade {
    _id: string;
    student_id: string;
    subject_id: string;
    class_id: string;
    point: number;
    pointType: number;
    date: string;
    time: string;
    comment: string;
    checked: boolean;
}

interface Student {
    _id: string;
    name: string;
    surname: string;
    user_ID: string;
}

interface Subject {
    _id: string;
    name: string;
}

interface DetailedGradeHistoryProps {
    classId: string;
    className: string;
    subjectId?: string;
    subjectName?: string;
    selectedColor: string;
    logoutButtonStyle: React.CSSProperties;
    onBackClick: () => void;
    selectedYear?: string;
}

const DetailedGradeHistory: React.FC<DetailedGradeHistoryProps> = ({
    classId,
    className,
    subjectId,
    subjectName,
    selectedColor,
    onBackClick,
    selectedYear
}) => {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string>(subjectId || 'all');

    useEffect(() => {
        if (subjectId) setSelectedSubject(subjectId);
    }, [subjectId]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let gradesUrl = `/api/grades?class_id=${classId}`;
                if (selectedYear) {
                    gradesUrl += `&year=${selectedYear}`;
                }
                const gradesRes = await fetch(gradesUrl);
                const gradesData = await gradesRes.json();
                setGrades(Array.isArray(gradesData) ? gradesData : []);

                const match = className.match(/^([0-9]+)([ა-ჰ])$/);
                const studentsUrl = match
                    ? `/api/student/grade/${match[1]}?parallel=${encodeURIComponent(match[2])}`
                    : '/api/student/all';
                const studentsRes = await fetch(studentsUrl);
                const studentsData = await studentsRes.json();
                const classStudents = match ? studentsData : studentsData.filter((s: any) => s.classInfo && s.classInfo._id === classId);
                setStudents(classStudents);

                const subjectsRes = await fetch('/api/subjects');
                const subjectsData = await subjectsRes.json();
                setSubjects(subjectsData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };
        fetchData();
    }, [classId, className, selectedYear]);

    if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '40px' }}>იტვირთება...</div>;

    const filteredGrades = selectedSubject === 'all' ? grades : grades.filter(g => g.subject_id === selectedSubject);
    const allDatesArr = Array.from(new Set(filteredGrades.map(g => g.date))).sort();
    const studentDateGrades: { [studentId: string]: { [date: string]: Grade[] } } = {};
    filteredGrades.forEach(g => {
        if (!studentDateGrades[g.student_id]) studentDateGrades[g.student_id] = {};
        if (!studentDateGrades[g.student_id][g.date]) studentDateGrades[g.student_id][g.date] = [];
        studentDateGrades[g.student_id][g.date].push(g);
    });

    const handleDeleteDay = async (dateToDelete: string) => {
        if (!window.confirm(`დარწმუნებული ხართ, რომ გსურთ ${formatDate(dateToDelete)} (${dateToDelete}) თარიღის ყველა ნიშნის/სწრებადობის წაშლა?`)) {
            return;
        }
        try {
            const res = await fetch('/api/grade/delete-day', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateToDelete,
                    class_id: classId,
                    subject_id: selectedSubject !== 'all' ? selectedSubject : undefined,
                    year: selectedYear
                })
            });
            if (res.ok) {
                setGrades(prev => prev.filter(g => g.date !== dateToDelete));
                alert('დღის მონაცემები წარმატებით წაიშალა!');
            } else {
                const data = await res.json();
                alert(`წაშლა ვერ მოხერხდა: ${data.message}`);
            }
        } catch (err) {
            alert('დღის წაშლისას მოხდა შეცდომა');
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    };

    const getGradeDisplay = (gradeList: Grade[]) => {
        if (gradeList.length === 0) return null;
        const sorted = gradeList.sort((a, b) => b.pointType - a.pointType);
        return sorted.slice(0, 3).map(g => {
            const isFormative = (g as any).is_formative || (g.comment && g.comment.trim() !== '') || (g as any).point === 'განმავითარებელი' || typeof (g as any).point === 'string';
            if (isFormative) return g.comment && g.comment.trim() !== '' ? g.comment : 'განმავითარებელი';
            if (g.point === -1) return g.checked ? '✓' : '✗';
            if (g.point === -2) return 'X';
            if (g.point === -3) return 'ჩთ';
            return g.point.toString();
        }).join(', ');
    };

    const getGradeColor = (gradeList: Grade[]) => {
        if (gradeList.length === 0) return 'rgba(255,255,255,0.1)';
        const highest = gradeList.reduce((p, c) => c.pointType > p.pointType ? c : p);
        const isFormative = (highest as any).is_formative || (highest.comment && highest.comment.trim() !== '') || (highest as any).point === 'განმავითარებელი' || typeof (highest as any).point === 'string';
        if (isFormative) return '#f59e0b';
        if (highest.point === -1) return highest.checked ? '#4caf50' : '#f44336';
        if (highest.point === -2) return '#9c27b0';
        if (highest.point === -3) return '#2196f3';
        if (highest.point >= 9) return '#4caf50';
        if (highest.point >= 7) return '#ff9800';
        return '#f44336';
    };

    return (
        <div className="admin-view-container animate-fade-in-down" style={{ maxWidth: '1400px' }}>
            <header className="admin-view-header">
                <button className="admin-back-btn" onClick={onBackClick}>
                    <ArrowLeftIcon size={20} /> უკან
                </button>
                <h2 className="admin-view-title">
                    {className} - {subjectName || (selectedSubject !== 'all' ? subjects.find(s => s._id === selectedSubject)?.name : 'დეტალური ისტორია')}
                </h2>
                {!subjectId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span className="admin-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>ფილტრი:</span>
                        <select className="admin-select" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} style={{ minWidth: '200px' }}>
                            <option value="all">ყველა საგანი</option>
                            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </div>
                )}
            </header>

            {allDatesArr.length === 0 ? (
                <div className="admin-form-container" style={{ maxWidth: 'none', textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.5)' }}>
                    ამ კლასში ნიშნები ვერ მოიძებნა
                </div>
            ) : (
                <div className="admin-list-container animate-zoom-in" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="admin-table-wrapper" style={{ width: '100%', maxHeight: '70vh', overflow: 'auto' }}>
                        <table className="admin-table" style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr>
                                    <th style={{ minWidth: '250px', background: 'rgba(20, 25, 40, 0.95)', backdropFilter: 'blur(10px)', position: 'sticky', left: 0, zIndex: 11 }}>სახელი გვარი</th>
                                    {allDatesArr.map(date => (
                                        <th key={date} style={{ textAlign: 'center', minWidth: '100px', verticalAlign: 'top', padding: '10px 8px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                <span>{formatDate(date)}</span>
                                                <button
                                                    onClick={() => handleDeleteDay(date)}
                                                    title="დღის სრულად წაშლა"
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.2)',
                                                        border: '1px solid rgba(239, 68, 68, 0.4)',
                                                        color: '#f87171',
                                                        borderRadius: '6px',
                                                        padding: '2px 6px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '3px',
                                                        transition: 'all 0.2s',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                                >
                                                წაშლა
                                                </button>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {students.length > 0 ? students.map((student, idx) => (
                                    <tr key={student._id}>
                                                                        <td style={{ fontWeight: '700', color: 'white', position: 'sticky', left: 0, background: idx % 2 === 0 ? 'rgba(11, 20, 55, 0.98)' : 'rgba(22, 30, 68, 0.98)', backdropFilter: 'blur(10px)', zIndex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedColor }}></div>
                                                {student.name} {student.surname}
                                            </div>
                                        </td>
                                        {allDatesArr.map(date => {
                                            const gradeList = studentDateGrades[student._id]?.[date] || [];
                                            return (
                                                <td key={date} style={{ textAlign: 'center', fontWeight: '800', color: getGradeColor(gradeList) }}>
                                                    {getGradeDisplay(gradeList) || '-'}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                )) : (
                                    <tr><td colSpan={allDatesArr.length + 1} style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>მოსწავლეები ვერ მოიძებნა</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div style={{
                marginTop: '16px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
            }}>
                {[
                    { glyph: '✓', color: '#4caf50', label: 'დასწრება' },
                    { glyph: '✗', color: '#f44336', label: 'გაცდენა' },
                    { glyph: '10', color: '#4caf50', label: 'მაღალი' },
                    { glyph: '7', color: '#ff9800', label: 'საშუალო' },
                    { glyph: '4', color: '#f44336', label: 'დაბალი' },
                ].map((item) => (
                    <div key={item.label} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.04)',
                    }}>
                        <span style={{ color: item.color, fontWeight: 800, fontSize: '14px' }}>{item.glyph}</span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DetailedGradeHistory;
