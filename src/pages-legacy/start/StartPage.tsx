"use client";
import React, { useState, useRef, useEffect } from 'react';
import { RiAdminFill } from "react-icons/ri";
import { FaUserGraduate, FaChalkboardTeacher, FaUserFriends } from "react-icons/fa";
import { IconType } from 'react-icons';
import { useColor } from './../../components/ColorContext';
import { useNavigate } from 'react-router-dom';
import LoginModal from '../../components/LoginModal';
// import RegisterModal from '../../components/RegisterModal';
import InfoModal from '../../components/InfoModal';

import './StartPage.css';

const roleMap: Record<string, string> = {
    'მოსწავლე': 'student',
    'მშობელი': 'parent',
    'მასწავლებელი': 'teacher',
    'ადმინისტრატორი': 'admin',
};

const StartPage: React.FC = () => {
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [loginOpen, setLoginOpen] = useState(false);
    const [loginRole, setLoginRole] = useState<string>('student');
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const navigate = useNavigate();
    const { selectedColor } = useColor();
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; message: string; isSuccess: boolean }>({ isOpen: false, message: '', isSuccess: false });

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const items: { icon: IconType; label: string; action: 'login' | 'register' }[] = [
        { icon: FaUserGraduate, label: 'მოსწავლე', action: 'login' },
        { icon: FaUserFriends, label: 'მშობელი', action: 'login' },
        { icon: FaChalkboardTeacher, label: 'მასწავლებელი', action: 'login' },
        { icon: RiAdminFill, label: 'ადმინისტრატორი', action: 'login' },
    ];

    const handleCardClick = (label: string, action: 'login' | 'register') => {
        if (action === 'login') {
            setLoginRole(roleMap[label] || 'student');
            setLoginOpen(true);
        } 
    };

    const handleLogin = async (role: string, user_ID: string, password: string) => {
        try {
            const res = await fetch(`/api/` + role + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_ID, password })
            });
            
            if (res.ok) {
                const data = await res.json();
                setLoginOpen(false);
                
                localStorage.setItem('login', JSON.stringify({ role: data.role || role, user_ID, loginTime: Date.now() }));
                
                if ((role === 'student' || role === 'parent') && data.user_ID && data.class_id) {
                    localStorage.setItem('studentId', data.user_ID);
                    localStorage.setItem('classId', data.class_id);
                }
                
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => {
                    localStorage.removeItem('login');
                    localStorage.removeItem('studentId');
                    localStorage.removeItem('classId');
                    setInfoModal({ isOpen: true, message: 'სესიის ვადა ამოიწურა. გთხოვთ გაიაროთ ავტორიზაცია თავიდან.', isSuccess: false });
                }, 60 * 60 * 1000); // 1 hour
                
                setInfoModal({
                    isOpen: true,
                    message:'ავტორიზაცია წარმატებით დასრულდა',
                    isSuccess: true
                });
            } else {
                const errorData = await res.json();
                setInfoModal({ isOpen: true, message: errorData.message || 'ავტორიზაცია ვერ მოხერხდა', isSuccess: false });
            }
        } catch (err) {
            setInfoModal({ isOpen: true, message: 'ავტორიზაციისას მოხდა შეცდომა', isSuccess: false });
        }
    };

    const handleInfoModalClose = () => {
        const wasSuccess = infoModal.isSuccess;
        const loginData = JSON.parse(localStorage.getItem('login') || '{}');

        setInfoModal({ isOpen: false, message: '', isSuccess: false });

        if (wasSuccess && loginData.role) {
            const isStaff = ['admin', 'rector', 'prorector', 'academic', 'clerk', 'secretary', 'accountant', 'it_manager', 'ped_council', 'sysadmin'].includes(loginData.role);
            navigate(isStaff ? '/admin' : `/${loginData.role}`);
        }
    };

    return (
        <div className="start-page-wrapper">
            <div className="start-page-bg-glow" style={{ background: `radial-gradient(circle at center, ${selectedColor}26 0%, transparent 70%)` }} />
            
            <div className="start-page-content">
                <header className="start-page-header animate-fade-in-down">
                    <h1 className="start-page-title">
                       სატესტო <br />
                        <span style={{ color: selectedColor }}>სკოლა</span>
                    </h1>
                    <p className="start-page-subtitle">
                        ონლაინ სასწავლო პორტალი
                    </p>
                </header>

                <div className="start-page-grid">
                    {items.map((item, index) => {
                        const Icon = item.icon as React.ComponentType<{ size?: number | string; className?: string }>;
                        const isHovered = hoveredCard === item.label;
                        
                        return (
                            <div
                                key={index}
                                className="role-card animate-zoom-in"
                                style={{ animationDelay: `${index * 0.1}s` }}
                                onMouseEnter={() => setHoveredCard(item.label)}
                                onMouseLeave={() => setHoveredCard(null)}
                                onClick={() => handleCardClick(item.label, item.action)}
                            >
                                <div 
                                    className="role-card-icon-wrapper"
                                    style={{ 
                                        backgroundColor: isHovered ? selectedColor : 'rgba(255,255,255,0.05)',
                                        boxShadow: isHovered ? `0 0 20px ${selectedColor}4D` : 'none'
                                    }}
                                >
                                    <Icon size={40} />
                                </div>
                                <span className="role-card-label">{item.label}</span>
                                <div 
                                    className="role-card-indicator" 
                                    style={{ backgroundColor: selectedColor }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            <LoginModal
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
                onLogin={handleLogin}
                role={loginRole}
            />
            <InfoModal
                isOpen={infoModal.isOpen}
                message={infoModal.message}
                onClose={handleInfoModalClose}
            />

            <div className="start-page-footer">
                &copy; 2026-  ESCHOOLS PORTAL. ALL RIGHTS RESERVED.
            </div>
        </div>
    );
};

export default StartPage;
