"use client";
import React, { useState, useEffect } from 'react';
import { useColor } from './ColorContext';

interface SemesterStats {
    average: number;
    total_points: number;
    count: number;
    valid_grades: number;
    attendance: number;
}

interface AnnualStats {
    average: number;
    total_points: number;
    count: number;
    valid_grades: number;
    attendance: number;
}

interface SubjectStats {
    first_semester: SemesterStats;
    second_semester: SemesterStats;
    annual: AnnualStats;
}

interface Statistics {
    student_id: string;
    class_id: string;
    subject_id?: string;
    first_semester: SemesterStats;
    second_semester: SemesterStats;
    annual: AnnualStats;
    subject_breakdown: { [key: string]: SubjectStats };
}

interface StudentStatisticsProps {
    studentId: string;
    classId?: string;
    subjectId?: string;
    showClassSelector?: boolean;
}

const StudentStatistics: React.FC<StudentStatisticsProps> = ({ studentId, classId, subjectId, showClassSelector = false }) => {
    const { selectedColor } = useColor();
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string>(classId || '');
    const [classes, setClasses] = useState<Array<{_id: string, classname: string}>>([]);
    const [classesLoading, setClassesLoading] = useState(false);

    useEffect(() => {
        if (showClassSelector) {
            fetchClasses();
        }
    }, [showClassSelector]);

    useEffect(() => {
        if (selectedClassId) {
            fetchStatistics();
        }
    }, [studentId, selectedClassId, subjectId]);

    const fetchClasses = async () => {
        try {
            setClassesLoading(true);
            const response = await fetch('/api/classes/ordered');
            if (!response.ok) {
                throw new Error('Failed to fetch classes');
            }
            const data = await response.json();
            setClasses(data);
        } catch (err) {
            console.error('Error fetching classes:', err);
        } finally {
            setClassesLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            setError(null);
            
            let url = `/api/statistics?student_id=${studentId}&class_id=${selectedClassId}`;
            if (subjectId) {
                url += `&subject_id=${subjectId}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch statistics');
            }

            const data = await response.json();
            setStatistics(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const containerStyle: React.CSSProperties = {
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '30px',
        color: 'white',
        fontFamily: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`,
        position: 'relative',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '28px',
        textTransform: 'uppercase',
        fontWeight: '700',
        textAlign: 'center',
        color: 'blue',
    };

    const contentStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: '1260px',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '20px',
    };

    const boxStyle = (isHovered: boolean): React.CSSProperties => ({
        background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}99)`,
        fontSize: '16px',
        width: '300px',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: isHovered
            ? '0 12px 24px rgba(0, 0, 0, 0.3)'
            : '0 6px 16px rgba(0, 0, 0, 0.2)',
        transform: isHovered ? 'translateY(-5px) scale(1.03)' : 'scale(1)',
        cursor: 'pointer',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        boxSizing: 'border-box',
    });

    const loadingStyle: React.CSSProperties = {
        fontSize: '20px',
        textAlign: 'center',
    };

    const errorStyle: React.CSSProperties = {
        fontSize: '18px',
        color: '#ff6b6b',
        textAlign: 'center',
    };

    const classSelectorStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '30px',
    };

    const selectStyle: React.CSSProperties = {
        padding: '12px 20px',
        fontSize: '16px',
        borderRadius: '8px',
        border: '2px solid #ddd',
        backgroundColor: 'white',
        color: '#333',
        cursor: 'pointer',
        minWidth: '200px',
        textAlign: 'center',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '18px',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: '10px',
    };

    const backButtonStyle: React.CSSProperties = {
        position: 'fixed',
        top: '20px',
        left: '20px',
        backgroundColor: '#fff',
        color: selectedColor,
        border: 'none',
        borderRadius: '8px',
        padding: '8px 16px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'background-color 0.3s',
    };

    const formatAverage = (average: number): string => {
        if (!average || average <= 0) return "-";
        return average.toFixed(1);
    };

    const getSubjectName = (subjectId: string): string => {
        // This could be enhanced with a subject mapping or API call
        const subjectNames: { [key: string]: string } = {
            'math': 'მათემატიკა',
            'georgian': 'ქართული ენა და ლიტერატურა',
            'history': 'ისტორია',
            'physics': 'ფიზიკა',
            'chemistry': 'ქიმია',
            'biology': 'ბიოლოგია',
            'english': 'ინგლისური',
            'russian': 'რუსული',
            'music': 'მუსიკა',
            'art': 'სახვითი და გამოყენებითი ხელოვნება',
            'civics': 'მოქალაქეობა',
            'georgian_history': 'საქართველოს ისტორია',
            'religion': 'საღვთო სჯული',
            'sport': 'სპორტი',
        };
        return subjectNames[subjectId] || subjectId;
    };

    // Show class selector if enabled and no class is selected
    if (showClassSelector && !selectedClassId) {
        return (
            <div style={containerStyle}>
                <div style={titleStyle}>სტატისტიკა</div>
                <div style={classSelectorStyle}>
                    <div style={labelStyle}>აირჩიეთ კლასი:</div>
                    {classesLoading ? (
                        <div style={loadingStyle}>იტვირთება კლასები...</div>
                    ) : (
                        <select 
                            style={selectStyle}
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                        >
                            <option value="">აირჩიეთ კლასი</option>
                            {classes.map((cls) => (
                                <option key={cls._id} value={cls._id}>
                                    {cls.classname}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={containerStyle}>
                <div style={loadingStyle}>იტვირთება სტატისტიკა...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={containerStyle}>
                <div style={errorStyle}>შეცდომა: {error}</div>
            </div>
        );
    }

    if (!statistics) {
        return (
            <div style={containerStyle}>
                <div style={errorStyle}>სტატისტიკა ვერ მოიძებნა</div>
            </div>
        );
    }

    // If specific subject is requested, show only that subject
    if (subjectId && statistics.subject_breakdown[subjectId]) {
        const subjectStats = statistics.subject_breakdown[subjectId];
        const first = Math.round(subjectStats.first_semester.average);
        const second = Math.round(subjectStats.second_semester.average);
        const annual = Math.round(subjectStats.annual.average);

        return (
            <div style={containerStyle}>
                <div style={titleStyle}>სტატისტიკა - {getSubjectName(subjectId)}</div>
                <div style={contentStyle}>
                    <div
                        style={boxStyle(false)}
                        onMouseEnter={() => setHoveredIndex(0)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                            {getSubjectName(subjectId)}
                        </div>
                                                    <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                <div>📘 პირველი სემესტრი: <strong>{formatAverage(subjectStats.first_semester.average)}</strong></div>
                                <div>📗 მეორე სემესტრი: <strong>{formatAverage(subjectStats.second_semester.average)}</strong></div>
                                <div>📊 წლიური: <strong>{formatAverage(subjectStats.annual.average)}</strong></div>
                                <div>📈 სწრებადობა: <strong>{subjectStats.annual.attendance.toFixed(1)}%</strong></div>
                                <div>📝 ქულების რაოდენობა: <strong>{subjectStats.annual.count}</strong></div>
                                <div>✅ მოქმედი ქულები: <strong>{subjectStats.annual.valid_grades}</strong></div>
                            </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show all subjects
    const subjects = Object.entries(statistics.subject_breakdown);

    const handleBackToClassSelection = () => {
        setSelectedClassId('');
        setStatistics(null);
    };

    const getSelectedClassName = () => {
        const selectedClass = classes.find(cls => cls._id === selectedClassId);
        return selectedClass ? selectedClass.classname : '';
    };

    return (
        <div style={containerStyle}>
            <div style={titleStyle}>
                სტატისტიკა
                {showClassSelector && selectedClassId && (
                    <div style={{ fontSize: '18px', marginTop: '10px', opacity: 0.8, color:"#ff0000" }}>
                        კლასი: {getSelectedClassName()}
                    </div>
                )}
            </div>
            <div style={contentStyle}>
                {subjects.map(([subjectId, subjectStats], index) => {
                    const isHovered = hoveredIndex === index;
                    const first = Math.round(subjectStats.first_semester.average);
                    const second = Math.round(subjectStats.second_semester.average);
                    const annual = Math.round(subjectStats.annual.average);

                    return (
                        <div
                            key={subjectId}
                            style={boxStyle(isHovered)}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                                {getSubjectName(subjectId)}
                            </div>
                            <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                <div>📘 პირველი სემესტრი: <strong>{formatAverage(subjectStats.first_semester.average)}</strong></div>
                                <div>📗 მეორე სემესტრი: <strong>{formatAverage(subjectStats.second_semester.average)}</strong></div>
                                <div>📊 წლიური: <strong>{formatAverage(subjectStats.annual.average)}</strong></div>
                                <div>📈 სწრებადობა: <strong>{subjectStats.annual.attendance.toFixed(1)}%</strong></div>
                                <div>📝 ქულების რაოდენობა: <strong>{subjectStats.annual.count}</strong></div>
                                <div>✅ მოქმედი ქულები: <strong>{subjectStats.annual.valid_grades}</strong></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Overall Statistics */}
            <div style={contentStyle}>
                <div
                    style={boxStyle(false)}
                    onMouseEnter={() => setHoveredIndex(-1)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                        საერთო სტატისტიკა
                    </div>
                    <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                        <div>📘 პირველი სემესტრი: <strong>{formatAverage(statistics.first_semester.average)}</strong></div>
                        <div>📗 მეორე სემესტრი: <strong>{formatAverage(statistics.second_semester.average)}</strong></div>
                        <div>📊 წლიური: <strong>{formatAverage(statistics.annual.average)}</strong></div>
                        <div>📈 სწრებადობა: <strong>{statistics.annual.attendance.toFixed(1)}%</strong></div>
                        <div>📝 ქულების რაოდენობა: <strong>{statistics.annual.count}</strong></div>
                        <div>✅ მოქმედი ქულები: <strong>{statistics.annual.valid_grades}</strong></div>
                    </div>
                </div>
            </div>
            {statistics && (
                <p style={{ textAlign: 'center', color: '#cbd5e1', opacity: 0.6, fontSize: '12px', marginTop: '20px', fontStyle: 'italic' }}>
                    * თუ მოსწავლეს აქვს ექსტერნის ნიშანი, წლიური ნიშანი ჩაანაცვლება ექსტერნის ნიშნით
                </p>
            )}
        </div>
    );
};

export default StudentStatistics;
