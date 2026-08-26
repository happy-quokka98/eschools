"use client";
import React, { useState } from 'react';
import { useColor } from '../ColorContext';
import { IoArrowBack } from 'react-icons/io5';

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string }>;

interface AddTeacherFormProps {
    onAddTeacher: (e: React.FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
}

const AddTeacherForm: React.FC<AddTeacherFormProps> = ({ onAddTeacher, onCancel }) => {
    const { selectedColor } = useColor();

    return (
        <div className="admin-view-container animate-fade-in-down" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="admin-form-container animate-zoom-in">
                <h2 className="admin-form-title">მასწავლებლის დამატება</h2>
                <form onSubmit={onAddTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="admin-form-group">
                        <label className="admin-label">სახელი</label>
                        <input className="admin-input" type="text" name="name" placeholder="შეიყვანეთ სახელი" required />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-label">გვარი</label>
                        <input className="admin-input" type="text" name="surname" placeholder="შეიყვანეთ გვარი" required />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-label">მომხმარებლის ID (პ/ნ)</label>
                        <input className="admin-input" type="text" name="user_ID" placeholder="შეიყვანეთ პირადი ნომერი" required />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                        <button type="button" onClick={onCancel} className="admin-cancel-btn">
                            გაუქმება
                        </button>
                        <button type="submit" className="admin-submit-btn" style={{ background: selectedColor, margin: 0, width: 'auto', padding: '12px 30px' }}>
                            დამატება
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTeacherForm; 