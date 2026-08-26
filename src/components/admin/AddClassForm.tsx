"use client";
import React, { useState } from 'react';
import { useColor } from '../ColorContext';

interface AddClassFormProps {
  onAddClass: (className: string) => void;
  onCancel: () => void;
}

const AddClassForm: React.FC<AddClassFormProps> = ({ onAddClass, onCancel }) => {
  const [className, setClassName] = useState('');
  const { selectedColor } = useColor();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (className.trim()) {
      onAddClass(className.trim());
      setClassName('');
    }
  };

  return (
    <div className="admin-view-container animate-fade-in-down" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <form onSubmit={handleSubmit} className="admin-form-container animate-zoom-in">
        <h2 className="admin-form-title">კლასის დამატება</h2>
        <div className="admin-form-group">
          <label className="admin-label">კლასის სახელი</label>
          <input
            className="admin-input"
            type="text"
            placeholder="მაგ: 10-A"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
          />
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

export default AddClassForm; 