"use client";
import React, { useState } from 'react';
import { useColor } from '../ColorContext';

interface AddSubjectFormProps {
  onAddSubject: (subject: string, isProject: boolean) => void;
  onCancel: () => void;
  subjects: string[];
}

const AddSubjectForm: React.FC<AddSubjectFormProps> = ({ onAddSubject, onCancel, subjects: allSubjects }) => {
  const [subject, setSubject] = useState('');
  const [isProject, setIsProject] = useState(false);
  const { selectedColor } = useColor();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim()) {
      onAddSubject(subject.trim(), isProject);
      setSubject('');
      setIsProject(false);
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

        <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', marginBottom: '16px' }}>
          <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
            <input
              type="checkbox"
              checked={isProject}
              onChange={(e) => setIsProject(e.target.checked)}
              style={{ display: 'none' }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: isProject ? selectedColor : '#ccc',
              borderRadius: '24px',
              transition: '.4s'
            }}>
              <span style={{
                position: 'absolute',
                content: '""',
                height: '18px', width: '18px',
                left: isProject ? '25px' : '3px',
                bottom: '3px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '.4s'
              }}></span>
            </span>
          </label>
          <span style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>პროექტული (ჩათვლებიანი) საგანი</span>
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