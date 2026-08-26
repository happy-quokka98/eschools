"use client";
import React, { useState, useEffect } from 'react';
import { IoArrowBack } from 'react-icons/io5';

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string }>;

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

interface ExternalsMarkInputProps {
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    selectedColor: string;
    logoutButtonStyle: React.CSSProperties;
    onBackClick: () => void;
    classSwitcher?: React.ReactNode;
}

const ExternalsMarkInput: React.FC<ExternalsMarkInputProps> = ({
    classId,
    className,
    subjectId,
    subjectName,
    selectedColor,
    onBackClick,
    classSwitcher
}) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [grades, setGrades] = useState<{ [studentId: string]: number }>({});
    const [existingDates, setExistingDates] = useState<{ [studentId: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch students
                const studentsRes = await fetch('/api/student/all');
                if (studentsRes.ok) {
                    const allStudents = await studentsRes.json();
                    setStudents(allStudents.filter((s: any) => s.classInfo && s.classInfo._id === classId));
                }

                // Fetch grades
                const gradesRes = await fetch(`/api/grades?class_id=${classId}&subject_id=${subjectId}`);
                if (gradesRes.ok) {
                    const allGrades: any[] = await gradesRes.json();
                    const externalGradesMap: { [studentId: string]: number } = {};
                    const datesMap: { [studentId: string]: string } = {};
                    allGrades.forEach(g => {
                        if (g.pointType === 4 && g.student_id) {
                            const studentIdStr = g.student_id.toString();
                            externalGradesMap[studentIdStr] = g.point;
                            datesMap[studentIdStr] = g.date;
                        }
                    });
                    setGrades(externalGradesMap);
                    setExistingDates(datesMap);
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [classId, subjectId]);

    const handleGradeChange = (studentId: string, grade: string) => {
        const numGrade = parseInt(grade);
        if (grade === '' || (numGrade >= 0 && numGrade <= 10)) {
            setGrades(prev => ({ ...prev, [studentId]: grade === '' ? 0 : numGrade }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const gradesToSubmit = Object.entries(grades).map(([studentId, grade]) => ({
                student_id: studentId,
                subject_id: subjectId,
                class_id: classId,
                point: grade,
                pointType: 4,
                date: existingDates[studentId] || new Date().toISOString().split('T')[0],
                checked: true
            }));

            const res = await fetch('/api/grades/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gradesToSubmit)
            });

            if (res.ok) {
                alert('ნიშნები წარმატებით შეინახა!');
                // Update local dates map for any newly saved grades
                const updatedDates = { ...existingDates };
                gradesToSubmit.forEach(g => {
                    if (g.student_id) {
                        updatedDates[g.student_id] = g.date;
                    }
                });
                setExistingDates(updatedDates);
            }
            else alert('ნიშნების შენახვა ვერ მოხერხდა');
        } catch (error) {
            console.error('Error:', error);
            alert('შეცდომა შენახვისას');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '40px' }}>იტვირთება...</div>;

    return (
        <div className="admin-view-container animate-fade-in-down">
            <header className="admin-view-header">
                <button className="admin-back-btn" onClick={onBackClick}>
                    <ArrowLeftIcon size={20} /> უკან
                </button>
                <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {classSwitcher ? classSwitcher : (
                        <>
                            <h2 className="admin-view-title" style={{ marginBottom: '5px' }}>ექსტერნების ნიშნები</h2>
                            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>
                                {className} • {subjectName}
                            </div>
                        </>
                    )}
                </div>
            </header>

            <div className="admin-form-container animate-zoom-in" style={{ maxWidth: '800px', margin: '0 auto 30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💡</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                        შეიყვანეთ ნიშნები <strong>0-დან 10-მდე</strong> თითოეული მოსწავლისთვის. ცარიელი ველი ჩაითვლება როგორც 0.
                    </div>
                </div>
            </div>

            <div className="admin-list-container animate-zoom-in" style={{ maxWidth: '800px', margin: '0 auto 30px', padding: '24px', gap: '12px', display: 'flex', flexDirection: 'column' }}>
                {students.map((student, idx) => (
                    <div 
                        key={student._id} 
                        style={{ 
                            padding: '16px 24px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            background: 'rgba(255, 255, 255, 0.02)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '16px',
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            animationDelay: `${idx * 0.05}s`
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = `0 6px 20px ${selectedColor}22`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: `linear-gradient(135deg, ${selectedColor}, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                {student.name[0]}
                            </div>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>{student.name} {student.surname}</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>ID: {student.user_ID}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                className="admin-input"
                                value={grades[student._id] || ''}
                                onChange={(e) => handleGradeChange(student._id, e.target.value)}
                                style={{ width: '80px', padding: '10px 14px', textAlign: 'center', fontSize: '18px', fontWeight: '800', color: selectedColor }}
                                placeholder="0"
                            />
                            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>/ 10</div>
                        </div>
                    </div>
                ))}

                <button
                    className="admin-submit-btn animate-fade-in-up"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ marginTop: '20px', fontSize: '16px', height: '55px' }}
                >
                    {saving ? 'ინახება...' : 'მონაცემების შენახვა'}
                </button>
            </div>
        </div>
    );
};

export default ExternalsMarkInput;
