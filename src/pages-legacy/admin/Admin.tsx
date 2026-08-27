"use client";
import React, { useState, useEffect, FormEvent } from 'react';
import { FaUserGraduate, FaChalkboardTeacher, FaHistory, FaBookOpen, FaBookReader, FaCalendarAlt, FaFileAlt, FaSearch, FaBullhorn, FaComments } from "react-icons/fa";
import { MdEdit, MdAdd, MdOutlineWarningAmber } from "react-icons/md";
import { IoStatsChartSharp, IoLockClosedSharp } from "react-icons/io5";
import { GoPlus } from "react-icons/go";
import { IconType } from 'react-icons';
import { useColor } from './../../components/ColorContext';
import ColorPalette from './../../components/ColorPalette';
import { useNavigate } from 'react-router-dom';
import { IoSchoolSharp } from "react-icons/io5";
import { FaArrowLeftLong } from "react-icons/fa6";
import AddStudentForm from '../../components/admin/AddStudentForm';
import StudentList from '../../components/admin/StudentList';
import AdminDashboard from '../../components/admin/AdminDashboard';
import AddAdminForm from '../../components/admin/AddAdminForm';
import AdminList, { AdminUser } from '../../components/admin/AdminList';
import { RiAdminFill } from "react-icons/ri";
import MessagePopup from '../../components/MessagePopup';
import ConfirmationModal from '../../components/ConfirmationModal';
import EditStudentModal from '../../components/admin/EditStudentModal';
import TeacherList from '../../components/admin/TeacherList';
import EditTeacherModal from '../../components/admin/EditTeacherModal';
import AddTeacherForm from '../../components/admin/AddTeacherForm';
import AddClassForm from '../../components/admin/AddClassForm';
import AddSubjectForm from '../../components/admin/AddSubjectForm';
import EditClassForm from '../../components/admin/EditClassForm';
import AdminCalendarManager from '../../components/admin/AdminCalendarManager';
import DetailedGradeHistory from '../../components/admin/DetailedGradeHistory';
import SubjectList from '../../components/admin/SubjectList';
import ExternalsMarkInput from '../../components/admin/ExternalsMarkInput';
import ReportGenerator from '../../components/admin/ReportGenerator';
import ReportClassSelector from '../../components/admin/ReportClassSelector';
import StudentCard from '../../components/admin/StudentCard';
import NoticeBoard from '../../components/NoticeBoard';
import ChatModule from '../../components/ChatModule';
import ExamsManager from '../../components/admin/ExamsManager';
import MandaturiInfractionManager from '../../components/admin/MandaturiInfractionManager';
import TopStudentsMonitor from '../../components/admin/TopStudentsMonitor';
import HomeworkModule from '../../components/HomeworkModule';

import { FaShieldAlt, FaAward, FaCheckDouble, FaTasks } from 'react-icons/fa';
import './Admin.css';

const ArrowLeftIcon = FaArrowLeftLong as React.FC<{ size?: number | string }>;


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

interface Teacher {
    _id: string;
    name: string;
    surname: string;
    user_ID: string;
    ID?: string;
}

interface Subject {
    _id: string;
    name: string;
    subject_name?: string;
}

interface Class {
    _id: string;
    ID?: string;
    classname: string;
    damrigebeli?: string;
    subjects?: { subject_id: string; teacher_id: string }[];
}

const Admin: React.FC = () => {
    const { selectedColor } = useColor();
    const navigate = useNavigate();
    const logoutButtonStyle: React.CSSProperties = {};

    const [boxWidth, setBoxWidth] = useState(350);
    const [view, setView] = useState('main'); // 'main', 'studentOptions', 'studentList', 'addStudentForm', 'teacherList', 'addTeacherForm', 'teacherOptions', 'addClassForm', 'addSubjectForm', 'editClass', 'classHistoryGrades', 'classHistoryParallels', 'classHistoryTable', 'manageCalendars', 'detailedGradeHistory', 'subjectList'
    const [currentUser, setCurrentUser] = useState<{ user_ID: string; role: string; name?: string; surname?: string } | null>(null);
    const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);

    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classFilter, setClassFilter] = useState<number | null>(null);
    const [parallelFilter, setParallelFilter] = useState<string | null>(null);
    const [popup, setPopup] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [confirmation, setConfirmation] = useState<{ message: string; onConfirm: () => void; } | null>(null);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [isEditTeacherModalOpen, setIsEditTeacherModalOpen] = useState(false);
    const [classHistory, setClassHistory] = useState<{ classname: string; tutorName: string; studentCount: number; }[]>([]);
    const [selectedHistoryGrade, setSelectedHistoryGrade] = useState<number | null>(null);
    const [selectedHistoryParallel, setSelectedHistoryParallel] = useState<string | null>(null);
    const [historyParallels, setHistoryParallels] = useState<string[]>([]);
    const [historyParallelTutors, setHistoryParallelTutors] = useState<{ [parallel: string]: string }>({});
    const [historyParallelCounts, setHistoryParallelCounts] = useState<{ [parallel: string]: number }>({});
    const [historyTable, setHistoryTable] = useState<{ classname: string; tutorName: string; studentCount: number; }[]>([]);
    const [journalTeachers, setJournalTeachers] = useState<any[]>([]);
    const [loadingJournal, setLoadingJournal] = useState(false);
    const [updatingTeacherId, setUpdatingTeacherId] = useState<string | null>(null);
    const [customDates, setCustomDates] = useState<{ [teacherId: string]: string }>({});
    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
    const [selectedClassForHistory, setSelectedClassForHistory] = useState<{ id: string; name: string } | null>(null);
    const [selectedSubjectForHistory, setSelectedSubjectForHistory] = useState<{ id: string; name: string } | null>(null);
    const [selectedClassForExternals, setSelectedClassForExternals] = useState<{ id: string; name: string } | null>(null);
    const [selectedClassForReport, setSelectedClassForReport] = useState<{ id: string; name: string } | null>(null);
    const [showReportGenerator, setShowReportGenerator] = useState(false);
    const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
    const [selectedHistoryYear, setSelectedHistoryYear] = useState<string>('');

    const getPromotionAcademicYear = (date = new Date()) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        let startYear = month >= 9 ? year : year - 1;
        let endYear = startYear + 1;
        return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
    };

    const getAvailableHistoryYears = () => {
        const years = [getPromotionAcademicYear(new Date())];
        classes.forEach(c => {
            if ((c as any).history) {
                (c as any).history.forEach((h: any) => {
                    if (h.year && !years.includes(h.year)) {
                        years.push(h.year);
                    }
                });
            }
        });
        return years.sort().reverse();
    };

    const showPopup = (message: string, type: 'success' | 'error') => {
        setPopup({ message, type });
    };

    const fetchAllSubjects = async () => {
        try {
            const res = await fetch('/api/subjects');
            if (res.ok) {
                const data = await res.json();
                setSubjects(data);
            } else {
                console.error('Failed to fetch subjects.');
            }
        } catch (err) {
            console.error('Error fetching subjects:', err);
        }
    };

    const fetchAllClasses = async () => {
        try {
            const res = await fetch('/api/classes');
            if (res.ok) {
                const data = await res.json();
                setClasses(data);
            } else {
                console.error('Failed to fetch classes.');
            }
        } catch (err) {
            console.error('Error fetching classes:', err);
        }
    };

    const fetchClassHistory = async () => {
        try {
            const [classRes, teacherRes, studentRes] = await Promise.all([
                fetch('/api/classes'),
                fetch('/api/teacher/all'),
                fetch('/api/student/all')
            ]);
            if (!classRes.ok || !teacherRes.ok || !studentRes.ok) throw new Error('Failed to fetch data');

            const [classData, teacherData, studentData] = await Promise.all([
                classRes.json(),
                teacherRes.json(),
                studentRes.json()
            ]);

            // Build the class history array
            const history = classData.map((cls: any) => {
                let tutorName = '';
                if (cls.damrigebeli) {
                    const tutor = teacherData.find((t: any) => t._id === cls.damrigebeli);
                    tutorName = tutor ? `${tutor.name} ${tutor.surname}` : '';
                }
                const studentCount = studentData.filter((s: any) => s.classInfo && s.classInfo.classname === cls.classname).length;
                return {
                    classname: cls.classname,
                    tutorName,
                    studentCount,
                };
            });
            setClassHistory(history);
        } catch (err) {
            setClassHistory([]);
        }
    };

    const fetchClassHistoryParallels = async (grade: number, year?: string) => {
        try {
            const [classRes, teacherRes, studentRes] = await Promise.all([
                fetch('/api/classes'),
                fetch('/api/teacher/all'),
                fetch(`/api/student/grade/${grade}`)
            ]);
            if (!classRes.ok || !teacherRes.ok || !studentRes.ok) throw new Error('Failed to fetch data');

            const [classData, teacherData, studentData] = await Promise.all([
                classRes.json(),
                teacherRes.json(),
                studentRes.json()
            ]);

            // Extract parallels, tutor names, and student counts for the selected grade
            const parallels: string[] = [];
            const parallelTutors: { [parallel: string]: string } = {};
            const parallelCounts: { [parallel: string]: number } = {};
            classData.forEach((cls: any) => {
                let classname = cls.classname;
                if (year) {
                    const h = cls.history?.find((x: any) => x.year === year);
                    if (h) {
                        classname = h.classname;
                    } else {
                        return; // Class did not exist in this year
                    }
                }
                const match = classname.match(/^([0-9]+)([ა-ჰ])$/);
                if (match && parseInt(match[1], 10) === grade) {
                    const parallel = match[2];
                    if (!parallels.includes(parallel)) {
                        parallels.push(parallel);
                    }
                    let tutorName = '';
                    if (cls.damrigebeli) {
                        const tutor = teacherData.find((t: any) => t._id === cls.damrigebeli);
                        tutorName = tutor ? `${tutor.name} ${tutor.surname}` : '';
                    }
                    parallelTutors[parallel] = tutorName;
                    // Count students in this class
                    const studentCount = studentData.filter((s: any) => s.classInfo && s.classInfo.classname === classname).length;
                    parallelCounts[parallel] = studentCount;
                }
            });
            setHistoryParallels(parallels);
            setHistoryParallelTutors(parallelTutors);
            setHistoryParallelCounts(parallelCounts);
        } catch (err) {
            setHistoryParallels([]);
            setHistoryParallelTutors({});
            setHistoryParallelCounts({});
        }
    };

    const fetchClassHistoryTable = async (grade: number, parallel: string, year?: string) => {
        try {
            // Fetch all classes
            const classRes = await fetch('/api/classes');
            if (!classRes.ok) throw new Error('Failed to fetch classes');
            const classData = await classRes.json();
            
            // Find the class for this grade and parallel in the given year
            const targetClassName = `${grade}${parallel}`;
            const classObj = classData.find((cls: any) => {
                if (!year) {
                    return cls.classname === targetClassName;
                } else {
                    const historyEntry = cls.history?.find((h: any) => h.year === year);
                    return historyEntry && historyEntry.classname === targetClassName;
                }
            });
            if (!classObj) {
                setHistoryTable([]);
                return;
            }
            // Fetch all teachers (for tutor names)
            const teacherRes = await fetch('/api/teacher/all');
            if (!teacherRes.ok) throw new Error('Failed to fetch teachers');
            const teacherData = await teacherRes.json();
            // Fetch only students in this specific grade+parallel
            const studentRes = await fetch(`/api/student/grade/${grade}?parallel=${encodeURIComponent(parallel)}`);
            if (!studentRes.ok) throw new Error('Failed to fetch students');
            const studentData = await studentRes.json();
            // Find tutor name
            let tutorName = '';
            if (classObj.damrigebeli) {
                const tutor = teacherData.find((t: any) => t._id === classObj.damrigebeli);
                tutorName = tutor ? `${tutor.name} ${tutor.surname}` : '';
            }
            // Count students in this class
            const studentCount = studentData.length;
            setHistoryTable([{ classname: targetClassName, tutorName, studentCount }]);
        } catch (err) {
            setHistoryTable([]);
        }
    };

    const fetchJournalTeachers = async () => {
        setLoadingJournal(true);
        // Mock API: fetch all teachers and add a mock gradeEntryStartDate
        const res = await fetch('/api/teacher/all');
        if (!res.ok) return setLoadingJournal(false);
        const teachers = await res.json();
        // For demo, use a random or today-13 days as gradeEntryStartDate
        const today = new Date();
        const defaultStart = new Date(today);
        defaultStart.setDate(today.getDate() - 13);
        setJournalTeachers(teachers.map((t: any) => ({
            ...t,
            gradeEntryStartDate: t.gradeEntryStartDate || defaultStart.toISOString().split('T')[0],
        })));
        setLoadingJournal(false);
    };

    const handleSetDefaultStartDate = async (teacherId: string) => {
        setUpdatingTeacherId(teacherId);
        // Set gradeEntryStartDate to today-13 days
        const today = new Date();
        const defaultStart = new Date(today);
        defaultStart.setDate(today.getDate() - 13);
        const defaultDate = defaultStart.toISOString().split('T')[0];
        try {
            const res = await fetch('/api/teacher/set-grade-entry-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacherId, date: defaultDate }),
            });
            const data = await res.json();
            if (res.ok) {
                setJournalTeachers(prev => prev.map(t => t._id === teacherId ? { ...t, gradeEntryStartDate: defaultDate } : t));
                showPopup('თარიღი წარმატებით განახლდა', 'success');
            } else {
                showPopup(data.message || 'შეცდომა მოხდა', 'error');
            }
        } catch (err) {
            showPopup('სერვერთან დაკავშირება ვერ მოხერხდა', 'error');
        }
        setUpdatingTeacherId(null);
    };

    const handleCustomDateChange = (teacherId: string, value: string) => {
        setCustomDates(prev => ({ ...prev, [teacherId]: value }));
    };

    const handleSaveCustomDate = async (teacherId: string) => {
        setUpdatingTeacherId(teacherId);
        const newDate = customDates[teacherId];
        try {
            const res = await fetch('/api/teacher/set-grade-entry-date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacherId, date: newDate }),
            });
            const data = await res.json();
            if (res.ok) {
                setJournalTeachers(prev => prev.map(t => t._id === teacherId ? { ...t, gradeEntryStartDate: newDate } : t));
                showPopup('თარიღი წარმატებით განახლდა', 'success');
            } else {
                showPopup(data.message || 'შეცდომა მოხდა', 'error');
            }
        } catch (err) {
            showPopup('სერვერთან დაკავშირება ვერ მოხერხდა', 'error');
        }
        setUpdatingTeacherId(null);
    };

    const handleJournalOpenClose = () => {
        setIsJournalModalOpen(true);
    };

    const handleJournalAction = async (action: 'semester' | 'year' | 'close') => {
        setIsJournalModalOpen(false);
        let newDate = '';
        const today = new Date();
        let targetDate = '';
        if (action === 'semester') {
            const month = today.getMonth() + 1;
            const year = today.getFullYear();
            if (month >= 9 && month <= 12) {
                // September-December: 15 September
                targetDate = `${year}-09-15`;
            } else if (month >= 1 && month <= 6) {
                // January-June: 15 January
                targetDate = `${year}-01-15`;
            } else {
                showPopup('სემესტრის გახსნა შესაძლებელია მხოლოდ სექტემბერი-დეკემბერი ან იანვარი-ივნისი.', 'error');
                return;
            }
            newDate = targetDate;
        } else if (action === 'year') {
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            if (month >= 9 && month <= 12) {
                newDate = `${year}-09-15`;
            } else if (month >= 1 && month <= 6) {
                newDate = `${year - 1}-09-15`;
            } else {
                showPopup('წელიწადის გახსნა შესაძლებელია მხოლოდ სექტემბერი-დეკემბერი ან იანვარი-ივნისი.', 'error');
                return;
            }
        } else if (action === 'close') {
            newDate = '';
        }
        // Update all teachers
        setUpdatingTeacherId('all');
        let successCount = 0;
        let errorCount = 0;
        for (const t of journalTeachers) {
            try {
                const res = await fetch('/api/teacher/set-grade-entry-date', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teacherId: t._id, date: newDate }),
                });
                if (res.ok) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch {
                errorCount++;
            }
        }
        setUpdatingTeacherId(null);
        // Refetch teachers to update UI and enforce new date restrictions
        await fetchJournalTeachers();
        if (successCount > 0 && errorCount === 0) {
            showPopup('ყველა მასწავლებლის თარიღი წარმატებით განახლდა', 'success');
            setJournalTeachers(prev => prev.map(t => ({ ...t, gradeEntryStartDate: newDate })));
        } else if (successCount > 0) {
            showPopup(`ნაწილობრივ განახლდა: წარმატებით: ${successCount}, შეცდომა: ${errorCount}`, 'error');
            setJournalTeachers(prev => prev.map(t => ({ ...t, gradeEntryStartDate: newDate })));
        } else {
            showPopup('შეცდომა: თარიღები ვერ განახლდა!', 'error');
        }
    };

    useEffect(() => {
        fetchAllClasses();
        fetchAllSubjects();
        fetchTeachers();
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 480) {
                setBoxWidth(window.innerWidth - 40);
            } else if (window.innerWidth < 768) {
                setBoxWidth(250);
            } else {
                setBoxWidth(350);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const AdminContainer: React.CSSProperties = {
        width: '100%',
        minHeight: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '20px',
        textTransform: 'uppercase',
        fontWeight: '700',
        color: 'white',
        boxSizing: 'border-box',
        position: 'relative',
        padding: '60px 16px 20px',
    };



    const BoxTitle = (): React.CSSProperties => ({
        fontSize: 'clamp(18px, 4vw, 24px)',
        textAlign: 'center',
    });

    const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.user_ID === 'kakhi-kakhidze';

    const dashboardItems = [
        ...(isSuperAdmin ? [{ icon: RiAdminFill, label: 'ადმინისტრატორები' }] : []),
        { icon: FaUserGraduate, label: 'მოსწავლეები' },
        { icon: FaChalkboardTeacher, label: 'მასწავლებლები' },

        { icon: IoSchoolSharp, label: 'კლასი' },
        { icon: FaHistory, label: 'ისტორია' },
        { icon: IoStatsChartSharp, label: 'სტატისტიკა' },
        { icon: FaBookReader, label: 'გამოცდები & ექსტერნატი' },
        { icon: FaShieldAlt, label: 'მანდატურის დარღვევები' },
        { icon: FaAward, label: 'წარჩინებულნი & მონიტორინგი' },
        { icon: FaFileAlt, label: 'უწყისი' },
        { icon: FaBookOpen, label: 'ჟურნალის გახსნა/დახურვა' },
        { icon: FaCalendarAlt, label: 'გაკვეთილების კალენდარი' },
        { icon: FaSearch, label: 'დღის სკანირება' },
        { icon: FaBullhorn, label: 'განცხადებები' },
        { icon: FaComments, label: 'ჩატი' },
    ];

    const adminItems: { icon: IconType; label: string }[] = [
        { icon: MdAdd, label: 'ადმინისტრატორის დამატება' },
        { icon: RiAdminFill, label: 'ადმინისტრატორების სია' },
    ];

    const classItems: { icon: IconType; label: string }[] = [
        { icon: IoSchoolSharp, label: 'კლასის დამატება' },
        { icon: FaBookReader, label: 'საგნის დამატება' },
        { icon: MdEdit, label: 'კლასის რედაქტირება' },
        { icon: FaHistory, label: 'კლასების გადაწევა' },
    ];

    const studentItems: { icon: IconType; label: string }[] = [
        { icon: MdAdd, label: 'მოსწავლის დამატება' },
        { icon: FaUserGraduate, label: 'მოსწავლეთა სია' },
    ];

    const teacherItems: { icon: IconType; label: string }[] = [
        { icon: MdAdd, label: 'მასწავლებლის დამატება' },
        { icon: FaChalkboardTeacher, label: 'მასწავლებლების სია' },
    ];

    useEffect(() => {
        try {
            const loginDataStr = localStorage.getItem('login');
            if (!loginDataStr) {
                navigate('/', { replace: true });
                return;
            }
            const loginData = JSON.parse(loginDataStr);
            if (loginData.role !== 'admin' && loginData.role !== 'superadmin') {
                navigate(loginData.role ? `/${loginData.role}` : '/', { replace: true });
                return;
            }
            setCurrentUser(loginData);
        } catch {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    const fetchAdmins = async () => {
        try {
            const res = await fetch('/api/admin/all');
            if (res.ok) {
                const data = await res.json();
                setAdminsList(data);
            } else {
                showPopup('ადმინისტრატორების სიის ჩატვირთვა ვერ მოხერხდა.', 'error');
            }
        } catch {
            showPopup('ადმინისტრატორების სიის ჩატვირთვისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleAddAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const adminData = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/admin/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...adminData, requesterId: currentUser?.user_ID }),
            });

            if (res.ok) {
                showPopup('ადმინისტრატორი წარმატებით დაემატა.', 'success');
                setView('adminOptions');
                fetchAdmins();
            } else {
                const data = await res.json();
                showPopup(`ადმინისტრატორის დამატება ვერ მოხერხდა: ${data.message}`, 'error');
            }
        } catch {
            showPopup('ადმინისტრატორის დამატებისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('login');
        localStorage.removeItem('authToken');
        navigate('/', { replace: true });
    };

    const handleDeleteStudent = async (studentId: string) => {
        const performDelete = async () => {
            try {
                const res = await fetch(`/api/student/delete/${studentId}`, { method: 'DELETE' });
                if (res.ok) {
                    showPopup('მოსწავლე წარმატებით წაიშალა.', 'success');
                    if (classFilter) fetchStudents(classFilter, parallelFilter);
                } else {
                    showPopup('მოსწავლის წაშლა ვერ მოხერხდა.', 'error');
                }
            } catch (err) {
                showPopup('მოსწავლის წაშლისას მოხდა შეცდომა.', 'error');
            }
            setConfirmation(null);
        };

        setConfirmation({
            message: 'დარწმუნებული ხართ, რომ გსურთ ამ მოსწავლის წაშლა?',
            onConfirm: performDelete,
        });
    };

    const handleResetPassword = async (studentId: string) => {
        const performReset = async () => {
            try {
                const res = await fetch('/api/student/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: studentId }),
                });
                if (res.ok) {
                    showPopup('პაროლი წარმატებით აღდგა.', 'success');
                } else {
                    const data = await res.json();
                    showPopup(`პაროლის აღდგენა ვერ მოხერხდა: ${data.message}`, 'error');
                }
            } catch (err) {
                showPopup('პაროლის აღდგენისას მოხდა შეცდომა.', 'error');
            }
            setConfirmation(null);
        };

        setConfirmation({
            message: 'დარწმუნებული ხართ, რომ გსურთ ამ მოსწავლის პაროლის აღდგენა?',
            onConfirm: performReset,
        });
    };

    const handleEditStudent = (student: Student) => {
        setEditingStudent(student);
        setIsEditModalOpen(true);
    };

    const handleUpdateStudent = async (updatedStudent: Student) => {
        try {
            const cleanStudent = {
                _id: updatedStudent._id, // optional, based on backend needs
                name: updatedStudent.name,
                surname: updatedStudent.surname,
                user_ID: updatedStudent.user_ID,
                class_id: updatedStudent.classInfo?._id || "",
            };

            const res = await fetch(`/api/student/update/${updatedStudent._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanStudent),
                credentials: 'include', // only if your backend uses cookies/sessions
            });

            if (res.ok) {
                showPopup('მოსწავლე წარმატებით განახლდა.', 'success');
                setIsEditModalOpen(false);
                if (classFilter) fetchStudents(classFilter, parallelFilter);
            } else {
                const resData = await res.json().catch(() => null);
                const errorMsg = resData?.message || 'მოსწავლის განახლება ვერ მოხერხდა.';
                showPopup(errorMsg, 'error');
            }
        } catch (err) {
            console.error(err);
            showPopup('მოსწავლის განახლებისას მოხდა შეცდომა.', 'error');
        }
    };


    const handleDeleteTeacher = async (teacherId: string) => {
        const performDelete = async () => {
            try {
                const res = await fetch(`/api/teacher/delete/${teacherId}`, { method: 'DELETE' });
                if (res.ok) {
                    showPopup('მასწავლებელი წარმატებით წაიშალა.', 'success');
                    fetchTeachers();
                } else {
                    showPopup('მასწავლებლის წაშლა ვერ მოხერხდა.', 'error');
                }
            } catch (err) {
                showPopup('მასწავლებლის წაშლისას მოხდა შეცდომა.', 'error');
            }
            setConfirmation(null);
        };

        setConfirmation({
            message: 'დარწმუნებული ხართ, რომ გსურთ ამ მასწავლებლის წაშლა?',
            onConfirm: performDelete,
        });
    };

    const handleEditTeacher = (teacher: Teacher) => {
        setEditingTeacher(teacher);
        setIsEditTeacherModalOpen(true);
    };

    const handleUpdateTeacher = async (updatedTeacher: Teacher) => {
        try {
            const res = await fetch(`/api/teacher/update/${updatedTeacher._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTeacher),
            });
            if (res.ok) {
                showPopup('მასწავლებელი წარმატებით განახლდა.', 'success');
                setIsEditTeacherModalOpen(false);
                fetchTeachers();
            } else {
                showPopup('მასწავლებლის განახლება ვერ მოხერხდა.', 'error');
            }
        } catch (err) {
            showPopup('მასწავლებლის განახლებისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleResetTeacherPassword = async (teacherId: string) => {
        const performReset = async () => {
            try {
                const res = await fetch('/api/teacher/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: teacherId }),
                });
                if (res.ok) {
                    showPopup('პაროლი წარმატებით აღდგა.', 'success');
                } else {
                    const data = await res.json();
                    showPopup(`პაროლის აღდგენა ვერ მოხერხდა: ${data.message}`, 'error');
                }
            } catch (err) {
                showPopup('პაროლის აღდგენისას მოხდა შეცდომა.', 'error');
            }
            setConfirmation(null);
        };

        setConfirmation({
            message: 'დარწმუნებული ხართ, რომ გსურთ ამ მასწავლებლის პაროლის აღდგენა?',
            onConfirm: performReset,
        });
    };

    const handleCardClick = (label: string) => {
        switch (label) {
            case 'ადმინისტრატორები':
                setView('adminOptions');
                break;
            case 'ადმინისტრატორის დამატება':
                setView('addAdminForm');
                break;
            case 'ადმინისტრატორების სია':
                fetchAdmins();
                setView('adminList');
                break;
            case 'მოსწავლეები':
                setView('studentOptions');
                break;
            case 'მასწავლებლები':
                setView('teacherOptions');
                break;

            case 'კლასი':
                setView('classOptions');
                break;
            case 'ისტორია':
                fetchAllClasses();
                setView('classHistoryGrades');
                break;
            case 'სტატისტიკა':
                setView('statistics');
                break;
            case 'ექსტერნი':
            case 'გამოცდები & ექსტერნატი':
                setView('examsManager');
                break;
            case 'მანდატურის დარღვევები':
                setView('infractionsManager');
                break;
            case 'წარჩინებულნი & მონიტორინგი':
                setView('topStudentsMonitor');
                break;
            case 'უწყისი':
                setView('reportGeneration');
                break;
            case 'ჟურნალის გახსნა/დახურვა':
                fetchJournalTeachers();
                setView('journalOpen');
                break;
            case 'გაკვეთილების კალენდარი':
                setView('manageCalendars');
                break;
            case 'დღის სკანირება':
                setView('dayScan');
                break;
            // Student sub-options
            case 'მოსწავლის დამატება':
                fetchClassesAndShowForm();
                break;
            case 'მოსწავლეთა სია':
                Promise.all([fetchAllClasses(), fetchStudents(null, null)]);
                setClassFilter(null);
                setParallelFilter(null);
                setView('studentList');
                break;
            // Teacher sub-options
            case 'მასწავლებლის დამატება':
                setView('addTeacherForm');
                break;
            case 'მასწავლებლების სია':
                fetchTeachers();
                setView('teacherList');
                break;

            // Class sub-options
            case 'კლასის დამატება':
                setView('addClassForm');
                break;
            case 'საგნის დამატება':
                setView('addSubjectForm');
                break;
            case 'კლასის რედაქტირება':
                setView('editClass');
                break;
            case 'კლასების გადაწევა':
                handlePromoteClasses();
                break;
            case 'განცხადებები':
                setView('noticeBoard');
                break;
            case 'ჩატი':
                setView('chat');
                break;
            default:
                break;
        }
    };

    const handleBackClick = () => {
        if (view === 'journalOpen') {
            setView('main');
        } else if (view === 'adminOptions' || view === 'studentOptions' || view === 'teacherOptions' || view === 'classOptions' || view === 'addClassForm' || view === 'addSubjectForm' || view === 'editClass' || view === 'noticeBoard' || view === 'chat') {
            setView('main');
        } else if (view === 'adminList' || view === 'addAdminForm') {
            setView('adminOptions');
        } else if (view === 'studentList' || view === 'addStudentForm') {
            setView('studentOptions');
        } else if (view === 'teacherList' || view === 'addTeacherForm') {
            setView('teacherOptions');
        } else if (view === 'classHistoryGrades') {
            setView('main');
        } else if (view === 'classHistoryParallels') {
            setView('classHistoryGrades');
        } else if (view === 'classHistoryTable') {
            setView('classHistoryParallels');
        } else if (view === 'detailedGradeHistory') {
            if (selectedSubjectForHistory) {
                setView('subjectList');
                setSelectedSubjectForHistory(null);
            } else {
                setView('classHistoryParallels');
                setSelectedClassForHistory(null);
            }
        } else if (view === 'subjectList') {
            setView('classHistoryParallels');
            setSelectedClassForHistory(null);
        } else if (view === 'manageCalendars') {
            setView('main');
        } else if (view === 'statistics') {
            setView('main');
        } else if (view === 'externals') {
            setView('main');
        } else if (view === 'externalsSubjectList') {
            setView('externals');
            setSelectedClassForExternals(null);
        } else if (view === 'externalsMarkInput') {
            setView('externalsSubjectList');
            setSelectedSubjectForHistory(null);
        } else if (view === 'reportGeneration') {
            if (showReportGenerator) {
                setShowReportGenerator(false);
                setSelectedClassForReport(null);
            } else {
                setView('main');
            }
        } else if (view === 'studentCard') {
            setSelectedStudentForCard(null);
            setView('studentList');
        } else if (view === 'examsManager' || view === 'infractionsManager' || view === 'topStudentsMonitor') {
            setView('main');
        } else {
            setView('main');
        }
    };

    const fetchClassesAndShowForm = async () => {
        try {
            const res = await fetch('/api/classes');
            if (res.ok) {
                const data = await res.json();
                setClasses(data);
                setView('addStudentForm');
            } else {
                showPopup('კლასების სიის ჩატვირთვა ვერ მოხერხდა.', 'error');
            }
        } catch (err) {
            showPopup('კლასების სიის ჩატვირთვისას მოხდა შეცდომა.', 'error');
        }
    };

    const fetchStudents = async (grade?: number | null, parallel?: string | null) => {
        try {
            const url = grade
                ? `/api/student/grade/${grade}${parallel ? `?parallel=${encodeURIComponent(parallel)}` : ''}`
                : '/api/student/all';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            } else {
                showPopup('მოსწავლეების სიის ჩატვირთვა ვერ მოხერხდა.', 'error');
            }
        } catch (err) {
            showPopup('მოსწავლეების სიის ჩატვირთვისას მოხდა შეცდომა.', 'error');
        }
    };

    const fetchTeachers = async () => {
        try {
            const res = await fetch('/api/teacher/all');
            if (res.ok) {
                const data = await res.json();
                setTeachers(data);
            } else {
                showPopup('მასწავლებლების სიის ჩატვირთვა ვერ მოხერხდა.', 'error');
            }
        } catch (err) {
            showPopup('მასწავლებლების სიის ჩატვირთვისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const studentData = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/admin/student/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData),
            });

            if (res.ok) {
                showPopup('მოსწავლე წარმატებით დაემატა.', 'success');
                setView('studentOptions');
                if (classFilter) fetchStudents(classFilter, parallelFilter);
            } else {
                const data = await res.json();
                showPopup(`მოსწავლის დამატება ვერ მოხერხდა: ${data.message}`, 'error');
            }
        } catch (err) {
            showPopup('მოსწავლის დამატებისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleAddTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const teacherData = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/teacher/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teacherData),
            });

            if (res.ok) {
                showPopup('მასწავლებელი წარმატებით დაემატა.', 'success');
                setView('teacherOptions');
                fetchTeachers();
            } else {
                const data = await res.json();
                showPopup(`მასწავლებლის დამატება ვერ მოხერხდა: ${data.message}`, 'error');
            }
        } catch (err) {
            showPopup('მასწავლებლის დამატებისას მოხდა შეცდომა.', 'error');
        }
    };



    const handleAddClass = async (className: string) => {
        try {
            const res = await fetch('/api/class/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classname: className, subjects: [] }),
            });
            if (res.ok) {
                showPopup('კლასი წარმატებით დაემატა.', 'success');
                setView('main');
                fetchAllClasses();
            } else {
                const resBody = await res.text();
                try {
                    const data = JSON.parse(resBody);
                    showPopup(`კლასის დამატება ვერ მოხერხდა: ${data.message || 'Unknown error'}`, 'error');
                } catch {
                    showPopup(`კლასის დამატება ვერ მოხერხდა: ${resBody}`, 'error');
                }
            }
        } catch (err) {
            showPopup('კლასის დამატებისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleAddSubject = async (subjectName: string, isProject: boolean = false) => {
        try {
            const res = await fetch('/api/subject/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: subjectName, is_project: isProject, is_pass_fail: isProject }),
            });
            if (res.ok) {
                showPopup('საგანი წარმატებით დაემატა.', 'success');
                setView('main');
                fetchAllSubjects();
            } else {
                const resBody = await res.text();
                try {
                    const data = JSON.parse(resBody);
                    showPopup(`საგნის დამატება ვერ მოხერხდა: ${data.message || 'Unknown error'}`, 'error');
                } catch {
                    showPopup(`საგნის დამატება ვერ მოხერხდა: ${resBody}`, 'error');
                }
            }
        } catch (err) {
            showPopup('საგნის დამატებისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleUpdateClass = async (classData: Class) => {
        try {
            const res = await fetch('/api/class/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(classData),
            });
            if (res.ok) {
                showPopup('კლასი წარმატებით განახლდა.', 'success');
                setView('main');
                fetchAllClasses();
            } else {
                const resBody = await res.text();
                try {
                    const data = JSON.parse(resBody);
                    showPopup(`კლასის განახლება ვერ მოხერხდა: ${data.message || 'Unknown error'}`, 'error');
                } catch {
                    showPopup(`კლასის განახლება ვერ მოხერხდა: ${resBody}`, 'error');
                }
            }
        } catch (err) {
            showPopup('კლასის განახლებისას მოხდა შეცდომა.', 'error');
        }
    };

    const handlePromoteClasses = async () => {
        const performPromotion = async () => {
            try {
                const res = await fetch('/api/admin/promote-classes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await res.json();
                if (res.ok) {
                    showPopup('კლასები წარმატებით გადაიწია მომდევნო საფეხურზე.', 'success');
                    fetchAllClasses();
                } else {
                    showPopup(data.message || 'კლასების გადაწევა ვერ მოხერხდა.', 'error');
                }
            } catch (err) {
                showPopup('მოხდა შეცდომა სერვერთან კავშირისას.', 'error');
            }
            setConfirmation(null);
        };

        setConfirmation({
            message: 'ნამდვილად გსურთ ყველა კლასის გადაწევა მომდევნო სასწავლო წლის საფეხურზე? (მაგ. მე-6 კლასი გადავა მე-7 კლასში, საგნები და კალენდარი განულდება)',
            onConfirm: performPromotion,
        });
    };

    const handleAddSubjectsToClass = async (classId: string, subjects: string[]) => {
        try {
            const res = await fetch('/api/class/add-subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ class_id: classId, subjects }),
            });
            if (res.ok) {
                showPopup('საგნები წარმატებით დაემატა.', 'success');
                setView('main');
                fetchAllClasses();
            } else {
                const resBody = await res.text();
                try {
                    const data = JSON.parse(resBody);
                    showPopup(`საგნების დამატება ვერ მოხერხდა: ${data.message || 'Unknown error'}`, 'error');
                } catch {
                    showPopup(`საგნების დამატება ვერ მოხერხდა: ${resBody}`, 'error');
                }
            }
        } catch (err) {
            showPopup('საგნების დამატებისას მოხდა შეცდომა.', 'error');
        }
    };

    const handleGradeClick = (grade: number | null) => {
        setClassFilter(grade);
        setParallelFilter(null);
        fetchStudents(grade, null);
    };

    const handleParallelClick = (parallel: string | null) => {
        setParallelFilter(parallel);
        if (classFilter) fetchStudents(classFilter, parallel);
    };

    const filteredStudents = students.filter(student => {
        if (!classFilter && !parallelFilter) return true;
        if (!student.classInfo?.classname) return false;
        const gradeMatch = student.classInfo.classname.match(/(\d+)/);
        const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : 0;
        const parallelMatch = student.classInfo.classname.match(/[ა-ჰa-zA-Z]/);
        const parallel = parallelMatch ? parallelMatch[0] : '';
        if (classFilter && grade !== classFilter) return false;
        if (parallelFilter && parallel !== parallelFilter) return false;
        return true;
    });

    const handleHistoryGradeClick = (grade: number) => {
        setSelectedHistoryGrade(grade);
        fetchClassHistoryParallels(grade, selectedHistoryYear);
        setView('classHistoryParallels');
    };

    const handleHistoryParallelClick = (parallel: string) => {
        setSelectedHistoryParallel(parallel);
        if (selectedHistoryGrade) {
            // Find the class for this grade and parallel in the given year
            const targetClassName = `${selectedHistoryGrade}${parallel}`;
            const classObj = classes.find((cls: any) => {
                if (!selectedHistoryYear) {
                    return cls.classname === targetClassName;
                } else {
                    const historyEntry = cls.history?.find((h: any) => h.year === selectedHistoryYear);
                    return historyEntry && historyEntry.classname === targetClassName;
                }
            });

            if (classObj) {
                setSelectedClassForHistory({ id: classObj._id, name: targetClassName });
                setView('subjectList');
            } else {
                fetchClassHistoryTable(selectedHistoryGrade, parallel, selectedHistoryYear);
                setView('classHistoryTable');
            }
        }
    };

    const handleHistoryBack = () => {
        if (view === 'classHistoryParallels') {
            setView('classHistoryGrades');
        } else if (view === 'classHistoryTable') {
            setView('classHistoryParallels');
        } else {
            setView('main');
        }
    };

    const handleViewClassDetails = (className: string) => {
        const classObj = classes.find((cls: any) => {
            if (!selectedHistoryYear) {
                return cls.classname === className;
            } else {
                const historyEntry = cls.history?.find((h: any) => h.year === selectedHistoryYear);
                return historyEntry && historyEntry.classname === className;
            }
        });
        if (classObj) {
            setSelectedClassForHistory({ id: classObj._id, name: className });
            setView('detailedGradeHistory');
        }
    };

    const handleSubjectClick = (subjectId: string, subjectName: string) => {
        setSelectedSubjectForHistory({ id: subjectId, name: subjectName });
        setView('detailedGradeHistory');
    };

    const handleExternalsClassClick = (classId: string, className: string) => {
        setSelectedClassForExternals({ id: classId, name: className });
        setView('externalsSubjectList');
    };

    const handleExternalsSubjectClick = (subjectId: string, subjectName: string) => {
        setSelectedSubjectForHistory({ id: subjectId, name: subjectName });
        setView('externalsMarkInput');
    };

    const handleViewChange = (newView: string) => setView(newView);

    const handleViewStudentCard = (student: Student) => {
        setSelectedStudentForCard(student);
        setView('studentCard');
    };

    const DayScanPage: React.FC = () => {
        const [selectedClassId, setSelectedClassId] = useState<string>('');
        const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
        const [loading, setLoading] = useState(false);
        const [results, setResults] = useState<any[]>([]);
        const [scanned, setScanned] = useState(false);
        const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

        // Sort classes in Georgian order
        const sortedClasses = [...classes].sort((a, b) => {
            const gradeA = parseInt(a.classname.match(/\d+/)?.[0] || '0', 10);
            const gradeB = parseInt(b.classname.match(/\d+/)?.[0] || '0', 10);
            if (gradeA !== gradeB) return gradeA - gradeB;

            const letterA = a.classname.match(/[ა-ჰa-zA-Z]/)?.[0] || '';
            const letterB = b.classname.match(/[ა-ჰa-zA-Z]/)?.[0] || '';
            return letterA.localeCompare(letterB, 'ka');
        });

        const toggleRow = (subjectId: string) => {
            setExpandedRows(prev => ({
                ...prev,
                [subjectId]: !prev[subjectId]
            }));
        };

        const handleScan = async () => {
            if (!selectedClassId) {
                alert('გთხოვთ აირჩიოთ კლასი');
                return;
            }
            setLoading(true);
            setScanned(true);
            setExpandedRows({});
            try {
                // Fetch students of selected class
                const studentsRes = await fetch('/api/student/all');
                const allStus = await studentsRes.json();
                const filteredStus = allStus.filter((s: any) => s.classInfo && s.classInfo._id === selectedClassId);

                // Fetch all grades/attendance records for this class
                const gradesRes = await fetch(`/api/grades?class_id=${selectedClassId}`);
                const allGrades = await gradesRes.json();

                // Filter grades by date
                const dayGrades = allGrades.filter((g: any) => g.date === selectedDate);

                // Group grades by subject_id
                const gradesBySubject: Record<string, any[]> = {};
                dayGrades.forEach((g: any) => {
                    if (!gradesBySubject[g.subject_id]) {
                        gradesBySubject[g.subject_id] = [];
                    }
                    gradesBySubject[g.subject_id].push(g);
                });

                // Get all teachers for name mapping
                const teachersRes = await fetch('/api/teacher/all');
                const allTeachers = await teachersRes.json();

                // Evaluate attendance for each subject
                const evaluations = Object.entries(gradesBySubject).map(([subjId, subjGrades]) => {
                    // Group by student_id to get the unique attendance
                    const studentCheckedMap: Record<string, boolean> = {};
                    subjGrades.forEach(g => {
                        studentCheckedMap[g.student_id] = g.checked;
                    });

                    const presentCount = Object.values(studentCheckedMap).filter(c => c === true).length;
                    const absentCount = Object.values(studentCheckedMap).filter(c => c === false).length;
                    const total = presentCount + absentCount;
                    const rate = total > 0 ? (presentCount / total) * 100 : 0;

                    const absentStudentIds = Object.entries(studentCheckedMap)
                        .filter(([_, c]) => c === false)
                        .map(([sid]) => sid);

                    const absentStudentNames = absentStudentIds.map(sid => {
                        const stu = filteredStus.find((s: any) => s._id === sid);
                        return stu ? `${stu.name} ${stu.surname}` : 'უცნობი მოსწავლე';
                    });

                    const absentKey = [...absentStudentIds].sort().join(',');

                    const subjectName = subjects.find(s => s._id === subjId)?.name || 'უცნობი საგანი';
                    
                    const teacherId = subjGrades[0]?.teacher_id;
                    const teacherObj = allTeachers.find((t: any) => t._id === teacherId);
                    const teacherName = teacherObj ? `${teacherObj.name} ${teacherObj.surname}` : 'უცნობი მასწავლებელი';

                    const gradesList = subjGrades.map(g => {
                        const stu = filteredStus.find((s: any) => s._id === g.student_id);
                        const studentName = stu ? `${stu.name} ${stu.surname}` : 'უცნობი მოსწავლე';
                        return {
                            studentId: g.student_id,
                            studentName,
                            point: g.point,
                            pointType: g.pointType,
                            checked: g.checked,
                            time: g.time
                        };
                    }).sort((a, b) => a.studentName.localeCompare(b.studentName, 'ka'));

                    return {
                        subjectId: subjId,
                        subjectName,
                        teacherName,
                        presentCount,
                        absentCount,
                        total,
                        rate,
                        absentStudentIds,
                        absentStudentNames,
                        absentKey,
                        gradesList
                    };
                });

                // Detect discrepancies
                if (evaluations.length >= 2) {
                    const keyFrequencies: Record<string, number> = {};
                    evaluations.forEach(ev => {
                        keyFrequencies[ev.absentKey] = (keyFrequencies[ev.absentKey] || 0) + 1;
                    });

                    let majorityKey = '';
                    let maxFreq = 0;
                    Object.entries(keyFrequencies).forEach(([key, freq]) => {
                        if (freq > maxFreq) {
                            maxFreq = freq;
                            majorityKey = key;
                        }
                    });

                    const finalResults = evaluations.map(ev => ({
                        ...ev,
                        isDiscrepancy: ev.absentKey !== majorityKey
                    }));
                    setResults(finalResults);
                } else {
                    const finalResults = evaluations.map(ev => ({
                        ...ev,
                        isDiscrepancy: false
                    }));
                    setResults(finalResults);
                }
            } catch (err) {
                console.error(err);
                showPopup('სკანირებისას მოხდა შეცდომა.', 'error');
            } finally {
                setLoading(false);
            }
        };

        const handleDeleteDayScan = async () => {
            if (!selectedDate) return showPopup('აირჩიეთ თარიღი', 'error');
            if (!window.confirm(`დარწმუნებული ხართ, რომ გსურთ ${selectedDate} თარიღის ყველა მონაცემის წაშლა?`)) return;
            setLoading(true);
            try {
                const res = await fetch('/api/grade/delete-day', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: selectedDate,
                        class_id: selectedClassId !== 'all' && selectedClassId !== '' ? selectedClassId : undefined,
                        isAdmin: true
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    showPopup(data.message || 'დღის მონაცემები წაიშალა', 'success');
                    setResults([]);
                    setScanned(false);
                } else {
                    showPopup(`წაშლა ვერ მოხერხდა: ${data.message}`, 'error');
                }
            } catch (err) {
                showPopup('სერვერის შეცდომა დღის წაშლისას', 'error');
            } finally {
                setLoading(false);
            }
        };

        const hasAnyDiscrepancy = results.some(r => r.isDiscrepancy);

        return (
            <div className="admin-view-container animate-fade-in-down" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
                <button onClick={() => setView('main')} className="admin-back-btn" style={{ marginBottom: '24px' }}>
                    უკან დაბრუნება
                </button>

                <div className="admin-form-container" style={{ maxWidth: 'none', marginBottom: '30px', padding: '25px' }}>
                    <h2 className="admin-form-title">დღის სკანირება</h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
                        <div className="admin-form-group" style={{ margin: 0 }}>
                            <label className="admin-label">კლასი:</label>
                            <select className="admin-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                                <option value="">აირჩიეთ კლასი</option>
                                {sortedClasses.map(cls => (
                                    <option key={cls._id} value={cls._id}>{cls.classname}</option>
                                ))}
                            </select>
                        </div>

                        <div className="admin-form-group" style={{ margin: 0 }}>
                            <label className="admin-label">თარიღი:</label>
                            <input
                                type="date"
                                className="admin-select"
                                style={{ colorScheme: 'dark', color: 'white' }}
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="admin-submit-btn" onClick={handleScan} disabled={loading} style={{ height: '44px', margin: 0, flex: 1 }}>
                                {loading ? 'მიმდინარეობს...' : 'სკანირება'}
                            </button>
                            <button
                                className="admin-cancel-btn"
                                onClick={handleDeleteDayScan}
                                disabled={loading}
                                style={{
                                    height: '44px',
                                    margin: 0,
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: '800',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                დღის წაშლა
                            </button>
                        </div>
                    </div>
                </div>

                {scanned && !loading && (
                    <div className="admin-list-container animate-zoom-in" style={{ padding: '24px' }}>
                        {results.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.6)' }}>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>მონაცემები ვერ მოიძებნა</div>
                                <div>არჩეულ კლასში მითითებულ დღეს ნიშნები ან სწრებადობის ჩანაწერები არ ფიქსირდება.</div>
                            </div>
                        ) : (
                            <>
                                {hasAnyDiscrepancy ? (
                                    <div style={{ 
                                        background: 'rgba(244, 67, 54, 0.1)', 
                                        border: '1px solid rgba(244, 67, 54, 0.3)', 
                                        borderRadius: '12px', 
                                        padding: '16px 20px', 
                                        marginBottom: '24px',
                                        color: '#ff8a80',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                    }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            ⚠️ ყურადღება! აღმოჩენილია სწრებადობის შეუსაბამობა
                                        </div>
                                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                                            ზოგიერთ საგანში დაფიქსირებულია განსხვავებული სწრებადობის მაჩვენებელი. გთხოვთ გადაამოწმოთ ქვემოთ მონიშნული საგნები.
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ 
                                        background: 'rgba(76, 175, 80, 0.1)', 
                                        border: '1px solid rgba(76, 175, 80, 0.3)', 
                                        borderRadius: '12px', 
                                        padding: '16px 20px', 
                                        marginBottom: '24px',
                                        color: '#b9f6ca',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px'
                                    }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            ✅ სწრებადობა თანხვედრაშია
                                        </div>
                                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                                            ყველა საგანში დაფიქსირებულია იდენტური სწრებადობის მაჩვენებლები.
                                        </div>
                                    </div>
                                )}

                                <div className="admin-table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>საგანი</th>
                                                <th>მასწავლებელი</th>
                                                <th style={{ textAlign: 'center' }}>სულ შეფასდა</th>
                                                <th style={{ textAlign: 'center' }}>დაესწრო</th>
                                                <th style={{ textAlign: 'center' }}>გააცდინა</th>
                                                <th style={{ textAlign: 'center' }}>სწრებადობა (%)</th>
                                                <th style={{ textAlign: 'center' }}>დეტალები</th>
                                                <th style={{ textAlign: 'center' }}>სტატუსი</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.map((r, idx) => {
                                                const isExpanded = !!expandedRows[r.subjectId];
                                                return (
                                                    <React.Fragment key={r.subjectId}>
                                                        <tr style={r.isDiscrepancy ? { backgroundColor: 'rgba(239, 68, 68, 0.08)' } : {}}>
                                                            <td style={{ fontWeight: 700 }}>{r.subjectName}</td>
                                                            <td>{r.teacherName}</td>
                                                            <td style={{ textAlign: 'center' }}>{r.total}</td>
                                                            <td style={{ textAlign: 'center', color: '#4caf50', fontWeight: 'bold' }}>{r.presentCount}</td>
                                                            <td style={{ textAlign: 'center', color: '#f44336', fontWeight: 'bold' }}>{r.absentCount}</td>
                                                            <td style={{ textAlign: 'center', fontWeight: '800' }}>
                                                                {r.rate.toFixed(0)}%
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <button 
                                                                    className="admin-table-action-btn" 
                                                                    style={{ 
                                                                        backgroundColor: isExpanded ? '#64748b' : selectedColor,
                                                                        padding: '6px 14px',
                                                                        fontSize: '12px'
                                                                    }} 
                                                                    onClick={() => toggleRow(r.subjectId)}
                                                                >
                                                                    {isExpanded ? 'ჩაკეცვა' : 'გაშლა'}
                                                                </button>
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                {r.isDiscrepancy ? (
                                                                    <span className="status-badge low" style={{ textTransform: 'none', fontSize: '11px', padding: '4px 8px' }}>
                                                                        განსხვავებული
                                                                    </span>
                                                                ) : (
                                                                    <span className="status-badge high" style={{ textTransform: 'none', fontSize: '11px', padding: '4px 8px' }}>
                                                                        ნორმალური
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        {isExpanded && (
                                                            <tr>
                                                                <td colSpan={8} style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                        <div style={{ fontWeight: 'bold', color: selectedColor, fontSize: '14px', textTransform: 'none' }}>
                                                                            ჩაწერილი ნიშნები და სწრებადობა ({r.subjectName}):
                                                                        </div>
                                                                        <div className="admin-table-wrapper" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                                                                            <table className="admin-table" style={{ margin: 0, background: 'rgba(0,0,0,0.1)' }}>
                                                                                <thead>
                                                                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                                                        <th>მოსწავლე</th>
                                                                                        <th style={{ textAlign: 'center' }}>სწრებადობა</th>
                                                                                        <th style={{ textAlign: 'center' }}>ნიშანი</th>
                                                                                        <th style={{ textAlign: 'center' }}>ტიპი</th>
                                                                                        <th style={{ textAlign: 'center' }}>დრო</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {r.gradesList.map((g: any, gIdx: number) => (
                                                                                        <tr key={gIdx}>
                                                                                            <td style={{ fontWeight: 600 }}>{g.studentName}</td>
                                                                                            <td style={{ textAlign: 'center' }}>
                                                                                                {g.checked ? (
                                                                                                    <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✓ დაესწრო</span>
                                                                                                ) : (
                                                                                                    <span style={{ color: '#f44336', fontWeight: 'bold' }}>✗ გააცდინა</span>
                                                                                                )}
                                                                                            </td>
                                                                                            <td style={{ textAlign: 'center', fontWeight: '800', fontSize: '15px' }}>
                                                                                                {g.point >= 0 ? (
                                                                                                    <span style={{ color: g.point >= 9 ? '#4caf50' : g.point >= 7 ? '#ff9800' : '#f44336' }}>
                                                                                                        {g.point}
                                                                                                    </span>
                                                                                                ) : (
                                                                                                    <span style={{ opacity: 0.5 }}>-</span>
                                                                                                )}
                                                                                            </td>
                                                                                            <td style={{ textAlign: 'center', opacity: 0.8, fontSize: '13px' }}>
                                                                                                {g.pointType === 1 ? 'საშინაო' : g.pointType === 2 ? 'საკლასო' : g.pointType === 3 ? 'შემაჯამებელი' : 'დასწრება'}
                                                                                            </td>
                                                                                            <td style={{ textAlign: 'center', opacity: 0.5, fontSize: '13px' }}>{g.time || '-'}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        switch (view) {
            case 'main':
                return <AdminDashboard items={dashboardItems} onCardClick={handleCardClick} boxWidth={boxWidth} selectedColor={selectedColor} BoxTitle={BoxTitle} />;
            case 'adminOptions':
                return <AdminDashboard items={adminItems} onCardClick={handleCardClick} boxWidth={boxWidth} selectedColor={selectedColor} BoxTitle={BoxTitle} onBackClick={handleBackClick} />;
            case 'adminList':
                return <AdminList admins={adminsList} selectedColor={selectedColor} onBackClick={() => setView('adminOptions')} />;
            case 'addAdminForm':
                return <AddAdminForm onAddAdmin={handleAddAdmin} onCancel={() => setView('adminOptions')} />;
            case 'studentOptions':
                return <AdminDashboard items={studentItems} onCardClick={handleCardClick} boxWidth={boxWidth} selectedColor={selectedColor} BoxTitle={BoxTitle} onBackClick={handleBackClick} />;
            case 'teacherOptions':
                return <AdminDashboard items={teacherItems} onCardClick={handleCardClick} boxWidth={boxWidth} selectedColor={selectedColor} BoxTitle={BoxTitle} onBackClick={handleBackClick} />;
            case 'classOptions':
                return <AdminDashboard items={classItems} onCardClick={handleCardClick} boxWidth={boxWidth} selectedColor={selectedColor} BoxTitle={BoxTitle} onBackClick={handleBackClick} />;
            case 'studentList':
                return <StudentList students={filteredStudents} onEditStudent={handleEditStudent} onDeleteStudent={handleDeleteStudent} onResetPassword={handleResetPassword} onBackClick={handleBackClick} onGradeClick={handleGradeClick} onParallelFilterClick={handleParallelClick} classFilter={classFilter} parallelFilter={parallelFilter} selectedColor={selectedColor} classes={classes} logoutButtonStyle={logoutButtonStyle} onViewStudentCard={handleViewStudentCard} />;
            case 'addStudentForm':
                return <AddStudentForm onAddStudent={handleAddStudent} onBackClick={() => setView('studentOptions')} classes={classes} selectedColor={selectedColor} logoutButtonStyle={logoutButtonStyle} />;
            case 'teacherList':
                return <TeacherList teachers={teachers} onEditTeacher={handleEditTeacher} onDeleteTeacher={handleDeleteTeacher} onResetPassword={handleResetTeacherPassword} onBackClick={handleBackClick} selectedColor={selectedColor} logoutButtonStyle={logoutButtonStyle} />;
            case 'addTeacherForm':
                return <AddTeacherForm onAddTeacher={handleAddTeacher} onCancel={() => setView('teacherOptions')} />;
            case 'addClassForm':
                return <AddClassForm onAddClass={handleAddClass} onCancel={() => setView('classOptions')} />;
            case 'addSubjectForm':
                return <AddSubjectForm onAddSubject={handleAddSubject} onCancel={() => setView('classOptions')} subjects={(subjects || []).map(s => s.name)} subjectsList={subjects || []} onSubjectUpdated={fetchAllSubjects} />;
            case 'editClass':
                return <EditClassForm onUpdateClass={handleUpdateClass} onCancel={() => setView('classOptions')} classes={classes} teachers={teachers} subjects={subjects} onSubjectUpdated={fetchAllSubjects} />;
            case 'classHistoryGrades':
                return (
                    <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
                        <button className="admin-back-btn" onClick={handleHistoryBack} style={{ marginBottom: '20px' }}>
                            <ArrowLeftIcon size={20} /> უკან
                        </button>
                        <h2 style={{ color: 'white', width: '100%', textAlign: 'center', marginBottom: '28px', fontSize: '24px', fontWeight: 800 }}>აირჩიეთ კლასი</h2>
                        
                        {/* Year Selector */}
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '28px', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>სასწავლო წელი:</span>
                            <select
                                value={selectedHistoryYear}
                                onChange={(e) => {
                                    setSelectedHistoryYear(e.target.value);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '15px',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {getAvailableHistoryYears().map((y) => (
                                    <option key={y} value={y === getAvailableHistoryYears()[0] ? "" : y} style={{ background: '#1e293b', color: 'white' }}>
                                        {y === getAvailableHistoryYears()[0] ? `20${y} (მიმდინარე)` : `20${y}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {Array.from(new Set(
                            classes
                                .map(c => {
                                    let name = c.classname;
                                    if (selectedHistoryYear) {
                                        const h = (c as any).history?.find((x: any) => x.year === selectedHistoryYear);
                                        if (!h) return null;
                                        name = h.classname;
                                    }
                                    const match = name.match(/^([0-9]+)([ა-ჰ])$/);
                                    return match ? parseInt(match[1], 10) : null;
                                })
                                .filter((g): g is number => g !== null)
                        )).sort((a, b) => a - b).map(grade => (
                            <div 
                                key={grade} 
                                className="admin-card animate-zoom-in"
                                style={{ 
                                    width: '120px', 
                                    height: '120px', 
                                    fontSize: '36px', 
                                    fontWeight: '800', 
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    justifyContent: 'center',
                                    padding: 0,
                                    minHeight: 'auto'
                                }} 
                                onClick={() => handleHistoryGradeClick(grade)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)`;
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                    e.currentTarget.style.boxShadow = `0 8px 24px ${selectedColor}44`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
                                }}
                            >
                                {grade}
                            </div>
                        ))}
                    </div>
                );
            case 'classHistoryParallels':
                return (
                    <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
                        <button className="admin-back-btn" onClick={handleHistoryBack} style={{ marginBottom: '20px' }}>
                            <ArrowLeftIcon size={20} /> უკან
                        </button>
                        <h2 style={{ color: 'white', width: '100%', textAlign: 'center', marginBottom: '8px', fontSize: '24px', fontWeight: 800 }}>აირჩიეთ პარალელი</h2>
                        <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px', fontSize: '15px' }}>სასწავლო წელი: {selectedHistoryYear ? `20${selectedHistoryYear}` : `20${getPromotionAcademicYear()} (მიმდინარე)`}</div>
                        {historyParallels.length > 0 ? (
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '20px',
                                width: '100%',
                                maxWidth: '1200px',
                                justifyContent: 'center'
                            }}>
                                {historyParallels.sort((a, b) => {
                                    // Georgian alphabet order: ა, ბ, გ, დ, ე, ვ, ზ, თ, ი, კ, ლ, მ, ნ, ო, პ, ჟ, რ, ს, ტ, უ, ფ, ქ, ღ, ყ, შ, ჩ, ც, ძ, წ, ჭ, ხ, ჯ, ჰ
                                    const georgianOrder = 'აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ';
                                    const aIndex = georgianOrder.indexOf(a);
                                    const bIndex = georgianOrder.indexOf(b);
                                    return aIndex - bIndex;
                                }).map(parallel => (
                                    <div 
                                        key={parallel} 
                                        className="admin-card animate-zoom-in"
                                        style={{
                                            minHeight: '180px',
                                            width: '280px',
                                            padding: '24px',
                                            justifyContent: 'center',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            textAlign: 'center',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px'
                                        }}
                                        onClick={() => handleHistoryParallelClick(parallel)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)`;
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                            e.currentTarget.style.transform = 'translateY(-6px)';
                                            e.currentTarget.style.boxShadow = `0 12px 30px ${selectedColor}44`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
                                        }}
                                    >
                                        <div style={{ fontSize: '32px', fontWeight: '800', color: 'white' }}>
                                            {selectedHistoryGrade}{parallel}
                                        </div>
                                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {historyParallelTutors[parallel] || 'დამრიგებელი არ არის'}
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>
                                            მოსწავლეები: {historyParallelCounts[parallel] ?? 0}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: 'white', fontSize: '24px', width: '100%', textAlign: 'center' }}>პარალელები ვერ მოიძებნა</div>
                        )}
                    </div>
                );
            case 'classHistoryTable':
                return <ClassHistoryTable
                    classHistory={historyTable}
                    onBackClick={handleHistoryBack}
                    selectedColor={selectedColor}
                    logoutButtonStyle={logoutButtonStyle}
                    onViewDetails={handleViewClassDetails}
                />;
            case 'journalOpen':
                return (
                    <div className="admin-list-container animate-zoom-in" style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
                        <button className="admin-back-btn" onClick={handleBackClick} style={{ marginBottom: '24px' }}>
                            <ArrowLeftIcon size={20} /> უკან
                        </button>
                        <h2 className="admin-view-title" style={{ marginBottom: '24px', textAlign: 'center' }}>ჟურნალის გახსნა</h2>
                        {loadingJournal ? <div style={{ color: 'white', textAlign: 'center', marginTop: '20px' }}>იტვირთება...</div> : (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>სახელი</th>
                                        <th>გვარი</th>
                                        <th>პ/ნ</th>
                                        <th>ქულების ჩაწერის დაწყების თარიღი</th>
                                        <th style={{ textAlign: 'center' }}>მოქმედება</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {journalTeachers.map(t => (
                                        <tr key={t._id}>
                                            <td style={{ fontWeight: 600 }}>{t.name}</td>
                                            <td style={{ fontWeight: 600 }}>{t.surname}</td>
                                            <td>{t.user_ID}</td>
                                            <td>
                                                <input
                                                    type="date"
                                                    value={customDates[t._id] ?? t.gradeEntryStartDate}
                                                    onChange={e => handleCustomDateChange(t._id, e.target.value)}
                                                    className="admin-select"
                                                    style={{ colorScheme: 'dark', color: 'white', padding: '8px 12px', fontSize: '14px', width: 'auto' }}
                                                />
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button 
                                                        onClick={() => handleSetDefaultStartDate(t._id)} 
                                                        disabled={updatingTeacherId === t._id} 
                                                        className="admin-table-action-btn"
                                                        style={{ background: selectedColor }}
                                                    >
                                                        {updatingTeacherId === t._id ? '...' : 'სტანდარტული'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleSaveCustomDate(t._id)} 
                                                        disabled={updatingTeacherId === t._id || !customDates[t._id]} 
                                                        className="admin-table-action-btn"
                                                        style={{ background: '#4caf50' }}
                                                    >
                                                        {updatingTeacherId === t._id ? '...' : 'გახსნა'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            case 'manageCalendars':
                return (
                    <AdminCalendarManager
                        teachers={teachers}
                        classes={classes}
                        subjects={subjects}
                        onBack={() => setView('main')}
                        showPopup={showPopup}
                    />
                );
            case 'subjectList':
                return selectedClassForHistory ? (
                    <SubjectList
                        classId={selectedClassForHistory.id}
                        className={selectedClassForHistory.name}
                        selectedColor={selectedColor}
                        logoutButtonStyle={logoutButtonStyle}
                        onBackClick={handleBackClick}
                        onSubjectClick={handleSubjectClick}
                        selectedYear={selectedHistoryYear}
                    />
                ) : (
                    <div style={{ color: 'white', textAlign: 'center' }}>კლასი ვერ მოიძებნა</div>
                );
            case 'detailedGradeHistory':
                return selectedClassForHistory ? (
                    <DetailedGradeHistory
                        classId={selectedClassForHistory.id}
                        className={selectedClassForHistory.name}
                        subjectId={selectedSubjectForHistory?.id}
                        subjectName={selectedSubjectForHistory?.name}
                        selectedColor={selectedColor}
                        logoutButtonStyle={logoutButtonStyle}
                        onBackClick={handleBackClick}
                        selectedYear={selectedHistoryYear}
                    />
                ) : (
                    <div style={{ color: 'white', textAlign: 'center' }}>კლასი ვერ მოიძებნა</div>
                );
            case 'dayScan':
                return <DayScanPage />;
            case 'statistics':
                return <AdminStatisticsPage
                    classes={classes}
                    subjects={subjects}
                    teachers={teachers}
                    selectedColor={selectedColor}
                    logoutButtonStyle={logoutButtonStyle}
                    onBackClick={handleBackClick}
                />;
            case 'externals':
                return (
                    <div style={{ width: '100%' }}>
                        <button className="admin-back-btn" onClick={handleBackClick} style={{ marginBottom: '24px' }}>
                            <ArrowLeftIcon size={20} /> უკან
                        </button>
                        <h2 style={{ color: 'white', fontSize: '28px', textAlign: 'center', marginBottom: '30px', fontWeight: 800 }}>
                            ექსტერნები - კლასების არჩევა
                        </h2>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            width: "100%",
                            gap: '20px',
                            padding: '20px'
                        }}>
                            {classes.map((cls) => (
                                <div
                                    key={cls._id}
                                    onClick={() => handleExternalsClassClick(cls._id, cls.classname)}
                                    className="admin-card animate-zoom-in"
                                    style={{
                                        minHeight: '130px',
                                        width: '280px',
                                        padding: '25px',
                                        justifyContent: 'center',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.08)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)`;
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                        e.currentTarget.style.transform = 'translateY(-6px)';
                                        e.currentTarget.style.boxShadow = `0 12px 30px ${selectedColor}44`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
                                    }}
                                >
                                    <div style={{
                                        fontSize: '32px',
                                        fontWeight: '800',
                                        color: 'white',
                                        textAlign: 'center'
                                    }}>
                                        {cls.classname}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'externalsSubjectList':
                return selectedClassForExternals ? (
                    <SubjectList
                        classId={selectedClassForExternals.id}
                        className={selectedClassForExternals.name}
                        selectedColor={selectedColor}
                        logoutButtonStyle={logoutButtonStyle}
                        onBackClick={handleBackClick}
                        onSubjectClick={handleExternalsSubjectClick}
                    />
                ) : (
                    <div style={{ color: 'white', textAlign: 'center' }}>კლასი ვერ მოიძებნა</div>
                );
            case 'externalsMarkInput':
                return selectedClassForExternals && selectedSubjectForHistory ? (
                    <ExternalsMarkInput
                        classId={selectedClassForExternals.id}
                        className={selectedClassForExternals.name}
                        subjectId={selectedSubjectForHistory.id}
                        subjectName={selectedSubjectForHistory.name}
                        selectedColor={selectedColor}
                        logoutButtonStyle={logoutButtonStyle}
                        onBackClick={handleBackClick}
                    />
                ) : (
                    <div style={{ color: 'white', textAlign: 'center' }}>მონაცემები ვერ მოიძებნა</div>
                );
            case 'reportGeneration':
                if (showReportGenerator && selectedClassForReport) {
                    return (
                        <ReportGenerator
                            classId={selectedClassForReport.id}
                            className={selectedClassForReport.name}
                            selectedColor={selectedColor}
                            logoutButtonStyle={logoutButtonStyle}
                            onBackClick={() => {
                                setShowReportGenerator(false);
                                setSelectedClassForReport(null);
                            }}
                        />
                    );
                }
                return (
                    <ReportClassSelector
                        classes={classes}
                        selectedColor={selectedColor}
                        onSelectClass={(cls) => {
                            setSelectedClassForReport(cls);
                            setShowReportGenerator(true);
                        }}
                        onBackClick={handleBackClick}
                    />
                );
            case 'reportGenerator':
                return selectedClassForReport ? (
                    <ReportGenerator
                        classId={selectedClassForReport.id}
                        className={selectedClassForReport.name}
                        selectedColor={selectedColor}
                        logoutButtonStyle={logoutButtonStyle}
                        onBackClick={() => {
                            setShowReportGenerator(false);
                            setSelectedClassForReport(null);
                        }}
                    />
                ) : (
                    <div style={{ color: 'white', textAlign: 'center' }}>კლასი ვერ მოიძებნა</div>
                );
            case 'studentCard':
                return selectedStudentForCard ? (
                    <StudentCard
                        student={selectedStudentForCard}
                        selectedColor={selectedColor}
                        logoutButtonStyle={logoutButtonStyle}
                        onBackClick={() => {
                            setSelectedStudentForCard(null);
                            setView('studentList');
                        }}
                    />
                ) : (
                    <div style={{ color: 'white', textAlign: 'center' }}>მოსწავლე ვერ მოიძებნა</div>
                );
            case 'noticeBoard':
                return (
                    <div style={{ width: '100%', maxWidth: '1000px' }}>
                        <button className="admin-back-btn" onClick={handleBackClick} style={{ marginBottom: '24px' }}>
                            <ArrowLeftIcon size={20} /> უკან
                        </button>
                        <NoticeBoard currentUser={{ id: 'admin', name: 'ადმინისტრატორი', role: 'admin' }} />
                    </div>
                );
            case 'examsManager':
                return (
                    <div style={{ width: '100%', maxWidth: '1100px' }}>
                        <button className="admin-back-btn" onClick={handleBackClick} style={{ marginBottom: '24px' }}>
                            <ArrowLeftIcon size={20} /> უკან
                        </button>
                        <ExamsManager selectedColor={selectedColor} />
                    </div>
                );
            case 'infractionsManager':
                return (
                    <div style={{ width: '100%', maxWidth: '1100px' }}>
                        <button className="admin-back-btn" onClick={handleBackClick} style={{ marginBottom: '24px' }}>
                            <ArrowLeftIcon size={20} /> უკან
                        </button>
                        <MandaturiInfractionManager selectedColor={selectedColor} />
                    </div>
                );
            case 'topStudentsMonitor':
                return (
                    <div style={{ width: '100%', maxWidth: '1100px' }}>
                        <button className="admin-back-btn" onClick={handleBackClick} style={{ marginBottom: '24px' }}>
                            <ArrowLeftIcon size={20} /> უკან
                        </button>
                        <TopStudentsMonitor selectedColor={selectedColor} />
                    </div>
                );
            case 'chat':
                return (
                    <div style={{ width: '100%', maxWidth: '1000px' }}>
                        <button className="admin-back-btn" onClick={handleBackClick} style={{ marginBottom: '24px' }}>
                            <ArrowLeftIcon size={20} /> უკან
                        </button>
                        <ChatModule currentUser={{ id: 'admin', name: 'ადმინისტრატორი', role: 'admin' }} />
                    </div>
                );
            default:
                return <div>არასწორი არჩევანი</div>;
        }
    };

    return (
        <div className="admin-page-wrapper">
            <div className="admin-page-bg-glow" style={{ background: `radial-gradient(circle at center, ${selectedColor}26 0%, transparent 70%)` }} />

            <ColorPalette />
            <button
                onClick={handleLogout}
                className="logout-btn"
            >
                გასვლა
            </button>

            <div className="admin-page-content">
                <header className="admin-page-header animate-fade-in-down">
                    <h1 className="admin-page-title">
                        ადმინისტრატორის <span style={{ color: selectedColor }}>პანელი</span>
                    </h1>
                    <p className="admin-page-subtitle">
                        მართვის სისტემა
                    </p>
                </header>

                <div className="admin-main-view animate-zoom-in">
                    {renderContent()}
                </div>
            </div>

            {confirmation && (
                <ConfirmationModal
                    isOpen={!!confirmation}
                    message={confirmation.message}
                    onConfirm={confirmation.onConfirm}
                    onCancel={() => setConfirmation(null)}
                />
            )}
            {popup && <MessagePopup message={popup.message} type={popup.type} onClose={() => setPopup(null)} />}

            {isEditModalOpen && editingStudent && (
                <EditStudentModal
                    student={editingStudent}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleUpdateStudent}
                    classes={classes}
                />
            )}
            {isEditTeacherModalOpen && editingTeacher && (
                <EditTeacherModal
                    teacher={editingTeacher}
                    isOpen={isEditTeacherModalOpen}
                    onClose={() => setIsEditTeacherModalOpen(false)}
                    onSave={handleUpdateTeacher}
                    classes={classes}
                />
            )}

            {isJournalModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'rgba(20, 25, 45, 0.85)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '40px', minWidth: '380px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>აირჩიეთ მოქმედება</div>
                        
                        <button 
                            onClick={() => handleJournalAction('semester')} 
                            style={{ 
                                background: 'linear-gradient(135deg, #3a8dde 0%, #1d4ed8 100%)', 
                                width: '100%', 
                                color: 'white', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '14px', 
                                padding: '14px 28px', 
                                fontWeight: '800', 
                                fontSize: '15px', 
                                cursor: 'pointer', 
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 4px 15px rgba(58, 141, 222, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(58, 141, 222, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(58, 141, 222, 0.2)';
                            }}
                        >
                            სრული სემესტრის გახსნა
                        </button>
                        
                        <button 
                            onClick={() => handleJournalAction('year')} 
                            style={{ 
                                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', 
                                width: '100%', 
                                color: 'white', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '14px', 
                                padding: '14px 28px', 
                                fontWeight: '800', 
                                fontSize: '15px', 
                                cursor: 'pointer', 
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.2)';
                            }}
                        >
                            სრული წლის გახსნა
                        </button>
                        
                        <button 
                            onClick={() => handleJournalAction('close')} 
                            style={{ 
                                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', 
                                width: '100%', 
                                color: 'white', 
                                border: '1px solid rgba(255,255,255,0.05)', 
                                borderRadius: '14px', 
                                padding: '14px 28px', 
                                fontWeight: '800', 
                                fontSize: '15px', 
                                cursor: 'pointer', 
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.2)';
                            }}
                        >
                            ჟურნალის დახურვა
                        </button>

                        <button 
                            onClick={() => setIsJournalModalOpen(false)} 
                            style={{ 
                                background: 'transparent', 
                                color: 'rgba(255,255,255,0.6)', 
                                border: 'none', 
                                borderRadius: '8px', 
                                padding: '8px 24px', 
                                fontWeight: 'bold', 
                                fontSize: '14px', 
                                cursor: 'pointer', 
                                marginTop: '10px',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                        >
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ClassHistoryTable: React.FC<{
    classHistory: { classname: string; tutorName: string; studentCount: number; }[];
    onBackClick: () => void;
    selectedColor: string;
    logoutButtonStyle: React.CSSProperties;
    onViewDetails?: (className: string) => void;
}> = ({ classHistory, onBackClick, selectedColor, onViewDetails }) => (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
        <button onClick={onBackClick} className="admin-back-btn" style={{ marginBottom: '24px' }}>
            <ArrowLeftIcon size={20} /> უკან
        </button>
        <h2 className="admin-view-title" style={{ marginBottom: '24px', textAlign: 'center' }}>კლასების ისტორია</h2>
        <div className="admin-list-container animate-zoom-in" style={{ padding: 0 }}>
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>კლასი</th>
                            <th>დამრიგებელი</th>
                            <th>მოსწავლეთა რაოდენობა</th>
                            {onViewDetails && <th style={{ textAlign: 'center' }}>ქმედება</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {classHistory.length > 0 ? classHistory.map((row) => (
                            <tr key={row.classname}>
                                <td style={{ fontWeight: '700', fontSize: '18px' }}>{row.classname}</td>
                                <td style={{ fontWeight: '600', color: '#cbd5e1' }}>{row.tutorName}</td>
                                <td style={{ fontWeight: '600' }}>{row.studentCount}</td>
                                {onViewDetails && (
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => onViewDetails(row.classname)}
                                            className="admin-table-action-btn"
                                            style={{
                                                background: selectedColor,
                                                padding: '10px 20px',
                                                fontSize: '14px',
                                            }}
                                        >
                                            დეტალები
                                        </button>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={onViewDetails ? 4 : 3} style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                                    კლასები ვერ მოიძებნა
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

// Admin Statistics Page Component
const AdminStatisticsPage: React.FC<{
    classes: Class[];
    subjects: Subject[];
    teachers: Teacher[];
    selectedColor: string;
    logoutButtonStyle: React.CSSProperties;
    onBackClick: () => void;
}> = ({ classes, subjects, teachers, selectedColor, logoutButtonStyle, onBackClick }) => {
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [students, setStudents] = useState<any[]>([]);
    const [classStatistics, setClassStatistics] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const handleViewStatistics = async () => {
        if (!selectedClass) {
            alert('გთხოვთ აირჩიოთ კლასი');
            return;
        }

        setLoading(true);
        try {
            // Fetch students for the selected class
            const studentsRes = await fetch('/api/student/all');
            const allStudents = await studentsRes.json();
            const classStudents = allStudents.filter((s: any) => s.classInfo && s.classInfo._id === selectedClass);
            setStudents(classStudents);

            // Fetch class statistics using the new API
            let url = `/api/class-statistics?class_id=${selectedClass}`;
            if (selectedSubject) {
                url += `&subject_id=${selectedSubject}`;
            }

            const statsRes = await fetch(url);
            if (!statsRes.ok) {
                throw new Error('Failed to fetch statistics');
            }
            const statsData = await statsRes.json();
            setClassStatistics(statsData);

            setShowResults(true);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            alert('სტატისტიკის ჩვენება ვერ მოხერხდა');
        } finally {
            setLoading(false);
        }
    };

    const getStudentStats = (studentId: string) => {
        if (!classStatistics || !classStatistics[studentId]) {
            return {
                firstSemester: 0,
                secondSemester: 0,
                annual: 0,
                attendance: 0
            };
        }

        const stats = classStatistics[studentId];

        // If a specific subject is selected, use subject breakdown
        if (selectedSubject && stats.subject_breakdown && stats.subject_breakdown[selectedSubject]) {
            const subjectStats = stats.subject_breakdown[selectedSubject];

            return {
                firstSemester: subjectStats.first_semester?.average || 0,
                secondSemester: subjectStats.second_semester?.average || 0,
                annual: subjectStats.annual?.average || 0,
                attendance: subjectStats.annual?.attendance || 0
            };
        }

        // Otherwise use overall stats
        return {
            firstSemester: stats.first_semester?.average || 0,
            secondSemester: stats.second_semester?.average || 0,
            annual: stats.annual?.average || 0,
            attendance: stats.annual?.attendance || 0
        };
    };

    const filteredStudents = students;

    // Get teacher name for the selected class
    const getTeacherName = () => {
        if (!selectedClass || !selectedSubject) return '';
        const classObj = classes.find(c => c._id === selectedClass);
        if (!classObj || !classObj.subjects) return '';

        const subjectObj = classObj.subjects.find(s => s.subject_id === selectedSubject);
        if (!subjectObj) return '';

        const teacher = teachers.find(t => t._id === subjectObj.teacher_id);
        return teacher ? `${teacher.name} ${teacher.surname}` : '';
    };

    return (
        <div style={{ background: 'white', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '1100px', margin: '20px auto', boxSizing: 'border-box' as const }}>
            <button onClick={onBackClick} style={{ marginBottom: '24px', background: selectedColor, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>უკან დაბრუნება</button>

            <div style={{ fontSize: '22px', fontWeight: '700', color: 'blue', marginBottom: '24px', textAlign: 'center' }}>სტატისტიკა</div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px', textAlign: 'center', fontStyle: 'italic' }}>
                * თუ მოსწავლეს აქვს ექსტერნის ნიშანი, წლიური ნიშანი ჩაანაცვლება ექსტერნის ნიშნით
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                {/* Class Selection */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <label style={{ fontWeight: '600', minWidth: '120px', color: '#2196f3' }}>აირჩიეთ კლასი:</label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '2px solid #2196f3',
                            fontSize: '16px',
                            minWidth: '200px',
                            backgroundColor: '#f8f9fa',
                            color: '#333'
                        }}
                    >
                        <option value="">აირჩიეთ კლასი</option>
                        {classes
                            .sort((a, b) => {
                                // Sort classes in Georgian order (1ა, 1ბ, 2ა, 2ბ, etc.)
                                const gradeA = parseInt(a.classname.match(/\d+/)?.[0] || '0');
                                const gradeB = parseInt(b.classname.match(/\d+/)?.[0] || '0');
                                if (gradeA !== gradeB) return gradeA - gradeB;

                                const letterA = a.classname.match(/[ა-ჰ]/)?.[0] || '';
                                const letterB = b.classname.match(/[ა-ჰ]/)?.[0] || '';
                                return letterA.localeCompare(letterB, 'ka');
                            })
                            .map((cls) => (
                                <option key={cls._id} value={cls._id}>{cls.classname}</option>
                            ))}
                    </select>
                </div>

                {/* Subject Selection */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <label style={{ fontWeight: '600', minWidth: '120px', color: '#2196f3' }}>აირჩიეთ საგანი:</label>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '2px solid #2196f3',
                            fontSize: '16px',
                            minWidth: '200px',
                            backgroundColor: '#f8f9fa',
                            color: '#333'
                        }}
                    >
                        <option value="">ყველა საგანი</option>
                        {subjects.map((subj) => (
                            <option key={subj._id} value={subj._id}>{subj.name}</option>
                        ))}
                    </select>
                </div>




            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '30px' }}>
                <button
                    onClick={handleViewStatistics}
                    disabled={loading || !selectedClass}
                    style={{
                        background: selectedColor,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                    }}
                >
                    {loading ? 'იტვირთება...' : 'სტატიტიკის ნახვა'}
                </button>
            </div>

            {/* Results */}
            {showResults && (
                <div style={{ marginTop: '30px' }}>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#333' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #ddd', background: '#f8f8f8' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>მოსწავლე</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>პირველი სემესტრი</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>მეორე სემესტრი</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>წლიური</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>სწრებადობა</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, index) => {
                                    const stats = getStudentStats(student._id);
                                    return (
                                        <tr key={student._id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: '#6c757d',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {index + 1}
                                                </div>
                                                {student.name} {student.surname}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#2196f3' }}>
                                                {stats.firstSemester.toFixed(1)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#4caf50' }}>
                                                {stats.secondSemester.toFixed(1)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#ff9800' }}>
                                                {stats.annual.toFixed(1)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#9c27b0' }}>
                                                {stats.attendance.toFixed(1)}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {students.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: '#6c757d',
                            fontSize: '18px'
                        }}>
                            ამ კლასში მოსწავლეები ვერ მოიძებნა
                        </div>
                    )}

                    {/* Summary Statistics */}
                    {classStatistics && students.length > 0 && (
                        <div style={{
                            marginTop: '30px',
                            padding: '20px',
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #dee2e6'
                        }}>
                            <h3 style={{ color: 'blue', marginBottom: '15px', textAlign: 'center' }}>
                                კლასის საერთო სტატისტიკა
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196f3' }}>
                                        {students.length}
                                    </div>
                                    <div style={{ color: '#666' }}>მოსწავლე</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
                                        {selectedSubject ? subjects.find(s => s._id === selectedSubject)?.name || 'საგანი' : 'ყველა საგანი'}
                                    </div>
                                    <div style={{ color: '#666' }}>საგანი</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
                                        {students.filter(s => classStatistics && classStatistics[s._id]).length}
                                    </div>
                                    <div style={{ color: '#666' }}>სტატისტიკით</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Admin;
