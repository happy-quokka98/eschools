"use client";
import React, { useState } from 'react';
import { IoArrowBack, IoKeyOutline } from 'react-icons/io5';

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string }>;
const KeyIcon = IoKeyOutline as React.FC<{ size?: number | string; style?: React.CSSProperties }>;

export interface AdminUser {
    _id: string;
    name?: string;
    surname?: string;
    user_ID: string;
    role?: string;
}

interface AdminListProps {
    admins: AdminUser[];
    selectedColor: string;
    onBackClick: () => void;
    onResetPassword?: (adminId: string, username: string) => void;
}

const AdminList: React.FC<AdminListProps> = ({
    admins,
    selectedColor,
    onBackClick,
    onResetPassword
}) => {
    const [resettingId, setResettingId] = useState<string | null>(null);

    const handleReset = async (admin: AdminUser) => {
        const newPassword = prompt(`ჩაწერეთ ახალი პაროლი ადმინისტრატორისტვის: (${admin.user_ID})`, '123456');
        if (newPassword === null) return;
        if (!newPassword.trim()) {
            alert('პაროლი არ შეიძლება იყოს ცარიელი');
            return;
        }

        setResettingId(admin._id);
        try {
            const res = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: admin._id, newPassword: newPassword.trim() })
            });

            const data = await res.json();
            if (res.ok) {
                alert(`პაროლი წარმატებით განახლდა: ${admin.user_ID}`);
            } else {
                alert(data.message || 'პაროლის შეცვლა ვერ მოხერხდა');
            }
        } catch (err) {
            alert('სერვერთან დაკავშირება ვერ მოხერხდა');
        } finally {
            setResettingId(null);
        }
    };

    return (
        <div className="admin-view-container animate-fade-in-down">
            <header className="admin-view-header">
                <button className="admin-back-btn" onClick={onBackClick}>
                    <ArrowLeftIcon size={20} /> უკან
                </button>
                <h2 className="admin-view-title">ადმინისტრატორების სია</h2>
            </header>

            <div className="admin-list-container animate-zoom-in">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>სახელი</th>
                            <th>გვარი</th>
                            <th>მომხმარებლის ID</th>
                            <th>როლი</th>
                            <th>მოქმედება</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.length > 0 ? admins.map((admin) => (
                            <tr key={admin._id}>
                                <td>{admin.name || '-'}</td>
                                <td>{admin.surname || '-'}</td>
                                <td style={{ fontWeight: 'bold' }}>{admin.user_ID}</td>
                                <td>
                                    <span style={{
                                        background: `${selectedColor}33`,
                                        color: selectedColor,
                                        border: `1px solid ${selectedColor}66`,
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        {admin.role || 'admin'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleReset(admin)}
                                        disabled={resettingId === admin._id}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            color: 'white',
                                            padding: '6px 14px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <KeyIcon size={14} style={{ color: selectedColor }} />
                                        {resettingId === admin._id ? 'ცვლილება...' : 'პაროლის ცვლილება'}
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                                    ადმინისტრატორი ვერ მოიძებნა
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminList;
