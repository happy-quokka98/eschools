"use client";
import React from 'react';
import { useColor } from './ColorContext';
import { useLocation } from 'react-router-dom';

const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentTheme, selectedColor } = useColor();
  const location = useLocation();
  const isStartPage = location.pathname === '/';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: currentTheme.bgColor,
        color: currentTheme.textColor,
        transition: 'background-color 0.4s ease, color 0.4s ease',
        boxSizing: 'border-box',
      }}
    >
      {!isStartPage && (
        <div className="global-brand-header">
          <img src="/logo.png" alt="eSchools Logo" className="global-brand-logo" />
          <span className="global-brand-text">e<span style={{ color: selectedColor }}>Schools</span></span>
        </div>
      )}
      {children}
    </div>
  );
};

export default AppWrapper;
