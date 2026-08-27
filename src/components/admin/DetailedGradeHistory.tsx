"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useColor } from '../ColorContext';
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
    selectedColor?: string;
    logoutButtonStyle?: React.CSSProperties;
    onBackClick: () => void;
    selectedYear?: string;
    isAdmin?: boolean;
}

const isDateEditableForUser = (dateStr: string, isAdminUser?: boolean): boolean => {
    if (isAdminUser) return true;
    if (!dateStr) return true;
    const gradeDate = new Date(dateStr);
    if (isNaN(gradeDate.getTime())) return true;
    gradeDate.setHours(0, 0, 0, 0);

    const minAllowedDate = new Date();
    minAllowedDate.setDate(minAllowedDate.getDate() - 14);
    minAllowedDate.setHours(0, 0, 0, 0);

    return gradeDate >= minAllowedDate;
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

const normalizeAcademicYear = (yr?: string | null): string | null => {
    if (!yr) return null;
    const m1 = yr.match(/^(\d{2,4})[-/](\d{2,4})$/);
    if (m1) {
        let s = parseInt(m1[1], 10);
        let e = parseInt(m1[2], 10);
        if (s < 100) s += 2000;
        if (e < 100) e += 2000;
        return `${s}-${e}`;
    }
    const m2 = yr.match(/^(\d{2})(\d{2})year$/);
    if (m2) {
        return `20${m2[1]}-20${m2[2]}`;
    }
    const m3 = yr.match(/^(\d{4})year$/);
    if (m3) {
        const s = parseInt(m3[1], 10);
        return `${s}-${s + 1}`;
    }
    return yr;
};

const isDateInSemester = (dateStr: string, semester: 'all' | '1' | '2') => {
    if (semester === 'all') return true;
    const parts = dateStr.split(/[-/]/);
    let month = 0;
    if (parts.length >= 3) {
        if (parts[0].length === 4) month = parseInt(parts[1], 10);
        else month = parseInt(parts[1], 10);
    } else if (parts.length === 2) {
        month = parseInt(parts[1], 10);
    }
    if (!month || isNaN(month)) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) month = d.getMonth() + 1;
    }
    if (!month) return true;
    if (semester === '1') {
        return month >= 9 && month <= 12;
    } else {
        return month >= 1 && month <= 6;
    }
};

const DetailedGradeHistory: React.FC<DetailedGradeHistoryProps> = ({
    classId,
    className,
    subjectId,
    subjectName,
    selectedColor,
    onBackClick,
    selectedYear,
    isAdmin = false
}) => {
    const { currentTheme } = useColor();
    const isDark = currentTheme.id === 'dark';

    const pageBg = isDark ? '#090d16' : '#f8fafc';
    const cardBg = isDark ? '#111827' : '#ffffff';
    const cardBorder = isDark ? '#1f2937' : '#e2e8f0';
    const textColor = isDark ? '#ffffff' : '#1e293b';
    const headingColor = isDark ? '#ffffff' : '#2e1065';
    const accentTitleColor = isDark ? '#38bdf8' : '#4338ca';
    const subTextColor = isDark ? '#94a3b8' : '#64748b';
    const stickyHeaderBg = isDark ? '#1f2937' : '#ffffff';
    const stickyColBg = isDark ? '#111827' : '#ffffff';
    const borderGridColor = isDark ? '#374151' : '#e2e8f0';

    const currentAy = getCurrentAcademicYear();
    const [grades, setGrades] = useState<Grade[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string>(subjectId || 'all');
    const [academicYearFilter, setAcademicYearFilter] = useState<string>(normalizeAcademicYear(selectedYear) || currentAy);
    const [semesterFilter, setSemesterFilter] = useState<'all' | '1' | '2'>('1');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [mobileSearchQuery, setMobileSearchQuery] = useState('');
    const [expandedMobileStudentId, setExpandedMobileStudentId] = useState<string | null>(null);
    const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'matrix'>('matrix');

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{
        student: Student;
        date: string;
        targetGrade: Grade | null;
    } | null>(null);

    const [isAttending, setIsAttending] = useState<boolean>(true);
    const [editPoint, setEditPoint] = useState<string>('10');
    const [editPointType, setEditPointType] = useState<number>(1);
    const [editSubjectId, setEditSubjectId] = useState<string>('');
    const [savingGrade, setSavingGrade] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [subjectModalOpen, setSubjectModalOpen] = useState(false);
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
        setSubjectModalOpen(true);
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
                setToast({ message: '✓ საგანი წარმატებით ჩასწორდა!', type: 'success' });
                setTimeout(() => setToast(null), 3000);
                setSubjectModalOpen(false);
            } else {
                const data = await res.json();
                setToast({ message: `შეცდომა: ${data.message || 'ვერ ჩაასწორა'}`, type: 'error' });
                setTimeout(() => setToast(null), 3000);
            }
        } catch (err) {
            setToast({ message: 'საგნის ჩასწორებისას მოხდა შეცდომა', type: 'error' });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSavingSubject(false);
        }
    };

    useEffect(() => {
        if (subjectId) setSelectedSubject(subjectId);
    }, [subjectId]);

    useEffect(() => {
        if (selectedYear) {
            const norm = normalizeAcademicYear(selectedYear);
            if (norm) setAcademicYearFilter(norm);
        }
    }, [selectedYear]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const yearToFetch = academicYearFilter !== 'all' ? academicYearFilter : (selectedYear || '');
                let gradesUrl = `/api/grades?class_id=${classId}`;
                if (yearToFetch) {
                    gradesUrl += `&year=${encodeURIComponent(yearToFetch)}`;
                }

                const match = className.match(/^([0-9]+)([ა-ჰ])$/);
                const studentsUrl = match
                    ? `/api/student/grade/${match[1]}?parallel=${encodeURIComponent(match[2])}`
                    : '/api/student/all';

                const [gradesRes, studentsRes, allStudentsRes, subjectsRes] = await Promise.all([
                    fetch(gradesUrl),
                    fetch(studentsUrl),
                    fetch('/api/student/all'),
                    fetch('/api/subjects')
                ]);

                const [gradesData, studentsData, allStudentsData, subjectsData] = await Promise.all([
                    gradesRes.json(),
                    studentsRes.json(),
                    allStudentsRes.json(),
                    subjectsRes.json()
                ]);

                setGrades(Array.isArray(gradesData) ? gradesData : []);
                let classStudents = Array.isArray(studentsData)
                    ? (match ? studentsData : studentsData.filter((s: any) => s.classInfo && s.classInfo._id === classId))
                    : [];

                if (Array.isArray(gradesData) && Array.isArray(allStudentsData)) {
                    const existingStudentIds = new Set(classStudents.map((s: any) => s._id ? s._id.toString() : ''));
                    const allStudentsMap = new Map(allStudentsData.map((s: any) => [s._id ? s._id.toString() : '', s]));

                    gradesData.forEach((g: Grade) => {
                        if (g.student_id) {
                            const sidStr = g.student_id.toString();
                            if (!existingStudentIds.has(sidStr) && allStudentsMap.has(sidStr)) {
                                const transferredStudent = allStudentsMap.get(sidStr);
                                classStudents.push({
                                    ...transferredStudent,
                                    isTransferred: true
                                });
                                existingStudentIds.add(sidStr);
                            }
                        }
                    });
                }

                setStudents(classStudents);
                setSubjects(subjectsData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };
        fetchData();
    }, [classId, className, selectedYear, academicYearFilter]);

    if (loading) {
        return (
            <div style={{ color: '#2e1065', textAlign: 'center', marginTop: '60px', fontSize: '18px', fontWeight: 700 }}>
                იტვირთება...
            </div>
        );
    }

    const subjectFilteredGrades = selectedSubject === 'all' ? grades : grades.filter(g => g.subject_id === selectedSubject);

    const detectedAcademicYears = Array.from(
        new Set(subjectFilteredGrades.map(g => getAcademicYearFromDate(g.date)).filter(Boolean) as string[])
    ).sort().reverse();

    if (!detectedAcademicYears.includes(currentAy)) {
        detectedAcademicYears.unshift(currentAy);
    }

    const filteredGrades = academicYearFilter === 'all'
        ? subjectFilteredGrades
        : subjectFilteredGrades.filter(g => getAcademicYearFromDate(g.date) === academicYearFilter);

    const rawDatesArr = Array.from(new Set(filteredGrades.map(g => g.date)))
        .sort((a, b) => sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b));

    const allDatesArr = rawDatesArr.filter(dateStr => isDateInSemester(dateStr, semesterFilter));

    const studentDateGrades: { [studentId: string]: { [date: string]: Grade[] } } = {};
    const datesPointTypes: { [date: string]: number } = {};

    filteredGrades.forEach(g => {
        if (!studentDateGrades[g.student_id]) studentDateGrades[g.student_id] = {};
        if (!studentDateGrades[g.student_id][g.date]) studentDateGrades[g.student_id][g.date] = [];
        studentDateGrades[g.student_id][g.date].push(g);

        if (g.pointType === 3) {
            datesPointTypes[g.date] = 3;
        } else if (g.pointType === 1 && datesPointTypes[g.date] !== 3) {
            datesPointTypes[g.date] = 1;
        }
    });

    const handleDeleteDay = async (dateToDelete: string) => {
        if (!isDateEditableForUser(dateToDelete, isAdmin)) {
            alert('მასწავლებელს დღის მონაცემების წაშლა შეუძლია მხოლოდ ბოლო 2 კვირის (14 დღის) ვადით. ჩასასწორებლად მიმართეთ ადმინისტრაციას.');
            return;
        }
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
                    year: selectedYear,
                    isAdmin: Boolean(isAdmin)
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

    const openEditModalForGrade = (student: Student, date: string, grade: Grade | null) => {
        setSelectedCell({ student, date, targetGrade: grade });
        const defaultSubj = selectedSubject !== 'all' ? selectedSubject : (subjects[0]?._id || '');
        const subjId = grade?.subject_id || defaultSubj;
        setEditSubjectId(subjId);
        setEditPointType(grade?.pointType || 1);

        if (!grade) {
            setIsAttending(true);
            setEditPoint('10');
        } else if (grade.point === -2 || grade.checked === false) {
            setIsAttending(false);
            setEditPoint('X');
        } else if (grade.point === -3) {
            setIsAttending(true);
            setEditPoint('ჩთ');
        } else {
            setIsAttending(true);
            setEditPoint(grade.point === -1 ? '10' : grade.point.toString());
        }
        setEditModalOpen(true);
    };

    const handleSaveGrade = async () => {
        if (!selectedCell || !editSubjectId) return;
        if (!isDateEditableForUser(selectedCell.date, isAdmin)) {
            alert('მასწავლებელს ნიშნის შეტანა/ჩასწორება შეუძლია მხოლოდ ბოლო 2 კვირის (14 დღის) ვადით. ჩასასწორებლად მიმართეთ ადმინისტრაციას.');
            return;
        }
        setSavingGrade(true);
        try {
            let pointVal = 10;
            let checkedVal = true;

            if (!isAttending) {
                pointVal = -2;
                checkedVal = false;
            } else if (editPoint === 'ჩთ') {
                pointVal = -3;
                checkedVal = true;
            } else if (editPoint === 'არა ჩთ') {
                pointVal = -3;
                checkedVal = false;
            } else {
                pointVal = parseInt(editPoint, 10);
                if (isNaN(pointVal)) pointVal = 10;
                checkedVal = true;
            }

            const payload: any = {
                student_id: selectedCell.student._id,
                subject_id: editSubjectId,
                class_id: classId,
                date: selectedCell.date,
                point: pointVal,
                pointType: editPointType,
                checked: checkedVal,
                isAdmin: Boolean(isAdmin)
            };

            if (selectedCell.targetGrade && selectedCell.targetGrade._id) {
                payload.id = selectedCell.targetGrade._id;
            }

            const res = await fetch('/api/grade/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const yearToFetch = academicYearFilter !== 'all' ? academicYearFilter : (selectedYear || '');
                let gradesUrl = `/api/grades?class_id=${classId}`;
                if (yearToFetch) gradesUrl += `&year=${encodeURIComponent(yearToFetch)}`;
                const gradesRes = await fetch(gradesUrl);
                const gradesData = await gradesRes.json();
                if (Array.isArray(gradesData)) setGrades(gradesData);
                setEditModalOpen(false);
                setToast({ message: selectedCell.targetGrade ? '✓ ნიშანი წარმატებით ჩასწორდა!' : '✓ ნიშანი წარმატებით დაემატა!', type: 'success' });
                setTimeout(() => setToast(null), 3500);
            } else {
                const data = await res.json();
                alert(`შეცდომა: ${data.message}`);
            }
        } catch (err) {
            alert('ნიშნის შენახვისას მოხდა შეცდომა');
        } finally {
            setSavingGrade(false);
        }
    };

    const handleDeleteSingleGrade = async () => {
        if (!selectedCell || !selectedCell.targetGrade) return;
        if (!isDateEditableForUser(selectedCell.date, isAdmin)) {
            alert('მასწავლებელს ნიშნის წაშლა შეუძლია მხოლოდ ბოლო 2 კვირის (14 დღის) ვადით. ჩასასწორებლად მიმართეთ ადმინისტრაციას.');
            return;
        }
        const targetGrade = selectedCell.targetGrade;
        if (!window.confirm('დარწმუნებული ხართ, რომ გსურთ ამ ნიშნის წაშლა?')) return;
        setSavingGrade(true);
        try {
            const res = await fetch('/api/grade/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: targetGrade._id,
                    date: selectedCell.date,
                    isAdmin: Boolean(isAdmin)
                })
            });
            if (res.ok) {
                setGrades(prev => prev.filter(g => g._id !== targetGrade._id));
                setEditModalOpen(false);
                setToast({ message: '✓ ნიშანი წარმატებით წაიშალა!', type: 'success' });
                setTimeout(() => setToast(null), 3500);
            } else {
                const data = await res.json();
                alert(`წაშლა ვერ მოხერხდა: ${data.message}`);
            }
        } catch (err) {
            alert('წაშლისას მოხდა შეცდომა');
        } finally {
            setSavingGrade(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split(/[-T/]/);
        if (parts.length >= 3) {
            if (parts[0].length === 4) {
                return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
            } else {
                return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
            }
        }
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        }
        return dateStr;
    };

    const getSingleGradeDisplay = (g: Grade) => {
        if (!g) return '';
        if (g.point === -1) return g.checked ? '✓' : '✗';
        if (g.point === -2) return 'X';
        if (g.point === -3) return 'ჩთ';
        if (typeof g.point === 'number' && g.point >= 0) return g.point.toString();
        return '✓';
    };

    const filteredStudents = mobileSearchQuery.trim()
        ? students.filter(s => `${s.name} ${s.surname}`.toLowerCase().includes(mobileSearchQuery.toLowerCase()))
        : students;

    const currentSubjectObj = subjects.find(s => s._id === selectedSubject);
    const displaySubjectTitle = subjectName || (selectedSubject !== 'all' ? currentSubjectObj?.name : 'ყველა საგანი');

    return (
        <div style={{
            width: '100%',
            minHeight: '100vh',
            background: pageBg,
            color: textColor,
            padding: '24px 16px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Main Card Container */}
            <div style={{
                width: '100%',
                maxWidth: '1350px',
                background: cardBg,
                borderRadius: '24px',
                boxShadow: isDark ? '0 10px 40px rgba(0, 0, 0, 0.4)' : '0 10px 40px rgba(0, 0, 0, 0.05)',
                border: `1px solid ${cardBorder}`,
                padding: '32px 28px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                {/* Top Action Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    paddingBottom: '16px',
                    borderBottom: `1px solid ${cardBorder}`
                }}>
                    {/* Left: Back Button */}
                    <button
                        onClick={onBackClick}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: isDark ? '#1f2937' : '#ffffff',
                            border: `1px solid ${isDark ? '#374151' : '#cbd5e1'}`,
                            color: isDark ? '#ffffff' : '#2e1065',
                            fontWeight: 800,
                            fontSize: '15px',
                            cursor: 'pointer',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <ArrowLeftIcon size={20} /> უკან დაბრუნება
                    </button>

                    {/* Center: Color Legend */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '16px', height: '16px', background: '#fef08a', border: '1px solid #fde047', borderRadius: '4px' }}></span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: subTextColor }}>საშინაო</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '16px', height: '16px', background: '#84c4cb', border: '1px solid #5eead4', borderRadius: '4px' }}></span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: subTextColor }}>საკლასო</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '16px', height: '16px', background: '#f4978e', border: '1px solid #f87171', borderRadius: '4px' }}></span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: subTextColor }}>შემაჯამებელი</span>
                        </div>
                    </div>

                    {/* Right: Subject Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: headingColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            საგანი: <span style={{ color: accentTitleColor }}>{displaySubjectTitle}</span>
                        </span>
                    </div>
                </div>

                {/* Academic Year & Semester Selector Tabs */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    {/* Academic Year Pills */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {detectedAcademicYears.map(yr => {
                            const isActive = academicYearFilter === yr;
                            return (
                                <button
                                    key={yr}
                                    type="button"
                                    onClick={() => setAcademicYearFilter(yr)}
                                    style={{
                                        background: isActive ? '#2e1065' : '#ffffff',
                                        color: isActive ? '#ffffff' : '#2e1065',
                                        border: isActive ? '1.5px solid #2e1065' : '1.5px solid #cbd5e1',
                                        borderRadius: '12px',
                                        padding: '8px 24px',
                                        fontWeight: 800,
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        boxShadow: isActive ? '0 4px 12px rgba(46, 16, 101, 0.25)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {yr}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => setAcademicYearFilter('all')}
                            style={{
                                background: academicYearFilter === 'all' ? '#2e1065' : '#ffffff',
                                color: academicYearFilter === 'all' ? '#ffffff' : '#2e1065',
                                border: academicYearFilter === 'all' ? '1.5px solid #2e1065' : '1.5px solid #cbd5e1',
                                borderRadius: '12px',
                                padding: '8px 20px',
                                fontWeight: 800,
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            ყველა წელი
                        </button>
                    </div>

                    {/* Semester Pills */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            type="button"
                            onClick={() => setSemesterFilter('1')}
                            style={{
                                background: semesterFilter === '1' ? '#2e1065' : '#ffffff',
                                color: semesterFilter === '1' ? '#ffffff' : '#2e1065',
                                border: semesterFilter === '1' ? '1.5px solid #2e1065' : '1.5px solid #cbd5e1',
                                borderRadius: '10px',
                                padding: '6px 20px',
                                fontWeight: 800,
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            პირველი სემესტრი
                        </button>
                        <button
                            type="button"
                            onClick={() => setSemesterFilter('2')}
                            style={{
                                background: semesterFilter === '2' ? '#2e1065' : '#ffffff',
                                color: semesterFilter === '2' ? '#ffffff' : '#2e1065',
                                border: semesterFilter === '2' ? '1.5px solid #2e1065' : '1.5px solid #cbd5e1',
                                borderRadius: '10px',
                                padding: '6px 20px',
                                fontWeight: 800,
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            მეორე სემესტრი
                        </button>
                        <button
                            type="button"
                            onClick={() => setSemesterFilter('all')}
                            style={{
                                background: semesterFilter === 'all' ? '#2e1065' : '#ffffff',
                                color: semesterFilter === 'all' ? '#ffffff' : '#2e1065',
                                border: semesterFilter === 'all' ? '1.5px solid #2e1065' : '1.5px solid #cbd5e1',
                                borderRadius: '10px',
                                padding: '6px 16px',
                                fontWeight: 800,
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            ყველა
                        </button>
                    </div>
                </div>

                {/* Table Matrix Grid */}
                <div style={{
                    width: '100%',
                    overflowX: 'auto',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '800px' }}>
                        <thead>
                            <tr style={{ background: '#ffffff' }}>
                                <th style={{
                                    minWidth: '220px',
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 10,
                                    background: '#ffffff',
                                    color: '#64748b',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    padding: '14px 18px',
                                    textAlign: 'left',
                                    borderRight: '2px solid #e2e8f0',
                                    borderBottom: '2px solid #cbd5e1',
                                    textTransform: 'uppercase'
                                }}>
                                    სახელი გვარი
                                </th>
                                {allDatesArr.map(date => (
                                    <th key={date} style={{
                                        textAlign: 'center',
                                        minWidth: '65px',
                                        padding: '12px 6px',
                                        color: '#64748b',
                                        fontWeight: 700,
                                        fontSize: '13px',
                                        borderRight: '1px solid #f1f5f9',
                                        borderBottom: '2px solid #cbd5e1',
                                        background: '#ffffff'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                            <span>{formatDate(date)}</span>
                                            <button
                                                onClick={() => handleDeleteDay(date)}
                                                title="დღის წაშლა"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    fontSize: '10px',
                                                    cursor: 'pointer',
                                                    opacity: 0.5,
                                                    padding: 0
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                                onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {students.length > 0 ? students.map((student, idx) => (
                                <tr key={student._id}>
                                    {/* Student Sticky Name Column */}
                                    <td style={{
                                        fontWeight: 700,
                                        color: '#0f172a',
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 5,
                                        background: '#ffffff',
                                        borderRight: '2px solid #e2e8f0',
                                        borderBottom: '1px solid #e2e8f0',
                                        padding: '14px 18px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0f172a" style={{ flexShrink: 0 }}>
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                            </svg>
                                            <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
                                                {student.name} {student.surname}
                                                {(student as any).isTransferred && (
                                                    <span style={{
                                                        marginLeft: '6px',
                                                        fontSize: '11px',
                                                        background: '#fee2e2',
                                                        color: '#dc2626',
                                                        padding: '2px 6px',
                                                        borderRadius: '6px',
                                                        fontWeight: 700
                                                    }}>
                                                        (გადასული)
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Date Cells */}
                                    {allDatesArr.map(date => {
                                        const gradeList = studentDateGrades[student._id]?.[date] || [];
                                        const primaryGrade = gradeList[0] || null;
                                        const datePointType = datesPointTypes[date] || 2;
                                        const effectivePointType = primaryGrade ? (primaryGrade.pointType || datePointType) : datePointType;

                                        let cellBgColor = '#84c4cb'; // Default Mint / Classwork
                                        if (effectivePointType === 3) {
                                            cellBgColor = '#f4978e'; // Summative Red / Salmon
                                        } else if (effectivePointType === 1) {
                                            cellBgColor = '#fef08a'; // Homework Yellow
                                        }

                                        return (
                                            <td
                                                key={date}
                                                onClick={() => openEditModalForGrade(student, date, primaryGrade)}
                                                title={primaryGrade ? `დააჭირეთ ჩასასწორებლად (${formatDate(date)})` : `დააჭირეთ ნიშნის დასამატებლად (${formatDate(date)})`}
                                                style={{
                                                    textAlign: 'center',
                                                    padding: '10px 4px',
                                                    background: cellBgColor,
                                                    border: '1.5px solid #ffffff',
                                                    cursor: 'pointer',
                                                    verticalAlign: 'middle',
                                                    transition: 'filter 0.15s, transform 0.15s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
                                                onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                                            >
                                                {gradeList.length > 0 ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', flexWrap: 'wrap', maxWidth: '140px', margin: '0 auto' }}>
                                                        {gradeList.map((g, gIdx) => {
                                                            const isAbsent = g.point === -2 || g.checked === false;
                                                            const displayVal = getSingleGradeDisplay(g);
                                                            const isNumber = typeof g.point === 'number' && g.point >= 0;
                                                            const hasComment = Boolean(g.comment && g.comment.trim() !== '');

                                                            let markColor = '#1d4ed8'; // Navy Blue for checkmark
                                                            if (isAbsent) markColor = '#dc2626'; // Red for X
                                                            else if (isNumber) markColor = '#0f172a'; // Black/Navy for numerical score

                                                            const tooltipText = `${g.time ? `[${g.time}] ` : ''}${isAbsent ? 'გაცდენა (X)' : isNumber ? `ქულა: ${g.point}` : 'დასწრება (✓)'}${hasComment ? ` — კომენტარი: "${g.comment}"` : ''}`;

                                                            return (
                                                                <span
                                                                    key={g._id || gIdx}
                                                                    title={tooltipText}
                                                                    style={{
                                                                        fontSize: '17px',
                                                                        fontWeight: 900,
                                                                        color: markColor,
                                                                        lineHeight: 1,
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '1px'
                                                                    }}
                                                                >
                                                                    {isAbsent ? 'X' : displayVal}
                                                                    {hasComment && !isAbsent && <span style={{ fontSize: '10px', marginLeft: '1px' }}>💬</span>}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                ) : null}
                                            </td>
                                        );
                                    })}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={allDatesArr.length + 1} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                        მოსწავლეები ვერ მოიძებნა
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Toast Banner */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10000,
                    background: toast.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '999px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                    fontWeight: 700,
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    {toast.message}
                </div>
            )}

            {/* Modal for editing / adding grade */}
            {editModalOpen && selectedCell && (() => {
                const activeSubject = subjects.find(s => s._id === editSubjectId);
                const isProjectSubject = activeSubject
                    ? ((activeSubject as any).is_project || (activeSubject as any).is_pass_fail || (activeSubject as any).type === 'project' || /პროექტი|ჩათვლა|პროექტული/i.test(activeSubject.name))
                    : false;
                const canUserEditDate = isDateEditableForUser(selectedCell.date, isAdmin);

                return typeof window !== 'undefined' ? createPortal(
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 999999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}>
                        <div style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '24px',
                            padding: '28px',
                            width: '100%',
                            maxWidth: '480px',
                            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
                            color: '#0f172a',
                            margin: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#2e1065' }}>
                                    {selectedCell.targetGrade ? 'ნიშნის ჩასწორება' : 'ნიშნის დამატება'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    style={{
                                        background: '#f1f5f9',
                                        border: 'none',
                                        color: '#64748b',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        fontSize: '16px',
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
                            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                                {selectedCell.student.name} {selectedCell.student.surname} — {formatDate(selectedCell.date)} ({selectedCell.date})
                            </p>

                            {!canUserEditDate && (
                                <div style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fca5a5',
                                    color: '#991b1b',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    marginBottom: '18px',
                                    lineHeight: 1.4
                                }}>
                                    ⚠️ მასწავლებელს ნიშნის შეტანა/ჩასწორება შეუძლია მხოლოდ ბოლო 2 კვირის (14 დღის) ვადით. 2 კვირაზე ძველი ნიშნების ჩასასწორებლად მიმართეთ ადმინისტრაციას.
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        საგანი:
                                    </label>
                                    <div style={{
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        background: '#e0e7ff',
                                        border: '1px solid #c7d2fe',
                                        color: '#4338ca',
                                        fontWeight: 800,
                                        fontSize: '15px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span>{activeSubject ? activeSubject.name : (subjectName || 'საგანი')}</span>
                                        {isProjectSubject && (
                                            <span style={{ fontSize: '11px', background: '#f3e8ff', border: '1px solid #d8b4fe', color: '#9333ea', padding: '2px 8px', borderRadius: '12px' }}>
                                                პროექტული (ჩათვლა)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        სწრებადობა და სტატუსი:
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            type="button"
                                            disabled={!canUserEditDate}
                                            onClick={() => {
                                                setIsAttending(true);
                                                if (editPoint === 'X') setEditPoint(isProjectSubject ? 'ჩთ' : '10');
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: '10px',
                                                border: isAttending ? '2px solid #16a34a' : '1px solid #cbd5e1',
                                                background: isAttending ? '#dcfce7' : '#f8fafc',
                                                color: isAttending ? '#15803d' : '#334155',
                                                fontWeight: 800,
                                                fontSize: '14px',
                                                cursor: canUserEditDate ? 'pointer' : 'not-allowed',
                                                opacity: canUserEditDate ? 1 : 0.6,
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            ✓ ესწრება
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!canUserEditDate}
                                            onClick={() => {
                                                setIsAttending(false);
                                                setEditPoint('X');
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: '10px',
                                                border: !isAttending ? '2px solid #dc2626' : '1px solid #cbd5e1',
                                                background: !isAttending ? '#fee2e2' : '#f8fafc',
                                                color: !isAttending ? '#b91c1c' : '#334155',
                                                fontWeight: 800,
                                                fontSize: '14px',
                                                cursor: canUserEditDate ? 'pointer' : 'not-allowed',
                                                opacity: canUserEditDate ? 1 : 0.6,
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            ✗ არ ესწრება (გაცდენა)
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {isProjectSubject ? 'შეფასება (პროექტული):' : 'ქულები (0 – 10):'}
                                    </label>

                                    {!isAttending ? (
                                        <div style={{ padding: '12px', borderRadius: '10px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: '13px', textAlign: 'center', fontWeight: 600 }}>
                                            ⚠️ მოსწავლე არ ესწრება (გაცდენა). ნიშანი ვერ დაეწერება.
                                        </div>
                                    ) : isProjectSubject ? (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                type="button"
                                                disabled={!canUserEditDate}
                                                onClick={() => setEditPoint('ჩთ')}
                                                style={{
                                                    flex: 1,
                                                    padding: '12px',
                                                    borderRadius: '10px',
                                                    border: editPoint === 'ჩთ' ? '2px solid #9333ea' : '1px solid #cbd5e1',
                                                    background: editPoint === 'ჩთ' ? '#f3e8ff' : '#f8fafc',
                                                    color: editPoint === 'ჩთ' ? '#7e22ce' : '#334155',
                                                    fontWeight: 800,
                                                    fontSize: '15px',
                                                    cursor: canUserEditDate ? 'pointer' : 'not-allowed'
                                                }}
                                            >
                                                ჩთ (ჩათვლა)
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!canUserEditDate}
                                                onClick={() => setEditPoint('არა ჩთ')}
                                                style={{
                                                    flex: 1,
                                                    padding: '12px',
                                                    borderRadius: '10px',
                                                    border: editPoint === 'არა ჩთ' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                                                    background: editPoint === 'არა ჩთ' ? '#fee2e2' : '#f8fafc',
                                                    color: editPoint === 'არა ჩთ' ? '#b91c1c' : '#334155',
                                                    fontWeight: 800,
                                                    fontSize: '15px',
                                                    cursor: canUserEditDate ? 'pointer' : 'not-allowed'
                                                }}
                                            >
                                                არა ჩთ (არ ჩაეთვალა)
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                            {['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'].map((pt) => {
                                                const isSelected = editPoint === pt;
                                                return (
                                                    <button
                                                        key={pt}
                                                        type="button"
                                                        disabled={!canUserEditDate}
                                                        onClick={() => setEditPoint(pt)}
                                                        style={{
                                                            padding: '12px 0',
                                                            borderRadius: '10px',
                                                            border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                                            background: isSelected ? '#dbeafe' : '#f8fafc',
                                                            color: isSelected ? '#1d4ed8' : '#334155',
                                                            fontWeight: 800,
                                                            fontSize: '16px',
                                                            cursor: canUserEditDate ? 'pointer' : 'not-allowed',
                                                            opacity: canUserEditDate ? 1 : 0.6,
                                                            transition: 'all 0.12s'
                                                        }}
                                                    >
                                                        {pt}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                type="button"
                                                disabled={!canUserEditDate}
                                                onClick={() => setEditPoint('0')}
                                                style={{
                                                    gridColumn: 'span 5',
                                                    padding: '10px 0',
                                                    borderRadius: '10px',
                                                    border: editPoint === '0' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                                                    background: editPoint === '0' ? '#fee2e2' : '#f8fafc',
                                                    color: editPoint === '0' ? '#b91c1c' : '#334155',
                                                    fontWeight: 800,
                                                    fontSize: '16px',
                                                    cursor: canUserEditDate ? 'pointer' : 'not-allowed',
                                                    opacity: canUserEditDate ? 1 : 0.6,
                                                    transition: 'all 0.12s'
                                                }}
                                            >
                                                0
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        ნიშნის ტიპი:
                                    </label>
                                    <select
                                        value={editPointType}
                                        disabled={!canUserEditDate}
                                        onChange={(e) => setEditPointType(Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            border: '1px solid #cbd5e1',
                                            background: '#ffffff',
                                            color: '#0f172a',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            opacity: canUserEditDate ? 1 : 0.6
                                        }}
                                    >
                                        <option value={1}>🔵 საშინაო (ლურჯი)</option>
                                        <option value={2}>🟡 საკლასო (ყვითელი)</option>
                                        <option value={3}>🔴 შემაჯამებელი (წითელი)</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={handleSaveGrade}
                                        disabled={savingGrade || !canUserEditDate}
                                        style={{
                                            flex: 1,
                                            padding: '12px 18px',
                                            borderRadius: '10px',
                                            background: (!canUserEditDate || savingGrade) ? '#cbd5e1' : '#10b981',
                                            border: 'none',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: '14px',
                                            cursor: (!canUserEditDate || savingGrade) ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {savingGrade ? 'ინახება...' : 'შენახვა'}
                                    </button>
                                    {selectedCell.targetGrade && (
                                        <button
                                            type="button"
                                            onClick={handleDeleteSingleGrade}
                                            disabled={savingGrade || !canUserEditDate}
                                            style={{
                                                padding: '12px 18px',
                                                borderRadius: '10px',
                                                background: (!canUserEditDate || savingGrade) ? '#f1f5f9' : '#fee2e2',
                                                border: (!canUserEditDate || savingGrade) ? '1px solid #cbd5e1' : '1px solid #fca5a5',
                                                color: (!canUserEditDate || savingGrade) ? '#94a3b8' : '#b91c1c',
                                                fontWeight: 700,
                                                fontSize: '14px',
                                                cursor: (!canUserEditDate || savingGrade) ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            წაშლა
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setEditModalOpen(false)}
                                        disabled={savingGrade}
                                        style={{
                                            padding: '12px 18px',
                                            borderRadius: '10px',
                                            background: '#f1f5f9',
                                            border: '1px solid #cbd5e1',
                                            color: '#475569',
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
                ) : null;
            })()}

            {/* Modal for editing subject details */}
            {subjectModalOpen && editSubjectTarget && typeof window !== 'undefined' && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 999999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '24px',
                        padding: '28px',
                        width: '100%',
                        maxWidth: '440px',
                        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
                        color: '#0f172a',
                        margin: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#2e1065' }}>
                                ⚙️ საგნის ჩასწორება
                            </h3>
                            <button
                                type="button"
                                onClick={() => setSubjectModalOpen(false)}
                                style={{
                                    background: '#f1f5f9',
                                    border: 'none',
                                    color: '#64748b',
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
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    საგნის დასახელება:
                                </label>
                                <input
                                    type="text"
                                    value={editSubjectName}
                                    onChange={(e) => setEditSubjectName(e.target.value)}
                                    placeholder="შეიყვანეთ საგნის სახელი"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        background: '#f8fafc',
                                        border: '1px solid #cbd5e1',
                                        color: '#0f172a',
                                        fontWeight: 600,
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                                            border: !editSubjectIsProject ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                            background: !editSubjectIsProject ? '#dbeafe' : '#f8fafc',
                                            color: !editSubjectIsProject ? '#1d4ed8' : '#334155',
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
                                            border: editSubjectIsProject ? '2px solid #9333ea' : '1px solid #cbd5e1',
                                            background: editSubjectIsProject ? '#f3e8ff' : '#f8fafc',
                                            color: editSubjectIsProject ? '#7e22ce' : '#334155',
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
                                        background: '#2563eb',
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
                                    onClick={() => setSubjectModalOpen(false)}
                                    disabled={savingSubject}
                                    style={{
                                        padding: '12px 18px',
                                        borderRadius: '10px',
                                        background: '#f1f5f9',
                                        border: '1px solid #cbd5e1',
                                        color: '#475569',
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

export default DetailedGradeHistory;
