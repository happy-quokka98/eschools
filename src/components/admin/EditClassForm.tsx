"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useColor } from '../ColorContext';

interface Class {
    _id: string;
    classname: string;
    damrigebeli?: string;
    subjects?: { subject_id: string; teacher_id: string }[];
}

interface Teacher {
    _id: string;
    name: string;
    surname: string;
}

interface Subject {
    _id: string;
    name?: string;
    subject_name?: string;
    is_project?: boolean;
    is_pass_fail?: boolean;
    type?: string;
}

interface EditClassFormProps {
    onUpdateClass: (classData: Class) => void;
    onCancel: () => void;
    classes: Class[];
    teachers: Teacher[];
    subjects: Subject[];
    onSubjectUpdated?: () => void;
}

const EditClassForm: React.FC<EditClassFormProps> = ({ onUpdateClass, onCancel, classes, teachers, subjects: initialSubjects, onSubjectUpdated }) => {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [tutorId, setTutorId] = useState<string>('');
    const [classSubjects, setClassSubjects] = useState<{ subject_id: string; teacher_id: string }[]>([]);
    const [subjectsList, setSubjectsList] = useState<Subject[]>(initialSubjects || []);
    const { selectedColor } = useColor();

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Subject | null>(null);
    const [editName, setEditName] = useState('');
    const [editIsProject, setEditIsProject] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setSubjectsList(initialSubjects || []);
    }, [initialSubjects]);

    useEffect(() => {
        if (classes.length > 0) {
            const defaultClass = classes.find(c => c.classname === '1ა');
            if (defaultClass) {
                setSelectedClassId(defaultClass._id);
                setTutorId(defaultClass.damrigebeli || '');
                setClassSubjects(defaultClass.subjects || []);
            } else {
                setSelectedClassId(classes[0]._id);
                setTutorId(classes[0].damrigebeli || '');
                setClassSubjects(classes[0].subjects || []);
            }
        }
    }, [classes]);

    const handleClassChange = (classId: string) => {
        setSelectedClassId(classId);
        const selectedClass = classes.find(c => c._id === classId);
        if (selectedClass) {
            setTutorId(selectedClass.damrigebeli || '');
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

    const openEditModal = (subj: Subject) => {
        setEditTarget(subj);
        setEditName(subj.name || subj.subject_name || '');
        const isProj = Boolean(subj.is_project || subj.is_pass_fail || subj.type === 'project' || /პროექტი|ჩათვლა|პროექტული/i.test(subj.name || ''));
        setEditIsProject(isProj);
        setEditModalOpen(true);
    };

    const handleSaveSubject = async () => {
        if (!editTarget || !editName.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/subject/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _id: editTarget._id,
                    name: editName.trim(),
                    is_project: editIsProject,
                    is_pass_fail: editIsProject
                })
            });
            if (res.ok) {
                const updatedName = editName.trim();
                setSubjectsList(prev => prev.map(s => s._id === editTarget._id ? {
                    ...s,
                    name: updatedName,
                    subject_name: updatedName,
                    is_project: editIsProject,
                    is_pass_fail: editIsProject
                } : s));
                if (onSubjectUpdated) onSubjectUpdated();
                setEditModalOpen(false);
            } else {
                alert('საგნის განახლება ვერ მოხერხდა');
            }
        } catch (err) {
            alert('შეცდომა საგნის განახლებისას');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const classData: Class = {
            _id: selectedClassId,
            classname: classes.find(c => c._id === selectedClassId)?.classname || '',
            damrigebeli: tutorId,
            subjects: classSubjects,
        };
        onUpdateClass(classData);
    };

    return (
        <div className="admin-view-container animate-fade-in-down" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <form onSubmit={handleSubmit} className="admin-form-container animate-zoom-in" style={{ maxWidth: '850px', width: '100%' }}>
                <h2 className="admin-form-title">კლასის რედაქტირება</h2>

                <div className="admin-form-group">
                    <label className="admin-label">აირჩიეთ კლასი</label>
                    <select className="admin-select" value={selectedClassId} onChange={(e) => handleClassChange(e.target.value)}>
                        {classes.sort((a, b) => {
                            const aName = a?.classname || '';
                            const bName = b?.classname || '';
                            const aMatch = aName.match(/^([0-9]+)([ა-ჰ])$/);
                            const bMatch = bName.match(/^([0-9]+)([ა-ჰ])$/);
                            if (!aMatch || !bMatch) return aName.localeCompare(bName);
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
                        {classSubjects.map((cs, index) => {
                            const currentSubj = subjectsList.find(s => s._id === cs.subject_id);
                            return (
                                <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <select className="admin-select" value={cs.subject_id} onChange={(e) => handleSubjectChange(index, 'subject_id', e.target.value)} style={{ flex: 1 }}>
                                        <option value="">საგანი</option>
                                        {subjectsList?.map(s => {
                                            const isProj = Boolean(s.is_project || s.is_pass_fail || s.type === 'project' || /პროექტი|ჩათვლა|პროექტული/i.test(s.name || ''));
                                            return (
                                                <option key={s._id} value={s._id}>
                                                    {s.name || s.subject_name} {isProj ? '(🎯 ჩათვლა)' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>

                                    {currentSubj && (
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(currentSubj)}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                background: 'rgba(96, 165, 250, 0.2)',
                                                border: '1px solid rgba(96, 165, 250, 0.4)',
                                                color: '#60a5fa',
                                                fontWeight: 700,
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                            title="არჩეული საგნის სახელის ან შეფასების სისტემის ჩასწორება"
                                        >
                                            ✏️ ჩასწორება
                                        </button>
                                    )}

                                    <select className="admin-select" value={cs.teacher_id} onChange={(e) => handleSubjectChange(index, 'teacher_id', e.target.value)} style={{ flex: 1 }}>
                                        <option value="">მასწავლებელი</option>
                                        {teachers?.map(t => <option key={t._id} value={t._id}>{t.name} {t.surname}</option>)}
                                    </select>

                                    <button type="button" onClick={() => handleRemoveSubject(index)} className="admin-action-btn delete" style={{ width: '45px', height: '45px' }}>
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
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

            {/* Modal for editing subject details (name, is_project) */}
            {editModalOpen && editTarget && typeof window !== 'undefined' && createPortal(
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
                                onClick={() => setEditModalOpen(false)}
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
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
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
                                        onClick={() => setEditIsProject(false)}
                                        style={{
                                            flex: 1,
                                            padding: '10px 8px',
                                            borderRadius: '10px',
                                            border: !editIsProject ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.12)',
                                            background: !editIsProject ? 'rgba(96, 165, 250, 0.25)' : 'rgba(255,255,255,0.04)',
                                            color: !editIsProject ? '#60a5fa' : 'white',
                                            fontWeight: 800,
                                            fontSize: '13px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        📊 სტანდარტული (0-10)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditIsProject(true)}
                                        style={{
                                            flex: 1,
                                            padding: '10px 8px',
                                            borderRadius: '10px',
                                            border: editIsProject ? '2px solid #c084fc' : '1px solid rgba(255,255,255,0.12)',
                                            background: editIsProject ? 'rgba(192, 132, 252, 0.25)' : 'rgba(255,255,255,0.04)',
                                            color: editIsProject ? '#c084fc' : 'white',
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
                                    disabled={saving || !editName.trim()}
                                    style={{
                                        flex: 1,
                                        padding: '12px 18px',
                                        borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        border: 'none',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '14px',
                                        cursor: saving ? 'wait' : 'pointer',
                                        opacity: (!editName.trim() || saving) ? 0.6 : 1
                                    }}
                                >
                                    {saving ? 'ინახება...' : 'შენახვა'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    disabled={saving}
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

export default EditClassForm;