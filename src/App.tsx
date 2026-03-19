import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import UserMenu from './components/UserMenu';
import Dashboard from './components/Dashboard';
import RondasManagement from './components/RondasManagement';
import PostasManagement from './components/PostasManagement';
import VehiculosManagement from './components/VehiculosManagement';
import PersonalManagement from './components/PersonalManagement';
import AuthGuard from './components/AuthGuard';
import SolicitudesManagement from './components/SolicitudesManagement';

type AuthView = 'login' | 'register' | 'authenticated';

const App: React.FC = () => {
  const { isAuthenticated, isLoading, usuario } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rondas' | 'salidas-programadas' | 'postas' | 'vehiculos' | 'personal' | 'solicitudes'>('dashboard');
  const [activosOpen, setActivosOpen] = useState(false);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner-large">
          <div className="spinner"></div>
          <p>Cargando sistema...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login/register
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSwitchToRegister={() => setAuthView('register')} />;
  }

  // Usuario autenticado
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'salidas-programadas': return <RondasManagement viewMode="table" onSwitchTab={usuario?.rol === 'admin' ? () => setActiveTab('rondas') : undefined} />;
      case 'rondas': return usuario?.rol === 'admin' ? <RondasManagement viewMode="form" /> : <Dashboard />;
      case 'postas': return usuario?.rol === 'admin' ? <PostasManagement /> : <Dashboard />;
      case 'vehiculos': return usuario?.rol === 'admin' ? <VehiculosManagement /> : <Dashboard />;
      case 'personal': return usuario?.rol === 'admin' ? <PersonalManagement /> : <Dashboard />;
      case 'solicitudes': return <SolicitudesManagement />;
      default: return <Dashboard />;
    }
  };

  return (
    <AuthGuard>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span style={{ fontSize: '1.5rem' }}>🚐</span>
            <span>Salidas de Vehículos</span>
          </div>

          <nav className="nav-links" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

            {/* ── Todos los usuarios ── */}
            <div
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span>📊</span> Dashboard
            </div>

            <div
              className={`nav-item ${activeTab === 'salidas-programadas' ? 'active' : ''}`}
              onClick={() => setActiveTab('salidas-programadas')}
            >
              <span>📄</span> Salidas Programadas
            </div>

            {usuario?.rol !== 'admin' && (
              <div
                className={`nav-item ${activeTab === 'solicitudes' ? 'active' : ''}`}
                onClick={() => setActiveTab('solicitudes')}
              >
                <span>📋</span> Solicitudes de Salida
              </div>
            )}

            {/* ── Solo Administrador ── */}
            {usuario?.rol === 'admin' && (
              <>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '0.5rem 0' }} />
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', padding: '0.25rem 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Administración
                </div>

                {/* Gestión module */}
                <div style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, padding: '0.5rem 1rem', marginTop: '0.75rem', textTransform: 'uppercase' }}>
                    📦 Gestión
                </div>

                <div
                  className={`nav-item ${activeTab === 'solicitudes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('solicitudes')}
                >
                  <span>📋</span> Gestionar Solicitudes
                </div>

                <div
                  className={`nav-item ${activeTab === 'rondas' ? 'active' : ''}`}
                  onClick={() => setActiveTab('rondas')}
                >
                  <span>🗓️</span> Programar Nueva Salida
                </div>

                {/* Activos accordion */}
                <div
                  className="nav-item"
                  onClick={() => setActivosOpen(o => !o)}
                  style={{ justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📁</span> Activos
                  </span>
                  <span style={{ fontSize: '0.7rem', transition: 'transform 0.2s', display: 'inline-block', transform: activosOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                </div>

                {activosOpen && (
                  <div style={{ paddingLeft: '1rem', borderLeft: '2px solid #e2e8f0', marginLeft: '1rem' }}>
                    <div
                      className={`nav-item ${activeTab === 'postas' ? 'active' : ''}`}
                      onClick={() => setActiveTab('postas')}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <span>🏠</span> Destinos
                    </div>
                    <div
                      className={`nav-item ${activeTab === 'vehiculos' ? 'active' : ''}`}
                      onClick={() => setActiveTab('vehiculos')}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <span>🛡️</span> Vehículos
                    </div>
                    <div
                      className={`nav-item ${activeTab === 'personal' ? 'active' : ''}`}
                      onClick={() => setActiveTab('personal')}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <span>👥</span> Personal
                    </div>
                  </div>
                )}
              </>
            )}
          </nav>

          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '12px', flexShrink: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600' }}>CESFAM FUTRONO</div>
            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Región de Los Ríos</div>
          </div>
        </aside>

        <main className="main-content">
          <header className="page-header">
            <h1>
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'rondas' && 'Programar Nueva Salida'}
              {activeTab === 'salidas-programadas' && 'Salidas Programadas'}
              {activeTab === 'postas' && 'Administración de Destinos'}
              {activeTab === 'vehiculos' && 'Control de Flota'}
              {activeTab === 'personal' && 'Personal'}
              {activeTab === 'solicitudes' && (usuario?.rol === 'admin' ? 'Gestión de Solicitudes' : 'Solicitudes de Salida')}
            </h1>
            <UserMenu />
          </header>

          {renderContent()}
        </main>
      </div>
    </AuthGuard>
  );
};

export default App;
