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
      </div>
    </div>
  );
};

export default Login;
