"use client";
import React, { useState, useEffect } from 'react';
import { IoArrowBack, IoCalendarOutline, IoTrashOutline, IoAddCircleOutline, IoAlertCircleOutline, IoCheckmarkCircleOutline, IoFilterOutline } from 'react-icons/io5';

const ArrowLeftIcon = IoArrowBack as React.ComponentType<any>;
const CalendarIcon = IoCalendarOutline as React.ComponentType<any>;
const TrashIcon = IoTrashOutline as React.ComponentType<any>;
const AddIcon = IoAddCircleOutline as React.ComponentType<any>;
const FilterIcon = IoFilterOutline as React.ComponentType<any>;

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

interface ClassSubject {
  subject_id: string;
  teacher_id: string;
}

interface Class {
  _id: string;
  classname: string;
  subjects?: ClassSubject[];
}

interface CalendarEntry {
  subject_id: string;
  teacher_id: string;
}

type Calendar = CalendarEntry[][];

export interface CalendarEventItem {
  _id?: string;
  date: string;
  type: 'holiday' | 'makeup';
  title: string;
  replacementDayOfWeek?: number;
  academicYear?: string;
}

interface AdminCalendarManagerProps {
  teachers: Teacher[];
  classes: Class[];
  subjects: Subject[];
  onBack: () => void;
  showPopup: (msg: string, type: 'success' | 'error') => void;
}

const days = ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი'];
const lessonsPerDay = 7;

function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 8 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

const availableAcademicYears = [
  '2024-2025',
  '2025-2026',
  '2026-2027',
  '2027-2028',
];

const AdminCalendarManager: React.FC<AdminCalendarManagerProps> = ({ teachers, classes, subjects, onBack, showPopup }) => {
  const [activeTab, setActiveTab] = useState<'timetable' | 'events'>('timetable');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<Calendar>(Array(5).fill(null).map(() => Array(lessonsPerDay).fill({ subject_id: '', teacher_id: '' })));
  const [loading, setLoading] = useState(false);

  // Special Calendar Events (Holidays & Makeup days) State
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(getCurrentAcademicYear());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState<'holiday' | 'makeup'>('holiday');
  const [eventTitle, setEventTitle] = useState('');
  const [replacementDayOfWeek, setReplacementDayOfWeek] = useState<number>(0);
  const [submittingEvent, setSubmittingEvent] = useState(false);

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const url = selectedAcademicYear === 'all'
        ? '/api/calendar-events'
        : `/api/calendar-events?academic_year=${encodeURIComponent(selectedAcademicYear)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data);
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedAcademicYear]);

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

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate || !eventTitle.trim()) {
      showPopup('გთხოვთ მიუთითოთ თარიღი და დასახელება', 'error');
      return;
    }

    setSubmittingEvent(true);
    try {
      const res = await fetch('/api/calendar-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: eventDate,
          type: eventType,
          title: eventTitle.trim(),
          replacementDayOfWeek: eventType === 'makeup' ? replacementDayOfWeek : undefined,
          academicYear: selectedAcademicYear !== 'all' ? selectedAcademicYear : undefined,
        }),
      });

      if (res.ok) {
        showPopup('დღის სტატუსი წარმატებით დაემატა/განახლდა!', 'success');
        setEventDate('');
        setEventTitle('');
        fetchEvents();
      } else {
        const data = await res.json();
        showPopup(data.message || 'შეცდომა დღის დამატებისას', 'error');
      }
    } catch (err) {
      showPopup('სერვერთან დაკავშირება ვერ მოხერხდა', 'error');
    } finally {
      setSubmittingEvent(false);
    }
  };

  const handleDeleteEvent = async (date: string) => {
    if (!confirm(`ნამდვილად გსურთ ${date} თარიღის მოვლენის წაშლა?`)) return;

    try {
      const res = await fetch(`/api/calendar-events?date=${encodeURIComponent(date)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showPopup('მოვლენა წარმატებით წაიშალა', 'success');
        fetchEvents();
      } else {
        showPopup('მოვლენის წაშლა ვერ მოხერხდა', 'error');
      }
    } catch (err) {
      showPopup('შეცდომა წაშლისას', 'error');
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
        <h2 className="admin-view-title">კალენდრისა და განრიგის მართვა</h2>
      </header>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'center' }}>
        <button
          onClick={() => setActiveTab('timetable')}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: activeTab === 'timetable' ? '#3b82f6' : 'rgba(255,255,255,0.08)',
            color: 'white',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'timetable' ? '0 4px 14px rgba(59,130,246,0.4)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <CalendarIcon size={18} />
          კლასების განრიგი
        </button>
        <button
          onClick={() => setActiveTab('events')}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: activeTab === 'events' ? '#8b5cf6' : 'rgba(255,255,255,0.08)',
            color: 'white',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'events' ? '0 4px 14px rgba(139,92,246,0.4)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <CalendarIcon size={18} />
          დასვენების & აღდგენის დღეები
        </button>
      </div>

      {activeTab === 'timetable' ? (
        <>
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
                    {[...Array(lessonsPerDay)].map((_, lessonIdx) => {
                      const currentClassObj = classes.find(c => c._id === selectedClassId);
                      const classSubjectIds = currentClassObj?.subjects?.map(s => s.subject_id.toString()) || [];
                      const filteredClassSubjects = subjects.filter(sub => classSubjectIds.includes(sub._id.toString()));

                      return (
                        <tr key={lessonIdx}>
                          <td style={{ textAlign: 'center', fontWeight: '800', opacity: 0.5 }}>{lessonIdx + 1}</td>
                          {days.map((_, dayIdx) => {
                            const cellSubjectId = calendar[dayIdx][lessonIdx]?.subject_id;
                            const allowedTeacherIds = currentClassObj?.subjects
                              ?.filter(s => s.subject_id.toString() === cellSubjectId?.toString())
                              .map(s => s.teacher_id.toString()) || [];
                            const filteredClassTeachers = teachers.filter(t => allowedTeacherIds.includes(t._id.toString()));

                            return (
                              <td key={dayIdx} style={{ minWidth: '180px', padding: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  <select
                                    className="calendar-select"
                                    value={calendar[dayIdx][lessonIdx]?.subject_id || ''}
                                    onChange={e => {
                                      handleCellChange(dayIdx, lessonIdx, 'subject_id', e.target.value);
                                      handleCellChange(dayIdx, lessonIdx, 'teacher_id', '');
                                    }}
                                  >
                                    <option value=''>საგანი</option>
                                    {filteredClassSubjects.map(sub => (
                                      <option key={sub._id} value={sub._id}>{sub.name}</option>
                                    ))}
                                  </select>
                                  <select
                                    className="calendar-select"
                                    value={calendar[dayIdx][lessonIdx]?.teacher_id || ''}
                                    onChange={e => handleCellChange(dayIdx, lessonIdx, 'teacher_id', e.target.value)}
                                    disabled={!cellSubjectId}
                                  >
                                    <option value=''>მასწავლებელი</option>
                                    {filteredClassTeachers.map(t => (
                                      <option key={t._id} value={t._id}>{t.name} {t.surname}</option>
                                    ))}
                                  </select>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
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
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-zoom-in">
          {/* Year Filter Header */}
          <div className="admin-form-container" style={{ maxWidth: 'none', padding: '20px 25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FilterIcon size={20} style={{ color: '#8b5cf6' }} />
              <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '15px' }}>სასწავლო წელი:</span>
              <select
                className="admin-select"
                style={{ width: 'auto', minWidth: '180px' }}
                value={selectedAcademicYear}
                onChange={e => setSelectedAcademicYear(e.target.value)}
              >
                <option value="all">ყველა წელი</option>
                {availableAcademicYears.map(yr => (
                  <option key={yr} value={yr}>{yr} სასწავლო წელი</option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              ყოველ სასწავლო წელს აქვს თავისი უნიკალური დასვენებისა და აღდგენის განრიგი.
            </div>
          </div>

          {/* Add / Edit Form Card */}
          <div className="admin-form-container" style={{ maxWidth: 'none', padding: '25px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AddIcon size={22} style={{ color: '#8b5cf6' }} />
              ახალი სპეციალური დღის დამატება ({selectedAcademicYear !== 'all' ? `${selectedAcademicYear} წელი` : 'მიმდინარე წელი'})
            </h3>

            <form onSubmit={handleAddEvent} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div>
                <label className="admin-label">თარიღი:</label>
                <input
                  type="date"
                  className="admin-input"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="admin-label">დღის სტატუსი / ტიპი:</label>
                <select
                  className="admin-select"
                  value={eventType}
                  onChange={e => setEventType(e.target.value as 'holiday' | 'makeup')}
                >
                  <option value="holiday">დასვენების დღე (უქმე)</option>
                  <option value="makeup">აღდგენის დღე (სასწავლო)</option>
                </select>
              </div>

              {eventType === 'makeup' && (
                <div>
                  <label className="admin-label">რომელი დღის ცხრილით აღდგება:</label>
                  <select
                    className="admin-select"
                    value={replacementDayOfWeek}
                    onChange={e => setReplacementDayOfWeek(Number(e.target.value))}
                  >
                    {days.map((dayName, idx) => (
                      <option key={idx} value={idx}>{dayName} (ცხრილი #{idx + 1})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="admin-label">დასახელება / მიზეზი:</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="მაგ. გიორგობა, ოთხშაბათის აღდგენა"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="admin-submit-btn"
                  disabled={submittingEvent}
                  style={{ width: '100%', height: '46px', padding: 0 }}
                >
                  {submittingEvent ? 'ინახება...' : 'შენახვა'}
                </button>
              </div>
            </form>
          </div>

          {/* Special Events List Card */}
          <div className="admin-list-container">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f8fafc' }}>
              დამატებული დასვენების და აღდგენის დღეები ({calendarEvents.length})
            </h3>

            {eventsLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>იტვირთება...</div>
            ) : calendarEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontStyle: 'italic' }}>
                სპეციალური დღეები არ არის დამატებული არჩეული წლისთვის ({selectedAcademicYear})
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>სასწავლო წელი</th>
                      <th>თარიღი</th>
                      <th>ტიპი</th>
                      <th>დასახელება / მიზეზი</th>
                      <th>აღდგენის ცხრილი</th>
                      <th style={{ textAlign: 'center' }}>მოქმედება</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calendarEvents.map((evt) => (
                      <tr key={evt.date}>
                        <td>
                          <span style={{
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            color: '#94a3b8',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}>
                            {evt.academicYear || 'საერთო'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#f8fafc' }}>{evt.date}</td>
                        <td>
                          {evt.type === 'holiday' ? (
                            <span style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              დასვენება
                            </span>
                          ) : (
                            <span style={{
                              backgroundColor: 'rgba(139, 92, 246, 0.15)',
                              color: '#a78bfa',
                              border: '1px solid rgba(139, 92, 246, 0.3)',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              აღდგენა
                            </span>
                          )}
                        </td>
                        <td style={{ color: '#e2e8f0' }}>{evt.title}</td>
                        <td>
                          {evt.type === 'makeup' && evt.replacementDayOfWeek !== undefined ? (
                            <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                              {days[evt.replacementDayOfWeek]}
                            </span>
                          ) : (
                            <span style={{ color: '#64748b' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteEvent(evt.date)}
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          >
                            <TrashIcon size={14} /> წაშლა
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendarManager;