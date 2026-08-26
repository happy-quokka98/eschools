"use client";
import React from 'react';
import { useColor } from '../ColorContext';
import { useQuery } from '@tanstack/react-query';
import { IoWarningOutline, IoTrendingDownOutline, IoCalendarOutline, IoAlertCircleOutline } from 'react-icons/io5';

const WarningIcon = IoWarningOutline as React.ComponentType<any>;
const TrendingDownIcon = IoTrendingDownOutline as React.ComponentType<any>;
const CalendarIcon = IoCalendarOutline as React.ComponentType<any>;
const AlertCircleIcon = IoAlertCircleOutline as React.ComponentType<any>;

interface AtRiskListProps {
  classId: string;
  className: string;
}

interface Student {
  _id: string;
  name: string;
  surname: string;
  user_ID: string;
  classInfo?: {
    _id: string;
    classname: string;
  };
}

interface SemesterStats {
  average: number;
  total_points: number;
  count: number;
  valid_grades: number;
  attendance: number;
}

interface AnnualStats {
  average: number;
  total_points: number;
  count: number;
  valid_grades: number;
  attendance: number;
}

interface StudentStats {
  first_semester: SemesterStats;
  second_semester: SemesterStats;
  annual: AnnualStats;
}

interface BehaviorRecord {
  _id: string;
  student_id: string;
  type: 'positive' | 'negative';
  points: number;
  category: string;
}

const AtRiskList: React.FC<AtRiskListProps> = ({ classId, className }) => {
  const { selectedColor } = useColor();

  // 1. Fetch students in the class (we get all students and filter by classId on client)
  const { data: allStudents, isLoading: loadingStudents } = useQuery<Student[]>({
    queryKey: ['all-students'],
    queryFn: async () => {
      const response = await fetch('/api/student/all');
      if (!response.ok) throw new Error();
      return response.json();
    }
  });

  const studentsInClass = React.useMemo(() => {
    if (!allStudents) return [];
    return allStudents.filter(s => s.classInfo?._id === classId);
  }, [allStudents, classId]);

  // 2. Fetch class statistics
  const { data: classStats, isLoading: loadingStats } = useQuery<Record<string, StudentStats>>({
    queryKey: ['class-statistics', classId],
    queryFn: async () => {
      const response = await fetch(`/api/class-statistics?class_id=${classId}`);
      if (!response.ok) throw new Error();
      return response.json();
    },
    enabled: !!classId
  });

  // 3. Fetch behavior records in class
  const { data: classBehaviors, isLoading: loadingBehaviors } = useQuery<BehaviorRecord[]>({
    queryKey: ['class-behaviors', classId],
    queryFn: async () => {
      const response = await fetch(`/api/behaviors?class_id=${classId}`);
      if (!response.ok) throw new Error();
      return response.json();
    },
    enabled: !!classId
  });

  const isLoading = loadingStudents || loadingStats || loadingBehaviors;

  const atRiskStudents = React.useMemo(() => {
    if (!studentsInClass || !classStats) return [];

    const list: Array<{
      student: Student;
      average: number;
      absences: number;
      negBehaviors: number;
      flags: string[];
    }> = [];

    studentsInClass.forEach(s => {
      const stats = classStats[s.user_ID];
      const studentBehaviors = classBehaviors ? classBehaviors.filter(b => b.student_id === s.user_ID && b.type === 'negative') : [];
      
      const avg = stats?.annual?.average || 0;
      const att = stats?.annual?.attendance ?? 100;
      const absences = Math.max(0, 100 - att);
      const negBehaviors = studentBehaviors.length;

      const flags: string[] = [];
      if (avg > 0 && avg < 5.0) {
        flags.push(`დაბალი აკადემიური მოსწრება: ${avg.toFixed(1)}/10`);
      }
      if (absences > 15) {
        flags.push(`ხშირი გაცდენები: ${absences.toFixed(1)}%`);
      }
      if (negBehaviors >= 3) {
        flags.push(`დისციპლინური დარღვევები: ${negBehaviors} ჩანაწერი`);
      }

      if (flags.length > 0) {
        list.push({
          student: s,
          average: avg,
          absences,
          negBehaviors,
          flags
        });
      }
    });

    return list;
  }, [studentsInClass, classStats, classBehaviors]);

  if (isLoading) {
    return <div style={{ color: '#666', textAlign: 'center', padding: '30px' }}>მიმდინარეობს ანალიზი...</div>;
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
      border: '1px solid #f1f5f9',
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <WarningIcon size={24} style={{ color: '#ef4444' }} />
        <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>
          რისკ-ჯგუფის მოსწავლეები ({className})
        </h3>
      </div>

      {atRiskStudents.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#10b981',
          padding: '20px',
          background: 'rgba(16, 185, 129, 0.05)',
          borderRadius: '10px',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          კლასში რისკ-ჯგუფის მოსწავლეები არ ირიცხებიან
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {atRiskStudents.map(({ student, average, absences, negBehaviors, flags }) => (
            <div key={student._id} style={{
              background: 'rgba(239, 68, 68, 0.02)',
              border: '1px solid rgba(239, 68, 68, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {/* Header with Name */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                  {student.name} {student.surname}
                </div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  ID: {student.user_ID}
                </span>
              </div>

              {/* Warning Tags list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {flags.map((flag, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    color: '#ef4444',
                    fontWeight: 600
                  }}>
                    <AlertCircleIcon size={14} />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>

              {/* Stats overview */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '8px',
                paddingTop: '8px',
                borderTop: '1px dashed rgba(239, 68, 68, 0.1)',
                fontSize: '12px',
                color: '#64748b'
              }}>
                <div>წლიური საშუალო: <strong style={{ color: average < 5 ? '#ef4444' : '#334155' }}>{average > 0 ? average.toFixed(1) : '—'}</strong></div>
                <div>გაცდენები: <strong style={{ color: absences > 15 ? '#ef4444' : '#334155' }}>{absences.toFixed(1)}%</strong></div>
                <div>დარღვევები: <strong style={{ color: negBehaviors >= 3 ? '#ef4444' : '#334155' }}>{negBehaviors}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AtRiskList;
