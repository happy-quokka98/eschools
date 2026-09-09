"use client";
import React, { useState, useEffect } from 'react';
import { useColor } from '../ColorContext';
import { IoArrowBack, IoCalendarOutline, IoTrashOutline, IoSaveOutline } from 'react-icons/io5';

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string }>;
const CalendarIcon = IoCalendarOutline as React.FC<{ size?: number | string }>;
const TrashIcon = IoTrashOutline as React.FC<{ size?: number | string }>;
const SaveIcon = IoSaveOutline as React.FC<{ size?: number | string }>;

interface Teacher {
  _id: string;
  name: string;
  surname: string;
  user_ID?: string;
  subjects?: string[];
  availability?: boolean[][];
}

interface ClassSubject {
  subject_id: string;
  teacher_id: string;
  hours_per_week?: number;
}

interface CalendarEntry {
  subject_id: string;
  teacher_id: string;
}

type Calendar = CalendarEntry[][];

interface Class {
  _id: string;
  classname: string;
  name?: string;
  grade?: number;
  subjects?: ClassSubject[];
  calendar?: Calendar;
}

interface Subject {
  _id: string;
  name: string;
}

interface CalendarEventItem {
  _id: string;
  event_date: string;
  event_type: 'holiday' | 'makeup';
  title: string;
  replacement_day_of_week?: number; // 1 = Monday .. 5 = Friday
  academic_year?: string;
  created_at?: string;
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

const shuffleArray = <T,>(arr: T[]): T[] => {
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
};

const getGradeNumber = (cls: any): number => {
  if (!cls) return 0;
  if (typeof cls.grade === 'number' && cls.grade >= 1 && cls.grade <= 12) return cls.grade;
  const name = cls.classname || cls.name || '';
  const match = name.match(/^([0-9]+)/);
  if (match) return parseInt(match[1], 10);
  const romanMap: { [k: string]: number } = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
  const romanMatch = name.match(/^(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)/i);
  if (romanMatch) return romanMap[romanMatch[1].toUpperCase()] || 0;
  return 0;
};

const NATIONAL_CURRICULUM_PRESETS: { [key: string]: { label: string; keywords: RegExp; hours: { [grade: number]: number } } } = {
  georgian: {
    label: 'ქართული ენა და ლიტერატურა',
    keywords: /ქართული|ლიტერატურა/i,
    hours: { 1: 8, 2: 7, 3: 6, 4: 6, 5: 5, 6: 5, 7: 4, 8: 5, 9: 5, 10: 5, 11: 5, 12: 5 }
  },
  math: {
    label: 'მათემატიკა',
    keywords: /მათემატიკა|ალგებრა|გეომეტრია/i,
    hours: { 1: 6, 2: 5, 3: 5, 4: 5, 5: 5, 6: 4, 7: 5, 8: 5, 9: 5, 10: 5, 11: 5, 12: 5 }
  },
  foreign1: {
    label: 'პირველი უცხოური ენა (ინგლისური)',
    keywords: /ინგლისური|პირველი უცხოური|უცხო ენა/i,
    hours: { 1: 0, 2: 2, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 2, 10: 3, 11: 2, 12: 2 }
  },
  foreign2: {
    label: 'მეორე უცხოური ენა (რუსული / გერმანული / ფრანგული)',
    keywords: /რუსული|გერმანული|ფრანგული|მეორე უცხოური/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
  },
  me_da_sazogadoeba: {
    label: 'მე და საზოგადოება',
    keywords: /მე და საზოგადოება/i,
    hours: { 1: 0, 2: 0, 3: 2, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
  },
  chveni_saqartvelo: {
    label: 'ჩვენი საქართველო',
    keywords: /ჩვენი საქართველო/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 3, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
  },
  history_world: {
    label: 'მსოფლიოს ისტორია',
    keywords: /მსოფლიოს ისტორია|ისტორია/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 2, 9: 3, 10: 0, 11: 2, 12: 2 }
  },
  history_geo: {
    label: 'საქართველოს ისტორია',
    keywords: /საქართველოს ისტორია/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 0, 9: 0, 10: 3, 11: 2, 12: 2 }
  },
  geography: {
    label: 'გეოგრაფია',
    keywords: /გეოგრაფია/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
  },
  civics: {
    label: 'მოქალაქეობა',
    keywords: /მოქალაქეობა|სამოქალაქო/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
  },
  nature: {
    label: 'ბუნებისმეტყველება',
    keywords: /ბუნებისმეტყველება|ბუნება/i,
    hours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 3, 6: 3, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
  },
  biology: {
    label: 'ბიოლოგია',
    keywords: /ბიოლოგია/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
  },
  physics: {
    label: 'ფიზიკა',
    keywords: /ფიზიკა/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
  },
  chemistry: {
    label: 'ქიმია',
    keywords: /ქიმია/i,
    hours: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
  },
  ict: {
    label: 'კომპიუტერული ტექნოლოგიები (ისტ)',
    keywords: /კომპიუტერული|ისტ|ტექნოლოგიები/i,
    hours: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
  },
  art: {
    label: 'ხელოვნება (სახვითი)',
    keywords: /ხელოვნება|სახვითი/i,
    hours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 1, 8: 1, 9: 1, 10: 1, 11: 0, 12: 0 }
  },
  music: {
    label: 'მუსიკა',
    keywords: /მუსიკა/i,
    hours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 1, 8: 1, 9: 1, 10: 1, 11: 0, 12: 0 }
  },
  sport: {
    label: 'ფიზიკური აღზრდა და სპორტი',
    keywords: /სპორტი|ფიზიკური/i,
    hours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
  },
  chess: {
    label: 'ჭადრაკი',
    keywords: /ჭადრაკი/i,
    hours: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
  }
};

const resolveSubjectHoursForClass = (s: any, cls: any, subjects: Subject[]): number => {
  if (typeof s.hours_per_week === 'number' && s.hours_per_week > 0) {
    return s.hours_per_week;
  }

  const gradeNum = getGradeNumber(cls);
  const subjObj = subjects.find(sub => String(sub._id) === String(s.subject_id));
  const subjName = subjObj?.name || '';

  if (subjName && gradeNum > 0) {
    for (const presetKey of Object.keys(NATIONAL_CURRICULUM_PRESETS)) {
      const preset = NATIONAL_CURRICULUM_PRESETS[presetKey];
      if (preset.keywords.test(subjName)) {
        const presetHrs = preset.hours[gradeNum];
        if (typeof presetHrs === 'number' && presetHrs > 0) {
          return presetHrs;
        }
      }
    }
  }

  return 2;
};

const normTeacherId = (tid: any, allTeachers: Teacher[]): string => {
  if (!tid) return '';
  const s = String(tid);
  if (s === "000000000000000000000000") return '';
  const found = allTeachers.find(t => String(t._id) === s || (t.user_ID && String(t.user_ID) === s));
  return found ? String(found._id) : s;
};

const getEffectiveSubjectsForClass = (
  cls: any,
  globalSubjects: Subject[],
  allTeachers: Teacher[]
): { subject_id: string; teacher_id: string; hours_per_week: number }[] => {
  const existingSubjects: any[] = cls?.subjects || [];

  if (Array.isArray(existingSubjects) && existingSubjects.length > 0) {
    return existingSubjects.map((s: any) => {
      let tid = normTeacherId(s.teacher_id, allTeachers);
      const subjObj = globalSubjects.find(sub => String(sub._id) === String(s.subject_id));
      const subjName = subjObj?.name || '';

      if (!tid && subjName) {
        const matchingTeacher = allTeachers.find(t =>
          t.subjects?.some(sName =>
            sName.toLowerCase().includes(subjName.toLowerCase()) ||
            subjName.toLowerCase().includes(sName.toLowerCase())
          )
        );
        if (matchingTeacher) tid = String(matchingTeacher._id);
        else if (allTeachers.length > 0) tid = String(allTeachers[0]._id);
      }

      return {
        subject_id: String(s.subject_id),
        teacher_id: tid || '',
        hours_per_week: resolveSubjectHoursForClass(s, cls, globalSubjects)
      };
    }).filter(s => s.hours_per_week > 0);
  }

  const generatedSubjects: { subject_id: string; teacher_id: string; hours_per_week: number }[] = [];

  for (const sub of globalSubjects) {
    const hrs = resolveSubjectHoursForClass({ subject_id: sub._id }, cls, globalSubjects);
    if (hrs > 0) {
      const matchingTeacher = allTeachers.find(t =>
        t.subjects?.some(sName =>
          sName.toLowerCase().includes(sub.name.toLowerCase()) ||
          sub.name.toLowerCase().includes(sName.toLowerCase())
        )
      ) || (allTeachers.length > 0 ? allTeachers[0] : null);

      generatedSubjects.push({
        subject_id: String(sub._id),
        teacher_id: matchingTeacher ? String(matchingTeacher._id) : '',
        hours_per_week: hrs
      });
    }
  }

  return generatedSubjects;
};

const AdminCalendarManager: React.FC<AdminCalendarManagerProps> = ({ teachers, classes: initialClasses, subjects, onBack, showPopup }) => {
  const [classesList, setClassesList] = useState<Class[]>(initialClasses);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<Calendar>(Array(5).fill(null).map(() => Array(lessonsPerDay).fill({ subject_id: '', teacher_id: '' })));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setClassesList(initialClasses);
  }, [initialClasses]);

  // Teacher Availability State
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedTeacherForAvail, setSelectedTeacherForAvail] = useState<string>('');
  const [teacherAvailGrid, setTeacherAvailGrid] = useState<boolean[][]>(
    Array(5).fill(null).map(() => Array(lessonsPerDay).fill(true))
  );
  const [savingAvail, setSavingAvail] = useState(false);

  // Load calendar when class selection changes
  useEffect(() => {
    if (!selectedClassId) {
      setCalendar(Array(5).fill(null).map(() => Array(lessonsPerDay).fill({ subject_id: '', teacher_id: '' })));
      return;
    }

    const currentClass = classesList.find(c => c._id === selectedClassId);
    if (currentClass && currentClass.calendar && Array.isArray(currentClass.calendar) && currentClass.calendar.length === 5) {
      const formattedCal = currentClass.calendar.map(dayArr => {
        if (!Array.isArray(dayArr)) return Array(lessonsPerDay).fill({ subject_id: '', teacher_id: '' });
        const padded = [...dayArr];
        while (padded.length < lessonsPerDay) {
          padded.push({ subject_id: '', teacher_id: '' });
        }
        return padded.slice(0, lessonsPerDay);
      });
      setCalendar(formattedCal);
    } else {
      setCalendar(Array(5).fill(null).map(() => Array(lessonsPerDay).fill({ subject_id: '', teacher_id: '' })));
    }
  }, [selectedClassId, classesList]);

  const handleCellChange = (dayIdx: number, lessonIdx: number, field: 'subject_id' | 'teacher_id', value: string) => {
    setCalendar(prev => {
      const updated = prev.map(row => [...row]);
      const currentCell = { ...updated[dayIdx][lessonIdx] };

      if (field === 'subject_id') {
        currentCell.subject_id = value;
        const currentClassObj = classesList.find(c => c._id === selectedClassId);
        const assignedSubject = currentClassObj?.subjects?.find(s => String(s.subject_id) === String(value));
        if (assignedSubject && assignedSubject.teacher_id) {
          currentCell.teacher_id = String(assignedSubject.teacher_id);
        } else {
          currentCell.teacher_id = '';
        }
      } else {
        currentCell.teacher_id = value;
      }

      updated[dayIdx][lessonIdx] = currentCell;
      return updated;
    });
  };

  const handleSaveCalendar = async () => {
    if (!selectedClassId) {
      showPopup('გთხოვთ ჯერ აირჩიოთ კლასი', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/class/set-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClassId,
          calendar: calendar,
        }),
      });

      if (res.ok) {
        showPopup('კალენდარი წარმატებით შენახულია!', 'success');
        setClassesList(prev => prev.map(c => c._id === selectedClassId ? { ...c, calendar } : c));
      } else {
        const data = await res.json();
        showPopup(data.message || 'შენახვა ვერ მოხერხდა', 'error');
      }
    } catch (err) {
      showPopup('სერვერთან დაკავშირება ვერ მოხერხდა', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCurrentClassCalendar = async () => {
    if (!selectedClassId) return;
    if (!confirm('ნამდვილად გსურთ არჩეული კლასის განრიგის სრულად წაშლა/გასუფთავება?')) return;
    setLoading(true);
    try {
      const emptyCal = Array(5).fill(null).map(() => Array(lessonsPerDay).fill({ subject_id: '', teacher_id: '' }));
      const res = await fetch('/api/class/set-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClassId,
          calendar: emptyCal,
        }),
      });

      if (res.ok) {
        showPopup('არჩეული კლასის ცხრილი წარმატებით გასუფთავდა!', 'success');
        setCalendar(emptyCal);
        setClassesList(prev => prev.map(c => c._id === selectedClassId ? { ...c, calendar: emptyCal } : c));
      } else {
        showPopup('გასუფთავება ვერ მოხერხდა', 'error');
      }
    } catch (err) {
      showPopup('შეცდომა გასუფთავებისას', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllClassesCalendars = async () => {
    if (!confirm('⚠️ ყურადღება! ნამდვილად გსურთ სკოლის ყველა კლასის განრიგის სრულად წაშლა/გასუფთავება?')) return;
    setLoading(true);
    try {
      const emptyCal = Array(5).fill(null).map(() => Array(lessonsPerDay).fill({ subject_id: '', teacher_id: '' }));
      const emptyCalendarsMap: Record<string, CalendarEntry[][]> = {};
      classesList.forEach(cls => {
        emptyCalendarsMap[cls._id] = emptyCal;
      });

      const res = await fetch('/api/class/set-calendars-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendars: emptyCalendarsMap })
      });

      if (res.ok) {
        showPopup('🚀 სკოლის ყველა კლასის განრიგი წარმატებით წაიშალა/გასუფთავდა!', 'success');
        setCalendar(emptyCal);
        setClassesList(prev => prev.map(c => ({ ...c, calendar: emptyCal })));
      } else {
        showPopup('ყველა კლასის გასუფთავება ვერ მოხერხდა', 'error');
      }
    } catch (err) {
      showPopup('შეცდომა გასუფთავებისას', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openTeacherAvailModal = (teacherId: string) => {
    setSelectedTeacherForAvail(teacherId);
    const target = teachers.find(t => t._id === teacherId || t.user_ID === teacherId);
    if (target && (target as any).availability && Array.isArray((target as any).availability) && (target as any).availability.length === 5) {
      setTeacherAvailGrid((target as any).availability);
    } else {
      setTeacherAvailGrid(Array(5).fill(null).map(() => Array(lessonsPerDay).fill(true)));
    }
  };

  const handleSaveTeacherAvail = async () => {
    if (!selectedTeacherForAvail) {
      showPopup('აირჩიეთ მასწავლებელი', 'error');
      return;
    }
    setSavingAvail(true);
    try {
      const res = await fetch('/api/teacher/update-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: selectedTeacherForAvail,
          availability: teacherAvailGrid
        })
      });
      if (res.ok) {
        showPopup('მასწავლებლის ხელმისაწვდომობა შენახულია!', 'success');
        setShowAvailabilityModal(false);
      } else {
        showPopup('შენახვა ვერ მოხერხდა', 'error');
      }
    } catch (err) {
      showPopup('შეცდომა შენახვისას', 'error');
    } finally {
      setSavingAvail(false);
    }
  };

  const sortedAndFilteredClasses = [...classesList]
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

      {/* Class Select & Action Buttons Bar */}
      <div className="admin-form-container" style={{ width: '100%', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <label className="admin-label">აირჩიეთ კლასი:</label>
                <select
                  className="admin-input"
                  value={selectedClassId || ''}
                  onChange={(e) => setSelectedClassId(e.target.value || null)}
                >
                  <option value="">-- აირჩიეთ კლასი --</option>
                  {sortedAndFilteredClasses.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.classname}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowAvailabilityModal(true)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="მასწავლებლების თავისუფალი/დაკავებული დღეების და საათების მართვა"
                >
                  ⚙️ მასწავლებლის საათები/დღეები
                </button>
              </div>
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
                      const currentClassObj = classesList.find(c => c._id === selectedClassId);
                      const classSubjectIds = currentClassObj?.subjects?.map(s => s.subject_id.toString()) || [];
                      const filteredClassSubjects = subjects.filter(sub => classSubjectIds.includes(sub._id.toString()));

                      return (
                        <tr key={lessonIdx}>
                          <td style={{ textAlign: 'center', fontWeight: '800', opacity: 0.5 }}>{lessonIdx + 1}</td>
                          {days.map((_, dayIdx) => {
                            const cellSubjectId = calendar[dayIdx][lessonIdx]?.subject_id;
                            const allowedTeacherIds = currentClassObj?.subjects
                              ?.filter(s => String(s.subject_id) === String(cellSubjectId))
                              .map(s => String(s.teacher_id)) || [];
                            const filteredClassTeachers = teachers.filter(t =>
                              allowedTeacherIds.includes(String(t._id)) || (t.user_ID && allowedTeacherIds.includes(String(t.user_ID)))
                            );

                            return (
                              <td key={dayIdx} style={{ minWidth: '180px', padding: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  <select
                                    className="admin-input"
                                    style={{ fontSize: '13px', padding: '6px', margin: 0, fontWeight: 700 }}
                                    value={cellSubjectId || ''}
                                    onChange={(e) => handleCellChange(dayIdx, lessonIdx, 'subject_id', e.target.value)}
                                  >
                                    <option value="">-- საგანი --</option>
                                    {filteredClassSubjects.map(sub => (
                                      <option key={sub._id} value={sub._id}>
                                        {sub.name}
                                      </option>
                                    ))}
                                  </select>

                                  <select
                                    className="admin-input"
                                    style={{ fontSize: '12px', padding: '4px', margin: 0, opacity: cellSubjectId ? 1 : 0.4 }}
                                    value={calendar[dayIdx][lessonIdx]?.teacher_id || ''}
                                    onChange={(e) => handleCellChange(dayIdx, lessonIdx, 'teacher_id', e.target.value)}
                                    disabled={!cellSubjectId}
                                  >
                                    <option value="">-- მასწავლებელი --</option>
                                    {filteredClassTeachers.map(t => (
                                      <option key={t._id} value={t._id}>
                                        {t.name} {t.surname}
                                      </option>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleClearCurrentClassCalendar}
                  disabled={loading}
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <TrashIcon size={18} />
                  ამ კლასის ცხრილის გასუფთავება
                </button>

                <button
                  type="button"
                  className="admin-submit-btn"
                  style={{ background: '#2563eb', color: '#ffffff', width: 'auto', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={handleSaveCalendar}
                  disabled={loading}
                >
                  <SaveIcon size={18} />
                  {loading ? 'ინახება...' : 'განრიგის შენახვა'}
                </button>
              </div>
            </div>
          )}

      {/* Teacher Availability Modal */}
      {showAvailabilityModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>⚙️ მასწავლებლის ხელმისაწვდომობა</h3>
              <button onClick={() => setShowAvailabilityModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="admin-label">აირჩიეთ მასწავლებელი:</label>
              <select
                className="admin-input"
                value={selectedTeacherForAvail}
                onChange={e => openTeacherAvailModal(e.target.value)}
              >
                <option value="">-- აირჩიეთ --</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.name} {t.surname}
                  </option>
                ))}
              </select>
            </div>

            {selectedTeacherForAvail && (
              <>
                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                  დააჭირეთ უჯრებს იმ საათების მოსანიშნად, როცა მასწავლებელი <b>თავისუფალია (მწვანე)</b> ან <b>დაკავებულია/არ სცალია (წითელი)</b>:
                </p>

                <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px', border: '1px solid #cbd5e1' }}>#</th>
                        {days.map((d, i) => (
                          <th key={i} style={{ padding: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}>{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(lessonsPerDay)].map((_, lessonIdx) => (
                        <tr key={lessonIdx}>
                          <td style={{ padding: '6px', border: '1px solid #cbd5e1', fontWeight: 800 }}>{lessonIdx + 1}</td>
                          {days.map((_, dayIdx) => {
                            const isFree = teacherAvailGrid[dayIdx]?.[lessonIdx] ?? true;
                            return (
                              <td
                                key={dayIdx}
                                onClick={() => {
                                  setTeacherAvailGrid(prev => {
                                    const updated = prev.map(row => [...row]);
                                    updated[dayIdx][lessonIdx] = !isFree;
                                    return updated;
                                  });
                                }}
                                style={{
                                  padding: '10px',
                                  border: '1px solid #cbd5e1',
                                  background: isFree ? '#dcfce7' : '#fee2e2',
                                  color: isFree ? '#15803d' : '#b91c1c',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  userSelect: 'none'
                                }}
                              >
                                {isFree ? '✓ ეცლება' : '✕ დაკავებული'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowAvailabilityModal(false)} className="admin-cancel-btn">გაუქმება</button>
              <button
                onClick={handleSaveTeacherAvail}
                disabled={savingAvail || !selectedTeacherForAvail}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {savingAvail ? 'ინახება...' : 'შენახვა'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendarManager;