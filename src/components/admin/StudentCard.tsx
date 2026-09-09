"use client";
import React, { useState, useEffect } from 'react';
import { IoArrowBack, IoChevronDown, IoChevronUp, IoCalendarOutline } from 'react-icons/io5';
import { FaRegComment } from 'react-icons/fa';
import { customRoundGrade } from "@/lib/statistics";

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string }>;
const ChevronDownIcon = IoChevronDown as React.FC<{ size?: number | string }>;
const ChevronUpIcon = IoChevronUp as React.FC<{ size?: number | string }>;
const CalendarOutlineIcon = IoCalendarOutline as React.FC<{ size?: number | string }>;
const RegCommentIcon = FaRegComment as React.FC<{ size?: number | string; style?: React.CSSProperties }>;

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

interface StudentCardProps {
    student: Student;
    selectedColor: string;
    logoutButtonStyle: React.CSSProperties;
    onBackClick: () => void;
}

const StudentCard: React.FC<StudentCardProps> = ({
    student,
    selectedColor,
    onBackClick
}) => {
    const [currentYearData, setCurrentYearData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedYearIdx, setSelectedYearIdx] = useState(0); // 0 = Current, 1 = Previous, 2 = Yr Before
    const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

    const getGradeInfo = (classname?: string) => {
        if (!classname) return { num: null, parallel: '' };
        const match = classname.match(/^([0-9]+)(.*)$/);
        return {
            num: match ? parseInt(match[1], 10) : null,
            parallel: match ? match[2] : ''
        };
    };

    const studentIdToUse = student._id || student.user_ID;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const baseStartYear = currentMonth >= 9 ? now.getFullYear() : now.getFullYear() - 1;

    const gradeInfo = getGradeInfo(student.classInfo?.classname);

    // Dynamic year selector tabs definition (supporting current and previous years up to 6 years)
    const yearsTabs = Array.from({ length: Math.min(6, Math.max(1, gradeInfo.num || 4)) }).map((_, index) => {
        const yearOffset = index;
        const startYr = baseStartYear - yearOffset;
        const endYr = startYr + 1;
        const fullAcademicYear = `${startYr}-${endYr}`;
        const startYearShort = String(startYr).slice(-2);
        const endYearShort = String(endYr).slice(-2);
        const academicYear = `${startYearShort}${endYearShort}year`;
        
        let displayClass = 'N/A';
        if (gradeInfo.num !== null) {
            const gradeNum = gradeInfo.num - yearOffset;
            if (gradeNum > 0) {
                displayClass = `${gradeNum}${gradeInfo.parallel}`;
            } else {
                displayClass = 'სკოლამდელი';
            }
        }

        let label = `${fullAcademicYear} (${displayClass})`;
        if (index === 0) label = `${fullAcademicYear} (${displayClass}) — მიმდინარე`;

        return {
            index,
            label,
            academicYear,
            fullAcademicYear,
            className: displayClass
        };
    });

    useEffect(() => {
        const fetchStudentGrades = async () => {
            setLoading(true);
            try {
                if (student.classInfo?._id && studentIdToUse) {
                    const targetYear = yearsTabs[selectedYearIdx]?.academicYear || '';
                    const yearParam = targetYear ? `&year=${encodeURIComponent(targetYear)}` : '';
                    const res = await fetch(`/api/student/subjects-grades?student_id=${studentIdToUse}&class_id=${student.classInfo._id}${yearParam}`);
                    if (res.ok) {
                        const data = await res.json();
                        setCurrentYearData(data);

                        // If 2026-2027 has no grades yet, auto-select previous year (e.g. 2025-2026) so user sees actual grades
                        if (selectedYearIdx === 0 && (!data.subjects || data.subjects.length === 0 || data.overall?.annual_average === 0)) {
                            if (yearsTabs.length > 1) {
                                setSelectedYearIdx(1);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching student grades:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudentGrades();
    }, [student, selectedYearIdx]);

    const displayGrade = (grade: number) => {
        if (grade === -3) return 'ჩთ';
        return grade > 0 ? customRoundGrade(grade).toString() : '—';
    };

    const getActiveYearData = () => {
        return currentYearData;
    };

    const getSemesterOfGrade = (dateStr: string) => {
        if (!dateStr) return 1;
        const parts = dateStr.split('-');
        if (parts.length < 2) return 1;
        const month = parseInt(parts[1], 10);
        if (month >= 9 && month <= 12) return 1;
        if (month >= 1 && month <= 6) return 2;
        return 1;
    };

    const toggleSubjectExpand = (subId: string) => {
        setExpandedSubjects(prev => ({
            ...prev,
            [subId]: !prev[subId]
        }));
    };

    if (loading) return <div style={{ color: '#0f172a', textAlign: 'center', marginTop: '40px', fontWeight: '700' }}>იტვირთება...</div>;

    const activeYearData = getActiveYearData();
    const activeTabObj = yearsTabs[selectedYearIdx];
    const isPreschool = activeTabObj.className === 'სკოლამდელი';

    const overall = activeYearData?.overall || { first_semester_average: 0, second_semester_average: 0, annual_average: 0 };
    const subjectsList = activeYearData?.subjects || [];

    return (
        <div className="admin-view-container animate-fade-in-down" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            
            {/* Header */}
            <header className="admin-view-header">
                <button className="admin-back-btn" onClick={onBackClick}>
                    <ArrowLeftIcon size={20} /> უკან
                </button>
                <h2 className="admin-view-title">მოსწავლის ქარდი</h2>
            </header>

            {/* Profile Info Card */}
            <div className="admin-form-container animate-zoom-in" style={{ maxWidth: 'none', marginBottom: '24px', padding: '30px', background: '#ffffff' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', alignItems: 'center' }}>
                    
                    {/* Left: Avatar & Name */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                            width: '90px', 
                            height: '90px', 
                            borderRadius: '50%', 
                            background: `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)`, 
                            margin: '0 auto 15px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '36px', 
                            fontWeight: '800', 
                            color: 'white', 
                            boxShadow: `0 8px 25px ${selectedColor}44`,
                            border: '2px solid rgba(255,255,255,0.5)'
                        }}>
                            {student.name ? student.name[0] : ''}{student.surname ? student.surname[0] : ''}
                        </div>
                        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '26px', fontWeight: '800', letterSpacing: '0.5px' }}>
                            {student.name} {student.surname}
                        </h1>
                        <span style={{ 
                            display: 'inline-block', 
                            marginTop: '8px', 
                            padding: '4px 12px', 
                            borderRadius: '12px', 
                            background: '#f1f5f9', 
                            color: '#475569', 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            textTransform: 'uppercase', 
                            letterSpacing: '1px' 
                        }}>
                            მოსწავლე
                        </span>
                    </div>

                    {/* Middle: Details Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', width: '100%' }}>
                        <div style={{ 
                            background: '#f8fafc', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '18px', 
                            padding: '20px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                        }}>
                            <span className="admin-label" style={{ fontSize: '11px', marginBottom: '6px', color: '#64748b' }}>პირადი ნომერი</span>
                            <span style={{ color: '#0f172a', fontWeight: '800', fontSize: '17px' }}>{student.user_ID}</span>
                        </div>
                        <div style={{ 
                            background: '#f8fafc', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '18px', 
                            padding: '20px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                        }}>
                            <span className="admin-label" style={{ fontSize: '11px', marginBottom: '6px', color: '#64748b' }}>კლასი</span>
                            <span style={{ color: selectedColor, fontWeight: '800', fontSize: '17px' }}>
                                {isPreschool ? 'სკოლამდელი' : activeTabObj.className}
                            </span>
                        </div>
                    </div>

                    {/* Right: Score Card */}
                    <div style={{ 
                        textAlign: 'center', 
                        background: '#f8fafc', 
                        borderRadius: '22px', 
                        padding: '22px', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
                    }}>
                        <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                            წლიური საშუალო
                        </div>
                        <div style={{ fontSize: '38px', fontWeight: '900', color: '#0f172a' }}>
                            {isPreschool ? '—' : displayGrade(overall.annual_average)}
                        </div>
                        <div style={{ height: '4px', width: '50px', background: selectedColor, margin: '10px auto 0', borderRadius: '2px' }}></div>
                    </div>
                </div>
            </div>

            {/* School Year Selector Tabs */}
            <div className="admin-tabs" style={{ marginBottom: '24px', maxWidth: 'none' }}>
                {yearsTabs.map((tab) => (
                    <button
                        key={tab.index}
                        className={`admin-tab-btn ${selectedYearIdx === tab.index ? 'active' : ''}`}
                        style={selectedYearIdx === tab.index ? { background: `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)`, color: 'white' } : { color: '#475569' }}
                        onClick={() => {
                            setSelectedYearIdx(tab.index);
                            setExpandedSubjects({});
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main content display based on preschool or valid school year */}
            {isPreschool ? (
                <div className="admin-form-container" style={{ maxWidth: 'none', textAlign: 'center', padding: '60px 20px', color: '#64748b', borderRadius: '24px', background: '#ffffff' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', color: '#0f172a' }}>მონაცემები არ არსებობს</h3>
                    <p style={{ fontSize: '15px' }}>ამ სასწავლო წელს მოსწავლე ჯერ არ დადიოდა სკოლაში (სკოლამდელი ასაკი).</p>
                </div>
            ) : (
                <>
                    {/* Semestral statistics */}
                    <div className="admin-list-container animate-fade-in-down" style={{ animationDelay: '0.05s', marginBottom: '30px', background: '#ffffff' }}>
                        <h3 className="admin-form-title" style={{ textAlign: 'left', fontSize: '18px', margin: '24px 24px 16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#0f172a' }}>
                            სემესტრული საშუალო ნიშნები
                        </h3>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>სემესტრი</th>
                                    <th style={{ textAlign: 'center' }}>საშუალო ქულა</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ color: '#0f172a', fontWeight: '700' }}>პირველი სემესტრი</td>
                                    <td style={{ textAlign: 'center', color: '#2196f3', fontWeight: '800' }}>
                                        {displayGrade(overall.first_semester_average)}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ color: '#0f172a', fontWeight: '700' }}>მეორე სემესტრი</td>
                                    <td style={{ textAlign: 'center', color: '#4caf50', fontWeight: '800' }}>
                                        {displayGrade(overall.second_semester_average)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Subject GPAs table */}
                    {subjectsList.length > 0 ? (
                        <div className="admin-list-container animate-fade-in-down" style={{ animationDelay: '0.1s', marginBottom: '30px', background: '#ffffff' }}>
                            <h3 className="admin-form-title" style={{ textAlign: 'left', fontSize: '18px', margin: '24px 24px 16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#0f172a' }}>
                                აკადემიური მოსწრება საგნების მიხედვით
                            </h3>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>საგანი</th>
                                        <th style={{ textAlign: 'center' }}>I სემესტრი</th>
                                        <th style={{ textAlign: 'center' }}>II სემესტრი</th>
                                        <th style={{ textAlign: 'center' }}>წლიური საშუალო</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjectsList.map((subject: any) => (
                                        <tr key={subject.subject_id}>
                                            <td style={{ fontWeight: '800', color: '#0f172a' }}>{subject.name || subject.subject_name}</td>
                                            <td style={{ textAlign: 'center', color: '#2196f3', fontWeight: '700' }}>
                                                {displayGrade(subject.first_semester_average)}
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#4caf50', fontWeight: '700' }}>
                                                {displayGrade(subject.second_semester_average)}
                                            </td>
                                            <td style={{ textAlign: 'center', fontWeight: '800', color: selectedColor }}>
                                                {displayGrade(subject.average)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="admin-form-container" style={{ maxWidth: 'none', textAlign: 'center', color: '#64748b', marginBottom: '30px', background: '#ffffff' }}>
                            ამ სასწავლო წელს საგნები არ ფიქსირდება
                        </div>
                    )}

                    {/* Expandable Grade Logs grouped by Subjects and Semesters */}
                    <div className="admin-list-container animate-fade-in-down" style={{ padding: '30px', animationDelay: '0.15s', background: '#ffffff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '22px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                            <h3 className="admin-form-title" style={{ textAlign: 'left', fontSize: '20px', margin: 0, color: '#0f172a' }}>
                                📋 ნიშნების დეტალური ისტორია საგნების მიხედვით
                            </h3>
                            <span style={{ fontSize: '13px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '6px 14px', borderRadius: '12px', fontWeight: '800' }}>
                                📅 {activeTabObj.fullAcademicYear} სასწავლო წელი ({activeTabObj.className} კლასი)
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {subjectsList.map((subject: any) => {
                                const isExpanded = !!expandedSubjects[subject.subject_id];
                                const subjectGrades = subject.grades || [];
                                
                                const actualGrades = subjectGrades.filter((g: any) => g.point !== -1 && g.point !== -2 && g.point !== '-1' && g.point !== '-2');
                                const sem1Grades = actualGrades.filter((g: any) => getSemesterOfGrade(g.date) === 1);
                                const sem2Grades = actualGrades.filter((g: any) => getSemesterOfGrade(g.date) === 2);

                                return (
                                    <div key={subject.subject_id} style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        {/* Header / Clickable accordion bar */}
                                        <div 
                                            onClick={() => toggleSubjectExpand(subject.subject_id)}
                                            style={{
                                                padding: '20px 24px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                background: '#f8fafc',
                                                borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#f1f5f9';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#f8fafc';
                                            }}
                                        >
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: selectedColor }}>
                                                    {subject.name || subject.subject_name}
                                                </h4>
                                                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'inline-block', fontWeight: '600' }}>
                                                    მასწავლებელი: {subject.teacher_name} • სულ {actualGrades.length} ნიშანი ({activeTabObj.fullAcademicYear})
                                                </span>
                                            </div>
                                            <div style={{ color: '#0f172a' }}>
                                                {isExpanded ? <ChevronUpIcon size={22} /> : <ChevronDownIcon size={22} />}
                                            </div>
                                        </div>

                                        {/* Accordion content */}
                                        {isExpanded && (
                                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#ffffff' }}>
                                                
                                                {/* Semester 1 Grades */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderLeft: '4px solid #2196f3', paddingLeft: '10px' }}>
                                                        <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', color: '#1e40af', letterSpacing: '0.5px' }}>
                                                            I სემესტრი — {activeTabObj.fullAcademicYear} სასწავლო წელი ({activeTabObj.className} კლასი)
                                                        </h5>
                                                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563eb', background: '#eff6ff', padding: '4px 10px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                                                            საშუალო: {displayGrade(subject.first_semester_average)}
                                                        </span>
                                                    </div>
                                                    
                                                    {sem1Grades.length === 0 ? (
                                                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
                                                            ნიშნები არ ფიქსირდება
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {sem1Grades.map((grade: any) => {
                                                                const numPoint = typeof grade.point === 'number'
                                                                    ? grade.point
                                                                    : (typeof grade.point === 'string' && !isNaN(parseInt(grade.point, 10)) ? parseInt(grade.point, 10) : null);
                                                                const isFormative = grade.is_formative || grade.point === 'განმავითარებელი' || (typeof grade.point === 'string' && numPoint === null && grade.point !== '-1' && grade.point !== '-2' && grade.point !== '-3');
                                                                const commentText = grade.comment || (typeof grade.point === 'string' && numPoint === null && grade.point !== 'განმავითარებელი' ? grade.point : '');

                                                                let bg = '#f1f5f9';
                                                                let fg = '#0f172a';
                                                                let displayVal: any = '';

                                                                if (isFormative) {
                                                                    displayVal = commentText || 'განმავითარებელი';
                                                                    bg = 'rgba(245, 158, 11, 0.15)';
                                                                    fg = '#d97706';
                                                                } else if (grade.point === -1 || numPoint === -1) {
                                                                    if (grade.checked) {
                                                                        displayVal = '✓';
                                                                        bg = 'rgba(76, 175, 80, 0.15)';
                                                                        fg = '#16a34a';
                                                                    } else {
                                                                        displayVal = '✗';
                                                                        bg = 'rgba(244, 67, 54, 0.15)';
                                                                        fg = '#dc2626';
                                                                    }
                                                                } else if (grade.point === -2 || numPoint === -2) {
                                                                    displayVal = 'X';
                                                                    bg = 'rgba(156, 39, 176, 0.15)';
                                                                    fg = '#9333ea';
                                                                } else if (grade.point === -3 || numPoint === -3) {
                                                                    displayVal = 'ჩთ';
                                                                    bg = 'rgba(33, 150, 243, 0.15)';
                                                                    fg = '#2563eb';
                                                                } else {
                                                                    const numVal = numPoint !== null ? numPoint : (typeof grade.point === 'number' ? grade.point : 0);
                                                                    displayVal = String(numVal > 0 ? numVal : grade.point);
                                                                    if (numVal >= 9) { bg = 'rgba(76, 175, 80, 0.15)'; fg = '#16a34a'; }
                                                                    else if (numVal >= 7) { bg = 'rgba(255, 152, 0, 0.15)'; fg = '#d97706'; }
                                                                    else if (numVal >= 4) { bg = 'rgba(33, 150, 243, 0.15)'; fg = '#2563eb'; }
                                                                    else if (numVal > 0) { bg = 'rgba(244, 67, 54, 0.15)'; fg = '#dc2626'; }
                                                                }

                                                                const typeLabel = isFormative ? 'განმავითარებელი' : (grade.pointType === 1 ? 'საშინაო' : grade.pointType === 2 ? 'საკლასო' : grade.pointType === 3 ? 'შემაჯამებელი' : grade.pointType === 4 ? 'ექსტერნი' : 'უცნობი');
                                                                const displayStr = String(displayVal);

                                                                return (
                                                                    <div key={grade._id} style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc', border: grade.pointType === 3 ? '1px solid rgba(239, 68, 68, 0.3)' : (grade.pointType === 2 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #e2e8f0'), borderRadius: '12px', padding: '12px 16px', gap: '8px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                                <div style={{
                                                                                    minWidth: '36px',
                                                                                    height: '36px',
                                                                                    padding: displayStr.length > 3 ? '0 10px' : '0',
                                                                                    borderRadius: displayStr.length > 3 ? '18px' : '50%',
                                                                                    backgroundColor: bg,
                                                                                    color: fg,
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    fontWeight: '800',
                                                                                    fontSize: displayStr.length > 15 ? '11px' : (displayStr.length > 3 ? '13px' : '15px'),
                                                                                    whiteSpace: 'nowrap',
                                                                                }}>
                                                                                    {displayVal}
                                                                                </div>
                                                                                <span style={{
                                                                                    fontSize: '11px',
                                                                                    fontWeight: '700',
                                                                                    background: isFormative ? 'rgba(245, 158, 11, 0.15)' : (grade.pointType === 3 ? 'rgba(239, 68, 68, 0.15)' : (grade.pointType === 2 ? 'rgba(245, 158, 11, 0.15)' : (grade.pointType === 1 ? 'rgba(59, 130, 246, 0.15)' : '#e2e8f0'))),
                                                                                    color: isFormative ? '#d97706' : (grade.pointType === 3 ? '#dc2626' : (grade.pointType === 2 ? '#d97706' : (grade.pointType === 1 ? '#2563eb' : '#475569'))),
                                                                                    padding: '3px 8px',
                                                                                    borderRadius: '10px'
                                                                                }}>
                                                                                    {typeLabel}
                                                                                </span>
                                                                            </div>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                                                                                <CalendarOutlineIcon size={14} />
                                                                                <span>{grade.date}</span>
                                                                            </div>
                                                                        </div>
                                                                        {(commentText || isFormative) && (
                                                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid #f59e0b', padding: '8px 12px', borderRadius: '0 6px 6px 0', fontSize: '13px', color: '#92400e' }}>
                                                                                <RegCommentIcon size={14} style={{ marginTop: '2px', flexShrink: 0, color: '#d97706' }} />
                                                                                <span>
                                                                                    <strong style={{ color: '#b45309' }}>განმავითარებელი შეფასება: </strong>
                                                                                    <span style={{ fontStyle: 'italic' }}>{commentText || 'განმავითარებელი შეფასება'}</span>
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Semester 2 Grades */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderLeft: '4px solid #16a34a', paddingLeft: '10px' }}>
                                                        <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', color: '#14532d', letterSpacing: '0.5px' }}>
                                                            II სემესტრი — {activeTabObj.fullAcademicYear} სასწავლო წელი ({activeTabObj.className} კლასი)
                                                        </h5>
                                                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#16a34a', background: '#f0fdf4', padding: '4px 10px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                                                            საშუალო: {displayGrade(subject.second_semester_average)}
                                                        </span>
                                                    </div>
                                                    
                                                    {sem2Grades.length === 0 ? (
                                                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
                                                            ნიშნები არ ფიქსირდება
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {sem2Grades.map((grade: any) => {
                                                                const numPoint = typeof grade.point === 'number'
                                                                    ? grade.point
                                                                    : (typeof grade.point === 'string' && !isNaN(parseInt(grade.point, 10)) ? parseInt(grade.point, 10) : null);
                                                                const isFormative = grade.is_formative || grade.point === 'განმავითარებელი' || (typeof grade.point === 'string' && numPoint === null && grade.point !== '-1' && grade.point !== '-2' && grade.point !== '-3');
                                                                const commentText = grade.comment || (typeof grade.point === 'string' && numPoint === null && grade.point !== 'განმავითარებელი' ? grade.point : '');

                                                                let bg = '#f1f5f9';
                                                                let fg = '#0f172a';
                                                                let displayVal: any = '';

                                                                if (isFormative) {
                                                                    displayVal = commentText || 'განმავითარებელი';
                                                                    bg = 'rgba(245, 158, 11, 0.15)';
                                                                    fg = '#d97706';
                                                                } else if (grade.point === -1 || numPoint === -1) {
                                                                    if (grade.checked) {
                                                                        displayVal = '✓';
                                                                        bg = 'rgba(76, 175, 80, 0.15)';
                                                                        fg = '#16a34a';
                                                                    } else {
                                                                        displayVal = '✗';
                                                                        bg = 'rgba(244, 67, 54, 0.15)';
                                                                        fg = '#dc2626';
                                                                    }
                                                                } else if (grade.point === -2 || numPoint === -2) {
                                                                    displayVal = 'X';
                                                                    bg = 'rgba(156, 39, 176, 0.15)';
                                                                    fg = '#9333ea';
                                                                } else if (grade.point === -3 || numPoint === -3) {
                                                                    displayVal = 'ჩთ';
                                                                    bg = 'rgba(33, 150, 243, 0.15)';
                                                                    fg = '#2563eb';
                                                                } else {
                                                                    const numVal = numPoint !== null ? numPoint : (typeof grade.point === 'number' ? grade.point : 0);
                                                                    displayVal = String(numVal > 0 ? numVal : grade.point);
                                                                    if (numVal >= 9) { bg = 'rgba(76, 175, 80, 0.15)'; fg = '#16a34a'; }
                                                                    else if (numVal >= 7) { bg = 'rgba(255, 152, 0, 0.15)'; fg = '#d97706'; }
                                                                    else if (numVal >= 4) { bg = 'rgba(33, 150, 243, 0.15)'; fg = '#2563eb'; }
                                                                    else if (numVal > 0) { bg = 'rgba(244, 67, 54, 0.15)'; fg = '#dc2626'; }
                                                                }

                                                                const typeLabel = isFormative ? 'განმავითარებელი' : (grade.pointType === 1 ? 'საშინაო' : grade.pointType === 2 ? 'საკლასო' : grade.pointType === 3 ? 'შემაჯამებელი' : grade.pointType === 4 ? 'ექსტერნი' : 'უცნობი');
                                                                const displayStr = String(displayVal);

                                                                return (
                                                                    <div key={grade._id} style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc', border: grade.pointType === 3 ? '1px solid rgba(239, 68, 68, 0.3)' : (grade.pointType === 2 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #e2e8f0'), borderRadius: '12px', padding: '12px 16px', gap: '8px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                                <div style={{
                                                                                    minWidth: '36px',
                                                                                    height: '36px',
                                                                                    padding: displayStr.length > 3 ? '0 10px' : '0',
                                                                                    borderRadius: displayStr.length > 3 ? '18px' : '50%',
                                                                                    backgroundColor: bg,
                                                                                    color: fg,
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    fontWeight: '800',
                                                                                    fontSize: displayStr.length > 15 ? '11px' : (displayStr.length > 3 ? '13px' : '15px'),
                                                                                    whiteSpace: 'nowrap',
                                                                                }}>
                                                                                    {displayVal}
                                                                                </div>
                                                                                <span style={{
                                                                                    fontSize: '11px',
                                                                                    fontWeight: '700',
                                                                                    background: isFormative ? 'rgba(245, 158, 11, 0.15)' : (grade.pointType === 3 ? 'rgba(239, 68, 68, 0.15)' : (grade.pointType === 2 ? 'rgba(245, 158, 11, 0.15)' : (grade.pointType === 1 ? 'rgba(59, 130, 246, 0.15)' : '#e2e8f0'))),
                                                                                    color: isFormative ? '#d97706' : (grade.pointType === 3 ? '#dc2626' : (grade.pointType === 2 ? '#d97706' : (grade.pointType === 1 ? '#2563eb' : '#475569'))),
                                                                                    padding: '3px 8px',
                                                                                    borderRadius: '10px'
                                                                                }}>
                                                                                    {typeLabel}
                                                                                </span>
                                                                            </div>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                                                                                <CalendarOutlineIcon size={14} />
                                                                                <span>{grade.date}</span>
                                                                            </div>
                                                                        </div>
                                                                        {(commentText || isFormative) && (
                                                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid #f59e0b', padding: '8px 12px', borderRadius: '0 6px 6px 0', fontSize: '13px', color: '#92400e' }}>
                                                                                <RegCommentIcon size={14} style={{ marginTop: '2px', flexShrink: 0, color: '#d97706' }} />
                                                                                <span>
                                                                                    <strong style={{ color: '#b45309' }}>განმავითარებელი შეფასება: </strong>
                                                                                    <span style={{ fontStyle: 'italic' }}>{commentText || 'განმავითარებელი შეფასება'}</span>
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', marginTop: '30px', fontStyle: 'italic', fontWeight: '600' }}>
                * თუ მოსწავლეს აქვს ექსტერნის ნიშანი, წლიური ნიშანი ჩაანაცვლება ექსტერნის ნიშნით
            </p>
        </div>
    );
};

export default StudentCard;
