"use client";
import React from 'react';
import { useColor } from './ColorContext';

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

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor,
        transition: 'background-color 0.5s ease',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
};

export default AppWrapper;
