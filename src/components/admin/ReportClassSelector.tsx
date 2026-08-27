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
                    <h2 className="admin-view-title" style={{ margin: 0 }}>
                        📄 უწყისის გენერირება — კლასების არჩევა
                    </h2>
                </div>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '6px 14px',
                    borderRadius: '100px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: selectedColor
                }}>
                    სულ {filteredClasses.length} კლასი
                </div>
            </header>

            {/* Filter & Search Bar */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
            }}>
                {/* Search Input */}
                <div style={{ position: 'relative', width: '100%' }}>
                    <SearchIcon size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input
                        type="text"
                        placeholder="🔍 მოძებნეთ კლასი (მაგ: 1ა, 10ბ)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 14px 12px 42px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
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
                                border: categoryFilter === cat.id ? `1.5px solid ${selectedColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                                background: categoryFilter === cat.id ? `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)` : 'rgba(255, 255, 255, 0.04)',
                                color: 'white',
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
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '20px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.4)'
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
                                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '18px',
                                padding: '22px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                                backdropFilter: 'blur(10px)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${selectedColor} 0%, #3a8dde 100%)`;
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                                e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                                e.currentTarget.style.boxShadow = `0 14px 30px ${selectedColor}55`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
                            }}
                        >
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '10px',
                                color: selectedColor
                            }}>
                                <SchoolIcon size={22} />
                            </div>

                            <div style={{
                                fontSize: '26px',
                                fontWeight: '900',
                                color: 'white',
                                letterSpacing: '0.5px',
                                marginBottom: '4px'
                            }}>
                                {cls.classname}
                            </div>

                            <div style={{
                                fontSize: '11px',
                                color: 'rgba(255, 255, 255, 0.6)',
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
