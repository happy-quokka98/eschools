"use client";
import React from 'react';
import { IconType } from 'react-icons';
import { IoArrowBack } from 'react-icons/io5';
import { FaCalendarAlt } from 'react-icons/fa';

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string }>;
const CallendarIcon = FaCalendarAlt as React.FC<{ size?: number | string }>;

interface DashboardItem {
    icon: IconType;
    label: string;
}

interface AdminDashboardProps {
    items: DashboardItem[];
    onCardClick: (label: string) => void;
    onBackClick?: () => void; 
    boxWidth: number;
    selectedColor: string;
    BoxTitle: () => React.CSSProperties;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    items,
    onCardClick,
    onBackClick,
    selectedColor
}) => {
    return (
        <div className="admin-dashboard-wrapper">
            {onBackClick && (
                <button className="admin-back-btn" onClick={onBackClick}>
                    <ArrowLeftIcon size={20} /> უკან
                </button>
            )}
            <div className="admin-grid">
                {items.map((item, index) => {
                    const Icon = item.icon as React.ComponentType<{ size?: number | string }>;
                    return (
                        <div
                            key={index}
                            className="admin-card animate-zoom-in"
                            style={{ animationDelay: `${index * 0.05}s` }}
                            onClick={() => onCardClick(item.label)}
                        >
                            <div 
                                className="admin-card-icon-wrapper"
                                style={{ 
                                    backgroundColor: `${selectedColor}33`, // 20% opacity of theme color
                                    border: `1px solid ${selectedColor}66` // 40% opacity
                                }}
                            >
                                <Icon size={34} />
                            </div>
                            <span className="admin-card-label">{item.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminDashboard;
 