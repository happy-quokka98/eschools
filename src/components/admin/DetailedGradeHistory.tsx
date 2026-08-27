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
}

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

const DetailedGradeHistory: React.FC<DetailedGradeHistoryProps> = ({
    classId,
    className,
    subjectId,
    subjectName,
    selectedColor,
    onBackClick,
    selectedYear
}) => {
    const currentAy = getCurrentAcademicYear();
    const [grades, setGrades] = useState<Grade[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string>(subjectId || 'all');
    const [academicYearFilter, setAcademicYearFilter] = useState<string>(normalizeAcademicYear(selectedYear) || currentAy);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [mobileSearchQuery, setMobileSearchQuery] = useState('');
    const [expandedMobileStudentId, setExpandedMobileStudentId] = useState<string | null>(null);
    const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'matrix'>('cards');

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

                const [gradesRes, studentsRes, subjectsRes] = await Promise.all([
                    fetch(gradesUrl),
                    fetch(studentsUrl),
                    fetch('/api/subjects')
                ]);

                const [gradesData, studentsData, subjectsData] = await Promise.all([
                    gradesRes.json(),
                    studentsRes.json(),
                    subjectsRes.json()
                ]);

                setGrades(Array.isArray(gradesData) ? gradesData : []);
                const classStudents = match ? studentsData : studentsData.filter((s: any) => s.classInfo && s.classInfo._id === classId);
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

    if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '40px' }}>იტვირთება...</div>;

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

    const allDatesArr = Array.from(new Set(filteredGrades.map(g => g.date)))
        .sort((a, b) => sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b));

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
                    year: selectedYear,
                    isAdmin: true
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

    const openEditModalForGrade = (student: Student, date: string, grade: Grade) => {
        setSelectedCell({ student, date, targetGrade: grade });
        const defaultSubj = selectedSubject !== 'all' ? selectedSubject : (subjects[0]?._id || '');
        const subjId = grade.subject_id || defaultSubj;
        setEditSubjectId(subjId);
        setEditPointType(grade.pointType || 1);

        if (grade.point === -2 || grade.checked === false) {
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
                isAdmin: true
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
                    isAdmin: true
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
        const date = new Date(dateStr);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    };

    const getSingleGradeDisplay = (g: Grade) => {
        if (!g) return '';
        const isFormative = (g as any).is_formative || (g.comment && g.comment.trim() !== '') || (g as any).point === 'განმავითარებელი' || typeof (g as any).point === 'string';
        if (isFormative) return g.comment && g.comment.trim() !== '' ? g.comment : 'განმავითარებელი';
        if (g.point === -1) return g.checked ? '✓' : '✗';
        if (g.point === -2) return 'X';
        if (g.point === -3) return 'ჩთ';
        return g.point.toString();
    };

    const getSingleGradeStyle = (g: Grade) => {
        if (!g) return { bg: 'transparent', border: '1px solid transparent', color: 'rgba(255,255,255,0.2)', label: '' };

        const isFormative = (g as any).is_formative || (g.comment && g.comment.trim() !== '') || (g as any).point === 'განმავითარებელი' || typeof (g as any).point === 'string';

        if (isFormative) {
            return {
                bg: 'rgba(245, 158, 11, 0.22)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                color: '#f59e0b',
                label: 'განმავითარებელი'
            };
        }

        if (g.pointType === 3) {
            return {
                bg: 'rgba(239, 68, 68, 0.28)',
                border: '1px solid rgba(239, 68, 68, 0.65)',
                color: '#fca5a5',
                label: 'შემაჯამებელი'
            };
        }

        if (g.pointType === 2) {
            return {
                bg: 'rgba(245, 158, 11, 0.25)',
                border: '1px solid rgba(245, 158, 11, 0.55)',
                color: '#fde047',
                label: 'საკლასო'
            };
        }

        if (g.point === -1) {
            return {
                bg: g.checked ? 'rgba(76, 175, 80, 0.18)' : 'rgba(244, 67, 54, 0.18)',
                border: g.checked ? '1px solid rgba(76, 175, 80, 0.4)' : '1px solid rgba(244, 67, 54, 0.4)',
                color: g.checked ? '#4caf50' : '#f44336',
                label: g.checked ? 'დასწრება' : 'გაცდენა'
            };
        }

        const pointColor = g.point >= 9 ? '#4caf50' : g.point >= 7 ? '#ff9800' : '#f44336';
        return {
            bg: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: pointColor,
            label: ''
        };
    };

    const filteredStudents = mobileSearchQuery.trim()
        ? students.filter(s => `${s.name} ${s.surname}`.toLowerCase().includes(mobileSearchQuery.toLowerCase()))
        : students;

    return (
        <div className="admin-view-container animate-fade-in-down" style={{ maxWidth: '1400px', width: '100%', padding: '12px', boxSizing: 'border-box' }}>
            <style>{`
                @media (min-width: 769px) {
                    .mobile-only-controls { display: none !important; }
                    .mobile-only-cards { display: none !important; }
                    .desktop-only-table { display: block !important; }
                }
                @media (max-width: 768px) {
                    .admin-view-container { padding: 6px !important; }
                    .admin-view-header { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
                    .admin-view-header > div { flex-direction: column !important; width: 100% !important; gap: 8px !important; }
                    .admin-select { width: 100% !important; min-width: 0 !important; }
                    .desktop-only-table { display: ${mobileViewMode === 'matrix' ? 'block' : 'none'} !important; }
                    .mobile-only-cards { display: ${mobileViewMode === 'cards' ? 'block' : 'none'} !important; }
                }
            `}</style>

            <header className="admin-view-header" style={{ flexWrap: 'wrap', gap: '15px' }}>
                <button className="admin-back-btn" onClick={onBackClick}>
                    <ArrowLeftIcon size={20} /> უკან
                </button>
                <h2 className="admin-view-title" style={{ flex: '1 1 auto', margin: 0 }}>
                    {className} - {subjectName || (selectedSubject !== 'all' ? subjects.find(s => s._id === selectedSubject)?.name : 'დეტალური ისტორია')}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="admin-label" style={{ margin: 0, whiteSpace: 'nowrap', fontSize: '13px' }}>სასწავლო წელი:</span>
                        <select className="admin-select" value={academicYearFilter} onChange={(e) => setAcademicYearFilter(e.target.value)} style={{ minWidth: '170px' }}>
                            {detectedAcademicYears.map(yr => (
                                <option key={yr} value={yr}>
                                    {yr === currentAy ? `მიმდინარე (${yr})` : `${yr} სასწ. წელი`}
                                </option>
                            ))}
                            <option value="all">ყველა წელი</option>
                        </select>
                    </div>
                    {!subjectId && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="admin-label" style={{ margin: 0, whiteSpace: 'nowrap', fontSize: '13px' }}>საგანი:</span>
                            <select className="admin-select" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} style={{ minWidth: '150px' }}>
                                <option value="all">ყველა საგანი</option>
                                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                            {selectedSubject !== 'all' && (() => {
                                const activeSubj = subjects.find(s => s._id === selectedSubject);
                                if (!activeSubj) return null;
                                return (
                                    <button
                                        type="button"
                                        onClick={() => openEditSubjectModal(activeSubj)}
                                        style={{
                                            background: 'rgba(96, 165, 250, 0.2)',
                                            border: '1px solid rgba(96, 165, 250, 0.4)',
                                            color: '#60a5fa',
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                        title="არჩეული საგნის დასახელების ან ტიპის ჩასწორება"
                                    >
                                        ✏️ საგნის ჩასწორება
                                    </button>
                                );
                            })()}
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="admin-label" style={{ margin: 0, whiteSpace: 'nowrap', fontSize: '13px' }}>სორტირება:</span>
                        <select className="admin-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')} style={{ minWidth: '130px' }}>
                            <option value="asc">ძველები თავში</option>
                            <option value="desc">ახლები თავში</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Mobile View Switcher & Search Bar (Phone Only) */}
            <div className="mobile-only-controls" style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        type="button"
                        onClick={() => setMobileViewMode('cards')}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: mobileViewMode === 'cards' ? `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)` : 'transparent',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        📱 ბარათები (მობილური)
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileViewMode('matrix')}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: mobileViewMode === 'matrix' ? `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)` : 'transparent',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        📊 ცხრილი (დესკტოპი)
                    </button>
                </div>

                {mobileViewMode === 'cards' && (
                    <input
                        type="text"
                        placeholder="🔍 მოსწავლის ძებნა..."
                        value={mobileSearchQuery}
                        onChange={e => setMobileSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white',
                            fontSize: '14px',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                )}
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)',
                flexWrap: 'wrap',
                gap: '8px'
            }}>
                <span>
                    ნაჩვენებია <strong>{academicYearFilter === 'all' ? 'ყველა სასწავლო წლის' : academicYearFilter === currentAy ? `მიმდინარე სასწავლო წლის (${currentAy})` : `${academicYearFilter} სასწ. წლის`}</strong> ნიშნები — სულ <strong>{allDatesArr.length}</strong> თარიღი
                </span>
                {academicYearFilter !== 'all' && detectedAcademicYears.length > 1 && (
                    <button
                        onClick={() => setAcademicYearFilter('all')}
                        style={{
                            background: 'rgba(96, 165, 250, 0.15)',
                            border: '1px solid rgba(96, 165, 250, 0.3)',
                            color: '#60a5fa',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                    >
                        ყველა წლების გამოჩენა
                    </button>
                )}
            </div>

            {/* Mobile Cards UI Section (Only Phone) */}
            <div className="mobile-only-cards" style={{ marginBottom: '20px' }}>
                {filteredStudents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                        მოსწავლეები ვერ მოიძებნა
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredStudents.map((student) => {
                            const isExpanded = expandedMobileStudentId === student._id;
                            const studentDates = allDatesArr.filter(date => (studentDateGrades[student._id]?.[date] || []).length > 0);
                            const totalGradesCount = studentDates.reduce((acc, d) => acc + (studentDateGrades[student._id]?.[d]?.length || 0), 0);

                            return (
                                <div key={student._id} style={{
                                    background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
                                    border: isExpanded ? `1.5px solid ${selectedColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                    transition: 'all 0.2s'
                                }}>
                                    {/* Card Header (Tap to expand) */}
                                    <div
                                        onClick={() => setExpandedMobileStudentId(isExpanded ? null : student._id)}
                                        style={{
                                            padding: '14px 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '38px',
                                                height: '38px',
                                                borderRadius: '50%',
                                                background: `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)`,
                                                color: 'white',
                                                fontWeight: 800,
                                                fontSize: '15px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {student.name ? student.name[0] : ''}{student.surname ? student.surname[0] : ''}
                                            </div>
                                            <div>
                                                <div style={{ color: 'white', fontWeight: 800, fontSize: '15px' }}>
                                                    {student.name} {student.surname}
                                                </div>
                                                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                                                    სულ {totalGradesCount} ნიშანი ({studentDates.length} თარიღი)
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ color: selectedColor, fontWeight: 800, fontSize: '18px' }}>
                                            {isExpanded ? '▲' : '▼'}
                                        </div>
                                    </div>

                                    {/* Card Body (Grade timeline when expanded) */}
                                    {isExpanded && (
                                        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.15)' }}>
                                            {studentDates.length === 0 ? (
                                                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', padding: '12px' }}>
                                                    ამ მოსწავლეს ნიშნები არ აქვს
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {studentDates.map(date => {
                                                        const gradeList = studentDateGrades[student._id]?.[date] || [];
                                                        return (
                                                            <div key={date} style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                background: 'rgba(255,255,255,0.03)',
                                                                border: '1px solid rgba(255,255,255,0.06)',
                                                                borderRadius: '10px',
                                                                padding: '10px 12px'
                                                            }}>
                                                                <span style={{ color: '#60a5fa', fontWeight: 800, fontSize: '14px' }}>
                                                                    {formatDate(date)} ({date})
                                                                </span>

                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                                    {gradeList.map((g, gIdx) => {
                                                                        const cellStyle = getSingleGradeStyle(g);
                                                                        const displayVal = getSingleGradeDisplay(g);
                                                                        return (
                                                                            <button
                                                                                key={g._id || gIdx}
                                                                                type="button"
                                                                                onClick={() => openEditModalForGrade(student, date, g)}
                                                                                style={{
                                                                                    padding: '6px 12px',
                                                                                    borderRadius: '8px',
                                                                                    background: cellStyle.bg,
                                                                                    border: cellStyle.border,
                                                                                    color: cellStyle.color,
                                                                                    fontWeight: 800,
                                                                                    fontSize: '14px',
                                                                                    cursor: 'pointer',
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '4px'
                                                                                }}
                                                                            >
                                                                                {displayVal}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Desktop Table UI Section (Widescreen untouched) */}
            <div className="desktop-only-table">
                {allDatesArr.length === 0 ? (
                    <div className="admin-form-container" style={{ maxWidth: 'none', textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.5)' }}>
                        ამ კლასში ნიშნები ვერ მოიძებნა
                    </div>
                ) : (
                    <div className="admin-list-container animate-zoom-in" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px' }}>
                        <div className="admin-table-wrapper" style={{ width: '100%', maxHeight: '70vh', overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table className="admin-table" style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                    <tr>
                                        <th className="history-sticky-col" style={{ minWidth: '220px', background: 'rgba(20, 25, 40, 0.98)', backdropFilter: 'blur(10px)', position: 'sticky', left: 0, zIndex: 11, borderRight: '2px solid rgba(255,255,255,0.12)', boxShadow: '4px 0 10px rgba(0,0,0,0.3)' }}>სახელი გვარი</th>
                                        {allDatesArr.map(date => (
                                            <th key={date} className="history-date-col" style={{ textAlign: 'center', minWidth: '95px', verticalAlign: 'top', padding: '10px 6px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 800 }}>{formatDate(date)}</span>
                                                    <button
                                                        onClick={() => handleDeleteDay(date)}
                                                        title="დღის სრულად წაშლა"
                                                        style={{
                                                            background: 'rgba(239, 68, 68, 0.2)',
                                                            border: '1px solid rgba(239, 68, 68, 0.4)',
                                                            color: '#f87171',
                                                            borderRadius: '6px',
                                                            padding: '3px 8px',
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
                                            <td className="history-sticky-col" style={{ fontWeight: '700', color: 'white', position: 'sticky', left: 0, background: idx % 2 === 0 ? 'rgba(11, 20, 55, 0.98)' : 'rgba(22, 30, 68, 0.98)', backdropFilter: 'blur(10px)', zIndex: 1, borderRight: '2px solid rgba(255,255,255,0.12)', boxShadow: '4px 0 10px rgba(0,0,0,0.3)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedColor, flexShrink: 0 }}></div>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.name} {student.surname}</span>
                                                </div>
                                            </td>
                                            {allDatesArr.map(date => {
                                                const gradeList = studentDateGrades[student._id]?.[date] || [];
                                                return (
                                                    <td key={date} className="history-date-col" style={{ textAlign: 'center', padding: '6px 4px', minWidth: '70px' }}>
                                                        {gradeList.length > 0 ? (
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                                                {gradeList.map((g, gIdx) => {
                                                                    const cellStyle = getSingleGradeStyle(g);
                                                                    const displayVal = getSingleGradeDisplay(g);
                                                                    return (
                                                                        <div
                                                                            key={g._id || gIdx}
                                                                            className="history-grade-pill"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openEditModalForGrade(student, date, g);
                                                                            }}
                                                                            title={`დააჭირეთ ამ ნიშნის (${displayVal}) ჩასასწორებლად / წასაშლელად`}
                                                                            style={{
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                padding: '4px 8px',
                                                                                borderRadius: '6px',
                                                                                background: cellStyle.bg,
                                                                                border: cellStyle.border,
                                                                                color: cellStyle.color,
                                                                                fontWeight: 800,
                                                                                fontSize: '13px',
                                                                                cursor: 'pointer',
                                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                                                                transition: 'transform 0.15s'
                                                                            }}
                                                                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                                                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                                        >
                                                                            {displayVal}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: 'rgba(255,255,255,0.15)' }}>-</span>
                                                        )}
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
            </div>

            <div style={{
                marginTop: '16px',
                padding: '12px 18px',
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
            }}>
                {[
                    { label: 'შემაჯამებელი', bg: 'rgba(239, 68, 68, 0.28)', border: '1px solid rgba(239, 68, 68, 0.6)', color: '#fca5a5' },
                    { label: 'საკლასო', bg: 'rgba(245, 158, 11, 0.25)', border: '1px solid rgba(245, 158, 11, 0.5)', color: '#fde047' },
                    { label: 'საშინაო', bg: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.45)', color: '#93c5fd' },
                    { label: 'დასწრება (✓)', bg: 'rgba(76, 175, 80, 0.15)', border: '1px solid rgba(76, 175, 80, 0.35)', color: '#4caf50' },
                    { label: 'გაცდენა (✗)', bg: 'rgba(244, 67, 54, 0.15)', border: '1px solid rgba(244, 67, 54, 0.35)', color: '#f44336' },
                ].map((item) => (
                    <div key={item.label} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        background: item.bg,
                        border: item.border,
                    }}>
                        <span style={{ fontSize: '12px', color: item.color, fontWeight: 700 }}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Toast Notification Banner */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10000,
                    background: toast.type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '999px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
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

                return typeof window !== 'undefined' ? createPortal(
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
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '20px',
                            padding: '28px',
                            width: '100%',
                            maxWidth: '480px',
                            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
                            color: 'white',
                            margin: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
                                    {selectedCell.targetGrade ? 'ნიშნის ჩასწორება' : 'ნიშნის დამატება'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        border: 'none',
                                        color: 'rgba(255,255,255,0.6)',
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
                            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#94a3b8' }}>
                                {selectedCell.student.name} {selectedCell.student.surname} — {formatDate(selectedCell.date)} ({selectedCell.date})
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        საგანი:
                                    </label>
                                    <div style={{
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        background: 'rgba(96, 165, 250, 0.12)',
                                        border: '1px solid rgba(96, 165, 250, 0.3)',
                                        color: '#60a5fa',
                                        fontWeight: 800,
                                        fontSize: '15px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span>{activeSubject ? activeSubject.name : (subjectName || 'საგანი')}</span>
                                        {isProjectSubject && (
                                            <span style={{ fontSize: '11px', background: 'rgba(192, 132, 252, 0.2)', border: '1px solid rgba(192, 132, 252, 0.4)', color: '#c084fc', padding: '2px 8px', borderRadius: '12px' }}>
                                                პროექტული (ჩათვლა)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        სწრებადობა და სტატუსი:
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAttending(true);
                                                if (editPoint === 'X') setEditPoint(isProjectSubject ? 'ჩთ' : '10');
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: '10px',
                                                border: isAttending ? '2px solid #4caf50' : '1px solid rgba(255,255,255,0.12)',
                                                background: isAttending ? 'rgba(76, 175, 80, 0.25)' : 'rgba(255,255,255,0.04)',
                                                color: isAttending ? '#4caf50' : 'white',
                                                fontWeight: 800,
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            ✓ ესწრება
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAttending(false);
                                                setEditPoint('X');
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: '10px',
                                                border: !isAttending ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
                                                background: !isAttending ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.04)',
                                                color: !isAttending ? '#ef4444' : 'white',
                                                fontWeight: 800,
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            ✗ არ ესწრება (გაცდენა)
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {isProjectSubject ? 'შეფასება (პროექტული):' : 'ქულები (0 – 10):'}
                                    </label>

                                    {!isAttending ? (
                                        <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '13px', textAlign: 'center', fontWeight: 600 }}>
                                            ⚠️ მოსწავლე არ ესწრება (გაცდენა). ნიშანი ვერ დაეწერება.
                                        </div>
                                    ) : isProjectSubject ? (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                type="button"
                                                onClick={() => setEditPoint('ჩთ')}
                                                style={{
                                                    flex: 1,
                                                    padding: '12px',
                                                    borderRadius: '10px',
                                                    border: editPoint === 'ჩთ' ? '2px solid #c084fc' : '1px solid rgba(255,255,255,0.12)',
                                                    background: editPoint === 'ჩთ' ? 'rgba(192, 132, 252, 0.3)' : 'rgba(255,255,255,0.04)',
                                                    color: editPoint === 'ჩთ' ? '#c084fc' : 'white',
                                                    fontWeight: 800,
                                                    fontSize: '15px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ჩთ (ჩათვლა)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditPoint('არა ჩთ')}
                                                style={{
                                                    flex: 1,
                                                    padding: '12px',
                                                    borderRadius: '10px',
                                                    border: editPoint === 'არა ჩთ' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
                                                    background: editPoint === 'არა ჩთ' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.04)',
                                                    color: editPoint === 'არა ჩთ' ? '#f87171' : 'white',
                                                    fontWeight: 800,
                                                    fontSize: '15px',
                                                    cursor: 'pointer'
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
                                                        onClick={() => setEditPoint(pt)}
                                                        style={{
                                                            padding: '12px 0',
                                                            borderRadius: '10px',
                                                            border: isSelected ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.12)',
                                                            background: isSelected ? 'rgba(96, 165, 250, 0.3)' : 'rgba(255,255,255,0.04)',
                                                            color: isSelected ? '#60a5fa' : 'white',
                                                            fontWeight: 800,
                                                            fontSize: '16px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.12s'
                                                        }}
                                                    >
                                                        {pt}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                type="button"
                                                onClick={() => setEditPoint('0')}
                                                style={{
                                                    gridColumn: 'span 5',
                                                    padding: '10px 0',
                                                    borderRadius: '10px',
                                                    border: editPoint === '0' ? '2px solid #f87171' : '1px solid rgba(255,255,255,0.12)',
                                                    background: editPoint === '0' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.04)',
                                                    color: editPoint === '0' ? '#f87171' : 'white',
                                                    fontWeight: 800,
                                                    fontSize: '16px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.12s'
                                                }}
                                            >
                                                0
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        ნიშნის ტიპი:
                                    </label>
                                    <select
                                        value={editPointType}
                                        onChange={(e) => setEditPointType(Number(e.target.value))}
                                        className="admin-select"
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
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
                                        disabled={savingGrade}
                                        style={{
                                            flex: 1,
                                            padding: '12px 18px',
                                            borderRadius: '10px',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            border: 'none',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: '14px',
                                            cursor: savingGrade ? 'wait' : 'pointer'
                                        }}
                                    >
                                        {savingGrade ? 'ინახება...' : 'შენახვა'}
                                    </button>
                                    {selectedCell.targetGrade && (
                                        <button
                                            type="button"
                                            onClick={handleDeleteSingleGrade}
                                            disabled={savingGrade}
                                            style={{
                                                padding: '12px 18px',
                                                borderRadius: '10px',
                                                background: 'rgba(239, 68, 68, 0.18)',
                                                border: '1px solid rgba(239, 68, 68, 0.5)',
                                                color: '#f87171',
                                                fontWeight: 700,
                                                fontSize: '14px',
                                                cursor: savingGrade ? 'wait' : 'pointer'
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
                ) : null;
            })()}

            {/* Modal for editing subject details (name, is_project) */}
            {subjectModalOpen && editSubjectTarget && typeof window !== 'undefined' && createPortal(
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
                                onClick={() => setSubjectModalOpen(false)}
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
                                    onClick={() => setSubjectModalOpen(false)}
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

export default DetailedGradeHistory;
