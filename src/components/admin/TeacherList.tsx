import React from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { FaTrashAlt, FaEdit } from 'react-icons/fa';
import { MdRestorePage } from 'react-icons/md';

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string }>;
const TrashIcon = FaTrashAlt as React.FC;
const EditIcon = FaEdit as React.FC;
const RestoreIcon = MdRestorePage as React.FC;

interface Teacher {
    _id: string;
    name: string;
    surname: string;
    user_ID: string;
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
    return (
        <div className="admin-view-container animate-fade-in-down">
            <header className="admin-view-header">
                <button className="admin-back-btn" onClick={onBackClick}>
                    <ArrowLeftIcon size={20} /> უკან
                </button>
                <h2 className="admin-view-title">მასწავლებელთა სია</h2>
            </header>

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
                                <td>{teacher.user_ID}</td>
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