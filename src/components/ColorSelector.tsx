"use client";
import React from 'react';
import { useColor } from './ColorContext';

const colorPalettes = [
    '#1565C0', // Blue
    '#2E7D32', // Green
    '#C62828', // Red
    '#F9A825', // Yellow
    '#6A1B9A', // Purple
];

const ColorSelector: React.FC = () => {
    const { selectedColor, setSelectedColor } = useColor();

    const PaletteCircle = (color: string, selected: boolean): React.CSSProperties => ({
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: color,
        border: selected ? '3px solid black' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'border-color 0.3s',
    });

    return (
        <div style={{ padding: 30 }}>
            <h2>აირჩიე ფერი</h2>
            <div style={{ display: 'flex', gap: 20 }}>
                {colorPalettes.map((color) => (
                    <div
                        key={color}
                        style={PaletteCircle(color, color === selectedColor)}
                        onClick={() => setSelectedColor(color)}
                        title={color}
                    />
                ))}
            </div>
        </div>
    );
};

export default ColorSelector;
