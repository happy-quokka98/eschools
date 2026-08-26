"use client";
import React, { useState, useEffect } from 'react';
import { useColor } from '../ColorContext';
import { IoMdClose } from 'react-icons/io';

const CloseIcon = IoMdClose as React.FC<{ size?: number | string }>;

interface Student {
    _id: string;
    name: string;
    surname: string;
    user_ID: string;
    class_id?: string; // for direct class_id
    classInfo?: {
        _id?: string;
        classname: string;
    };
}

interface Class {
    _id:string;
    classname: string;
}

interface EditStudentModalProps {
    isOpen: boolean;
    student: Student | null;
    classes: Class[];
    onClose: () => void;
    onSave: (student: Student) => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ isOpen, student, classes, onClose, onSave }) => {
    const [formData, setFormData] = useState<Student | null>(null);
    const { selectedColor } = useColor();

    useEffect(() => {
        if (student) {
            setFormData({
                _id: student._id,
                name: student.name,
                surname: student.surname,
                user_ID: student.user_ID,
                class_id: student.class_id || student.classInfo?._id || "",
                classInfo: student.classInfo || undefined,
            });
        }
    }, [student]);

    if (!isOpen || !formData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'class_id') {
            const classInfo = classes.find(c => c._id === value);
            setFormData({ ...formData, class_id: value, classInfo: classInfo ? { _id: value, classname: classInfo.classname } : undefined });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            _id: formData._id,
            name: formData.name,
            surname: formData.surname,
            user_ID: formData.user_ID,
            class_id: formData.class_id,
            classInfo: formData.classInfo,
        } as Student);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="admin-form-container animate-zoom-in" style={{ position: 'relative', maxWidth: '500px' }}>
                <button 
                    onClick={onClose} 
                    style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.color = 'white'}
                    onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >
                    <CloseIcon size={24} />
                </button>
                
                <h2 className="admin-form-title">მოსწავლის რედაქტირება</h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="admin-form-group">
                        <label className="admin-label">სახელი</label>
                        <input className="admin-input" type="text" name="name" value={formData.name} onChange={handleChange} />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-label">გვარი</label>
                        <input className="admin-input" type="text" name="surname" value={formData.surname} onChange={handleChange} />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-label">პირადი ნომერი</label>
                        <input className="admin-input" type="text" name="user_ID" value={formData.user_ID} onChange={handleChange} />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-label">კლასი</label>
                        <select className="admin-select" name="class_id" value={formData.class_id || ''} onChange={handleChange}>
                            {classes.map(c => (
                                <option key={c._id} value={c._id}>{c.classname}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                        <button type="button" onClick={onClose} className="admin-cancel-btn">
                            გაუქმება
                        </button>
                        <button type="submit" className="admin-submit-btn" style={{ background: selectedColor, margin: 0, width: 'auto', padding: '12px 30px' }}>
                            შენახვა
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditStudentModal; 