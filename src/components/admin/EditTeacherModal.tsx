"use client";
import React, { useState, useEffect } from 'react';
import { useColor } from '../ColorContext';
import { IoMdClose } from 'react-icons/io';

const CloseIcon = IoMdClose as React.FC<{ size?: number | string }>;

interface Teacher {
    _id: string;
    name: string;
    surname: string;
    user_ID: string;
    ID?: string;
}

interface Class {
    _id: string;
    classname: string;
}

interface EditTeacherModalProps {
    isOpen: boolean;
    teacher: Teacher | null;
    classes: Class[];
    onClose: () => void;
    onSave: (teacher: Teacher) => void;
}

const EditTeacherModal: React.FC<EditTeacherModalProps> = ({ isOpen, teacher, classes, onClose, onSave }) => {
    const [formData, setFormData] = useState<Teacher | null>(null);
    const { selectedColor } = useColor();

    useEffect(() => {
        if (teacher) {
            const idVal = teacher.ID || teacher.user_ID || '';
            setFormData({
                _id: teacher._id,
                name: teacher.name,
                surname: teacher.surname,
                ID: idVal,
                user_ID: idVal,
            });
        }
    }, [teacher]);

    if (!isOpen || !formData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const idVal = formData.ID || formData.user_ID || '';
        onSave({
            _id: formData._id,
            name: formData.name,
            surname: formData.surname,
            ID: idVal,
            user_ID: idVal,
        } as Teacher);
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

                <h2 className="admin-form-title">მასწავლებლის რედაქტირება</h2>
                
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
                        <label className="admin-label">პირადი ნომერი / ID (პ/ნ)</label>
                        <input className="admin-input" type="text" name="ID" value={formData.ID || formData.user_ID || ''} onChange={handleChange} />
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

export default EditTeacherModal; 