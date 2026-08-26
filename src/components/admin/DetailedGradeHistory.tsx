"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IoArrowBack } from 'react-icons/io5';

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string }>;

interface Grade {
    _id: string;
    student_id: string;
    subject_id: string;
    class_id: string;
    teacher_id: string;
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
    classSwitcher?: React.ReactNode;
}

const DetailedGradeHistory: React.FC<DetailedGradeHistoryProps> = ({
    classId,
    className,
    subjectId,
    subjectName,
    selectedColor,
    onBackClick,
    classSwitcher
}) => {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string>(subjectId || 'all');

    useEffect(() => {
        if (subjectId) setSelectedSubject(subjectId);
    }, [subjectId]);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const [selectedCellDate, setSelectedCellDate] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedGradeList, setSelectedGradeList] = useState<Grade[]>([]);

    // Form states for editing a grade
    const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
    const [editPoint, setEditPoint] = useState<string>('');
    const [editPointType, setEditPointType] = useState<number>(2);
    const [editComment, setEditComment] = useState<string>('');
    const [editSubjectId, setEditSubjectId] = useState<string>('');
    const [isNewGradeForm, setIsNewGradeForm] = useState<boolean>(false);
    const [editLoading, setEditLoading] = useState<boolean>(false);
    const [currentClassObj, setCurrentClassObj] = useState<any>(null);

    // Fetch class details to get teacher mappings
    useEffect(() => {
        const fetchClassDetails = async () => {
            try {
                const res = await fetch('/api/classes');
                if (res.ok) {
                    const data = await res.json();
                    const cls = data.find((c: any) => c._id === classId);
                    setCurrentClassObj(cls);
                }
            } catch (err) {
                console.error("Error fetching classes details:", err);
            }
        };
        fetchClassDetails();
    }, [classId]);

    const parsePoint = (ptStr: string, isAbsence: boolean, isX: boolean, isCT: boolean) => {
        if (isCT || ptStr === 'ჩთ') return -3;
        if (isX || ptStr === 'X') return -2;
        if (isAbsence || ptStr === 'გაცდენა') return -1;
        if (ptStr === 'დასწრება') return -1;
        return parseInt(ptStr, 10);
    };

    const handleUpdateGrade = async (grade: Grade) => {
        try {
            setEditLoading(true);
            const isCT = editPoint === 'ჩთ';
            const isX = editPoint === 'X';
            const isAbsence = editPoint === 'გაცდენა';
            const isAttendance = editPoint === 'დასწრება';
            const numericPoint = parsePoint(editPoint, isAbsence, isX, isCT);

            const payload = {
                student_id: grade.student_id,
                subject_id: grade.subject_id,
                class_id: grade.class_id,
                date: grade.date,
                teacher_id: grade.teacher_id,
                point: numericPoint,
                pointType: editPointType,
                checked: !isAbsence,
                comment: editComment,
                isAdmin: true,
            };

            const res = await fetch('/api/grade/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.message || 'შეცდომა ნიშნის შენახვისას');
                setEditLoading(false);
                return;
            }

            // Refresh grades in local state
            const updatedRes = await fetch(`/api/grades?class_id=${classId}`);
            if (updatedRes.ok) {
                const updatedData = await updatedRes.json();
                setGrades(updatedData);
            }

            setEditingGradeId(null);
            setEditLoading(false);
            setEditModalOpen(false);
        } catch (err) {
            console.error("Error updating grade:", err);
            alert("შეცდომა ნიშნის ჩასწორებისას");
            setEditLoading(false);
        }
    };

    const handleDeleteGrade = async (gradeId: string) => {
        if (!window.confirm("ნამდვილად გსურთ ამ ნიშნის წაშლა?")) return;
        try {
            setEditLoading(true);
            const res = await fetch('/api/grade/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: gradeId, date: selectedCellDate }),
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.message || 'შეცდომა ნიშნის წაშლისას');
                setEditLoading(false);
                return;
            }

            // Refresh grades in local state
            const updatedRes = await fetch(`/api/grades?class_id=${classId}`);
            if (updatedRes.ok) {
                const updatedData = await updatedRes.json();
                setGrades(updatedData);
            }

            setEditingGradeId(null);
            setEditLoading(false);
            setEditModalOpen(false);
        } catch (err) {
            console.error("Error deleting grade:", err);
            alert("შეცდომა წაშლისას");
            setEditLoading(false);
        }
    };

    const handleAddNewGrade = async () => {
        try {
            setEditLoading(true);
            // Find teacher_id from class mapping
            const classSubj = currentClassObj?.subjects?.find((s: any) => s.subject_id === editSubjectId);
            const teacherId = classSubj?.teacher_id;

            if (!teacherId) {
                alert("ამ საგნისთვის მასწავლებელი არ არის მიბმული კლასში");
                setEditLoading(false);
                return;
            }

            const isCT = editPoint === 'ჩთ';
            const isX = editPoint === 'X';
            const isAbsence = editPoint === 'გაცდენა';
            const isAttendance = editPoint === 'დასწრება';
            const numericPoint = parsePoint(editPoint, isAbsence, isX, isCT);

            const payload = {
                student_id: selectedStudent?._id,
                subject_id: editSubjectId,
                class_id: classId,
                date: selectedCellDate,
                teacher_id: teacherId,
                point: numericPoint,
                pointType: editPointType,
                checked: !isAbsence,
                comment: editComment,
                isAdmin: true,
            };

            const res = await fetch('/api/grade/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.message || 'შეცდომა ნიშნის დამატებისას');
                setEditLoading(false);
                return;
            }

            // Refresh grades in local state
            const updatedRes = await fetch(`/api/grades?class_id=${classId}`);
            if (updatedRes.ok) {
                const updatedData = await updatedRes.json();
                setGrades(updatedData);
            }

            setIsNewGradeForm(false);
            setEditLoading(false);
            setEditModalOpen(false);
        } catch (err) {
            console.error("Error adding grade:", err);
            alert("შეცდომა ნიშნის დამატებისას");
            setEditLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const gradesRes = await fetch(`/api/grades?class_id=${classId}`);
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
    }, [classId, className]);

    if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '40px' }}>იტვირთება...</div>;

    const filteredGrades = selectedSubject === 'all' ? grades : grades.filter(g => g.subject_id === selectedSubject);
    const allDatesArr = Array.from(new Set(filteredGrades.map(g => g.date))).sort();
    const studentDateGrades: { [studentId: string]: { [date: string]: Grade[] } } = {};
    filteredGrades.forEach(g => {
        if (!studentDateGrades[g.student_id]) studentDateGrades[g.student_id] = {};
        if (!studentDateGrades[g.student_id][g.date]) studentDateGrades[g.student_id][g.date] = [];
        studentDateGrades[g.student_id][g.date].push(g);
    });

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    };

    const getGradeDisplay = (gradeList: Grade[]) => {
        if (gradeList.length === 0) return null;
        const sorted = gradeList.sort((a, b) => b.pointType - a.pointType || b.point - a.point);
        return sorted.slice(0, 3).map(g => g.point === -1 ? (g.checked ? '✓' : '✗') : g.point === -2 ? 'X' : g.point.toString()).join(', ');
    };

    const getGradeColor = (gradeList: Grade[]) => {
        if (gradeList.length === 0) return 'rgba(255,255,255,0.1)';
        const highest = gradeList.reduce((p, c) => c.pointType > p.pointType ? c : p);
        if (highest.point === -1) return highest.checked ? '#4caf50' : '#f44336';
        if (highest.point === -2) return '#9c27b0';
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
                {classSwitcher ? classSwitcher : (
                    <h2 className="admin-view-title">
                        {className} - {subjectName || (selectedSubject !== 'all' ? subjects.find(s => s._id === selectedSubject)?.name : 'დეტალური ისტორია')}
                    </h2>
                )}
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
                                        <th key={date} style={{ textAlign: 'center', minWidth: '90px' }}>{formatDate(date)}</th>
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
                                             const gradeColor = getGradeColor(gradeList);
                                             let cellBg = undefined;
                                             let cellColor = gradeColor;
                                             const hasSummative = gradeList.some(g => g.pointType === 3);
                                             const hasHomework = gradeList.some(g => g.pointType === 1);
                                             if (hasSummative) {
                                                 cellBg = 'rgba(239, 68, 68, 0.15)'; // Soft red
                                                 cellColor = '#ef4444'; // Red
                                             } else if (hasHomework) {
                                                 cellBg = 'rgba(245, 158, 11, 0.15)'; // Soft yellow
                                                 cellColor = '#f59e0b'; // Yellow
                                             }
                                             return (
                                                 <td 
                                                     key={date} 
                                                     onClick={() => {
                                                         setSelectedStudent(student);
                                                         setSelectedCellDate(date);
                                                         setSelectedGradeList(gradeList);
                                                         setEditingGradeId(null);
                                                         setIsNewGradeForm(false);
                                                         setEditModalOpen(true);
                                                     }}
                                                     style={{ textAlign: 'center', fontWeight: '800', backgroundColor: cellBg, color: cellColor, cursor: 'pointer' }}
                                                 >
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

            {/* Modal must be rendered here, inside the main return */}
            {mounted && editModalOpen && selectedStudent && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        padding: '30px',
                        width: '450px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        color: 'white',
                    }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: selectedColor }}>ნიშნების მართვა</h3>
                        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
                            <strong>მოსწავლე:</strong> {selectedStudent.name} {selectedStudent.surname}<br />
                            <strong>თარიღი:</strong> {selectedCellDate}
                        </p>

                        {/* List of existing grades */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0', fontSize: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>არსებული ნიშნები:</h4>
                            {selectedGradeList.length === 0 ? (
                                <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>ნიშნები არ ფიქსირდება</p>
                            ) : (
                                selectedGradeList.map((g) => {
                                    const subjName = subjects.find(s => s._id === g.subject_id)?.name || 'უცნობი საგანი';
                                    const typeLbl = g.pointType === 1 ? 'საშინაო' : g.pointType === 2 ? 'საკლასო' : g.pointType === 3 ? 'შემაჯამებელი' : g.pointType === 4 ? 'ექსტერნი' : 'დასწრება';
                                    const pointLbl = g.point === -1 ? (g.checked ? 'დასწრება' : 'გაცდენა') : g.point === -2 ? 'X' : g.point === -3 ? 'ჩთ' : g.point.toString();

                                    const isThisEditing = editingGradeId === g._id;

                                    return (
                                        <div key={g._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{subjName}</div>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{typeLbl} • {pointLbl}</div>
                                                    {g.comment && <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#cbd5e1', marginTop: '4px' }}>"{g.comment}"</div>}
                                                </div>
                                                {!isThisEditing && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingGradeId(g._id);
                                                            setEditPoint(g.point === -1 ? (g.checked ? 'დასწრება' : 'გაცდენა') : g.point === -2 ? 'X' : g.point === -3 ? 'ჩთ' : g.point.toString());
                                                            setEditPointType(g.pointType);
                                                            setEditComment(g.comment || '');
                                                            setIsNewGradeForm(false);
                                                        }}
                                                        style={{ background: selectedColor, color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                                                    >
                                                        ჩასწორება
                                                    </button>
                                                )}
                                            </div>

                                            {/* Edit fields for this grade */}
                                            {isThisEditing && (
                                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>ქულა:</label>
                                                        <select
                                                            value={editPoint}
                                                            onChange={(e) => setEditPoint(e.target.value)}
                                                            style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px', borderRadius: '4px' }}
                                                        >
                                                            {Array.from({ length: 11 }, (_, i) => i).map(n => <option key={n} value={n.toString()}>{n}</option>)}
                                                            <option value="ჩთ">ჩთ</option>
                                                            <option value="დასწრება">დასწრება</option>
                                                            <option value="გაცდენა">გაცდენა</option>
                                                            <option value="X">X</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>ტიპი:</label>
                                                        <select
                                                            value={editPointType}
                                                            onChange={(e) => setEditPointType(Number(e.target.value))}
                                                            style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px', borderRadius: '4px' }}
                                                        >
                                                            <option value={1}>საშინაო</option>
                                                            <option value={2}>საკლასო</option>
                                                            <option value={3}>შემაჯამებელი</option>
                                                            <option value={4}>ექსტერნი</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>კომენტარი:</label>
                                                        <input
                                                            type="text"
                                                            value={editComment}
                                                            onChange={(e) => setEditComment(e.target.value)}
                                                            style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px', borderRadius: '4px', boxSizing: 'border-box' }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                                        <button
                                                            onClick={() => handleUpdateGrade(g)}
                                                            disabled={editLoading}
                                                            style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                                        >
                                                            {editLoading ? 'ინახება...' : 'შენახვა'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteGrade(g._id)}
                                                            disabled={editLoading}
                                                            style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                                        >
                                                            წაშლა
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingGradeId(null)}
                                                            disabled={editLoading}
                                                            style={{ background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
                                                        >
                                                            გაუქმება
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Add new grade section */}
                        {!isNewGradeForm ? (
                            <button
                                onClick={() => {
                                    setIsNewGradeForm(true);
                                    setEditingGradeId(null);
                                    setEditSubjectId(subjectId && subjectId !== 'all' ? subjectId : (subjects[0]?._id || ''));
                                    setEditPoint('10');
                                    setEditPointType(2);
                                    setEditComment('');
                                }}
                                style={{ width: '100%', background: 'transparent', border: `1.5px dashed ${selectedColor}`, color: selectedColor, borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}
                            >
                                + ახალი ნიშნის დამატება
                            </button>
                        ) : (
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '15px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: selectedColor }}>ახალი ნიშანი:</h4>
                                <div>
                                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>საგანი:</label>
                                    <select
                                        value={editSubjectId}
                                        onChange={(e) => setEditSubjectId(e.target.value)}
                                        disabled={!!subjectId && subjectId !== 'all'}
                                        style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px', borderRadius: '4px' }}
                                    >
                                        {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>ქულა:</label>
                                    <select
                                        value={editPoint}
                                        onChange={(e) => setEditPoint(e.target.value)}
                                        style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px', borderRadius: '4px' }}
                                    >
                                        {Array.from({ length: 11 }, (_, i) => i).map(n => <option key={n} value={n.toString()}>{n}</option>)}
                                        <option value="ჩთ">ჩთ</option>
                                        <option value="დასწრება">დასწრება</option>
                                        <option value="გაცდენა">გაცდენა</option>
                                        <option value="X">X</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>ტიპი:</label>
                                    <select
                                        value={editPointType}
                                        onChange={(e) => setEditPointType(Number(e.target.value))}
                                        style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px', borderRadius: '4px' }}
                                    >
                                        <option value={1}>საშინაო</option>
                                        <option value={2}>საკლასო</option>
                                        <option value={3}>შემაჯამებელი</option>
                                        <option value={4}>ექსტერნი</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>კომენტარი:</label>
                                    <input
                                        type="text"
                                        value={editComment}
                                        onChange={(e) => setEditComment(e.target.value)}
                                        style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                    <button
                                        onClick={handleAddNewGrade}
                                        disabled={editLoading}
                                        style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        {editLoading ? 'ემატება...' : 'დამატება'}
                                    </button>
                                    <button
                                        onClick={() => setIsNewGradeForm(false)}
                                        disabled={editLoading}
                                        style={{ background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 12px', fontSize: '13px', cursor: 'pointer' }}
                                    >
                                        გაუქმება
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}
                            >
                                დახურვა
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DetailedGradeHistory;
