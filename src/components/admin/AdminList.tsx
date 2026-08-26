import React from 'react';
import { IoArrowBack } from 'react-icons/io5';

const ArrowLeftIcon = IoArrowBack as React.FC<{ size?: number | string }>;

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
}

const AdminList: React.FC<AdminListProps> = ({
    admins,
    selectedColor,
    onBackClick,
}) => {
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
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
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
