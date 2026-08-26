"use client";
import React, { useState } from 'react';
import { useColor } from './ColorContext';
import { IoMdClose } from 'react-icons/io';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: (role: string, user_ID: string, password: string) => void;
  role: string;
}

const CloseIcon = IoMdClose as React.FC;

// const roleLabels: Record<string, string> = {
//   teacher: 'მასწავლებელი',
//   student: 'მოსწავლე',
//   admin: 'ადმინისტრატორი',
// };

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onLogin, role }) => {
  const [user_ID, setUserID] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { selectedColor } = useColor();

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user_ID || !password) {
      setError('გთხოვთ, შეიყვანოთ მომხმარებლის ID და პაროლი.');
      return;
    }
    setError('');
    onLogin(role, user_ID, password);
  };

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  };

  const modalContentStyle: React.CSSProperties = {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
    margin: '0 16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    position: 'relative',
    fontFamily: 'sans-serif',
  };
  
  const closeButtonStyle: React.CSSProperties = {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontSize: '24px',
      color: '#888'
  };

  const titleStyle: React.CSSProperties = {
    marginTop: 0,
    marginBottom: '24px',
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: '600',
    color: 'blue'
  };

  const formGroupStyle: React.CSSProperties = {
      marginBottom: '16px'
  };

  const labelStyle: React.CSSProperties = {
      display: 'block',
      marginBottom: '8px',
      color: '#555',
      fontSize: '14px',
      fontWeight: '500'
  };
  
  const inputStyle: React.CSSProperties = {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxSizing: 'border-box',
      fontSize: '16px',
      color: '#333'
  };

  // const roleDisplayStyle: React.CSSProperties = {
  //     ...inputStyle,
  //     background: '#f0f0f0',
  //     color: '#333',
  //     fontWeight: '500'
  // };
  
  const errorStyle: React.CSSProperties = {
      color: '#e53e3e',
      marginBottom: '16px',
      textAlign: 'center',
      fontSize: '14px'
  };

  const buttonContainerStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '24px'
  };
  
  const buttonStyle: React.CSSProperties = {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '16px',
      transition: 'opacity 0.2s'
  };

  const cancelButtonStyle: React.CSSProperties = {
      ...buttonStyle,
      background: '#e2e8f0',
      color: '#4a5568'
  };

  const loginButtonStyle: React.CSSProperties = {
      ...buttonStyle,
      background: selectedColor,
      color: '#fff'
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <button onClick={onClose} style={closeButtonStyle}>
            <CloseIcon />
        </button>
        <h2 style={titleStyle}>ავტორიზაცია</h2>
        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>პირადი ნომერი:</label>
            <input type="text" value={user_ID} onChange={e => setUserID(e.target.value)} style={inputStyle} />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>პაროლი:</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
          </div>
          {error && <div style={errorStyle}>{error}</div>}
          <div style={buttonContainerStyle}>
            <button type="button" onClick={onClose} style={cancelButtonStyle}>გაუქმება</button>
            <button type="submit" style={loginButtonStyle}>შესვლა</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal; 