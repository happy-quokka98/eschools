"use client";
import React, { useState, useEffect } from 'react';
import { IoArrowBack } from 'react-icons/io5';

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string }>;

interface Teacher {
  _id: string;
  name: string;
  surname: string;
  user_ID: string;
}

interface Subject {
  _id: string;
  name: string;
}

interface Class {
  _id: string;
  classname: string;
}

interface CalendarEntry {
  subject_id: string;
  teacher_id: string;
}

type Calendar = CalendarEntry[][];

interface AdminCalendarManagerProps {
  teachers: Teacher[];
  classes: Class[];
  subjects: Subject[];
  onBack: () => void;
  showPopup: (msg: string, type: 'success' | 'error') => void;
}

const days = ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი'];
const lessonsPerDay = 7;

const AdminCalendarManager: React.FC<AdminCalendarManagerProps> = ({ teachers, classes, subjects, onBack, showPopup }) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<Calendar>(Array(5).fill(null).map(() => Array(lessonsPerDay).fill({ subject_id: '', teacher_id: '' })));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedClassId) return;
    const fetchCalendar = async () => {
      try {
        const res = await fetch(`/api/classes`);
        if (res.ok) {
          const data = await res.json();
          const found = data.find((cls: any) => cls._id === selectedClassId);
          if (found && found.calendar && Array.isArray(found.calendar) && found.calendar.length === 5) {
            setCalendar(found.calendar.map((day: any) => Array.isArray(day) ? day.map((cell: any) => ({
              subject_id: cell.subject_id || '',
              teacher_id: cell.teacher_id || ''
            })) : Array(lessonsPerDay).fill({ subject_id: '', teacher_id: '' })));
          } else {
            setCalendar(Array(5).fill(null).map(() => Array(lessonsPerDay).fill({ subject_id: '', teacher_id: '' })));
          }
        }
      } catch (err) {
        setCalendar(Array(5).fill(null).map(() => Array(lessonsPerDay).fill({ subject_id: '', teacher_id: '' })));
      }
    };
    fetchCalendar();
  }, [selectedClassId]);

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
  };

  const handleCellChange = (dayIdx: number, lessonIdx: number, field: 'subject_id' | 'teacher_id', value: string) => {
    setCalendar(prev => {
      const updated = prev.map(row => row.slice());
      updated[dayIdx][lessonIdx] = { ...updated[dayIdx][lessonIdx], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/class/set-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: selectedClassId, calendar }),
      });
      if (res.ok) {
        showPopup('კალენდარი წარმატებით შეინახა!', 'success');
      } else {
        showPopup('კალენდარის შენახვა ვერ მოხერხდა.', 'error');
      }
    } catch (err) {
      showPopup('შეცდომა კალენდარის შენახვისას.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sortedAndFilteredClasses = [...classes]
    .sort((a, b) => {
      const gradeA = parseInt(a.classname.match(/\d+/)?.[0] || '0', 10);
      const gradeB = parseInt(b.classname.match(/\d+/)?.[0] || '0', 10);
      if (gradeA !== gradeB) return gradeA - gradeB;

      const letterA = a.classname.match(/[ა-ჰa-zA-Z]/)?.[0] || '';
      const letterB = b.classname.match(/[ა-ჰa-zA-Z]/)?.[0] || '';
      return letterA.localeCompare(letterB, 'ka');
    });

  return (
    <div className="admin-view-container animate-fade-in-down">
      <header className="admin-view-header">
        <button className="admin-back-btn" onClick={onBack}>
          <ArrowLeftIcon size={20} /> უკან
        </button>
        <h2 className="admin-view-title">გაკვეთილების განრიგი</h2>
      </header>

      <div className="admin-form-container" style={{ maxWidth: 'none', marginBottom: '30px', padding: '25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <label className="admin-label" style={{ margin: 0 }}>კლასი: </label>
          <select className="admin-select" style={{ maxWidth: '300px' }} value={selectedClassId || ''} onChange={e => handleClassSelect(e.target.value)}>
            <option value='' disabled>აირჩიეთ კლასი</option>
            {sortedAndFilteredClasses.map(cls => (
              <option key={cls._id} value={cls._id}>{cls.classname}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedClassId && (
        <div className="admin-list-container animate-zoom-in">
          <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="admin-table calendar-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  {days.map((day, dayIdx) => (
                    <th key={dayIdx}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(lessonsPerDay)].map((_, lessonIdx) => (
                  <tr key={lessonIdx}>
                    <td style={{ textAlign: 'center', fontWeight: '800', opacity: 0.5 }}>{lessonIdx + 1}</td>
                    {days.map((_, dayIdx) => (
                      <td key={dayIdx} style={{ minWidth: '180px', padding: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <select
                            className="calendar-select"
                            value={calendar[dayIdx][lessonIdx]?.subject_id || ''}
                            onChange={e => handleCellChange(dayIdx, lessonIdx, 'subject_id', e.target.value)}
                          >
                            <option value=''>საგანი</option>
                            {subjects.map(sub => (
                              <option key={sub._id} value={sub._id}>{sub.name}</option>
                            ))}
                          </select>
                          <select
                            className="calendar-select"
                            value={calendar[dayIdx][lessonIdx]?.teacher_id || ''}
                            onChange={e => handleCellChange(dayIdx, lessonIdx, 'teacher_id', e.target.value)}
                          >
                            <option value=''>მასწავლებელი</option>
                            {teachers.map(t => (
                              <option key={t._id} value={t._id}>{t.name} {t.surname}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '25px' }}>
            <button className="admin-submit-btn" onClick={handleSave} disabled={loading} style={{ width: 'auto', padding: '12px 40px' }}>
              {loading ? 'ინახება...' : 'განრიგის შენახვა'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendarManager; 