import React from 'react';

interface InfoModalProps {
    isOpen: boolean;
    message: string;
    onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, message, onClose }) => {
    if (!isOpen) {
        return null;
    }

    const backdropStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10001,
        animation: 'fadeIn 0.3s ease-out',
    };

    const modalStyle: React.CSSProperties = {
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '40px',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
        maxWidth: '450px',
        width: '100%',
        margin: '0 16px',
        color: 'white',
        animation: 'slideUp 0.3s ease-out',
    };

    const messageStyle: React.CSSProperties = {
        fontSize: '20px',
        color: 'white',
        marginBottom: '30px',
        fontWeight: '600',
        lineHeight: '1.5',
    };

    const buttonStyle: React.CSSProperties = {
        padding: '14px 40px',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: '800',
        fontSize: '16px',
        backgroundColor: 'white',
        color: '#112358',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    };

    return (
        <div style={backdropStyle} onClick={onClose}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <p style={messageStyle}>{message}</p>
                <button
                    style={buttonStyle}
                    onClick={onClose}
                    onMouseOver={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                    }}
                >
                    გასაგებია
                </button>
            </div>
        </div>
    );
};

export default InfoModal; 