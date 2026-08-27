"use client";
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

export type ThemePreset = {
  id: string;
  name: string;
  bgColor: string;
  cardBg: string;
  textColor: string;
  accentColor: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'light', name: '⚪ თეთრი (ნაგულისხმევი)', bgColor: '#f8fafc', cardBg: '#ffffff', textColor: '#0f172a', accentColor: '#2563eb' },
  { id: 'dark', name: '⬛ შავ-თეთრი (მუქი)', bgColor: '#090d16', cardBg: '#111827', textColor: '#ffffff', accentColor: '#38bdf8' },
  { id: 'sky', name: '🔵 ღია ლურჯი', bgColor: '#f0f9ff', cardBg: '#ffffff', textColor: '#0369a1', accentColor: '#0284c7' },
  { id: 'emerald', name: '🟢 ზურმუხტისფერი', bgColor: '#ecfdf5', cardBg: '#ffffff', textColor: '#047857', accentColor: '#059669' },
  { id: 'purple', name: '🟣 მეწამული', bgColor: '#faf5ff', cardBg: '#ffffff', textColor: '#6b21a8', accentColor: '#7c3aed' },
];

type ColorContextType = {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  currentTheme: ThemePreset;
  setThemeById: (themeId: string) => void;
};

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export const ColorProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(THEME_PRESETS[0]); // Default: White Spectrum

  useEffect(() => {
    const savedThemeId = typeof window !== 'undefined' ? localStorage.getItem('app_theme_id') : null;
    if (savedThemeId) {
      const found = THEME_PRESETS.find(t => t.id === savedThemeId);
      if (found) setCurrentTheme(found);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--app-bg', currentTheme.bgColor);
      root.style.setProperty('--app-card-bg', currentTheme.cardBg);
      root.style.setProperty('--app-text', currentTheme.textColor);
      root.style.setProperty('--app-accent', currentTheme.accentColor);
      
      if (currentTheme.id === 'dark') {
        root.classList.add('theme-dark');
        root.classList.remove('theme-light');
      } else {
        root.classList.add('theme-light');
        root.classList.remove('theme-dark');
      }
    }
  }, [currentTheme]);

  const setThemeById = (themeId: string) => {
    const found = THEME_PRESETS.find(t => t.id === themeId);
    if (found) {
      setCurrentTheme(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_theme_id', found.id);
      }
    }
  };

  const setSelectedColor = (colorStr: string) => {
    const matched = THEME_PRESETS.find(t => t.accentColor.toLowerCase() === colorStr.toLowerCase() || t.id === colorStr);
    if (matched) {
      setThemeById(matched.id);
    } else {
      setCurrentTheme(prev => ({ ...prev, accentColor: colorStr }));
    }
  };

  const value: ColorContextType = {
    selectedColor: currentTheme.accentColor,
    setSelectedColor,
    currentTheme,
    setThemeById
  };

  return (
    <ColorContext.Provider value={value}>
      {children}
    </ColorContext.Provider>
  );
};

export const useColor = (): ColorContextType => {
  const context = useContext(ColorContext);
  if (!context) throw new Error("useColor must be used within ColorProvider");
  return context;
};
