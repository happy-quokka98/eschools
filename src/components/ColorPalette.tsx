"use client";
import React, { useState } from 'react';
import { useColor, THEME_PRESETS } from './ColorContext';
import { IoColorPaletteOutline } from 'react-icons/io5';

const ColorPalette: React.FC = () => {
    const { currentTheme, setThemeById } = useColor();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                title="თემის / ფერების არჩევა"
                style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s'
                }}
            >
                <IoColorPaletteOutline size={16} color={currentTheme.accentColor} />
                <span>თემა</span>
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '45px',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '12px',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minWidth: '210px',
                    color: '#0f172a',
                    zIndex: 999999
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        აირჩიეთ ფერების სპექტრი:
                    </div>
                    {THEME_PRESETS.map((t) => {
                        const isSelected = currentTheme.id === t.id;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                    setThemeById(t.id);
                                    setIsOpen(false);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 12px',
                                    borderRadius: '10px',
                                    border: isSelected ? `2px solid ${t.accentColor}` : '1px solid #f1f5f9',
                                    background: isSelected ? '#f8fafc' : '#ffffff',
                                    color: '#0f172a',
                                    fontWeight: isSelected ? 800 : 600,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                            >
                                <span style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    background: t.accentColor,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }}></span>
                                <span>{t.name}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ColorPalette;
