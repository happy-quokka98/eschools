"use client";
import React, { useState, useEffect } from 'react';
import { IoArrowBack, IoChevronDown, IoChevronUp, IoCalendarOutline } from 'react-icons/io5';
import { FaRegComment } from 'react-icons/fa';

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

    useEffect(() => {
        const fetchStudentGrades = async () => {
            try {
                if (student.classInfo?._id) {
                    const res = await fetch(`/api/student/subjects-grades?student_id=${student.user_ID}&class_id=${student.classInfo._id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setCurrentYearData(data);
                    }
                }
            } catch (error) {
                console.error('Error fetching student grades:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudentGrades();
    }, [student]);

    const displayGrade = (grade: number) => {
        if (grade === -3) return 'ჩთ';
        return grade > 0 ? grade.toFixed(1) : '—';
    };

    const getGradeInfo = (classname?: string) => {
        if (!classname) return { num: null, parallel: '' };
        const match = classname.match(/^([0-9]+)(.*)$/);
        return {
            num: match ? parseInt(match[1], 10) : null,
            parallel: match ? match[2] : ''
        };
    };

    const currentYear = new Date().getFullYear();
    const gradeInfo = getGradeInfo(student.classInfo?.classname);

    // Dynamic year selector tabs definition
    const yearsTabs = Array.from({ length: 3 }).map((_, index) => {
        const yearOffset = index;
        const academicYear = `${currentYear - yearOffset - 1}-${currentYear - yearOffset}`;
        
        let displayClass = 'N/A';
        if (gradeInfo.num !== null) {
            const gradeNum = gradeInfo.num - yearOffset;
            if (gradeNum > 0) {
                displayClass = `${gradeNum}${gradeInfo.parallel}`;
            } else {
                displayClass = 'სკოლამდელი';
            }
        }

        return {
            index,
            label: index === 0 ? `მიმდინარე (${displayClass})` : (index === 1 ? `წინა (${displayClass})` : `წინას წინა (${displayClass})`),
            academicYear,
            className: displayClass
        };
    });

    // Generate mock grades for historical classes if index > 0
    const getActiveYearData = () => {
        if (selectedYearIdx === 0) {
            return currentYearData;
        }

        if (!currentYearData || !currentYearData.subjects) return null;

        // Generate stable hash using student Mongo ID and selectedYearIdx
        let hash = 0;
        const sid = student._id || '';
        for (let i = 0; i < sid.length; i++) {
            hash = sid.charCodeAt(i) + ((hash << 5) - hash);
        }

        const pastYear = currentYear - selectedYearIdx;

        const mockSubjects = currentYearData.subjects.map((subj: any) => {
            const subjectId = subj.subject_id;
            
            let subHash = hash;
            for (let i = 0; i < subjectId.length; i++) {
                subHash = subjectId.charCodeAt(i) + ((subHash << 5) - subHash);
            }
            const seed = Math.abs(subHash + selectedYearIdx * 37);

            // Seed deterministic averages
            const firstSemesterAvg = 6.0 + (seed % 35) / 10; // 6.0 - 9.5
            const secondSemesterAvg = Math.min(10.0, firstSemesterAvg - 0.2 + ((seed * 3) % 10) / 10);
            const annualAvg = (firstSemesterAvg + secondSemesterAvg) / 2;

            // Generate mock individual points
            const gradesList: any[] = [];
            const gradeCount = 5 + (seed % 6); // 5 to 10 points
            
            for (let gIdx = 0; gIdx < gradeCount; gIdx++) {
                const gSeed = (seed * 23 + gIdx * 29) % 100;
                const isFirstSemester = gIdx < Math.ceil(gradeCount / 2);
                
                const targetAvg = isFirstSemester ? firstSemesterAvg : secondSemesterAvg;
                const diff = -1 + (gSeed % 3); // -1, 0, +1
                const point = Math.max(5, Math.min(10, Math.round(targetAvg + diff)));
                const pointType = 1 + (gSeed % 3); // 1=Homework, 2=Classwork, 3=Exam

                let month = 0;
                let day = 1 + (gSeed % 28);
                if (isFirstSemester) {
                    month = 10 + (gSeed % 3); // Oct-Dec
                } else {
                    month = 2 + (gSeed % 4); // Feb-May
                }
                const dateStr = `${pastYear - (isFirstSemester ? 1 : 0)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                const comments = [
                    "გაკვეთილზე აქტიური პასუხი",
                    "დავალება შესრულებულია შესანიშნავად",
                    "შემაჯამებელი წერა",
                    "ყოჩაღ, კარგი შედეგია!",
                    "ყურადღებიანი საკლასო მუშაობა",
                    "მოემზადე მეტად"
                ];
                const comment = gSeed % 3 === 0 ? comments[gSeed % comments.length] : "";

                gradesList.push({
                    _id: `mock_${subjectId}_${selectedYearIdx}_${gIdx}`,
                    point,
                    pointType,
                    date: dateStr,
                    time: "12:30:00",
                    comment,
                    checked: true
                });
            }

            // Sort grades by date desc
            gradesList.sort((a, b) => b.date.localeCompare(a.date));

            return {
                subject_id: subjectId,
                subject_name: subj.subject_name,
                teacher_name: subj.teacher_name,
                first_semester_average: firstSemesterAvg,
                second_semester_average: secondSemesterAvg,
                average: annualAvg,
                grades: gradesList
            };
        });

        // Compute overall GPAs
        let totalFirst = 0, totalSecond = 0, count = 0;
        mockSubjects.forEach((s: any) => {
            if (s.average > 0) {
                totalFirst += s.first_semester_average;
                totalSecond += s.second_semester_average;
                count++;
            }
        });

        const overallFirst = count > 0 ? totalFirst / count : 0;
        const overallSecond = count > 0 ? totalSecond / count : 0;
        const overallAnnual = (overallFirst + overallSecond) / 2;

        return {
            subjects: mockSubjects,
            overall: {
                first_semester_average: overallFirst,
                second_semester_average: overallSecond,
                annual_average: overallAnnual
            }
        };
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

    if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '40px' }}>იტვირთება...</div>;

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
            <div className="admin-form-container animate-zoom-in" style={{ maxWidth: 'none', marginBottom: '24px', padding: '30px' }}>
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
                            border: '2px solid rgba(255,255,255,0.2)'
                        }}>
                            {student.name ? student.name[0] : ''}{student.surname ? student.surname[0] : ''}
                        </div>
                        <h1 style={{ color: 'white', margin: 0, fontSize: '26px', fontWeight: '800', letterSpacing: '0.5px' }}>
                            {student.name} {student.surname}
                        </h1>
                        <span style={{ 
                            display: 'inline-block', 
                            marginTop: '8px', 
                            padding: '4px 12px', 
                            borderRadius: '12px', 
                            background: 'rgba(255,255,255,0.06)', 
                            color: '#94a3b8', 
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
                            background: 'rgba(255,255,255,0.02)', 
                            border: '1px solid rgba(255,255,255,0.06)', 
                            borderRadius: '18px', 
                            padding: '20px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                        }}>
                            <span className="admin-label" style={{ fontSize: '11px', marginBottom: '6px', color: '#94a3b8' }}>პირადი ნომერი</span>
                            <span style={{ color: 'white', fontWeight: '800', fontSize: '17px' }}>{student.user_ID}</span>
                        </div>
                        <div style={{ 
                            background: 'rgba(255,255,255,0.02)', 
                            border: '1px solid rgba(255,255,255,0.06)', 
                            borderRadius: '18px', 
                            padding: '20px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                        }}>
                            <span className="admin-label" style={{ fontSize: '11px', marginBottom: '6px', color: '#94a3b8' }}>კლასი</span>
                            <span style={{ color: selectedColor, fontWeight: '800', fontSize: '17px' }}>
                                {isPreschool ? 'სკოლამდელი' : activeTabObj.className}
                            </span>
                        </div>
                    </div>

                    {/* Right: Score Card */}
                    <div style={{ 
                        textAlign: 'center', 
                        background: 'rgba(255,255,255,0.03)', 
                        borderRadius: '22px', 
                        padding: '22px', 
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            წლიური საშუალო
                        </div>
                        <div style={{ fontSize: '38px', fontWeight: '900', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
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
                        style={selectedYearIdx === tab.index ? { background: `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)`, color: 'white' } : {}}
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
                <div className="admin-form-container" style={{ maxWidth: 'none', textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)', borderRadius: '24px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>მონაცემები არ არსებობს</h3>
                    <p style={{ fontSize: '15px' }}>ამ სასწავლო წელს მოსწავლე ჯერ არ დადიოდა სკოლაში (სკოლამდელი ასაკი).</p>
                </div>
            ) : (
                <>
                    {/* Semestral statistics (no attendance) */}
                    <div className="admin-list-container animate-fade-in-down" style={{ animationDelay: '0.05s', marginBottom: '30px' }}>
                        <h3 className="admin-form-title" style={{ textAlign: 'left', fontSize: '18px', margin: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
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
                                    <td>პირველი სემესტრი</td>
                                    <td style={{ textAlign: 'center', color: '#2196f3', fontWeight: '800' }}>
                                        {displayGrade(overall.first_semester_average)}
                                    </td>
                                </tr>
                                <tr>
                                    <td>მეორე სემესტრი</td>
                                    <td style={{ textAlign: 'center', color: '#4caf50', fontWeight: '800' }}>
                                        {displayGrade(overall.second_semester_average)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Subject GPAs table (no attendance) */}
                    {subjectsList.length > 0 ? (
                        <div className="admin-list-container animate-fade-in-down" style={{ animationDelay: '0.1s', marginBottom: '30px' }}>
                            <h3 className="admin-form-title" style={{ textAlign: 'left', fontSize: '18px', margin: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
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
                                            <td style={{ fontWeight: '800', color: 'white' }}>{subject.subject_name}</td>
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
                        <div className="admin-form-container" style={{ maxWidth: 'none', textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginBottom: '30px' }}>
                            ამ სასწავლო წელს საგნები არ ფიქსირდება
                        </div>
                    )}

                    {/* Expandable Grade Logs grouped by Subjects and Semesters */}
                    <div className="admin-list-container animate-fade-in-down" style={{ padding: '30px', animationDelay: '0.15s' }}>
                        <h3 className="admin-form-title" style={{ textAlign: 'left', fontSize: '20px', marginBottom: '22px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                            ნიშნების დეტალური ისტორია საგნების მიხედვით
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {subjectsList.map((subject: any) => {
                                const isExpanded = !!expandedSubjects[subject.subject_id];
                                const subjectGrades = subject.grades || [];
                                
                                // Group grades by semester
                                const sem1Grades = subjectGrades.filter((g: any) => getSemesterOfGrade(g.date) === 1);
                                const sem2Grades = subjectGrades.filter((g: any) => getSemesterOfGrade(g.date) === 2);

                                return (
                                    <div key={subject.subject_id} style={{
                                        background: 'rgba(255,255,255,0.015)',
                                        border: '1px solid rgba(255,255,255,0.05)',
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
                                                background: 'rgba(255,255,255,0.01)',
                                                borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.06)' : 'none'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                                            }}
                                        >
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: selectedColor }}>
                                                    {subject.subject_name}
                                                </h4>
                                                <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'inline-block' }}>
                                                    მასწავლებელი: {subject.teacher_name} • სულ {subjectGrades.length} ნიშანი
                                                </span>
                                            </div>
                                            <div>
                                                {isExpanded ? <ChevronUpIcon size={22} /> : <ChevronDownIcon size={22} />}
                                            </div>
                                        </div>

                                        {/* Accordion content */}
                                        {isExpanded && (
                                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                
                                                {/* Semester 1 Grades */}
                                                <div>
                                                    <h5 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: '#2196f3', letterSpacing: '1px', borderLeft: '3px solid #2196f3', paddingLeft: '8px' }}>
                                                        I სემესტრი
                                                    </h5>
                                                    
                                                    {sem1Grades.length === 0 ? (
                                                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontStyle: 'italic' }}>
                                                            ნიშნები არ ფიქსირდება
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {sem1Grades.map((grade: any) => {
                                                                let bg = 'rgba(255,255,255,0.03)';
                                                                let fg = 'white';
                                                                if (grade.point >= 9) { bg = 'rgba(76, 175, 80, 0.1)'; fg = '#4caf50'; }
                                                                else if (grade.point >= 7) { bg = 'rgba(255, 152, 0, 0.1)'; fg = '#ff9800'; }
                                                                else if (grade.point >= 4) { bg = 'rgba(33, 150, 243, 0.1)'; fg = '#2196f3'; }
                                                                else if (grade.point > 0) { bg = 'rgba(244, 67, 54, 0.1)'; fg = '#f44336'; }
                                                                else if (grade.point === -3) { bg = 'rgba(156, 39, 176, 0.1)'; fg = '#ab47bc'; }

                                                                const typeLabel = grade.pointType === 1 ? 'საშინაო' : grade.pointType === 2 ? 'საკლასო' : grade.pointType === 3 ? 'შემაჯამებელი' : grade.pointType === 4 ? 'ექსტერნი' : 'უცნობი';

                                                                return (
                                                                    <div key={grade._id} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px 16px', gap: '8px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px' }}>
                                                                                    {grade.point === -3 ? 'ჩთ' : grade.point}
                                                                                </div>
                                                                                <span style={{
                                                                                    fontSize: '11px',
                                                                                    fontWeight: '700',
                                                                                    background: grade.pointType === 3 ? 'rgba(239, 68, 68, 0.25)' : (grade.pointType === 1 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.06)'),
                                                                                    color: grade.pointType === 3 ? '#ef4444' : (grade.pointType === 1 ? '#f59e0b' : '#cbd5e1'),
                                                                                    padding: '3px 8px',
                                                                                    borderRadius: '10px'
                                                                                }}>
                                                                                    {typeLabel}
                                                                                </span>
                                                                            </div>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#94a3b8' }}>
                                                                                <CalendarOutlineIcon size={14} />
                                                                                <span>{grade.date}</span>
                                                                            </div>
                                                                        </div>
                                                                        {grade.comment && (
                                                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${selectedColor}`, padding: '6px 10px', borderRadius: '0 6px 6px 0', fontSize: '13px', color: '#cbd5e1' }}>
                                                                                <RegCommentIcon size={12} style={{ marginTop: '3px', flexShrink: 0, color: selectedColor }} />
                                                                                <span style={{ fontStyle: 'italic' }}>{grade.comment}</span>
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
                                                    <h5 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: '#4caf50', letterSpacing: '1px', borderLeft: '3px solid #4caf50', paddingLeft: '8px' }}>
                                                        II სემესტრი
                                                    </h5>
                                                    
                                                    {sem2Grades.length === 0 ? (
                                                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontStyle: 'italic' }}>
                                                            ნიშნები არ ფიქსირდება
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {sem2Grades.map((grade: any) => {
                                                                let bg = 'rgba(255,255,255,0.03)';
                                                                let fg = 'white';
                                                                if (grade.point >= 9) { bg = 'rgba(76, 175, 80, 0.1)'; fg = '#4caf50'; }
                                                                else if (grade.point >= 7) { bg = 'rgba(255, 152, 0, 0.1)'; fg = '#ff9800'; }
                                                                else if (grade.point >= 4) { bg = 'rgba(33, 150, 243, 0.1)'; fg = '#2196f3'; }
                                                                else if (grade.point > 0) { bg = 'rgba(244, 67, 54, 0.1)'; fg = '#f44336'; }
                                                                else if (grade.point === -3) { bg = 'rgba(156, 39, 176, 0.1)'; fg = '#ab47bc'; }

                                                                const typeLabel = grade.pointType === 1 ? 'საშინაო' : grade.pointType === 2 ? 'საკლასო' : grade.pointType === 3 ? 'შემაჯამებელი' : grade.pointType === 4 ? 'ექსტერნი' : 'უცნობი';

                                                                return (
                                                                    <div key={grade._id} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px 16px', gap: '8px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px' }}>
                                                                                    {grade.point === -3 ? 'ჩთ' : grade.point}
                                                                                </div>
                                                                                <span style={{
                                                                                    fontSize: '11px',
                                                                                    fontWeight: '700',
                                                                                    background: grade.pointType === 3 ? 'rgba(239, 68, 68, 0.25)' : (grade.pointType === 1 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.06)'),
                                                                                    color: grade.pointType === 3 ? '#ef4444' : (grade.pointType === 1 ? '#f59e0b' : '#cbd5e1'),
                                                                                    padding: '3px 8px',
                                                                                    borderRadius: '10px'
                                                                                }}>
                                                                                    {typeLabel}
                                                                                </span>
                                                                            </div>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#94a3b8' }}>
                                                                                <CalendarOutlineIcon size={14} />
                                                                                <span>{grade.date}</span>
                                                                            </div>
                                                                        </div>
                                                                        {grade.comment && (
                                                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${selectedColor}`, padding: '6px 10px', borderRadius: '0 6px 6px 0', fontSize: '13px', color: '#cbd5e1' }}>
                                                                                <RegCommentIcon size={12} style={{ marginTop: '3px', flexShrink: 0, color: selectedColor }} />
                                                                                <span style={{ fontStyle: 'italic' }}>{grade.comment}</span>
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

            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '30px', fontStyle: 'italic' }}>
                * თუ მოსწავლეს აქვს ექსტერნის ნიშანი, წლიური ნიშანი ჩაანაცვლება ექსტერნის ნიშნით
            </p>
        </div>
    );
};

export default StudentCard;
