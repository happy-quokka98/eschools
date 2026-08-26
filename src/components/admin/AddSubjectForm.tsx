"use client";
import React, { useState } from 'react';
import { useColor } from '../ColorContext';

interface AddSubjectFormProps {
  onAddSubject: (subject: string) => void;
  onCancel: () => void;
  subjects: string[];
}

const AddSubjectForm: React.FC<AddSubjectFormProps> = ({ onAddSubject, onCancel, subjects: allSubjects }) => {
  const [subject, setSubject] = useState('');
  const { selectedColor } = useColor();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim()) {
      onAddSubject(subject.trim());
      setSubject('');
    }
  };

  return (
    <div className="admin-view-container animate-fade-in-down" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <form onSubmit={handleSubmit} className="admin-form-container animate-zoom-in">
        <h2 className="admin-form-title">საგნის დამატება</h2>
        <div className="admin-form-group">
          <label className="admin-label">საგანი</label>
          <input
            className="admin-input"
            type="text"
            placeholder="შეიყვანეთ საგანი"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            list="subjects-datalist"
          />
          <datalist id="subjects-datalist">
            {allSubjects.map((s, index) => (
              <option key={index} value={s} />
            ))}
          </datalist>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button type="button" onClick={onCancel} className="admin-cancel-btn" style={{ flex: 1 }}>
            გაუქმება
          </button>
          <button type="submit" className="admin-submit-btn" style={{ background: selectedColor, margin: 0, flex: 1 }}>
            დამატება
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSubjectForm; 