"use client";
import React, { useState, useEffect } from 'react';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, VerticalAlign, WidthType, BorderStyle } from 'docx';
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

interface Subject {
    _id: string;
    name: string;
}

interface Grade {
    _id: string;
    student_id: string;
    subject_id: string;
    class_id: string;
    point: number;
    pointType: number;
    date: string;
    checked: boolean;
}

interface ReportGeneratorProps {
    classId: string;
    className: string;
    selectedColor: string;
    logoutButtonStyle: React.CSSProperties;
    onBackClick: () => void;
    classSwitcher?: React.ReactNode;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
    classId,
    className,
    selectedColor,
    onBackClick,
    classSwitcher
}) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const match = className.match(/^([0-9]+)([ა-ჰ])$/);
                const studentsUrl = match
                    ? `/api/student/grade/${match[1]}?parallel=${encodeURIComponent(match[2])}`
                    : '/api/student/all';
                const studentsRes = await fetch(studentsUrl);
                const fetched = await studentsRes.json();
                const classStudents = match ? fetched : fetched.filter((s: any) => s.classInfo && s.classInfo._id === classId);
                setStudents(classStudents);

                const classesRes = await fetch('/api/classes');
                const allClasses = await classesRes.json();
                const selectedClass = allClasses.find((c: any) => c._id === classId);
                
                if (selectedClass && selectedClass.subjects) {
                    const subjectsRes = await fetch('/api/subjects');
                    const allSubjects = await subjectsRes.json();
                    setSubjects(allSubjects.filter((s: any) => selectedClass.subjects.some((cs: any) => cs.subject_id === s._id)));
                } else {
                    const subjectsRes = await fetch('/api/subjects');
                    const allSubjects = await subjectsRes.json();
                    setSubjects(allSubjects);
                }

                const gradesRes = await fetch(`/api/grades?class_id=${classId}`);
                const classGrades = await gradesRes.json();
                setGrades(classGrades);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [classId, className]);

    const generateReport = async () => {
        setGenerating(true);
        try {
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: 'სატესტო სკოლა', bold: true, size: 24 })],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: '2024-2025 სასწავლო წელი', size: 20 })],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: `კლასი: ${className} - საბოლოო შეფასების უწყისი`, size: 20 })],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 400 }
                        }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'N', bold: true, size: 16 })], alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } } }),
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'მოსწავლის გვარი, სახელი', bold: true, size: 16 })], alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } } }),
                                        ...subjects.map(s => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.name, bold: true, size: 14 })], alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } }, textDirection: 'btLr' })),
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'საშუალო ქულა', bold: true, size: 16 })], alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } } })
                                    ]
                                }),
                                ...students.map((student, index) => {
                                    const allGrades = grades.filter(g => g.student_id === student._id);
                                    const valid = allGrades.filter(g => g.point !== -1);
                                    const average = valid.length > 0 ? (valid.reduce((sum, g) => sum + g.point, 0) / valid.length).toFixed(1) : '';
                                    return new TableRow({
                                        children: [
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString(), size: 16 })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } } }),
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${student.surname} ${student.name}`, size: 16 })], alignment: AlignmentType.LEFT })], verticalAlign: VerticalAlign.CENTER, borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } } }),
                                            ...subjects.map(subject => {
                                                const sGrades = grades.filter(g => g.student_id === student._id && g.subject_id === subject._id);
                                                const sValid = sGrades.filter(g => g.point !== -1);
                                                const sAvg = sValid.length > 0 ? (Math.round((sValid.reduce((sum, g) => sum + g.point, 0) / sValid.length) * 10) / 10).toString() : '';
                                                return new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: sAvg, size: 16 })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } } });
                                            }),
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: average, size: 16 })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } } })
                                        ]
                                    });
                                })
                            ]
                        })
                    ]
                }]
            });

            const blob = await Packer.toBlob(doc);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${className}_უწყისი_${new Date().toISOString().split('T')[0]}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            alert('უწყისი წარმატებით გენერირებულია!');
        } catch (error) {
            console.error('Error:', error);
            alert('უწყისის გენერირებისას მოხდა შეცდომა');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '40px' }}>იტვირთება...</div>;

    return (
        <div className="admin-view-container animate-fade-in-down">
            <header className="admin-view-header">
                <button className="admin-back-btn" onClick={onBackClick}>
                    <ArrowLeftIcon size={20} /> უკან
                </button>
                {classSwitcher ? classSwitcher : <h2 className="admin-view-title">უწყისის გენერატორი</h2>}
            </header>

            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '30px' }}>
                <div className="admin-card animate-zoom-in" style={{ padding: '30px', textAlign: 'center', minHeight: 'auto', cursor: 'default' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '10px' }}>სამიზნე კლასი</div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: selectedColor }}>{className}</div>
                    <div style={{ height: '2px', width: '40px', background: 'rgba(255,255,255,0.1)', margin: '15px auto' }}></div>
                    <div style={{ fontSize: '14px', color: 'white' }}>{students.length} მოსწავლე</div>
                </div>

                <div className="admin-card animate-zoom-in" style={{ padding: '30px', textAlign: 'center', animationDelay: '0.1s', minHeight: 'auto', cursor: 'default' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '10px' }}>სულ მონაცემები</div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: 'white' }}>{grades.length}</div>
                    <div style={{ height: '2px', width: '40px', background: 'rgba(255,255,255,0.1)', margin: '15px auto' }}></div>
                    <div style={{ fontSize: '14px', color: 'white' }}>{subjects.length} საგანი</div>
                </div>
            </div>

            <div className="admin-form-container animate-zoom-in" style={{ maxWidth: 'none', animationDelay: '0.2s' }}>
                <h3 className="admin-form-title" style={{ textAlign: 'left', fontSize: '18px', marginBottom: '20px' }}>უწყისში შემავალი საგნები</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px' }}>
                    {subjects.map(subject => (
                        <div key={subject._id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '100px', fontSize: '13px', color: 'white', fontWeight: '600' }}>
                            {subject.name}
                        </div>
                    ))}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '15px', padding: '20px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px' }}>
                        გენერირებული დოკუმენტი მოიცავს ყველა მოსწავლის საბოლოო შეფასებას თითოეულ საგანში და საერთო საშუალო ქულას.
                    </p>
                    <button
                        className="admin-submit-btn"
                        onClick={generateReport}
                        disabled={generating}
                        style={{ width: 'auto', padding: '15px 50px', margin: '0 auto', fontSize: '16px' }}
                    >
                        {generating ? 'გენერირება...' : 'უწყისის გადმოწერა (.DOCX)'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportGenerator;
