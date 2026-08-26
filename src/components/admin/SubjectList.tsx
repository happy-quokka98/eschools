"use client";
import React, { useState, useEffect } from 'react';
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
                            if (highestGrade.point === -1) studentRow.push(highestGrade.checked ? 'დასწრება' : 'არ დასწრება');
                            else if (highestGrade.point === -2) studentRow.push('X');
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
                                minHeight: '180px', 
                                justifyContent: 'center',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                padding: '25px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
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
                            <div style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '10px' }}>
                                {card.subjectName}
                            </div>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                მასწავლებელი
                            </div>
                            <div style={{ fontSize: '18px', color: '#cbd5e1', fontWeight: '600', marginTop: '4px' }}>
                                {card.teacherName}
                            </div>
                            <div style={{ position: 'absolute', bottom: '15px', right: '20px', fontSize: '11px', opacity: 0.3, fontWeight: '800' }}>
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
        </div>
    );
};

export default SubjectList;
