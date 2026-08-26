"use client";
import React, { useEffect } from 'react';

interface MessagePopupProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

const MessagePopup: React.FC<MessagePopupProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // Auto-close after 3 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    const popupStyle: React.CSSProperties = {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 25px',
        borderRadius: '8px',
        color: 'white',
        backgroundColor: type === 'success' ? '#28a745' : '#dc3545', // Green for success, red for error
        zIndex: 10000,
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minWidth: '300px',
        fontSize: '16px',
    };

    const closeButtonStyle: React.CSSProperties = {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '20px',
        cursor: 'pointer',
        marginLeft: '20px',
    };

    if (!message) {
        return null;
    }

    return (
        <div style={popupStyle}>
            <span>{message}</span>
            <button onClick={onClose} style={closeButtonStyle}>&times;</button>
        </div>
    );
};

export default MessagePopup; 