"use client";
import React, { useState, useEffect } from 'react';
import { useColor } from '../ColorContext';

// Keep other interfaces from Admin.tsx
interface Class {
    _id: string;
    classname: string;
    tutor_id?: string;
    subjects?: { subject_id: string; teacher_id: string }[];
}

interface Teacher {
    _id:string;
    name: string;
    surname: string;
}

interface Subject {
    _id: string;
    name: string;
}

interface EditClassFormProps {
    onUpdateClass: (classData: Class) => void;
    onCancel: () => void;
    classes: Class[];
    teachers: Teacher[];
    subjects: Subject[];
}

const EditClassForm: React.FC<EditClassFormProps> = ({ onUpdateClass, onCancel, classes, teachers, subjects }) => {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [tutorId, setTutorId] = useState<string>('');
    const [classSubjects, setClassSubjects] = useState<{ subject_id: string; teacher_id: string }[]>([]);
    const { selectedColor } = useColor();

    useEffect(() => {
        if (classes.length > 0) {
            const defaultClass = classes.find(c => c.classname === '1ა');
            if (defaultClass) {
                setSelectedClassId(defaultClass._id);
                setTutorId(defaultClass.tutor_id || '');
                setClassSubjects(defaultClass.subjects || []);
            } else {
                setSelectedClassId(classes[0]._id);
                setTutorId(classes[0].tutor_id || '');
                setClassSubjects(classes[0].subjects || []);
            }
        }
    }, [classes]);

    const handleClassChange = (classId: string) => {
        setSelectedClassId(classId);
        const selectedClass = classes.find(c => c._id === classId);
        if (selectedClass) {
            setTutorId(selectedClass.tutor_id || '');
            setClassSubjects(selectedClass.subjects || []);
        }
    };

    const handleAddSubject = () => {
        setClassSubjects([...classSubjects, { subject_id: '', teacher_id: '' }]);
    };

    const handleSubjectChange = (index: number, field: 'subject_id' | 'teacher_id', value: string) => {
        const updatedSubjects = [...classSubjects];
        updatedSubjects[index][field] = value;
        setClassSubjects(updatedSubjects);
    };

    const handleRemoveSubject = (index: number) => {
        const updatedSubjects = classSubjects.filter((_, i) => i !== index);
        setClassSubjects(updatedSubjects);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const classData: Class = {
            _id: selectedClassId,
            classname: classes.find(c => c._id === selectedClassId)?.classname || '',
            tutor_id: tutorId,
            subjects: classSubjects,
        };
        onUpdateClass(classData);
    };

    return (
        <div className="admin-view-container animate-fade-in-down" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <form onSubmit={handleSubmit} className="admin-form-container animate-zoom-in" style={{ maxWidth: '800px' }}>
                <h2 className="admin-form-title">კლასის რედაქტირება</h2>

                <div className="admin-form-group">
                    <label className="admin-label">აირჩიეთ კლასი</label>
                    <select className="admin-select" value={selectedClassId} onChange={(e) => handleClassChange(e.target.value)}>
                        {classes.sort((a, b) => {
                            const aMatch = a.classname.match(/^([0-9]+)([ა-ჰ])$/);
                            const bMatch = b.classname.match(/^([0-9]+)([ა-ჰ])$/);
                            if (!aMatch || !bMatch) return a.classname.localeCompare(b.classname);
                            const aGrade = parseInt(aMatch[1], 10);
                            const bGrade = parseInt(bMatch[1], 10);
                            const aParallel = aMatch[2];
                            const bParallel = bMatch[2];
                            if (aGrade !== bGrade) return aGrade - bGrade;
                            const georgianOrder = 'აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ';
                            const aIndex = georgianOrder.indexOf(aParallel);
                            const bIndex = georgianOrder.indexOf(bParallel);
                            return aIndex - bIndex;
                        }).map(c => <option key={c._id} value={c._id}>{c.classname}</option>)}
                    </select>
                </div>

                <div className="admin-form-group">
                    <label className="admin-label">დამრიგებელი</label>
                    <select className="admin-select" value={tutorId} onChange={(e) => setTutorId(e.target.value)}>
                        <option value="">აირჩიეთ დამრიგებელი</option>
                        {teachers?.map(t => <option key={t._id} value={t._id}>{t.name} {t.surname}</option>)}
                    </select>
                </div>

                <div className="admin-form-group">
                    <h3 className="admin-label" style={{ fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '20px' }}>საგნები</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {classSubjects.map((cs, index) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <select className="admin-select" value={cs.subject_id} onChange={(e) => handleSubjectChange(index, 'subject_id', e.target.value)} style={{ flex: 1 }}>
                                    <option value="">საგანი</option>
                                    {subjects?.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                                <select className="admin-select" value={cs.teacher_id} onChange={(e) => handleSubjectChange(index, 'teacher_id', e.target.value)} style={{ flex: 1 }}>
                                    <option value="">მასწავლებელი</option>
                                    {teachers?.map(t => <option key={t._id} value={t._id}>{t.name} {t.surname}</option>)}
                                </select>
                                <button type="button" onClick={() => handleRemoveSubject(index)} className="admin-action-btn delete" style={{ width: '45px', height: '45px' }}>
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <button type="button" onClick={handleAddSubject} className="admin-cancel-btn" style={{ width: '100%', marginBottom: '20px', borderStyle: 'dashed' }}>
                    + საგნის დამატება
                </button>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    <button type="button" onClick={onCancel} className="admin-cancel-btn" style={{ flex: 1 }}>
                        გაუქმება
                    </button>
                    <button type="submit" className="admin-submit-btn" style={{ background: selectedColor, margin: 0, flex: 1 }}>
                        განახლება
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditClassForm;