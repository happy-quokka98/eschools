"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useColor } from '../ColorContext';

interface SubjectObj {
  _id: string;
  name: string;
  subject_name?: string;
  is_project?: boolean;
  is_pass_fail?: boolean;
  type?: string;
}

interface AddSubjectFormProps {
  onAddSubject: (subject: string, isProject: boolean) => void;
  onCancel: () => void;
  subjects?: string[];
  subjectsList?: SubjectObj[];
  classes?: any[];
  onSubjectUpdated?: () => void;
}

const ALL_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const getGradeNumber = (cls: any): number => {
  if (typeof cls.grade === 'number' && cls.grade >= 1 && cls.grade <= 12) return cls.grade;
  const name = cls.classname || cls.name || '';
  const match = name.match(/^([0-9]+)/);
  if (match) return parseInt(match[1], 10);
  const romanMap: { [k: string]: number } = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
  const romanMatch = name.match(/^(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)/i);
  if (romanMatch) return romanMap[romanMatch[1].toUpperCase()] || 0;
  return 0;
};

const getGradeLabel = (g: number) => {
  if (g === 1) return '1-ლი კლასი';
  return `მე-${g} კლასი`;
};

// Official Georgian National Curriculum Grid Presets
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
    hours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 0, 11: 0, 12: 0 }
  },
  music: {
    label: 'მუსიკა',
    keywords: /მუსიკა/i,
    hours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 0, 11: 0, 12: 0 }
  },
  sport: {
    label: 'ფიზიკური აღზრდა და სპორტი',
    keywords: /სპორტი|ფიზიკური აღზრდა/i,
    hours: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2 }
  },
  chess: {
    label: 'ჭადრაკი',
    keywords: /ჭადრაკი/i,
    hours: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
  }
};

const AddSubjectForm: React.FC<AddSubjectFormProps> = ({
  onAddSubject,
  onCancel,
  subjects: stringSubjects = [],
  subjectsList = [],
  classes: passedClasses = [],
  onSubjectUpdated
}) => {
  const [subject, setSubject] = useState('');
  const [isProject, setIsProject] = useState(false);
  const { selectedColor } = useColor();

  const [classList, setClassList] = useState<any[]>(passedClasses);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubjectObj | null>(null);
  const [editName, setEditName] = useState('');
  const [editIsProject, setEditIsProject] = useState(false);
  
  // Grade Workloads: grade 1..12 -> hours_per_week
  const [gradeWorkloads, setGradeWorkloads] = useState<{ [grade: number]: number }>({});
  const [saving, setSaving] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);

  const handleAutofillAllWorkloads = async () => {
    if (!confirm('ნამდვილად გსურთ სკოლის ყველა საგნის საათობრივი დატვირთვის ავტომატურად შევსება ეროვნული სასწავლო გეგმის (ესგ) ოფიციალური ბადის მიხედვით?')) {
      return;
    }
    setAutofilling(true);
    try {
      const res = await fetch('/api/subject/autofill-all-workloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'ყველა საგნის დატვირთვა წარმატებით შეივსო!');
        if (onSubjectUpdated) onSubjectUpdated();
      } else {
        alert(data.message || 'ავტო-შევსება ვერ მოხერხდა');
      }
    } catch (err) {
      alert('შეცდომა ავტო-შევსების პროცესში');
    } finally {
      setAutofilling(false);
    }
  };

  useEffect(() => {
    if (passedClasses && passedClasses.length > 0) {
      setClassList(passedClasses);
    } else {
      fetch('/api/classes')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setClassList(data);
        })
        .catch(err => console.error('Error loading classes:', err));
    }
  }, [passedClasses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim()) {
      onAddSubject(subject.trim(), isProject);
      setSubject('');
      setIsProject(false);
    }
  };

  const openEditModal = (subj: SubjectObj) => {
    setEditTarget(subj);
    const targetName = subj.name || subj.subject_name || '';
    setEditName(targetName);
    const isProj = Boolean(subj.is_project || subj.is_pass_fail || subj.type === 'project' || /პროექტი|ჩათვლა|პროექტული/i.test(targetName));
    setEditIsProject(isProj);

    const normTargetName = targetName.trim().toLowerCase();

    // Group class workload by Grade (1..12)
    const initialGradeWorkloads: { [grade: number]: number } = {};
    ALL_GRADES.forEach(g => {
      initialGradeWorkloads[g] = 0;
    });

    classList.forEach((cls) => {
      const g = getGradeNumber(cls);
      if (g >= 1 && g <= 12) {
        const subjects: any[] = cls.subjects || [];
        const found = subjects.find((s: any) =>
          (typeof s === 'string' && s.trim().toLowerCase() === normTargetName) ||
          (typeof s === 'object' && s && (s.subject_name || s.name || '').trim().toLowerCase() === normTargetName)
        );

        if (found && typeof found === 'object' && typeof found.hours_per_week === 'number') {
          if (found.hours_per_week > initialGradeWorkloads[g]) {
            initialGradeWorkloads[g] = found.hours_per_week;
          }
        }
      }
    });

    setGradeWorkloads(initialGradeWorkloads);
    setEditModalOpen(true);
  };

  const handleApplyPresetAll = (hours: number) => {
    const next: { [grade: number]: number } = {};
    ALL_GRADES.forEach(g => {
      next[g] = hours;
    });
    setGradeWorkloads(next);
  };

  const handleApplyNationalCurriculumStandard = (presetKey?: string) => {
    let targetKey = presetKey;
    if (!targetKey) {
      // Auto detect by subject name
      const name = editName.trim().toLowerCase();
      for (const [key, config] of Object.entries(NATIONAL_CURRICULUM_PRESETS)) {
        if (config.keywords.test(name)) {
          targetKey = key;
          break;
        }
      }
    }

    if (targetKey && NATIONAL_CURRICULUM_PRESETS[targetKey]) {
      const preset = NATIONAL_CURRICULUM_PRESETS[targetKey];
      setGradeWorkloads({ ...preset.hours });
    } else {
      alert('ამ საგნისთვის ესგ სტანდარტის ავტომატური ამოცნობა ვერ მოხერხდა. გთხოვთ აირჩიოთ სიიდან.');
    }
  };

  const handleSaveSubject = async () => {
    if (!editTarget || !editName.trim()) return;
    setSaving(true);
    try {
      const oldName = editTarget.name || editTarget.subject_name || '';

      // 1. Update subject name & project status
      const res = await fetch('/api/subject/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: editTarget._id,
          name: editName.trim(),
          is_project: editIsProject,
          is_pass_fail: editIsProject
        })
      });

      if (!res.ok) {
        alert('საგნის განახლება ვერ მოხერხდა');
        setSaving(false);
        return;
      }

      // 2. Map grade workloads to all matching classes in database
      const workloadsPayload: { classId: string; hours_per_week: number }[] = [];
      classList.forEach((cls) => {
        const g = getGradeNumber(cls);
        const hrs = g >= 1 && g <= 12 ? (gradeWorkloads[g] || 0) : 0;
        workloadsPayload.push({
          classId: cls._id,
          hours_per_week: hrs
        });
      });

      const workloadRes = await fetch('/api/subject/update-workload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: editName.trim(),
          oldSubjectName: oldName,
          workloads: workloadsPayload
        })
      });

      if (workloadRes.ok) {
        if (onSubjectUpdated) onSubjectUpdated();
        setEditModalOpen(false);
      } else {
        alert('საგნის დატვირთვის განახლება ვერ მოხერხდა');
      }
    } catch (err) {
      alert('შეცდომა საგნის განახლებისას');
    } finally {
      setSaving(false);
    }
  };

  const allSubjectNames = Array.from(new Set([
    ...stringSubjects,
    ...subjectsList.map(s => s.name || s.subject_name || '')
  ])).filter(Boolean);

  return (
    <div className="admin-view-container animate-fade-in-down" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit} className="admin-form-container animate-zoom-in" style={{ width: '100%' }}>
        <h2 className="admin-form-title">საგნის დამატება</h2>
        <div className="admin-form-group">
          <label className="admin-label">საგანი</label>
          <input
            className="admin-input"
            type="text"
            placeholder="შეიყვანეთ საგანი"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            list="subjects-datalist"
          />
          <datalist id="subjects-datalist">
            {allSubjectNames.map((s, index) => (
              <option key={index} value={s} />
            ))}
          </datalist>
        </div>

        <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', marginBottom: '16px' }}>
          <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
            <input
              type="checkbox"
              checked={isProject}
              onChange={(e) => setIsProject(e.target.checked)}
              style={{ display: 'none' }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: isProject ? selectedColor : '#ccc',
              borderRadius: '24px',
              transition: '.4s'
            }}>
              <span style={{
                position: 'absolute',
                content: '""',
                height: '18px', width: '18px',
                left: isProject ? '25px' : '3px',
                bottom: '3px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '.4s'
              }}></span>
            </span>
          </label>
          <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: 700 }}>პროექტული (ჩათვლებიანი) საგანი</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button type="button" onClick={onCancel} className="admin-cancel-btn" style={{ flex: 1 }}>
            გაუქმება
          </button>
          <button type="submit" className="admin-submit-btn" style={{ background: '#2563eb', color: '#ffffff', margin: 0, flex: 1, fontWeight: 800 }}>
            დამატება
          </button>
        </div>
      </form>

      {/* List of existing subjects with edit buttons */}
      {subjectsList.length > 0 && (
        <div className="admin-form-container" style={{ width: '100%', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 className="admin-form-title" style={{ fontSize: '18px', margin: 0, color: '#0f172a', fontWeight: 900 }}>
              არსებული საგნების სია და რედაქტირება
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleAutofillAllWorkloads}
                disabled={autofilling}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: autofilling ? 'wait' : 'pointer',
                  opacity: autofilling ? 0.7 : 1,
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                }}
              >
                {autofilling ? 'იბეჭდება...' : '⚡ ყველა საგნის ავტო-შევსება (ესგ)'}
              </button>
              <button
                type="button"
                onClick={() => setShowCurriculumModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                }}
              >
                📋 ეროვნული სასწავლო გეგმის საათობრივი ბადე
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {subjectsList.map((subj) => {
              const isProj = Boolean(subj.is_project || subj.is_pass_fail || subj.type === 'project' || /პროექტი|ჩათვლა|პროექტული/i.test(subj.name || ''));
              return (
                <div key={subj._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '16px' }}>
                      {subj.name || subj.subject_name}
                    </span>
                    {isProj ? (
                      <span style={{ fontSize: '11px', background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed', padding: '4px 10px', borderRadius: '12px', fontWeight: 800 }}>
                        🎯 პროექტული (ჩათვლა)
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', padding: '4px 10px', borderRadius: '12px', fontWeight: 800 }}>
                        📊 სტანდარტული (0-10)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditModal(subj)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#2563eb',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ ჩასწორება / საათები
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Subject Modal with Grade Level Workload Grid (1 to 12) */}
      {editModalOpen && editTarget && typeof window !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 10, 25, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            borderRadius: '24px',
            padding: '28px',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            color: 'white',
            margin: 'auto',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#60a5fa' }}>
                ⚙️ საგნის ჩასწორება & საათობრივი დატვირთვა
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '6px' }}>
              {/* Subject Name & Type */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    საგნის დასახელება:
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="შეიყვანეთ საგნის სახელი"
                    className="admin-input"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: 600 }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: '220px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    საგნის ტიპი:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setEditIsProject(false)}
                      style={{
                        flex: 1,
                        padding: '10px 6px',
                        borderRadius: '10px',
                        border: !editIsProject ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.12)',
                        background: !editIsProject ? 'rgba(96, 165, 250, 0.25)' : 'rgba(255,255,255,0.04)',
                        color: !editIsProject ? '#60a5fa' : 'white',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      📊 სტანდარტული
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditIsProject(true)}
                      style={{
                        flex: 1,
                        padding: '10px 6px',
                        borderRadius: '10px',
                        border: editIsProject ? '2px solid #c084fc' : '1px solid rgba(255,255,255,0.12)',
                        background: editIsProject ? 'rgba(192, 132, 252, 0.25)' : 'rgba(255,255,255,0.04)',
                        color: editIsProject ? '#c084fc' : 'white',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      🎯 პროექტული
                    </button>
                  </div>
                </div>
              </div>

              {/* National Curriculum Preset Action Bar */}
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🇬🇪</span>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>ეროვნული სასწავლო გეგმის (ესგ) სტანდარტი</span>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>ავტომატური საათობრივი ბადის შევსება ოფიციალური სტანდარტით</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleApplyNationalCurriculumStandard(e.target.value);
                    }}
                    defaultValue=""
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      color: '#a7f3d0',
                      border: '1px solid rgba(52, 211, 153, 0.4)',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="" disabled>-- აირჩიეთ ესგ საგანი --</option>
                    {Object.entries(NATIONAL_CURRICULUM_PRESETS).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleApplyNationalCurriculumStandard()}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    title="ავტომატური ამოცნობა საგნის დასახელებით"
                  >
                    ⚡ ავტო-შევსება
                  </button>
                </div>
              </div>

              {/* Grade Workload Header & Presets (1 to 12) */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#38bdf8' }}>
                      📚 საათობრივი დატვირთვა კლასების მიხედვით (1 - 12)
                    </h4>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      (მიუთითეთ კვირეული საათები 1-დან 12 კლასამდე. 0 = არ ისწავლება)
                    </span>
                  </div>

                  {/* Preset quick actions */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', alignSelf: 'center', fontWeight: 700 }}>სწრაფი:</span>
                    {[0, 1, 2, 3, 4, 5].map(hrs => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() => handleApplyPresetAll(hrs)}
                        style={{
                          background: hrs === 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                          border: hrs === 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)',
                          color: hrs === 0 ? '#fca5a5' : '#7dd3fc',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {hrs === 0 ? '0 (ყველას)' : `${hrs} სთ`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid of 12 Grade Level Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
                  gap: '12px'
                }}>
                  {ALL_GRADES.map((g) => {
                    const currentHours = gradeWorkloads[g] ?? 0;
                    const isActive = currentHours > 0;
                    const matchingClasses = classList.filter(cls => getGradeNumber(cls) === g);
                    const matchingClassNames = matchingClasses.map(cls => cls.classname || cls.name).filter(Boolean).join(', ');

                    return (
                      <div
                        key={g}
                        style={{
                          background: isActive ? 'rgba(37, 99, 235, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: isActive ? '1px solid rgba(96, 165, 250, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '14px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span style={{ fontWeight: 900, fontSize: '15px', color: isActive ? '#60a5fa' : '#cbd5e1' }}>
                            {getGradeLabel(g)}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px', background: isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.15)', color: isActive ? '#4ade80' : '#94a3b8' }}>
                            {isActive ? `${currentHours} სთ` : '0'}
                          </span>
                        </div>

                        {matchingClassNames && (
                          <div style={{ fontSize: '10px', color: '#94a3b8', width: '100%', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`მოიცავს: ${matchingClassNames}`}>
                            📁 {matchingClassNames}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', marginTop: '2px' }}>
                          <button
                            type="button"
                            onClick={() => setGradeWorkloads(prev => ({ ...prev, [g]: Math.max(0, (prev[g] || 0) - 1) }))}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '8px',
                              background: 'rgba(255,255,255,0.1)',
                              border: 'none',
                              color: 'white',
                              fontWeight: 900,
                              fontSize: '15px',
                              cursor: 'pointer'
                            }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={currentHours}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              setGradeWorkloads(prev => ({ ...prev, [g]: Math.max(0, val) }));
                            }}
                            style={{
                              flex: 1,
                              width: '100%',
                              textAlign: 'center',
                              padding: '4px',
                              borderRadius: '8px',
                              background: 'rgba(0,0,0,0.35)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: isActive ? '#60a5fa' : '#94a3b8',
                              fontWeight: 900,
                              fontSize: '15px'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setGradeWorkloads(prev => ({ ...prev, [g]: (prev[g] || 0) + 1 }))}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '8px',
                              background: 'rgba(255,255,255,0.1)',
                              border: 'none',
                              color: 'white',
                              fontWeight: 900,
                              fontSize: '15px',
                              cursor: 'pointer'
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                onClick={handleSaveSubject}
                disabled={saving || !editName.trim()}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '15px',
                  cursor: saving ? 'wait' : 'pointer',
                  opacity: (!editName.trim() || saving) ? 0.6 : 1,
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
                }}
              >
                {saving ? 'ინახება...' : '💾 ცვლილებების შენახვა'}
              </button>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                disabled={saving}
                style={{
                  padding: '14px 20px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                გაუქმება
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Official Georgian National Curriculum Table Modal */}
      {showCurriculumModal && typeof window !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 10, 25, 0.88)',
          backdropFilter: 'blur(12px)',
          zIndex: 9999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            width: '100%',
            maxWidth: '1100px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            color: '#0f172a',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#1e293b' }}>
                  🇬🇪 ეროვნული სასწავლო გეგმის საათობრივი ბადე (ოფიციალური სტანდარტი)
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  საგნების კვირეული საათობრივი დატვირთვა 1-დან 12 კლასის ჩათვლით (I ს = I სემესტრი, II ს = II სემესტრი)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCurriculumModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#64748b',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontSize: '18px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#1e293b', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', minWidth: '220px', fontWeight: 900 }}>საგნების ჩამონათვალი</th>
                    {ALL_GRADES.map(g => (
                      <th key={g} style={{ padding: '10px 8px', fontWeight: 900, minWidth: '55px', background: g % 2 === 0 ? '#f1f5f9' : '#f8fafc' }}>
                        {g} კლ.
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(NATIONAL_CURRICULUM_PRESETS).map(([key, config], idx) => (
                    <tr key={key} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 800, color: '#0f172a' }}>
                        {config.label}
                      </td>
                      {ALL_GRADES.map(g => {
                        const val = config.hours[g] || 0;
                        return (
                          <td key={g} style={{ padding: '8px', fontWeight: val > 0 ? 900 : 400, color: val > 0 ? '#2563eb' : '#cbd5e1', background: val > 0 ? (g % 2 === 0 ? '#eff6ff' : '#f0f9ff') : 'transparent' }}>
                            {val > 0 ? val : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowCurriculumModal(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  background: '#2563eb',
                  border: 'none',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                დახურვა
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AddSubjectForm;