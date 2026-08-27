"use client";
import React, { useState } from 'react';
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
  onSubjectUpdated?: () => void;
}

const AddSubjectForm: React.FC<AddSubjectFormProps> = ({
  onAddSubject,
  onCancel,
  subjects: stringSubjects = [],
  subjectsList = [],
  onSubjectUpdated
}) => {
  const [subject, setSubject] = useState('');
  const [isProject, setIsProject] = useState(false);
  const { selectedColor } = useColor();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubjectObj | null>(null);
  const [editName, setEditName] = useState('');
  const [editIsProject, setEditIsProject] = useState(false);
  const [saving, setSaving] = useState(false);

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
    setEditName(subj.name || subj.subject_name || '');
    const isProj = Boolean(subj.is_project || subj.is_pass_fail || subj.type === 'project' || /პროექტი|ჩათვლა|პროექტული/i.test(subj.name || ''));
    setEditIsProject(isProj);
    setEditModalOpen(true);
  };

  const handleSaveSubject = async () => {
    if (!editTarget || !editName.trim()) return;
    setSaving(true);
    try {
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
      if (res.ok) {
        if (onSubjectUpdated) onSubjectUpdated();
        setEditModalOpen(false);
      } else {
        alert('საგნის განახლება ვერ მოხერხდა');
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
          <span style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>პროექტული (ჩათვლებიანი) საგანი</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button type="button" onClick={onCancel} className="admin-cancel-btn" style={{ flex: 1 }}>
            გაუქმება
          </button>
          <button type="submit" className="admin-submit-btn" style={{ background: selectedColor, margin: 0, flex: 1 }}>
            დამატება
          </button>
        </div>
      </form>

      {/* List of existing subjects with edit buttons */}
      {subjectsList.length > 0 && (
        <div className="admin-form-container" style={{ width: '100%' }}>
          <h3 className="admin-form-title" style={{ fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '20px' }}>
            არსებული საგნების სია და რედაქტირება
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {subjectsList.map((subj) => {
              const isProj = Boolean(subj.is_project || subj.is_pass_fail || subj.type === 'project' || /პროექტი|ჩათვლა|პროექტული/i.test(subj.name || ''));
              return (
                <div key={subj._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>
                      {subj.name || subj.subject_name}
                    </span>
                    {isProj ? (
                      <span style={{ fontSize: '11px', background: 'rgba(192, 132, 252, 0.2)', border: '1px solid rgba(192, 132, 252, 0.4)', color: '#c084fc', padding: '3px 8px', borderRadius: '12px', fontWeight: 700 }}>
                        🎯 პროექტული (ჩათვლა)
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', background: 'rgba(96, 165, 250, 0.15)', border: '1px solid rgba(96, 165, 250, 0.3)', color: '#60a5fa', padding: '3px 8px', borderRadius: '12px', fontWeight: 700 }}>
                        📊 სტანდარტული (0-10)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditModal(subj)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ ჩასწორება
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
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
            borderRadius: '20px',
            padding: '28px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            color: 'white',
            margin: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#60a5fa' }}>
                ⚙️ საგნის ჩასწორება
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  fontSize: '15px',
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
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

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  საგნის ტიპი (შეფასების სისტემა):
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEditIsProject(false)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: '10px',
                      border: !editIsProject ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.12)',
                      background: !editIsProject ? 'rgba(96, 165, 250, 0.25)' : 'rgba(255,255,255,0.04)',
                      color: !editIsProject ? '#60a5fa' : 'white',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    📊 სტანდარტული (0-10)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIsProject(true)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: '10px',
                      border: editIsProject ? '2px solid #c084fc' : '1px solid rgba(255,255,255,0.12)',
                      background: editIsProject ? 'rgba(192, 132, 252, 0.25)' : 'rgba(255,255,255,0.04)',
                      color: editIsProject ? '#c084fc' : 'white',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    🎯 პროექტული (ჩათვლა)
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleSaveSubject}
                  disabled={saving || !editName.trim()}
                  style={{
                    flex: 1,
                    padding: '12px 18px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: saving ? 'wait' : 'pointer',
                    opacity: (!editName.trim() || saving) ? 0.6 : 1
                  }}
                >
                  {saving ? 'ინახება...' : 'შენახვა'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  disabled={saving}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  გაუქმება
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AddSubjectForm;