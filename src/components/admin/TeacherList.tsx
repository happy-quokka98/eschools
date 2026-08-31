import React, { useState } from 'react';
import { IoArrowBack, IoSearch } from 'react-icons/io5';
import { FaTrashAlt, FaEdit } from 'react-icons/fa';
import { MdRestorePage } from 'react-icons/md';

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string }>;
const SearchIcon = IoSearch as React.FC<{ size?: number | string; style?: React.CSSProperties }>;
const TrashIcon = FaTrashAlt as React.FC;
const EditIcon = FaEdit as React.FC;
const RestoreIcon = MdRestorePage as React.FC;

interface Teacher {
    _id: string;
    name: string;
    surname: string;
    user_ID: string;
    ID?: string;
}

interface TeacherListProps {
    teachers: Teacher[];
    selectedColor: string;
    logoutButtonStyle: React.CSSProperties;
    onBackClick: () => void;
    onDeleteTeacher: (teacherId: string) => void;
    onEditTeacher: (teacher: Teacher) => void;
    onResetPassword: (teacherId: string) => void;
}

const TeacherList: React.FC<TeacherListProps> = ({
    teachers,
    selectedColor,
    onBackClick,
    onDeleteTeacher,
    onEditTeacher,
    onResetPassword,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTeachers = teachers.filter((teacher) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        const name = (teacher.name || '').toLowerCase();
        const surname = (teacher.surname || '').toLowerCase();
        const fullName = `${name} ${surname}`;
        const id = (teacher.ID || teacher.user_ID || '').toLowerCase();
        return fullName.includes(query) || name.includes(query) || surname.includes(query) || id.includes(query);
    });

    return (
        <div className="admin-view-container animate-fade-in-down">
            <header className="admin-view-header">
                <button className="admin-back-btn" onClick={onBackClick}>
                    <ArrowLeftIcon size={20} /> უკან
                </button>
                <h2 className="admin-view-title">მასწავლებელთა სია ({filteredTeachers.length})</h2>
            </header>

            {/* Manual Search Bar */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
                    <SearchIcon style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                    <input
                        type="text"
                        placeholder="ძებნა ხელით (სახელი, გვარი, პ/ნ)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px 12px 42px',
                            borderRadius: '14px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#0f172a',
                            fontSize: '14px',
                            fontWeight: '600',
                            outline: 'none',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                        }}
                    />
                </div>
            </div>

            <div className="admin-list-container animate-zoom-in">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>სახელი</th>
                            <th>გვარი</th>
                            <th>პ/ნ</th>
                            <th style={{ textAlign: 'center' }}>ქმედება</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teachers.length > 0 ? teachers.map((teacher) => (
                            <tr key={teacher._id}>
                                <td>{teacher.name}</td>
                                <td>{teacher.surname}</td>
                                <td>{teacher.ID || teacher.user_ID}</td>
                                <td>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                        <button 
                                            className="admin-action-btn edit" 
                                            onClick={() => onEditTeacher(teacher)} 
                                            title="რედაქტირება"
                                        >
                                            <EditIcon />
                                        </button>
                                        <button 
                                            className="admin-action-btn delete" 
                                            onClick={() => onDeleteTeacher(teacher._id)} 
                                            title="წაშლა"
                                        >
                                            <TrashIcon />
                                        </button>
                                        <button 
                                            className="admin-action-btn reset" 
                                            onClick={() => onResetPassword(teacher._id)} 
                                            title="აღდგენა"
                                        >
                                            <RestoreIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                                    მასწავლებელი ვერ მოიძებნა
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeacherList; 