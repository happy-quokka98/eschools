"use client";
import React, { useState } from 'react';
import { IoArrowBack, IoSearchOutline, IoSchoolOutline } from 'react-icons/io5';

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string; style?: React.CSSProperties }>;
const SearchIcon = IoSearchOutline as React.FC<{ size?: number | string; style?: React.CSSProperties }>;
const SchoolIcon = IoSchoolOutline as React.FC<{ size?: number | string; style?: React.CSSProperties }>;

interface ClassItem {
    _id: string;
    classname: string;
}

interface ReportClassSelectorProps {
    classes: ClassItem[];
    selectedColor: string;
    onSelectClass: (cls: { id: string; name: string }) => void;
    onBackClick: () => void;
}

const ReportClassSelector: React.FC<ReportClassSelectorProps> = ({
    classes,
    selectedColor,
    onSelectClass,
    onBackClick
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'primary' | 'basic' | 'high'>('all');

    // Sort classes in Georgian numerical order (1ა, 1ბ, 2ა... 10ა)
    const sortedClasses = [...classes].sort((a, b) => {
        const gradeA = parseInt(a.classname.match(/\d+/)?.[0] || '0', 10);
        const gradeB = parseInt(b.classname.match(/\d+/)?.[0] || '0', 10);
        if (gradeA !== gradeB) return gradeA - gradeB;

        const letterA = a.classname.match(/[ა-ჰ]/)?.[0] || '';
        const letterB = b.classname.match(/[ა-ჰ]/)?.[0] || '';
        return letterA.localeCompare(letterB, 'ka');
    });

    const filteredClasses = sortedClasses.filter((cls) => {
        // Search filter
        if (searchQuery.trim() && !cls.classname.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
            return false;
        }

        // Category filter
        const gradeNum = parseInt(cls.classname.match(/\d+/)?.[0] || '0', 10);
        if (categoryFilter === 'primary') return gradeNum >= 1 && gradeNum <= 4;
        if (categoryFilter === 'basic') return gradeNum >= 5 && gradeNum <= 9;
        if (categoryFilter === 'high') return gradeNum >= 10 && gradeNum <= 12;

        return true;
    });

    return (
        <div className="admin-view-container animate-fade-in-down" style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '16px', boxSizing: 'border-box' }}>
            
            {/* Header */}
            <header className="admin-view-header" style={{ flexWrap: 'wrap', gap: '15px', marginBottom: '24px' }}>
                <button className="admin-back-btn" onClick={onBackClick}>
                    <ArrowLeftIcon size={20} /> უკან
                </button>
                <div style={{ flex: '1 1 auto' }}>
                    <h2 className="admin-view-title" style={{ margin: 0, color: '#0f172a', fontWeight: 900 }}>
                        📄 უწყისის გენერირება — კლასების არჩევა
                    </h2>
                </div>
                <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    padding: '6px 16px',
                    borderRadius: '100px',
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#2563eb'
                }}>
                    სულ {filteredClasses.length} კლასი
                </div>
            </header>

            {/* Filter & Search Bar */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '20px',
                marginBottom: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)'
            }}>
                {/* Search Input */}
                <div style={{ position: 'relative', width: '100%' }}>
                    <SearchIcon size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="🔍 მოძებნეთ კლასი (მაგ: 1ა, 10ბ)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 14px 12px 42px',
                            borderRadius: '12px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#0f172a',
                            fontSize: '14px',
                            fontWeight: 700,
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Category Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                        { id: 'all', label: 'ყველა კლასი' },
                        { id: 'primary', label: 'დაწყებითი (I-IV)' },
                        { id: 'basic', label: 'საბაზო (V-IX)' },
                        { id: 'high', label: 'საშუალო (X-XII)' },
                    ].map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategoryFilter(cat.id as any)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '10px',
                                border: categoryFilter === cat.id ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                                background: categoryFilter === cat.id ? '#2563eb' : '#f8fafc',
                                color: categoryFilter === cat.id ? '#ffffff' : '#475569',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Classes Grid Layout */}
            {filteredClasses.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: '1px dashed #cbd5e1',
                    color: '#64748b',
                    fontWeight: 700
                }}>
                    კლასები ვერ მოიძებნა
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                    gap: '16px'
                }}>
                    {filteredClasses.map((cls) => (
                        <div
                            key={cls._id}
                            onClick={() => onSelectClass({ id: cls._id, name: cls.classname })}
                            className="animate-zoom-in"
                            style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '20px',
                                padding: '22px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.04)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.borderColor = '#2563eb';
                                e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 14px 30px rgba(37, 99, 235, 0.18)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.04)';
                            }}
                        >
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                background: '#eff6ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '10px',
                                color: '#2563eb'
                            }}>
                                <SchoolIcon size={22} />
                            </div>

                            <div style={{
                                fontSize: '26px',
                                fontWeight: '900',
                                color: '#0f172a',
                                letterSpacing: '0.5px',
                                marginBottom: '4px'
                            }}>
                                {cls.classname}
                            </div>

                            <div style={{
                                fontSize: '11px',
                                color: '#64748b',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                📄 უწყისის შექმნა
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReportClassSelector;
