"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IoArrowBack } from 'react-icons/io5';
import { IoDownload } from 'react-icons/io5';
import * as XLSX from 'xlsx';

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string }>;
const DownloadIcon = IoDownload as React.FC<{ size?: number | string }>;

interface Subject {
    _id: string;
    name: string;
}

interface Teacher {
    _id: string;
    name: string;
    surname: string;
    user_ID: string;
}

interface ClassSubject {
    subject_id: string;
    teacher_id: string;
}

interface Class {
    _id: string;
    classname: string;
    damrigebeli?: string;
    subjects: ClassSubject[];
}

interface SubjectListProps {
    classId: string;
    className: string;
    selectedColor: string;
    logoutButtonStyle: React.CSSProperties;
    onBackClick: () => void;
    onSubjectClick: (subjectId: string, subjectName: string) => void;
    selectedYear?: string;
}

const SubjectList: React.FC<SubjectListProps> = ({
    classId,
    className,
    selectedColor,
    onBackClick,
    onSubjectClick,
    selectedYear
}) => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [classData, setClassData] = useState<Class | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editSubjectTarget, setEditSubjectTarget] = useState<Subject | null>(null);
    const [editSubjectName, setEditSubjectName] = useState('');
    const [editSubjectIsProject, setEditSubjectIsProject] = useState(false);
    const [savingSubject, setSavingSubject] = useState(false);

    const openEditSubjectModal = (subj: Subject) => {
        setEditSubjectTarget(subj);
        setEditSubjectName(subj.name);
        const isProj = Boolean(
            (subj as any).is_project || (subj as any).is_pass_fail || (subj as any).type === 'project' || /პროექტი|ჩათვლა|პროექტული/i.test(subj.name)
        );
        setEditSubjectIsProject(isProj);
        setEditModalOpen(true);
    };

    const handleSaveSubject = async () => {
        if (!editSubjectTarget || !editSubjectName.trim()) return;
        setSavingSubject(true);
        try {
            const res = await fetch('/api/subject/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _id: editSubjectTarget._id,
                    name: editSubjectName.trim(),
                    is_project: editSubjectIsProject,
                    is_pass_fail: editSubjectIsProject
                })
            });
            if (res.ok) {
                const updatedName = editSubjectName.trim();
                setSubjects(prev => prev.map(s => s._id === editSubjectTarget._id ? {
                    ...s,
                    name: updatedName,
                    is_project: editSubjectIsProject,
                    is_pass_fail: editSubjectIsProject
                } : s));
                setEditModalOpen(false);
            } else {
                alert('საგნის განახლება ვერ მოხერხდა');
            }
        } catch (err) {
            alert('შეცდომა საგნის განახლებისას');
        } finally {
            setSavingSubject(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const subjectsRes = await fetch('/api/subjects');
                const subjectsData = await subjectsRes.json();
                setSubjects(subjectsData);

                const teachersRes = await fetch('/api/teacher/all');
                const teachersData = await teachersRes.json();
                setTeachers(teachersData);

                const classesRes = await fetch('/api/classes');
                const classesData = await classesRes.json();
                const foundClass = classesData.find((cls: any) => cls._id === classId);
                
                if (foundClass && selectedYear) {
                    const historyEntry = foundClass.history?.find((h: any) => h.year === selectedYear);
                    if (historyEntry) {
                        foundClass.subjects = historyEntry.subjects || [];
                    }
                }
                setClassData(foundClass);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [classId, selectedYear]);

    const downloadClassHistory = async () => {
        if (!classData) return;
        setDownloading(true);
        try {
            let gradesUrl = `/api/grades?class_id=${classId}`;
            if (selectedYear) {
                gradesUrl += `&year=${selectedYear}`;
            }
            const gradesRes = await fetch(gradesUrl);
            if (!gradesRes.ok) throw new Error(`Failed to fetch grades`);
            const gradesData = await gradesRes.json();
            const grades = Array.isArray(gradesData) ? gradesData : [];

            const match = className.match(/^([0-9]+)([ა-ჰ])$/);
            const studentsUrl = match
                ? `/api/student/grade/${match[1]}?parallel=${encodeURIComponent(match[2])}`
                : '/api/student/all';
            const studentsRes = await fetch(studentsUrl);
            if (!studentsRes.ok) throw new Error(`Failed to fetch students`);
            const studentsData = await studentsRes.json();
            const classStudents = match
                ? studentsData
                : studentsData.filter((s: any) => s.classInfo && s.classInfo._id === classId);

            const subjectCardsData = classData.subjects?.map(classSubject => {
                const subject = subjects.find(s => s._id === classSubject.subject_id);
                const teacher = teachers.find(t => t._id === classSubject.teacher_id);
                if (!subject || !teacher) return null;
                return {
                    subjectId: subject._id,
                    subjectName: subject.name,
                    teacherName: `${teacher.name} ${teacher.surname}`,
                    teacherId: teacher._id
                };
            }).filter((card): card is NonNullable<typeof card> => card !== null) || [];

            const workbook = XLSX.utils.book_new();
            subjectCardsData.forEach((subjectCard) => {
                const subjectGrades = grades.filter((g: any) => g.subject_id === subjectCard.subjectId);
                const dates = Array.from(new Set(subjectGrades.map((g: any) => g.date))).sort();
                const worksheetData = [];
                const headerRow = ['სახელი გვარი'];
                dates.forEach(date => {
                    const dateObj = new Date(date);
                    headerRow.push(`${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`);
                });
                worksheetData.push(headerRow);

                classStudents.forEach((student: any) => {
                    const studentRow = [`${student.name} ${student.surname}`];
                    dates.forEach(date => {
                        const studentGrades = subjectGrades.filter((g: any) => g.student_id === student._id && g.date === date);
                        if (studentGrades.length > 0) {
                            const highestGrade = studentGrades.reduce((prev: any, current: any) => current.pointType > prev.pointType ? current : prev);
                            if (highestGrade.point === -1) studentRow.push(highestGrade.checked ? '✓' : '✗');
                            else if (highestGrade.point === -2) studentRow.push('✗');
                            else studentRow.push(highestGrade.point.toString());
                        } else studentRow.push('-');
                    });
                    worksheetData.push(studentRow);
                });

                const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
                let sheetName = subjectCard.subjectName.substring(0, 31);
                XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            });

            const fileName = `${className}_ისტორია_${new Date().getFullYear()}.xlsx`;
            XLSX.writeFile(workbook, fileName);
        } catch (error) {
            console.error('Error:', error);
            alert('გადმოწერა ვერ მოხერხდა');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '40px' }}>იტვირთება...</div>;
    if (!classData) return <div style={{ color: 'white', textAlign: 'center', marginTop: '40px' }}>კლასი ვერ მოიძებნა</div>;

    const subjectCards = classData.subjects?.map(cs => {
        const subject = subjects.find(s => s._id === cs.subject_id);
        const teacher = teachers.find(t => t._id === cs.teacher_id);
        if (!subject || !teacher) return null;
        return { subjectId: subject._id, subjectName: subject.name, teacherName: `${teacher.name} ${teacher.surname}` };
    }).filter((c): c is NonNullable<typeof c> => c !== null) || [];

    return (
        <div className="admin-view-container animate-fade-in-down">
            <header className="admin-view-header">
                <button className="admin-back-btn" onClick={onBackClick}>
                    <ArrowLeftIcon size={20} /> უკან
                </button>
                <h2 className="admin-view-title">{className} - საგნები</h2>
                <button
                    className="admin-action-btn"
                    onClick={downloadClassHistory}
                    disabled={downloading || subjectCards.length === 0}
                    style={{ background: '#4caf50', display: 'flex', gap: '8px', padding: '0 20px', width: 'auto', borderRadius: '12px', height: '45px', fontSize: '14px' }}
                >
                    <DownloadIcon size={20} />
                    {downloading ? 'იტვირთება...' : 'გადმოწერე ისტორია'}
                </button>
            </header>

            <div className="admin-grid" style={{ gap: "30px" }}>
                {subjectCards.length > 0 ? (
                    subjectCards.map((card) => (
                        <div
                            key={card.subjectId}
                            className="admin-card animate-zoom-in"
                            onClick={() => onSubjectClick(card.subjectId, card.subjectName)}
                            style={{ 
                                minHeight: '160px', 
                                justifyContent: 'center',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '20px',
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                boxShadow: '0 6px 20px rgba(0,0,0,0.04)',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.borderColor = '#2563eb';
                                e.currentTarget.style.transform = 'translateY(-6px)';
                                e.currentTarget.style.boxShadow = '0 16px 35px rgba(37, 99, 235, 0.18)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.04)';
                            }}
                        >
                            <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginBottom: '8px', textAlign: 'center' }}>
                                {card.subjectName}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                                მასწავლებელი
                            </div>
                            <div style={{ fontSize: '16px', color: '#2563eb', fontWeight: 800, marginTop: '4px', textAlign: 'center' }}>
                                {card.teacherName}
                            </div>
                            <div style={{ position: 'absolute', bottom: '12px', right: '16px', fontSize: '11px', color: '#94a3b8', fontWeight: 800 }}>
                                {new Date().getFullYear()}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="admin-form-container" style={{ gridColumn: '1 / -1', maxWidth: 'none', textAlign: 'center' }}>
                        ამ კლასში საგნები ვერ მოიძებნა
                    </div>
                )}
            </div>

            {/* Modal for editing subject details (name, is_project) */}
            {editModalOpen && editSubjectTarget && typeof window !== 'undefined' && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(5, 10, 25, 0.85)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 999999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                        border: '1px solid rgba(96, 165, 250, 0.3)',
                        borderRadius: '20px',
                        padding: '28px',
                        width: '100%',
                        maxWidth: '440px',
                        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        margin: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#60a5fa' }}>
                                ⚙️ საგნის ჩასწორება
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditModalOpen(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.6)',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    საგნის დასახელება:
                                </label>
                                <input
                                    type="text"
                                    value={editSubjectName}
                                    onChange={(e) => setEditSubjectName(e.target.value)}
                                    placeholder="შეიყვანეთ საგნის სახელი"
                                    className="admin-input"
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: 600 }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    საგნის ტიპი (შეფასების სისტემა):
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setEditSubjectIsProject(false)}
                                        style={{
                                            flex: 1,
                                            padding: '10px 8px',
                                            borderRadius: '10px',
                                            border: !editSubjectIsProject ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.12)',
                                            background: !editSubjectIsProject ? 'rgba(96, 165, 250, 0.25)' : 'rgba(255,255,255,0.04)',
                                            color: !editSubjectIsProject ? '#60a5fa' : 'white',
                                            fontWeight: 800,
                                            fontSize: '13px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        📊 სტანდარტული (0-10)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditSubjectIsProject(true)}
                                        style={{
                                            flex: 1,
                                            padding: '10px 8px',
                                            borderRadius: '10px',
                                            border: editSubjectIsProject ? '2px solid #c084fc' : '1px solid rgba(255,255,255,0.12)',
                                            background: editSubjectIsProject ? 'rgba(192, 132, 252, 0.25)' : 'rgba(255,255,255,0.04)',
                                            color: editSubjectIsProject ? '#c084fc' : 'white',
                                            fontWeight: 800,
                                            fontSize: '13px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🎯 პროექტული (ჩათვლა)
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={handleSaveSubject}
                                    disabled={savingSubject || !editSubjectName.trim()}
                                    style={{
                                        flex: 1,
                                        padding: '12px 18px',
                                        borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        border: 'none',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '14px',
                                        cursor: savingSubject ? 'wait' : 'pointer',
                                        opacity: (!editSubjectName.trim() || savingSubject) ? 0.6 : 1
                                    }}
                                >
                                    {savingSubject ? 'ინახება...' : 'შენახვა'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    disabled={savingSubject}
                                    style={{
                                        padding: '12px 18px',
                                        borderRadius: '10px',
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    გაუქმება
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default SubjectList;
