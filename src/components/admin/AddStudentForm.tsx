import React from 'react';
import { IoArrowBack } from 'react-icons/io5';

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string }>;

interface Class {
    _id: string;
    classname: string;
}

interface AddStudentFormProps {
    onBackClick: () => void;
    onAddStudent: (e: React.FormEvent<HTMLFormElement>) => void;
    classes: Class[];
    selectedColor: string;
    logoutButtonStyle: React.CSSProperties;
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({
    onBackClick,
    onAddStudent,
    classes,
    selectedColor,
}) => {
    return (
        <div className="admin-view-container animate-fade-in-down" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <header className="admin-view-header">
                <button className="admin-back-btn" onClick={onBackClick}>
                    <ArrowLeftIcon size={20} /> უკან
                </button>
            </header>

            <div className="admin-form-container animate-zoom-in">
                <h2 className="admin-form-title">მოსწავლის დამატება</h2>
                <form onSubmit={onAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="admin-form-group">
                        <label className="admin-label">სახელი</label>
                        <input className="admin-input" id="name" name="name" type="text" placeholder="შეიყვანეთ სახელი" required />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-label">გვარი</label>
                        <input className="admin-input" id="surname" name="surname" type="text" placeholder="შეიყვანეთ გვარი" required />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-label">პირადი ნომერი</label>
                        <input className="admin-input" id="user_ID" name="user_ID" type="text" placeholder="შეიყვანეთ პირადი ნომერი" required />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-label">კლასი</label>
                        <select className="admin-select" id="class_id" name="class_id" required defaultValue="">
                            <option value="" disabled>აირჩიეთ კლასი</option>
                            {classes.map(c => (
                                <option key={c._id} value={c._id}>{c.classname}</option>
                            ))}
                        </select>
                    </div>
                    <button className="admin-submit-btn" type="submit" style={{ background: selectedColor }}>
                        მოსწავლის დამატება
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddStudentForm; 