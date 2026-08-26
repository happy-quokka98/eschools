"use client";
import React, { useState } from 'react';
import { useColor } from './ColorContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IoMegaphoneOutline, IoTrashOutline, IoAddCircleOutline } from 'react-icons/io5';

const MegaphoneIcon = IoMegaphoneOutline as React.ComponentType<any>;
const TrashIcon = IoTrashOutline as React.ComponentType<any>;
const AddCircleIcon = IoAddCircleOutline as React.ComponentType<any>;

interface NoticeBoardProps {
  allowCreate?: boolean;
  currentUser: {
    id: string;
    name: string;
    role: string;
    classId?: string | null;
  };
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  class_id?: string | null;
  date: string;
  time: string;
}

const NoticeBoard: React.FC<NoticeBoardProps> = ({ allowCreate = false, currentUser }) => {
  const { selectedColor } = useColor();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch announcements
  const { data: announcements, isLoading, error } = useQuery<Announcement[]>({
    queryKey: ['announcements', currentUser.role, currentUser.classId],
    queryFn: async () => {
      const roleParam = currentUser.role ? `role=${currentUser.role}` : '';
      const classParam = currentUser.classId ? `class_id=${currentUser.classId}` : '';
      const query = [roleParam, classParam].filter(Boolean).join('&');
      const response = await fetch(`/api/announcements?${query}`);
      if (!response.ok) {
        throw new Error('კავშირის შეცდომა');
      }
      return response.json();
    }
  });

  // Create announcement mutation
  const createMutation = useMutation({
    mutationFn: async (newAnn: { title: string; content: string; author_id: string; author_name: string; class_id?: string | null }) => {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnn),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'გამოქვეყნება ვერ მოხერხდა');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setTitle('');
      setContent('');
      setIsFormOpen(false);
      setSuccessMsg('განცხადება წარმატებით გამოქვეყნდა!');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setFormError(err.message || 'შეცდომა მოხდა');
    }
  });

  // Delete announcement mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/announcements?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('წაშლა ვერ მოხერხდა');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim() || !content.trim()) {
      setFormError('გთხოვთ შეავსოთ ყველა ველი');
      return;
    }
    createMutation.mutate({
      title,
      content,
      author_id: currentUser.id,
      author_name: currentUser.name,
      class_id: currentUser.classId || null
    });
  };

  if (isLoading) {
    return <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>განცხადებების ჩატვირთვა...</div>;
  }

  if (error) {
    return <div style={{ color: '#ff6b6b', textAlign: 'center', padding: '40px' }}>განცხადებები ვერ ჩაიტვირთა</div>;
  }

  return (
    <div style={{
      maxWidth: '1000px',
      width: '100%',
      margin: '0 auto',
      padding: '16px',
      boxSizing: 'border-box',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {successMsg && (
        <div style={{
          background: '#d1e7dd',
          color: '#0f5132',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontWeight: 600,
          textAlign: 'center'
        }}>
          {successMsg}
        </div>
      )}

      {/* Admin / Teacher post form */}
      {allowCreate && (
        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: selectedColor,
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: `0 4px 14px ${selectedColor}44`,
              transition: 'transform 0.2s',
              outline: 'none'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <AddCircleIcon size={20} /> ახალი განცხადების დამატება
          </button>

          {isFormOpen && (
            <div style={{
              marginTop: '16px',
              background: 'white',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              animation: 'slideDown 0.3s ease'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '18px' }}>ახალი განცხადება</h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#475569' }}>სათაური</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#333'
                    }}
                    placeholder="ჩაწერეთ განცხადების სათაური"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#475569' }}>ტექსტი</label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      color: '#333',
                      resize: 'vertical'
                    }}
                    placeholder="ჩაწერეთ განცხადების შინაარსი..."
                  />
                </div>

                {formError && <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>{formError}</div>}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: selectedColor,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {createMutation.isPending ? 'აიტვირთება...' : 'გამოქვეყნება'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Announcements Feed */}
      {announcements && announcements.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#64748b',
          padding: '60px 20px',
          background: 'white',
          border: '1px solid #f1f5f9',
          borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            backgroundColor: `${selectedColor}12`,
            color: selectedColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <MegaphoneIcon size={32} />
          </div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#334155' }}>საინფორმაციო დაფა ცარიელია</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', maxWidth: '300px', lineHeight: '1.5' }}>
            ამ დროისთვის სკოლის საინფორმაციო დაფაზე განცხადებები არ არის გამოქვეყნებული.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {announcements && announcements.map(item => (
            <div key={item._id} style={{
              background: 'white',
              border: '1px solid #f1f5f9',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
              position: 'relative'
            }}>
              {/* Delete Button (if Admin or Author) */}
              {(currentUser.role === 'admin' || item.author_id === currentUser.id) && (
                <button
                  onClick={() => {
                    if (confirm('დარწმუნებული ხართ, რომ გსურთ განცხადების წაშლა?')) {
                      deleteMutation.mutate(item._id);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '24px',
                    right: '24px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                    padding: '4px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  <TrashIcon size={18} />
                </button>
              )}

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: `${selectedColor}12`,
                  color: selectedColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <MegaphoneIcon size={24} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1e293b', fontWeight: 700, paddingRight: '24px' }}>
                    {item.title}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                    <span>გამოაქვეყნა: <strong>{item.author_name}</strong></span>
                    <span>•</span>
                    <span>{item.date} {item.time ? `• ${item.time.slice(0, 5)}` : ''}</span>
                  </div>

                  <div style={{
                    fontSize: '14px',
                    color: '#334155',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {item.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
