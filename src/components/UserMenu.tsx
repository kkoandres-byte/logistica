import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const UserMenu: React.FC = () => {
  const { usuario, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!usuario) return null;

  const getRolBadge = (rol: string) => {
    const badges: Record<string, string> = {
      admin: 'badge-error',
      coordinador: 'badge-warning',
      conductor: 'badge-specialty',
      personal: 'badge-success'
    };
    return badges[rol] || 'badge-specialty';
  };

  const getRolLabel = (rol: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      coordinador: 'Coordinador',
      conductor: 'Conductor',
      personal: 'Personal'
    };
    return labels[rol] || rol;
  };

  return (
    <div className="user-menu-container" style={{ position: 'relative' }}>
      <button
        className="user-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '8px',
          transition: 'background 0.2s'
        }}
      >
        <div className="user-avatar">
          {usuario.nombre.charAt(0).toUpperCase()}
        </div>
        <div className="user-info" style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1a1e23' }}>
            {usuario.nombre}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {getRolLabel(usuario.rol)}
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="user-menu-overlay"
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          />
          <div
            className="user-menu-dropdown"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              minWidth: '280px',
              zIndex: 1000,
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '4px' }}>
                {usuario.nombre}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>
                {usuario.email}
              </div>
              <span className={`badge ${getRolBadge(usuario.rol)}`}>
                {getRolLabel(usuario.rol)}
              </span>
            </div>

            <div style={{ padding: '0.5rem' }}>
              <button
                className="menu-item"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.875rem',
                  color: '#475569',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span>⚙️</span> Configuración
              </button>
              <button
                className="menu-item"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.875rem',
                  color: '#dc3545',
                  transition: 'background 0.2s'
                }}
                onClick={logout}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span>🚪</span> Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
