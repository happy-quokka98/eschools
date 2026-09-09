"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useColor } from '../ColorContext';

interface Class {
    _id: string;
    classname: string;
    damrigebeli?: string;
    subjects?: { subject_id: string; teacher_id: string; hours_per_week?: number }[];
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

const NATIONAL_CURRICULUM_PRESETS: { [key: string]: { label: string; keywords: RegExp; hours: { [grade: number]: number } } } = {
    georgian: {
        label: 'ქართული ენა და ლიტერატურა',
        keywords: /ქართული|ლიტერატურა/i,
        hours: { 1: 8, 2: 7, 3: 6, 4: 6, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 5, 11: 5, 12: 5 }
    },
    math: {
        label: 'მათემატიკა',
        keywords: /მათემატიკა|ალგებრა|გეომეტრია/i,
        hours: { 1: 6, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 5, 11: 5, 12: 5 }
    },
    foreign1: {
        label: 'პირველი უცხოური ენა (ინგლისური)',
        keywords: /ინგლისური|პირველი უცხოური|უცხო ენა/i,
        hours: { 1: 2, 2: 2, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3 }
    },
    foreign2: {
        label: 'მეორე უცხოური ენა (რუსული / გერმანული / ფრანგული)',
        keywords: /რუსული|გერმანული|ფრანგული|მეორე უცხოური/i,
        hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
    },
    me_da_sazogadoeba: {
        label: 'მე და საზოგადოება',
        keywords: /მე და საზოგადოება/i,
        hours: { 1: 0, 2: 0, 3: 2, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
    },
    chveni_saqartvelo: {
        label: 'ჩვენი საქართველო',
        keywords: /ჩვენი საქართველო/i,
        hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 3, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
    },
    history_geo: {
        label: 'საქართველოს ისტორია',
        keywords: /საქართველოს ისტორია/i,
        hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 2, 9: 2, 10: 3, 11: 2, 12: 2 }
    },
    history_world: {
        label: 'მსოფლიოს ისტორია',
        keywords: /მსოფლიოს ისტორია/i,
        hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 2, 9: 2, 10: 0, 11: 2, 12: 2 }
    },
    history_general: {
        label: 'ისტორია',
        keywords: /ისტორია/i,
        hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3 }
    },
    geography: {
        label: 'გეოგრაფია',
        keywords: /გეოგრაფია/i,
        hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
    },
    civics: {
        label: 'მოქალაქეობა',
        keywords: /მოქალაქეობა|სამოქალაქო/i,
        hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
    },
    nature: {
        label: 'ბუნებისმეტყველება',
        keywords: /ბუნებისმეტყველება|ბუნება/i,
        hours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 3, 6: 3, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
    },
    biology: {
        label: 'ბიოლოგია',
        keywords: /ბიოლოგია/i,
        hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
    },
    physics: {
        label: 'ფიზიკა',
        keywords: /ფიზიკა/i,
        hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
    },
    chemistry: {
        label: 'ქიმია',
        keywords: /ქიმია/i,
        hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
    },
    ict: {
        label: 'კომპიუტერული ტექნოლოგიები (ისტ)',
        keywords: /კომპიუტერული|ისტ|ტექნოლოგიები/i,
        hours: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
    },
    art: {
        label: 'ხელოვნება (სახვითი)',
        keywords: /ხელოვნება|სახვითი/i,
        hours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 1, 11: 1, 12: 1 }
    },
    music: {
        label: 'მუსიკა',
        keywords: /მუსიკა/i,
        hours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 1, 11: 1, 12: 1 }
    },
    sport: {
        label: 'ფიზიკური აღზრდა და სპორტი',
        keywords: /სპორტი|ფიზიკური აღზრდა/i,
        hours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
    },
    chess: {
        label: 'ჭადრაკი',
        keywords: /ჭადრაკი/i,
        hours: { 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
    },
    religion: {
        label: 'საღვრთო სჯული',
        keywords: /საღვრთო|სჯული|რელიგია/i,
        hours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
    }
};

const getGradeNumber = (cls: any): number => {
    if (typeof cls?.grade === 'number' && cls.grade >= 1 && cls.grade <= 12) return cls.grade;
    const name = cls?.classname || cls?.name || '';
    const match = name.match(/^([0-9]+)/);
    if (match) return parseInt(match[1], 10);
    const romanMap: { [k: string]: number } = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
    const romanMatch = name.match(/^(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)/i);
    if (romanMatch) return romanMap[romanMatch[1].toUpperCase()] || 0;
    return 0;
};

const getAutoHoursForSubject = (
    subjId: string,
    subjName: string,
    selectedClass: any,
    existingHours?: number,
    forcePreset: boolean = false
): number => {
    if (!forcePreset && typeof existingHours === 'number') {
        return existingHours;
    }
    const grade = getGradeNumber(selectedClass);
    if (grade < 1 || grade > 12) return typeof existingHours === 'number' ? existingHours : 2;

    const cleanName = (subjName || '').trim();
    for (const preset of Object.values(NATIONAL_CURRICULUM_PRESETS)) {
        if (preset.keywords.test(cleanName)) {
            const presetHrs = preset.hours[grade];
            if (typeof presetHrs === 'number') return presetHrs;
        }
    }
    return typeof existingHours === 'number' ? existingHours : 2;
};

const EditClassForm: React.FC<EditClassFormProps> = ({ onUpdateClass, onCancel, classes, teachers, subjects: initialSubjects, onSubjectUpdated }) => {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [tutorId, setTutorId] = useState<string>('');
    const [classSubjects, setClassSubjects] = useState<{ subject_id: string; teacher_id: string; hours_per_week?: number }[]>([]);
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

    const normalizeClassSubjects = (cls: Class) => {
        const rawSubjects = cls.subjects || [];
        return rawSubjects.map((s: any) => {
            const foundSubj = subjectsList.find(sub => String(sub._id) === String(s.subject_id));
            const sName = foundSubj ? (foundSubj.name || foundSubj.subject_name || '') : ((s as any).name || (s as any).subject_name || '');
            const hrs = getAutoHoursForSubject(String(s.subject_id), sName, cls, s.hours_per_week, false);
            return {
                ...s,
                hours_per_week: hrs
            };
        });
    };

    useEffect(() => {
        if (classes.length > 0) {
            const targetClass = selectedClassId
                ? (classes.find(c => c._id === selectedClassId) || classes[0])
                : (classes.find(c => c.classname === '1ა') || classes[0]);

            if (targetClass) {
                if (selectedClassId !== targetClass._id) {
                    setSelectedClassId(targetClass._id);
                }
                setTutorId(targetClass.damrigebeli || '');
                setClassSubjects(normalizeClassSubjects(targetClass));
            }
        }
    }, [classes, subjectsList]);

    const handleClassChange = (classId: string) => {
        setSelectedClassId(classId);
        const selectedClass = classes.find(c => c._id === classId);
        if (selectedClass) {
            setTutorId(selectedClass.damrigebeli || '');
            setClassSubjects(normalizeClassSubjects(selectedClass));
        }
    };

    const handleApplyEsgHours = () => {
        const selectedClassObj = classes.find(c => c._id === selectedClassId);
        if (!selectedClassObj) return;
        const updated = classSubjects.map(cs => {
            const foundSubj = subjectsList.find(s => s._id === cs.subject_id);
            const sName = foundSubj ? (foundSubj.name || foundSubj.subject_name || '') : '';
            const autoHrs = getAutoHoursForSubject(cs.subject_id, sName, selectedClassObj, cs.hours_per_week, true);
            return {
                ...cs,
                hours_per_week: autoHrs
            };
        });
        setClassSubjects(updated);
    };

    const handleAddSubject = () => {
        setClassSubjects([...classSubjects, { subject_id: '', teacher_id: '', hours_per_week: 2 }]);
    };

    const handleSubjectChange = (index: number, field: 'subject_id' | 'teacher_id' | 'hours_per_week', value: any) => {
        const updatedSubjects = [...classSubjects];
        if (field === 'subject_id') {
            const selectedClassObj = classes.find(c => c._id === selectedClassId);
            const foundSubj = subjectsList.find(s => s._id === value);
            const sName = foundSubj ? (foundSubj.name || foundSubj.subject_name || '') : '';
            const autoHrs = getAutoHoursForSubject(value, sName, selectedClassObj, 0, true);

            updatedSubjects[index] = {
                ...updatedSubjects[index],
                subject_id: value,
                hours_per_week: autoHrs
            };
        } else {
            updatedSubjects[index] = { ...updatedSubjects[index], [field]: value };
        }
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '20px' }}>
                        <h3 className="admin-label" style={{ fontSize: '18px', margin: 0 }}>საგნები</h3>
                        <button
                            type="button"
                            onClick={handleApplyEsgHours}
                            style={{
                                fontSize: '12px',
                                color: '#ffffff',
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                border: '1px solid rgba(147, 197, 253, 0.4)',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)',
                                transition: 'all 0.2s ease'
                            }}
                            title="კლასის საგნების საათების ავტომატურად განახლება ესგ ბადის მიხედვით"
                        >
                            ⚡ ესგ ბადით საათების ავტომატური განახლება
                        </button>
                    </div>
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

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#eff6ff', padding: '6px 10px', borderRadius: '10px', border: '1px solid #bfdbfe' }} title="კვირეული საათები (ავტომატურად გაანგარიშებული ეროვნული სასწავლო გეგმით)">
                                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#1e40af' }}>საათები:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="15"
                                            value={cs.hours_per_week !== undefined ? cs.hours_per_week : 0}
                                            onChange={(e) => handleSubjectChange(index, 'hours_per_week', Math.max(0, Number(e.target.value)))}
                                            style={{ width: '45px', padding: '4px', borderRadius: '6px', border: '1px solid #93c5fd', fontWeight: 900, textAlign: 'center', color: '#1e3a8a', background: '#ffffff' }}
                                        />
                                    </div>

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