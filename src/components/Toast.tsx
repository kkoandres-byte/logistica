import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const typeClasses: Record<ToastType, { background: string; border: string; icon: string }> = {
    success: {
      background: '#f0fdf4',
      border: '#86efac',
      icon: '#16a34a'
    },
    error: {
      background: '#fef2f2',
      border: '#fca5a5',
      icon: '#dc2626'
    },
    warning: {
      background: '#fffbeb',
      border: '#fcd34d',
      icon: '#d97706'
    },
    info: {
      background: '#eff6ff',
      border: '#93c5fd',
      icon: '#2563eb'
    }
  };

  const colors = typeClasses[type];

  return (
    <div
      className="toast"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${colors.icon}`,
        borderRadius: '8px',
        padding: '1rem 1.25rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        zIndex: 10000,
        minWidth: '300px',
        maxWidth: '500px',
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <span
        style={{
          fontSize: '1.25rem',
          color: colors.icon,
          fontWeight: 'bold'
        }}
      >
        {icons[type]}
      </span>
      <p style={{
        flex: 1,
        margin: 0,
        fontSize: '0.875rem',
        color: '#1e293b',
        lineHeight: 1.5
      }}>
        {message}
      </p>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.25rem',
          color: '#64748b',
          padding: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#1e293b'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
