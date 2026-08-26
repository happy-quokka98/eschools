import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) {
        return null;
    }

    const backdropStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10001,
    };

    const modalStyle: React.CSSProperties = {
        background: 'white',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        textAlign: 'center',
        maxWidth: '450px',
        width: '100%',
        margin: '0 16px',
    };

    const messageStyle: React.CSSProperties = {
        fontSize: '18px',
        color: '#333',
        marginBottom: '25px',
    };

    const buttonContainerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
    };

    const buttonStyle: React.CSSProperties = {
        padding: '10px 25px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '16px',
    };

    const confirmButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        backgroundColor: '#28a745',
        color: 'white',
    };

    const cancelButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        backgroundColor: '#6c757d',
        color: 'white',
    };

    return (
        <div style={backdropStyle} onClick={onCancel}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <p style={messageStyle}>{message}</p>
                <div style={buttonContainerStyle}>
                    <button style={confirmButtonStyle} onClick={onConfirm}>დიახ</button>
                    <button style={cancelButtonStyle} onClick={onCancel}>არა</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal; 