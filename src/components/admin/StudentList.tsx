import React, { useState } from 'react';
import { IoArrowBack, IoSearch } from 'react-icons/io5';
import { FaTrashAlt, FaEdit } from 'react-icons/fa';
import { MdRestorePage } from 'react-icons/md';

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string }>;
const SearchIcon = IoSearch as React.FC<{ size?: number | string; style?: React.CSSProperties }>;
const TrashIcon = FaTrashAlt as React.FC;
const RestoreIcon = MdRestorePage as React.FC;
const EditIcon = FaEdit as React.FC;

interface Student {
    _id: string;
    name: string;
    surname: string;
    user_ID: string;
    ID?: string;
    role?: string;
    image?: string;
    classInfo?: {
        _id?: string;
        ID?: string;
        classname: string;
    };
}

interface Class {
    _id: string;
    ID?: string;
    classname: string;
}

interface StudentListProps {
    students: Student[];
    classes: Class[];
    classFilter: number | null;
    parallelFilter: string | null;
    selectedColor: string;
    logoutButtonStyle: React.CSSProperties;
    onBackClick: () => void;
    onGradeClick: (grade: number | null) => void;
    onParallelFilterClick: (filter: string | null) => void;
    onDeleteStudent: (studentId: string) => void;
    onResetPassword: (studentId: string) => void;
    onEditStudent: (student: Student) => void;
    onViewStudentCard: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({
    students,
    classes,
    classFilter,
    parallelFilter,
    selectedColor,
    onBackClick,
    onGradeClick,
    onParallelFilterClick,
    onDeleteStudent,
    onResetPassword,
    onEditStudent,
    onViewStudentCard,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const getClassNameStr = (item: any): string => {
        if (!item) return '';
        if (typeof item === 'string') return item;
        return item.ID || item.classname || '';
    };

    // Extract available parallel letters for the selected grade filter
    const parallelLetters = Array.from(new Set(
        classes
            .filter(c => {
                const name = getClassNameStr(c);
                if (!name) return false;
                const match = name.match(/(\d+)/);
                return match && parseInt(match[1], 10) === classFilter;
            })
            .map(c => {
                const name = getClassNameStr(c);
                if (!name) return null;
                const match = name.match(/[ა-ჰa-zA-Z]/);
                return match ? match[0] : null;
            })
            .filter((l): l is string => Boolean(l))
    )).sort((a, b) => {
        const georgianOrder = 'აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ';
        const aIndex = georgianOrder.indexOf(a || '');
        const bIndex = georgianOrder.indexOf(b || '');
        return aIndex - bIndex;
    });

    // Filter students by grade if classFilter is set, otherwise include all students
    const studentsInGrade = classFilter === null
        ? students
        : students.filter(student => {
            const name = getClassNameStr(student?.classInfo);
            if (!name) return false;
            const match = name.match(/(\d+)/);
            if (!match) return false;
            const grade = parseInt(match[1], 10);
            return grade === classFilter;
        });

    // Filter by parallel letter if selected
    const filteredStudents = parallelFilter
        ? studentsInGrade.filter(student => {
            const name = getClassNameStr(student?.classInfo);
            if (!name) return false;
            const match = name.match(/[ა-ჰa-zA-Z]/);
            return match && match[0] === parallelFilter;
        })
        : studentsInGrade;

    // Apply manual search filter
    const finalFilteredStudents = filteredStudents.filter(student => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        const name = (student.name || '').toLowerCase();
        const surname = (student.surname || '').toLowerCase();
        const fullName = `${name} ${surname}`;
        const id = (student.ID || student.user_ID || '').toLowerCase();
        const classNameStr = getClassNameStr(student.classInfo).toLowerCase();
        return fullName.includes(query) || name.includes(query) || surname.includes(query) || id.includes(query) || classNameStr.includes(query);
    });

    // Build unique list of numeric grades present in classes, with default 1..12 fallback
    const parsedGrades = Array.from(new Set(
        classes
            .map(c => {
                const name = getClassNameStr(c);
                if (!name) return null;
                const match = name.match(/(\d+)/);
                return match ? parseInt(match[1], 10) : null;
            })
            .filter((g): g is number => g !== null)
    )).sort((a, b) => a - b);

    const grades = parsedGrades.length > 0 ? parsedGrades : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    const getActiveStyle = (active: boolean) => {
        return active
            ? {
                background: `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)`,
                boxShadow: `0 4px 15px ${selectedColor}4D`,
                borderColor: `${selectedColor}aa`,
              }
            : {};
    };

    return (
        <div className="admin-view-container animate-fade-in-down" style={{ width: '100%', maxWidth: '1200px' }}>
            <header className="admin-view-header">
                <button className="admin-back-btn" onClick={onBackClick}>
                    <ArrowLeftIcon size={20} /> უკან
                </button>
                <h2 className="admin-view-title">მოსწავლეთა სია ({finalFilteredStudents.length})</h2>
            </header>

            {/* Manual Search Bar */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                    <SearchIcon style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                    <input
                        type="text"
                        placeholder="ძებნა ხელით (სახელი, გვარი, პ/ნ, კლასი)..."
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

            {/* Grade Filters */}
            <div style={{ marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                <button 
                    onClick={() => onGradeClick(null)} 
                    className={`admin-filter-btn ${classFilter === null ? 'active' : ''}`}
                    style={getActiveStyle(classFilter === null)}
                >
                    ყველა
                </button>
                {grades.map(grade => (
                    <button 
                        key={grade} 
                        onClick={() => onGradeClick(grade)} 
                        className={`admin-filter-btn ${classFilter === grade ? 'active' : ''}`}
                        style={getActiveStyle(classFilter === grade)}
                    >
                        {grade}
                    </button>
                ))}
            </div>

            {/* Parallel Filters */}
            {classFilter !== null && parallelLetters.length > 0 && (
                <div className="animate-zoom-in" style={{ marginBottom: '30px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                    <button 
                        onClick={() => onParallelFilterClick(null)} 
                        className={`admin-filter-btn ${parallelFilter === null ? 'active' : ''}`}
                        style={getActiveStyle(parallelFilter === null)}
                    >
                        ყველა
                    </button>
                    {parallelLetters.map(pLetter => (
                        <button 
                            key={pLetter} 
                            onClick={() => onParallelFilterClick(pLetter as string)} 
                            className={`admin-filter-btn ${parallelFilter === pLetter ? 'active' : ''}`}
                            style={getActiveStyle(parallelFilter === pLetter)}
                        >
                            {pLetter}
                        </button>
                    ))}
                </div>
            )}

            {/* Student Table */}
            <div className="admin-list-container animate-zoom-in">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>სახელი</th>
                            <th>გვარი</th>
                            <th>პ/ნ</th>
                            <th>კლასი</th>
                            <th style={{ textAlign: 'center' }}>ქმედება</th>
                        </tr>
                    </thead>
                    <tbody>
                        {finalFilteredStudents.length > 0 ? finalFilteredStudents.map((student) => (
                            <tr key={student._id}>
                                <td>{student.name}</td>
                                <td>{student.surname}</td>
                                <td>{student.ID || student.user_ID}</td>
                                <td>{getClassNameStr(student.classInfo) || 'N/A'}</td>
                                <td>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                                        <button 
                                            className="admin-table-action-btn"
                                            onClick={() => onViewStudentCard(student)} 
                                            style={{ 
                                                background: `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)`, 
                                                boxShadow: `0 4px 12px ${selectedColor}3D`
                                            }} 
                                            title="მოსწავლის ქარდი"
                                        >
                                            ქარდი
                                        </button>
                                        <button className="admin-action-btn edit" onClick={() => onEditStudent(student)} title="რედაქტირება">
                                            <EditIcon />
                                        </button>
                                        <button className="admin-action-btn delete" onClick={() => onDeleteStudent(student._id)} title="წაშლა">
                                            <TrashIcon />
                                        </button>
                                        <button className="admin-action-btn reset" onClick={() => onResetPassword(student._id)} title="აღდგენა">
                                            <RestoreIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                                    მოსწავლე ვერ მოიძებნა
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentList;