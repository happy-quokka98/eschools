"use client";
import React from 'react';
import { useColor } from './ColorContext';
import { useLocation } from 'react-router-dom';

// Map main colors to darker companion background colors
const getSuitableBackgroundColor = (color: string): string => {
  const map: Record<string, string> = {
    '#6392D2': '#3A6CAA',  // Blue, darker companion to brand color
  };
  return map[color] || '#3A6CAA';
};

const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedColor } = useColor();
  const backgroundColor = getSuitableBackgroundColor(selectedColor);
  const location = useLocation();
  const isStartPage = location.pathname === '/';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor,
        transition: 'background-color 0.5s ease',
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
