"use client";
import React, { useState } from 'react';
import { useColor } from './ColorContext';
import { IoChevronDown, IoChevronUp, IoCalendarOutline } from 'react-icons/io5';
import { FaRegComment } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';

const ChevronDownIcon = IoChevronDown as React.ComponentType<any>;
const ChevronUpIcon = IoChevronUp as React.ComponentType<any>;
const CalendarOutlineIcon = IoCalendarOutline as React.ComponentType<any>;
const RegCommentIcon = FaRegComment as React.ComponentType<any>;

interface Grade {
    _id: string;
    teacher_id: string;
    student_id: string;
    subject_id: string;
    class_id: string;
    pointType: number;
    point: number | string;
    date: string;
    time: string;
    comment: string;
    checked: boolean;
    is_formative?: boolean;
}

interface SubjectWithGrades {
    subject_id: string;
    name?: string;
    subject_name?: string;
    teacher_id: string;
    teacher_name: string;
    grades: Grade[];
    average: number;
    first_semester_average: number;
    second_semester_average: number;
    annual_attendance: number;
    total_grades: number;
}

interface StudentData {
    student_name: string;
    student_surname: string;
    class_name: string;
    subjects: SubjectWithGrades[];
    available_years?: string[];
}

interface StudentSubjectsGradesProps {
    studentId: string;
    classId: string;
}

const StudentSubjectsGrades: React.FC<StudentSubjectsGradesProps> = ({ studentId, classId }) => {
    const { selectedColor } = useColor();
    const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
    const [selectedYear, setSelectedYear] = useState<string>('');

    const { data: studentData, isLoading: loading, error: queryError } = useQuery<StudentData>({
        queryKey: ['student-subjects-grades', studentId, classId, selectedYear],
        queryFn: async () => {
            let url = `/api/student/subjects-grades?student_id=${studentId}&class_id=${classId}`;
            if (selectedYear) {
                url += `&year=${selectedYear}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch student data: ${response.status} ${errorText}`);
            }
            return response.json();
        },
        enabled: !!studentId && !!classId,
    });

    const error = queryError instanceof Error ? queryError.message : (queryError ? String(queryError) : null);
    const dataLoaded = !!studentData;

    const toggleSubjectExpand = (subjectId: string) => {
        setExpandedSubjects(prev => ({
            ...prev,
            [subjectId]: !prev[subjectId]
        }));
    };

    const formatAvg = (n: number) => (n >= 0 && n <= 10 ? n.toFixed(1) : '—');

    return (
        <div style={{
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            padding: '16px',
            boxSizing: 'border-box' as const,
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}99)`,
                color: 'white',
                padding: '30px',
                borderRadius: '16px',
                marginBottom: '30px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
            }}>
                <h1 style={{ margin: '0 0 4px 0', fontSize: '28px' }}>
                    საგნები და ქულები
                </h1>
                <p style={{ margin: '0', fontSize: '18px', opacity: 0.9 }}>
                    მოსწავლის საგნების სია
                </p>
                {studentData?.available_years && studentData.available_years.length > 1 && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>სასწავლო წელი:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                fontWeight: 'bold',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            {studentData.available_years.map((y) => (
                                <option key={y} value={y === studentData.available_years?.[0] ? "" : y} style={{ background: '#1e293b', color: 'white' }}>
                                    {y === studentData.available_years?.[0] ? `20${y} (მიმდინარე)` : `20${y}`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {error && (
                <div style={{
                    background: '#f8d7da',
                    color: '#721c24',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    შეცდომა: {error}
                </div>
            )}

            {!dataLoaded && (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '16px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                    {loading ? 'მონაცემების ჩატვირთვა...' : 'საგნები არ მოიძებნა'}
                </div>
            )}

            {dataLoaded && studentData && studentData.subjects.length === 0 && (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '16px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                    საგნები არ მოიძებნა
                </div>
            )}

            {dataLoaded && studentData && studentData.subjects.map((subject) => {
                const absencePct = Math.max(0, 100 - (subject.annual_attendance ?? 0));
                const externalGrade = subject.grades?.find(g => g.pointType === 4 && g.point !== -1);
                const stats: Array<{ label: string; value: string }> = [
                    { label: 'პირველი სემესტრის საშუალო', value: formatAvg(subject.first_semester_average) },
                    { label: 'მეორე სემესტრის საშუალო', value: formatAvg(subject.second_semester_average) },
                    { 
                        label: externalGrade ? 'ექსტერნის ნიშანი' : 'საერთო საშუალო', 
                        value: externalGrade ? externalGrade.point.toString() : formatAvg(subject.average) 
                    },
                    { label: 'გაცდენების პროცენტობა', value: `${absencePct.toFixed(1)}%` },
                ];

                return (
                    <div key={subject.subject_id} style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '20px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginBottom: '16px',
                            paddingBottom: '12px',
                            borderBottom: `2px solid ${selectedColor}33`,
                        }}>
                            <h2 style={{ margin: 0, fontSize: '22px', color: selectedColor }}>
                                {subject.name || subject.subject_name}
                            </h2>
                            <span style={{ fontSize: '14px', color: '#666' }}>
                                {subject.teacher_name}
                            </span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '14px',
                        }}>
                            {stats.map((s) => (
                                <div key={s.label} style={{
                                    background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}99)`,
                                    color: 'white',
                                    padding: '18px',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '6px' }}>
                                        {s.label}
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                        {s.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Accordion Toggle Button */}
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={() => toggleSubjectExpand(subject.subject_id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'none',
                                    border: `1.5px solid ${selectedColor}`,
                                    color: selectedColor,
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    transition: 'all 0.2s ease',
                                    outline: 'none',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = `${selectedColor}11`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                {expandedSubjects[subject.subject_id] ? (
                                    <>
                                        ისტორიის დამალვა <ChevronUpIcon size={16} />
                                    </>
                                ) : (
                                    <>
                                        ნიშნების ისტორია ({subject.grades?.length || 0}) <ChevronDownIcon size={16} />
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Expandable Grade History Panel */}
                        {expandedSubjects[subject.subject_id] && (
                            <div style={{
                                marginTop: '20px',
                                paddingTop: '20px',
                                borderTop: '1px solid #eee',
                            }}>
                                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333' }}>
                                    ნიშნების დეტალური ისტორია
                                </h3>
                                
                                {!subject.grades || subject.grades.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        color: '#888',
                                        padding: '20px',
                                        fontStyle: 'italic',
                                        background: '#f9f9f9',
                                        borderRadius: '8px',
                                    }}>
                                        ნიშნები არ მოიძებნა
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                    }}>
                                        {[...subject.grades]
                                            .sort((a, b) => {
                                                const dateCompare = b.date.localeCompare(a.date);
                                                if (dateCompare !== 0) return dateCompare;
                                                return (b.time || '').localeCompare(a.time || '');
                                            })
                                            .map((grade) => {
                                                const isFormative = grade.is_formative || (grade.comment && grade.comment.trim() !== '') || grade.point === 'განმავითარებელი' || typeof grade.point === 'string';

                                                let displayVal = '';
                                                let bg = '#eee';
                                                let fg = '#333';

                                                const commentText = grade.comment || (typeof grade.point === 'string' && grade.point !== 'განმავითარებელი' ? grade.point : '');

                                                if (isFormative) {
                                                    displayVal = commentText || 'განმავითარებელი';
                                                    bg = 'rgba(245, 158, 11, 0.15)';
                                                    fg = '#d97706';
                                                } else if (grade.point === -1) {
                                                    if (grade.checked) {
                                                        displayVal = '✓';
                                                        bg = '#e8f5e9';
                                                        fg = '#4caf50';
                                                    } else {
                                                        displayVal = '✗';
                                                        bg = '#ffebee';
                                                        fg = '#f44336';
                                                    }
                                                } else if (grade.point === -2) {
                                                    displayVal = 'X';
                                                    bg = '#f3e5f5';
                                                    fg = '#9c27b0';
                                                } else if (grade.point === -3) {
                                                    displayVal = 'ჩთ';
                                                    bg = '#e3f2fd';
                                                    fg = '#2196f3';
                                                } else {
                                                    const numPt = typeof grade.point === 'number' ? grade.point : (typeof grade.point === 'string' && !isNaN(parseInt(grade.point, 10)) ? parseInt(grade.point, 10) : -1);
                                                    displayVal = grade.point.toString();
                                                    if (numPt >= 9) {
                                                        bg = '#e8f5e9';
                                                        fg = '#4caf50';
                                                    } else if (numPt >= 7) {
                                                        bg = '#fff3e0';
                                                        fg = '#ff9800';
                                                    } else if (numPt >= 4) {
                                                        bg = '#e3f2fd';
                                                        fg = '#2196f3';
                                                    } else {
                                                        bg = '#ffebee';
                                                        fg = '#f44336';
                                                    }
                                                }

                                                let typeLabel = isFormative ? 'განმავითარებელი' : 'საშინაო';
                                                if (!isFormative) {
                                                    if (grade.pointType === 2) typeLabel = 'საკლასო';
                                                    else if (grade.pointType === 3) typeLabel = 'შემაჯამებელი';
                                                    else if (grade.pointType === 4) typeLabel = 'ექსტერნი';
                                                }

                                                return (
                                                    <div key={grade._id} style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        background: '#fafafa',
                                                        border: '1px solid #eaeaea',
                                                        borderRadius: '8px',
                                                        padding: '12px 16px',
                                                        gap: '8px',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                                    }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            flexWrap: 'wrap',
                                                            gap: '8px',
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{
                                                                    minWidth: '40px',
                                                                    height: '40px',
                                                                    padding: displayVal.length > 3 ? '0 14px' : '0',
                                                                    borderRadius: displayVal.length > 3 ? '20px' : '50%',
                                                                    backgroundColor: bg,
                                                                    color: fg,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontWeight: 'bold',
                                                                    fontSize: displayVal.length > 15 ? '12px' : (displayVal.length > 3 ? '13px' : '18px'),
                                                                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
                                                                    whiteSpace: 'nowrap',
                                                                }}>
                                                                    {displayVal}
                                                                </div>
                                                                
                                                                <div>
                                                                    <span style={{
                                                                        fontSize: '12px',
                                                                        fontWeight: 'bold',
                                                                        color: isFormative ? '#d97706' : (grade.pointType === 3 ? '#ef4444' : (grade.pointType === 1 ? '#f59e0b' : '#555')),
                                                                        backgroundColor: isFormative ? 'rgba(245, 158, 11, 0.15)' : (grade.pointType === 3 ? 'rgba(239, 68, 68, 0.15)' : (grade.pointType === 1 ? 'rgba(245, 158, 11, 0.15)' : '#eee')),
                                                                        padding: '2px 8px',
                                                                        borderRadius: '12px',
                                                                        marginRight: '8px',
                                                                    }}>
                                                                        {typeLabel}
                                                                    </span>
                                                                    
                                                                    {grade.point === -1 && !isFormative && (
                                                                        <span style={{ fontSize: '13px', color: grade.checked ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                                                                            {grade.checked ? 'დასწრება' : 'გაცდენა'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                fontSize: '13px',
                                                                color: '#888',
                                                            }}>
                                                                <CalendarOutlineIcon size={14} />
                                                                <span>{grade.date} {grade.time ? `• ${grade.time.slice(0, 5)}` : ''}</span>
                                                            </div>
                                                        </div>

                                                        {(commentText || isFormative) && (
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'flex-start',
                                                                gap: '8px',
                                                                backgroundColor: '#fffbeb',
                                                                borderLeft: `4px solid #f59e0b`,
                                                                padding: '8px 12px',
                                                                borderRadius: '0 6px 6px 0',
                                                                fontSize: '13px',
                                                                color: '#92400e',
                                                                marginTop: '4px',
                                                            }}>
                                                                <RegCommentIcon size={14} style={{ marginTop: '2px', flexShrink: 0, color: '#d97706' }} />
                                                                <span>
                                                                    <strong style={{ color: '#b45309' }}>განმავითარებელი შეფასება: </strong>
                                                                    <span style={{ fontStyle: 'italic', fontWeight: 500 }}>{commentText || 'განმავითარებელი შეფასება'}</span>
                                                                </span>
                                                            </div>
                                                        )}
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
            {dataLoaded && studentData && (
                <p style={{ textAlign: 'center', color: '#888', fontSize: '12px', marginTop: '30px', fontStyle: 'italic' }}>
                    * თუ მოსწავლეს აქვს ექსტერნის ნიშანი, წლიური ნიშანი ჩაანაცვლება ექსტერნის ნიშნით
                </p>
            )}
        </div>
    );
};

export default StudentSubjectsGrades;
