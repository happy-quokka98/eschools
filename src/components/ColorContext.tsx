"use client";
import React, { createContext, useContext, ReactNode } from 'react';

const FIXED_COLOR = '#6392D2';

type ColorContextType = {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
};

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export const ColorProvider = ({ children }: { children: ReactNode }) => {
  const value: ColorContextType = {
    selectedColor: FIXED_COLOR,
    setSelectedColor: () => {},
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
