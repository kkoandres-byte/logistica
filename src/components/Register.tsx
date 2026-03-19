import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.nombre || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Por favor complete todos los campos');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const emailLower = formData.email.toLowerCase();
    if (!emailLower.endsWith('@munifutrono.cl') && !emailLower.endsWith('@gmail.com')) {
      setError('Debe usar un correo válido (@munifutrono.cl o @gmail.com)');
      return;
    }

    setIsLoading(true);

    const result = await register({
      nombre: formData.nombre,
      email: formData.email,
      password: formData.password,
      rol: 'personal'
    });

    if (!result.success) {
      setError(result.message || 'Error al registrar usuario');
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
          <p className="auth-subtitle">Solicitud de Registro de Usuario</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre Completo</label>
            <input
              id="nombre"
              type="text"
              placeholder="Ej: Juan Pérez"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              disabled={isLoading}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="nombre@munifutrono.cl"
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
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                autoComplete="new-password"
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <div className="password-input-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repita la contraseña"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
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
              <span className="loading-spinner">Registrando usuario...</span>
            ) : (
              'Solicitar Registro'
            )}
          </button>
        </form>

        <div className="auth-info-box">
          <p>
            <strong>ℹ️ Información:</strong> Su solicitud será revisada por el administrador del sistema.
            Una vez aprobada, podrá acceder con sus credenciales.
          </p>
        </div>

        <div className="auth-footer">
          <p>
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={onSwitchToLogin}
            >
              Iniciar sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
