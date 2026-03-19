import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      setError('Por favor complete todos los campos');
      setIsLoading(false);
      return;
    }

    console.log('Intentando login con:', { email: formData.email, password: formData.password });
    const result = await login(formData);
    console.log('Resultado del login:', result);

    if (!result.success) {
      setError(result.message || 'Error al iniciar sesión');
    }

    setIsLoading(false);
  };

  const handleDemoLogin = (role: string) => {
    const demos: Record<string, { email: string; password: string }> = {
      admin: { email: 'calvarado@munifutrono.cl', password: 'Loki5050' },
      coordinador: { email: 'coordinador@cesfamfutrono.cl', password: 'coord123' },
      conductor: { email: 'conductor@cesfamfutrono.cl', password: 'cond123' },
      personal: { email: 'tens@cesfamfutrono.cl', password: 'tens123' }
    };

    const demo = demos[role];
    if (demo) {
      setFormData({ email: demo.email, password: demo.password });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">🚐</span>
          </div>
          <h1 className="auth-title">CESFAM Futrono</h1>
          <p className="auth-subtitle">Sistema de Gestión Logística</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Correo Institucional</label>
            <input
              id="email"
              type="email"
              placeholder="nombre@cesfamfutrono.cl"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full auth-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner">Iniciando sesión...</span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>Acceso rápido</span>
        </div>

        <div className="demo-buttons">
          <button
            type="button"
            className="demo-btn"
            onClick={() => handleDemoLogin('admin')}
            title="Administrador"
          >
            👨‍💼 Claudio A.
          </button>
          <button
            type="button"
            className="demo-btn"
            onClick={() => handleDemoLogin('coordinador')}
            title="Coordinador"
          >
            📋 Coordinador
          </button>
          <button
            type="button"
            className="demo-btn"
            onClick={() => handleDemoLogin('conductor')}
            title="Conductor"
          >
            🚐 Conductor
          </button>
          <button
            type="button"
            className="demo-btn"
            onClick={() => handleDemoLogin('personal')}
            title="Personal"
          >
            👨‍⚕️ Personal
          </button>
        </div>

        <div className="auth-footer">
          <p>
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={onSwitchToRegister}
            >
              Solicitar registro
            </button>
          </p>
        </div>

        <div className="auth-credentials">
          <p className="credentials-title">Credenciales de prueba:</p>
          <div className="credentials-grid">
            <div className="credential-item">
              <strong>Admin:</strong> calvarado@munifutrono.cl / Loki5050
            </div>
            <div className="credential-item">
              <strong>Coordinador:</strong> coordinador@cesfamfutrono.cl / coord123
            </div>
          </div>
          <button
            type="button"
            className="btn"
            style={{ marginTop: '1rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', width: '100%', fontSize: '0.75rem', padding: '0.5rem' }}
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
          >
            🗑️ Resetear datos y recargar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
