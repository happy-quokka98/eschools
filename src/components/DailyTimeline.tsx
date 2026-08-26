"use client";
import React, { useState, useEffect } from 'react';
import { useColor } from './ColorContext';
import { useQuery } from '@tanstack/react-query';
import { IoTimeOutline, IoCalendarOutline, IoBookOutline, IoPersonOutline, IoSparklesOutline } from 'react-icons/io5';

const TimeIcon = IoTimeOutline as React.ComponentType<any>;
const CalendarIcon = IoCalendarOutline as React.ComponentType<any>;
const BookIcon = IoBookOutline as React.ComponentType<any>;
const PersonIcon = IoPersonOutline as React.ComponentType<any>;

interface DailyTimelineProps {
  classId: string;
}

interface ClassEntry {
  _id: string;
  classname: string;
  calendar?: Array<Array<{ subject_id: string; teacher_id: string } | null> | null>;
}

interface Subject {
  _id: string;
  name: string;
}

interface Teacher {
  _id: string;
  name: string;
  surname: string;
}

interface CalendarEvent {
  _id?: string;
  date: string;
  type: 'holiday' | 'makeup';
  title: string;
  replacementDayOfWeek?: number;
}

// Lesson time slots definition
const timeSlots = [
  { period: 1, range: '09:00 - 09:45', startMin: 540, endMin: 585 },
  { period: 2, range: '09:55 - 10:40', startMin: 595, endMin: 640 },
  { period: 3, range: '10:50 - 11:35', startMin: 650, endMin: 695 },
  { period: 4, range: '11:55 - 12:40', startMin: 715, endMin: 760 },
  { period: 5, range: '12:50 - 13:35', startMin: 770, endMin: 815 },
  { period: 6, range: '13:45 - 14:30', startMin: 825, endMin: 870 },
  { period: 7, range: '14:40 - 15:25', startMin: 880, endMin: 925 },
];

const daysGeorgian = ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი'];

function formatDateLocal(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DailyTimeline: React.FC<DailyTimelineProps> = ({ classId }) => {
  const { selectedColor } = useColor();

  // Get current day of week (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const currentDayOfWeek = new Date().getDay();
  const initialDayIdx = currentDayOfWeek >= 1 && currentDayOfWeek <= 5 ? currentDayOfWeek - 1 : 0;
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(initialDayIdx);
  const [currentMinutes, setCurrentMinutes] = useState<number>(0);

  // Update current time minutes to detect active lesson slot
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  // Queries for classes, subjects, teachers, and calendar events
  const { data: classesList, isLoading: loadingClasses } = useQuery<ClassEntry[]>({
    queryKey: ['classes-list-timeline'],
    queryFn: async () => {
      const res = await fetch('/api/classes');
      if (!res.ok) throw new Error();
      return res.json();
    }
  });

  const { data: subjects, isLoading: loadingSubjects } = useQuery<Subject[]>({
    queryKey: ['subjects-list-timeline'],
    queryFn: async () => {
      const res = await fetch('/api/subjects');
      if (!res.ok) throw new Error();
      return res.json();
    }
  });

  const { data: teachers, isLoading: loadingTeachers } = useQuery<Teacher[]>({
    queryKey: ['teachers-list-timeline'],
    queryFn: async () => {
      const res = await fetch('/api/teacher/all');
      if (!res.ok) throw new Error();
      return res.json();
    }
  });

  const { data: calendarEvents, isLoading: loadingEvents } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events'],
    queryFn: async () => {
      const res = await fetch('/api/calendar-events');
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 10000
  });

  const classData = classesList?.find(c => c._id === classId);
  const isLoading = loadingClasses || loadingSubjects || loadingTeachers || loadingEvents;

  if (isLoading) {
    return <div style={{ color: '#666', textAlign: 'center', padding: '30px' }}>განრიგის ჩატვირთვა...</div>;
  }

  // Calculate actual date for the selected day in current week
  const getWeekDateStr = (dayIdx: number) => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...6=Sat
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diffToMon + dayIdx);
    return formatDateLocal(targetDate);
  };

  const selectedDateStr = getWeekDateStr(selectedDayIdx);
  const todayDateStr = formatDateLocal(new Date());

  // Check if today or selected date has a special calendar event (holiday / makeup)
  const currentEvent = calendarEvents?.find(e => e.date === selectedDateStr) || calendarEvents?.find(e => e.date === todayDateStr && currentDayOfWeek === 0 || currentDayOfWeek === 6);

  // Determine effective day schedule to load
  let effectiveDayIdx = selectedDayIdx;
  let isMakeupDay = false;
  let isHolidayDay = false;

  if (currentEvent) {
    if (currentEvent.type === 'holiday') {
      isHolidayDay = true;
    } else if (currentEvent.type === 'makeup' && currentEvent.replacementDayOfWeek !== undefined) {
      effectiveDayIdx = currentEvent.replacementDayOfWeek;
      isMakeupDay = true;
    }
  }

  // Get selected day's lessons array
  const dayLessons = isHolidayDay ? [] : (classData?.calendar?.[effectiveDayIdx] || []);

  return (
    <div style={{
      maxWidth: '800px',
      width: '100%',
      margin: '0 auto',
      padding: '16px',
      boxSizing: 'border-box',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Day Selector Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '12px',
        marginBottom: '24px',
        justifyContent: 'center'
      }}>
        {daysGeorgian.map((dayName, idx) => {
          const isSelected = selectedDayIdx === idx;
          const isToday = currentDayOfWeek - 1 === idx;
          const dateStr = getWeekDateStr(idx);
          const eventForDay = calendarEvents?.find(e => e.date === dateStr);

          return (
            <button
              key={idx}
              onClick={() => setSelectedDayIdx(idx)}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                backgroundColor: isSelected ? selectedColor : 'white',
                color: isSelected ? 'white' : isToday ? selectedColor : '#64748b',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: isSelected ? `0 4px 12px ${selectedColor}44` : '0 2px 8px rgba(0,0,0,0.03)',
                border: isToday && !isSelected ? `1px solid ${selectedColor}` : '1px solid transparent',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{dayName} {isToday && '• დღეს'}</span>
              {eventForDay?.type === 'holiday' && (
                <span title={`დასვენების დღე: ${eventForDay.title}`} style={{ fontSize: '11px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px' }}>უქმე</span>
              )}
              {eventForDay?.type === 'makeup' && (
                <span title={`აღდგენის დღე: ${eventForDay.title}`} style={{ fontSize: '11px', backgroundColor: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', padding: '2px 6px', borderRadius: '4px' }}>აღდგენა</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Special Day Banners */}
      {isHolidayDay && currentEvent && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2 0%, #ffe4e6 100%)',
          border: '1.5px solid #fecaca',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.08)'
        }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#991b1b', fontWeight: 800 }}>
            დასვენების დღე: {currentEvent.title}
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#b91c1c' }}>
            ამ დღეს სწავლა არ ტარდება.
          </p>
        </div>
      )}

      {isMakeupDay && currentEvent && (
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '1.5px solid #bae6fd',
          borderRadius: '16px',
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: '#0369a1',
          boxShadow: '0 4px 20px rgba(56, 189, 248, 0.1)'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '2px' }}>
              აღდგენის დღე: {currentEvent.title}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              გაკვეთილები ჩატარდება <strong>{daysGeorgian[currentEvent.replacementDayOfWeek ?? 0]}ს</strong> ცხრილით.
            </div>
          </div>
        </div>
      )}

      {/* Timeline Section */}
      {!isHolidayDay && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px 24px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <CalendarIcon size={22} style={{ color: selectedColor }} />
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>
              დღის განრიგი: {daysGeorgian[selectedDayIdx]}
              {isMakeupDay && currentEvent && (
                <span style={{ fontSize: '14px', color: '#0284c7', marginLeft: '8px', fontWeight: 600 }}>
                  ({daysGeorgian[currentEvent.replacementDayOfWeek ?? 0]}ს ცხრილი)
                </span>
              )}
            </h2>
          </div>

          {dayLessons.length === 0 ? (
            <div style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '30px' }}>
              გაკვეთილები არ არის დაგეგმილი
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* Vertical timeline connector line */}
              <div style={{
                position: 'absolute',
                left: '20px',
                top: '16px',
                bottom: '16px',
                width: '2px',
                backgroundColor: '#e2e8f0',
                zIndex: 1
              }} />

              {timeSlots.map((slot) => {
                const lessonEntry = dayLessons[slot.period - 1];
                const subjectData = subjects?.find(s => s._id === lessonEntry?.subject_id);
                const teacherData = teachers?.find(t => t._id === lessonEntry?.teacher_id);

                const isTodaySelected = currentDayOfWeek - 1 === selectedDayIdx;
                const isActive = isTodaySelected && currentMinutes >= slot.startMin && currentMinutes <= slot.endMin;
                const isPast = isTodaySelected && currentMinutes > slot.endMin;

                return (
                  <div key={slot.period} style={{
                    display: 'flex',
                    gap: '24px',
                    position: 'relative',
                    marginBottom: '20px',
                    zIndex: 2,
                    opacity: isPast ? 0.6 : 1
                  }}>
                    {/* Timeline Period Circle */}
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: isActive ? selectedColor : isPast ? '#e2e8f0' : 'white',
                      color: isActive ? 'white' : isPast ? '#64748b' : '#94a3b8',
                      border: isActive ? `none` : isPast ? '1px solid #cbd5e1' : `2px solid #e2e8f0`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '15px',
                      flexShrink: 0,
                      boxShadow: isActive ? `0 0 14px ${selectedColor}66` : 'none',
                      animation: isActive ? 'pulseGlow 2s infinite' : 'none'
                    }}>
                      {slot.period}
                    </div>

                    {/* Card Content */}
                    <div style={{
                      flex: 1,
                      background: isActive ? `${selectedColor}05` : '#f8fafc',
                      border: isActive ? `1.5px solid ${selectedColor}` : '1.5px solid #f1f5f9',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {lessonEntry ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
                              <BookIcon size={16} style={{ color: selectedColor }} />
                              <span>{subjectData ? subjectData.name : 'უცნობი საგანი'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                              <PersonIcon size={14} />
                              <span>მასწავლებელი: {teacherData ? `${teacherData.name} ${teacherData.surname}` : '—'}</span>
                            </div>
                          </>
                        ) : (
                          <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '14px' }}>
                            ფანჯარა / თავისუფალი
                          </div>
                        )}
                      </div>

                      {/* Time Slot display */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: isActive ? selectedColor : '#64748b',
                        fontWeight: isActive ? 700 : 500,
                        backgroundColor: isActive ? `${selectedColor}12` : 'rgba(0,0,0,0.03)',
                        padding: '4px 10px',
                        borderRadius: '20px'
                      }}>
                        <TimeIcon size={14} />
                        <span>{slot.range}</span>
                        {isActive && <span style={{ color: '#10b981', fontWeight: 'bold' }}> (მიმდინარეობს)</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CSS animation inline styling */}
      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 ${selectedColor}66; }
          70% { box-shadow: 0 0 0 10px ${selectedColor}00; }
          100% { box-shadow: 0 0 0 0 ${selectedColor}00; }
        }
      `}</style>
    </div>
  );
};

export default DailyTimeline;
